import Fuse from 'fuse.js'
import type { SessionIndex, SearchResult } from './types.js'

let fuseIndex: Fuse<SessionIndex> | null = null

const FUSE_OPTIONS: Fuse.IFuseOptions<SessionIndex> = {
  keys: [
    { name: 'firstPrompt', weight: 3 },
    { name: 'userPrompts', weight: 2 },
    { name: 'projectName', weight: 1.5 },
    { name: 'gitBranch', weight: 0.5 },
    { name: 'cwd', weight: 0.5 },
  ],
  threshold: 0.4,
  distance: 300,
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 2,
  useExtendedSearch: true,
  ignoreLocation: true,
}

/**
 * Build the Fuse.js search index.
 */
export function buildSearchIndex(sessions: SessionIndex[]): void {
  fuseIndex = new Fuse(sessions, FUSE_OPTIONS)
  console.log(`Search index built with ${sessions.length} sessions`)
}

/**
 * Search sessions using Fuse.js fuzzy matching.
 */
export function searchSessions(query: string, limit: number = 30): SearchResult[] {
  if (!fuseIndex) return []
  if (!query.trim()) return []

  const results = fuseIndex.search(query, { limit })

  return results.map((r) => ({
    session: r.item,
    score: 1 - (r.score || 0), // Fuse returns 0 = perfect match, invert for our API
    matches: (r.matches || []).map((m) => ({
      field: m.key || '',
      value: typeof m.value === 'string' ? m.value.slice(0, 200) : '',
      indices: (m.indices || []) as [number, number][],
    })),
  }))
}

/**
 * Update the search index when sessions change.
 */
export function updateSearchIndex(sessions: SessionIndex[]): void {
  buildSearchIndex(sessions)
}
