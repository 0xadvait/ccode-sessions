import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import readline from 'readline'
import { PROJECTS_DIR, HISTORY_FILE, CACHE_FILE, decodeProjectDir, isSessionFile } from './claude-paths.js'
import type { SessionIndex } from './types.js'

interface SessionsIndexFile {
  version: number
  entries: Array<{
    sessionId: string
    fullPath: string
    fileMtime: number
    firstPrompt: string
    messageCount: number
    created: string
    modified: string
    gitBranch: string
    projectPath: string
    isSidechain: boolean
  }>
}

interface CacheFile {
  builtAt: string
  sessions: SessionIndex[]
  projectMtimes: Record<string, number>
}

/**
 * Parse history.jsonl to build a map of sessionId -> user prompts
 */
async function parseHistoryFile(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (!fs.existsSync(HISTORY_FILE)) return map

  const stream = fs.createReadStream(HISTORY_FILE, { encoding: 'utf-8' })
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line)
      if (entry.sessionId && entry.display) {
        const existing = map.get(entry.sessionId) || []
        existing.push(entry.display.slice(0, 500))
        map.set(entry.sessionId, existing)
      }
    } catch {
      // skip malformed lines
    }
  }

  return map
}

/**
 * Read first N and last N lines from a JSONL file to extract metadata.
 */
async function extractMetadataFromJsonl(filePath: string): Promise<{
  firstPrompt: string
  sessionId: string
  created: string
  modified: string
  gitBranch: string
  cwd: string
  messageCount: number
}> {
  const result = {
    firstPrompt: '',
    sessionId: '',
    created: '',
    modified: '',
    gitBranch: 'main',
    cwd: '',
    messageCount: 0,
  }

  const stream = fs.createReadStream(filePath, { encoding: 'utf-8' })
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  let lineCount = 0
  let lastTimestamp = ''
  let lastLine = ''

  for await (const line of rl) {
    lineCount++
    try {
      const entry = JSON.parse(line)

      if (entry.type === 'user' || entry.type === 'assistant') {
        result.messageCount++
      }

      // Extract first user message as firstPrompt
      if (entry.type === 'user' && !result.firstPrompt) {
        const msg = entry.message
        if (msg && msg.content) {
          if (typeof msg.content === 'string') {
            result.firstPrompt = msg.content.slice(0, 500)
          } else if (Array.isArray(msg.content)) {
            const textBlock = msg.content.find((b: any) => b.type === 'text')
            if (textBlock) result.firstPrompt = textBlock.text.slice(0, 500)
          }
        }
      }

      if (entry.sessionId && !result.sessionId) result.sessionId = entry.sessionId
      if (entry.timestamp && !result.created) result.created = entry.timestamp
      if (entry.timestamp) lastTimestamp = entry.timestamp
      if (entry.gitBranch) result.gitBranch = entry.gitBranch
      if (entry.cwd && !result.cwd) result.cwd = entry.cwd

      lastLine = line
    } catch {
      // skip
    }
  }

  result.modified = lastTimestamp || result.created

  // If we didn't get timestamps from message entries, try file stat
  if (!result.created) {
    try {
      const stat = await fsp.stat(filePath)
      result.created = stat.birthtime.toISOString()
      result.modified = stat.mtime.toISOString()
    } catch {}
  }

  return result
}

/**
 * Build the full session index by scanning all projects.
 */
