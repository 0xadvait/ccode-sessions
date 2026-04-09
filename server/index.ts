import express from 'express'
import { exec } from 'child_process'
import { watch } from 'chokidar'
import path from 'path'
import os from 'os'
import { loadOrBuildIndex, reindexSession } from './indexer.js'
import { parseConversation } from './parser.js'
import { buildSearchIndex, searchSessions } from './search.js'
import { PROJECTS_DIR, isSessionFile } from './claude-paths.js'
import type { SessionIndex } from './types.js'

const app = express()
app.use(express.json())

// Only allow requests from localhost (security: this exposes local conversation data)
app.use((req, res, next) => {
  const origin = req.headers.origin || ''
  if (origin && !origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
    return res.status(403).json({ error: 'Forbidden: localhost only' })
  }
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

let sessions: SessionIndex[] = []
const sseClients: Set<express.Response> = new Set()

function broadcastSSE(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of sseClients) {
    client.write(msg)
  }
}

// ─── SSE Endpoint ──────────────────────────────────────────────
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write('event: connected\ndata: {}\n\n')
  sseClients.add(res)
  req.on('close', () => sseClients.delete(res))
})

// ─── List All Sessions ─────────────────────────────────────────
app.get('/api/sessions', (_req, res) => {
  res.json({ sessions, total: sessions.length })
})

// ─── Get Conversation Messages ─────────────────────────────────
app.get('/api/sessions/:id/messages', async (req, res) => {
  const { id } = req.params
  if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid session ID' })

  const cursor = parseInt(req.query.cursor as string) || 0
  const session = sessions.find((s) => s.sessionId === id)
  if (!session || !session.jsonlPath) {
    return res.status(404).json({ error: 'Session not found or no conversation file' })
  }

  try {
    const result = await parseConversation(session.jsonlPath, cursor)
    res.json(result)
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Parse error' })
  }
})

// ─── Search Sessions ───────────────────────────────────────────
app.get('/api/search', (req, res) => {
  const query = (req.query.q as string) || ''
  const limit = parseInt(req.query.limit as string) || 30
  if (!query.trim()) return res.json({ results: [], query })

  const results = searchSessions(query, limit)
  res.json({ results, query })
})

// ─── Resume Session ────────────────────────────────────────────
app.post('/api/sessions/:id/resume', (req, res) => {
  const { id } = req.params
  if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid session ID' })

  const session = sessions.find((s) => s.sessionId === id)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const cwd = session.cwd || session.projectPath || os.homedir()
  const platform = os.platform()

  let cmd: string
  if (platform === 'darwin') {
    // macOS: open a new Terminal.app tab
    const escapedCwd = cwd.replace(/'/g, "'\\''")
    const script = `cd '${escapedCwd}' && claude --dangerously-skip-permissions --resume ${id}`
    const osascriptSafe = script.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    cmd = `osascript -e 'tell application "Terminal"' -e 'activate' -e 'do script "${osascriptSafe}"' -e 'end tell'`
  } else if (platform === 'win32') {
    // Windows: open a new cmd window
    cmd = `start cmd /k "cd /d "${cwd}" && claude --dangerously-skip-permissions --resume ${id}"`
  } else {
    // Linux: try common terminal emulators
    const escapedCwd = cwd.replace(/'/g, "'\\''")
    const script = `cd '${escapedCwd}' && claude --dangerously-skip-permissions --resume ${id}`
    cmd = `x-terminal-emulator -e bash -c '${script.replace(/'/g, "'\\''")}' 2>/dev/null || xterm -e bash -c '${script.replace(/'/g, "'\\''")}' 2>/dev/null || gnome-terminal -- bash -c '${script.replace(/'/g, "'\\''")}'`
  }

  exec(cmd, (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ success: true, sessionId: id, cwd })
  })
})

// ─── Session Detail ────────────────────────────────────────────
app.get('/api/sessions/:id', (req, res) => {
  const { id } = req.params
  if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid session ID' })
  const session = sessions.find((s) => s.sessionId === id)
  if (!session) return res.status(404).json({ error: 'Not found' })
  res.json(session)
})

// ─── Start Server ──────────────────────────────────────────────
async function start() {
  sessions = await loadOrBuildIndex()
  buildSearchIndex(sessions)

  const watcher = watch(PROJECTS_DIR, {
    ignoreInitial: true,
    depth: 1,
    ignored: ['**/memory/**', '**/sessions-index.json', '**/.DS_Store'],
  })

  watcher.on('add', handleFileChange)
  watcher.on('change', handleFileChange)

  async function handleFileChange(filePath: string) {
    const filename = path.basename(filePath)
    if (!isSessionFile(filename)) return

    const sessionId = filename.replace('.jsonl', '')
    const updated = await reindexSession(filePath)
    if (!updated) return

    const existingIdx = sessions.findIndex((s) => s.sessionId === sessionId)
    if (existingIdx >= 0) {
      sessions[existingIdx] = updated
    } else {
      sessions.unshift(updated)
    }

    sessions.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    buildSearchIndex(sessions)
    broadcastSSE('session-update', { session: updated, isNew: existingIdx < 0 })
  }

  const PORT = parseInt(process.env.PORT || '3141')
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`ccode-sessions running on http://localhost:${PORT}`)
  })
}

start().catch(console.error)
