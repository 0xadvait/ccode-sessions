const API_BASE = '/api'

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/sessions`)
  if (!res.ok) throw new Error('Failed to fetch sessions')
  return res.json()
}

export async function fetchMessages(sessionId: string, cursor: number = 0) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages?cursor=${cursor}`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export async function searchSessions(query: string) {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Search failed')
  return res.json()
}

export async function resumeSession(sessionId: string) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/resume`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to resume session')
  return res.json()
}

export function createSSEConnection(onSessionUpdate: (data: any) => void): EventSource {
  const es = new EventSource(`${API_BASE}/events`)

  es.addEventListener('session-update', (e) => {
    try {
      const data = JSON.parse(e.data)
      onSessionUpdate(data)
    } catch {}
  })

  return es
}