export async function buildIndex(): Promise<SessionIndex[]> {
  const sessions: SessionIndex[] = []
  const historyMap = await parseHistoryFile()

  if (!fs.existsSync(PROJECTS_DIR)) {
    console.log('No projects directory found at', PROJECTS_DIR)
    return sessions
  }

  const projectDirs = await fsp.readdir(PROJECTS_DIR)

  for (const dirName of projectDirs) {
    const projectDir = path.join(PROJECTS_DIR, dirName)
    const stat = await fsp.stat(projectDir).catch(() => null)
    if (!stat || !stat.isDirectory()) continue

    const { name: projectName, path: projectPath } = decodeProjectDir(dirName)
    const isWorktree = projectPath.includes('.claude-worktrees')

    // Check for sessions-index.json first
    const indexFile = path.join(projectDir, 'sessions-index.json')
    let indexedSessionIds = new Set<string>()

    if (fs.existsSync(indexFile)) {
      try {
        const indexData: SessionsIndexFile = JSON.parse(await fsp.readFile(indexFile, 'utf-8'))
        for (const entry of indexData.entries) {
          if (entry.isSidechain) continue
          indexedSessionIds.add(entry.sessionId)

          const jsonlPath = entry.fullPath
          let fileSizeBytes = 0
          try {
            const s = await fsp.stat(jsonlPath)
            fileSizeBytes = s.size
          } catch {}

          const prompts = historyMap.get(entry.sessionId) || []

          sessions.push({
            sessionId: entry.sessionId,
            projectDir: dirName,
            projectName,
            projectPath: entry.projectPath || projectPath,
            firstPrompt: entry.firstPrompt || prompts[0] || '(no prompt)',
            userPrompts: prompts,
            messageCount: entry.messageCount,
            created: entry.created,
            modified: entry.modified,
            gitBranch: entry.gitBranch || 'main',
            jsonlPath,
            fileSizeBytes,
            isWorktree,
            cwd: entry.projectPath || projectPath,
          })
        }
      } catch (err) {
        console.warn(`Failed to parse ${indexFile}:`, err)
      }
    }

    // Also scan for JSONL files not covered by the index
    const files = await fsp.readdir(projectDir)
    for (const file of files) {
      if (!isSessionFile(file)) continue
      const sessionId = file.replace('.jsonl', '')
      if (indexedSessionIds.has(sessionId)) continue

      const jsonlPath = path.join(projectDir, file)
      let fileSizeBytes = 0
      try {
        const s = await fsp.stat(jsonlPath)
        fileSizeBytes = s.size
      } catch {}

      // Skip empty files
      if (fileSizeBytes === 0) continue

      try {
        const meta = await extractMetadataFromJsonl(jsonlPath)
        const prompts = historyMap.get(sessionId) || []

        sessions.push({
          sessionId,
          projectDir: dirName,
          projectName,
          projectPath,
          firstPrompt: meta.firstPrompt || prompts[0] || '(no prompt)',
          userPrompts: prompts.length > 0 ? prompts : (meta.firstPrompt ? [meta.firstPrompt] : []),
          messageCount: meta.messageCount,
          created: meta.created,
          modified: meta.modified,
          gitBranch: meta.gitBranch,
          jsonlPath,
          fileSizeBytes,
          isWorktree,
          cwd: meta.cwd || projectPath,
        })
      } catch (err) {
        console.warn(`Failed to parse ${jsonlPath}:`, err)
      }
    }
  }

  // Sort by modified date, most recent first
  sessions.sort((a, b) => {
    const da = new Date(a.modified).getTime() || 0
    const db = new Date(b.modified).getTime() || 0
    return db - da
  })

  return sessions
}

/**
 * Try to load from cache, otherwise build fresh.
 */
export async function loadOrBuildIndex(): Promise<SessionIndex[]> {
  // Always build fresh for now - caching can be added later for performance
  console.log('Building session index...')
  const start = Date.now()
  const sessions = await buildIndex()
  console.log(`Indexed ${sessions.length} sessions in ${Date.now() - start}ms`)
  return sessions
}

/**
 * Re-index a single session file (for real-time updates).
 */
export async function reindexSession(jsonlPath: string): Promise<SessionIndex | null> {
  try {
    const stat = await fsp.stat(jsonlPath)
    if (stat.size === 0) return null

    const dirName = path.basename(path.dirname(jsonlPath))
    const { name: projectName, path: projectPath } = decodeProjectDir(dirName)
    const sessionId = path.basename(jsonlPath, '.jsonl')
    const isWorktree = projectPath.includes('.claude-worktrees')

    const meta = await extractMetadataFromJsonl(jsonlPath)

    return {
      sessionId,
      projectDir: dirName,
      projectName,
      projectPath,
      firstPrompt: meta.firstPrompt || '(no prompt)',
      userPrompts: meta.firstPrompt ? [meta.firstPrompt] : [],
      messageCount: meta.messageCount,
      created: meta.created,
      modified: meta.modified,
      gitBranch: meta.gitBranch,
      jsonlPath,
      fileSizeBytes: stat.size,
      isWorktree,
      cwd: meta.cwd || projectPath,
    }
  } catch {
    return null
  }
}
