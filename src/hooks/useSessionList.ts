import { useEffect } from 'react'
import { useStore } from '../store/store'
import { fetchSessions, createSSEConnection } from '../api/client'

export function useSessionList() {
  const setSessions = useStore((s) => s.setSessions)
  const upsertSession = useStore((s) => s.upsertSession)
  const sessions = useStore((s) => s.sessions)

  useEffect(() => {
    fetchSessions()
      .then((data) => setSessions(data.sessions))
      .catch(console.error)
  }, [setSessions])

  // SSE for real-time updates
  useEffect(() => {
    const es = createSSEConnection((data) => {
      if (data.session) {
        upsertSession(data.session)
      }
    })

    return () => es.close()
  }, [upsertSession])

  return sessions
}
