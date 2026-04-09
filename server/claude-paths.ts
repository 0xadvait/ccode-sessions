import { homedir } from 'os'
import path from 'path'

export const CLAUDE_DIR = path.join(homedir(), '.claude')
export const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects')
export const HISTORY_FILE = path.join(CLAUDE_DIR, 'history.jsonl')
export const CACHE_FILE = path.join(CLAUDE_DIR, 'claude-ui-index.json')
export const WORKTREES_DIR = path.join(homedir(), '.claude-worktrees')

/**
 * Decode project directory name back to a human-readable name.
 * Claude Code encodes project paths by replacing / with - and prepending -.
 * e.g. "-Users-alice-my-project" -> "my-project"
 */
export function decodeProjectDir(dirName: string): { name: string; path: string } {
  const decoded = dirName.startsWith('-')
    ? '/' + dirName.slice(1).replace(/-/g, '/')
    : dirName.replace(/-/g, '/')

  const parts = decoded.split('/').filter(Boolean)

  // Derive the current username from homedir for skipping
  const username = path.basename(homedir())

  // Skip common path prefixes to find the meaningful project name
  const skipPrefixes = ['Users', 'home', username, 'Library', 'Mobile Documents',
    'CloudStorage', 'GoogleDrive', 'Google Drive', 'My Drive', 'com', 'apple',
    'CloudDocs', 'Documents', 'Desktop', 'Downloads', 'Projects', 'repos',
    'src', 'dev', 'code', 'workspace', 'private', 'tmp', 'var']

  let name = parts[parts.length - 1] || dirName

  // Walk backwards from the end, skip generic containers
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    if (!skipPrefixes.some(p => part.toLowerCase() === p.toLowerCase()) && part.length > 1) {
      if (i === parts.length - 1) {
        name = part
      } else {
        name = parts.slice(i).join(' / ')
      }
      break
    }
  }

  name = name.replace(/\s+/g, ' ').trim()

  // Tag worktree paths
  if (decoded.includes('.claude-worktrees')) {
    const wtParts = decoded.split('.claude-worktrees/')[1]
    if (wtParts) name = `[WT] ${wtParts}`
  }

  return { name, path: decoded }
}

/**
 * Check if a filename looks like a UUID (session ID).
 */
export function isSessionFile(filename: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/.test(filename)
}
