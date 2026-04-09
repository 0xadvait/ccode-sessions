import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, X, MessageSquare, ArrowRight, Folder } from 'lucide-react'
import { useStore, type SessionIndex } from '../../store/store'
import { searchSessions } from '../../api/client'
import { safeTimeAgo } from '../../lib/utils'

export function SpotlightSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SessionIndex[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const setSelectedId = useStore((s) => s.setSelectedId)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Open on Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
      setSelectedIdx(0)
    }
  }, [open])

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIdx(0)
      return
    }
    setLoading(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchSessions(query)
        setResults(data.results.map((r: any) => r.session))
        setSelectedIdx(0)
      } catch {}
      setLoading(false)
    }, 200)
    return () => clearTimeout(timerRef.current)
  }, [query])

  const select = useCallback((session: SessionIndex) => {
    setSelectedId(session.sessionId)
    setOpen(false)
  }, [setSelectedId])

  // Keyboard nav
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      select(results[selectedIdx])
    }
  }, [results, selectedIdx, select])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed z-50 top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl"
          >
            <div className="glass-strong rounded-2xl shadow-2xl overflow-hidden glow-md">
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
                <Search size={18} className={loading ? 'text-brand-400 animate-pulse' : 'text-text-muted'} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Describe what you were working on..."
                  className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                />
                <kbd className="text-[10px] font-mono text-text-muted bg-surface-card rounded px-1.5 py-0.5 border border-border-subtle">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto py-2">
                  {results.map((session, i) => (
                    <button
                      key={session.sessionId}
                      onClick={() => select(session)}
                      onMouseEnter={() => setSelectedIdx(i)}
                      className={`w-full text-left px-5 py-3 flex items-start gap-3 transition-colors duration-75 ${
                        i === selectedIdx ? 'bg-brand-500/10' : 'hover:bg-surface-hover'
                      }`}
                    >
                      <MessageSquare size={14} className={`mt-0.5 flex-shrink-0 ${i === selectedIdx ? 'text-brand-400' : 'text-text-muted'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug line-clamp-2 ${i === selectedIdx ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {session.firstPrompt || '(empty)'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted font-mono">
                          <span className="flex items-center gap-1">
                            <Folder size={9} />
                            {session.projectName}
                          </span>
                          <span>{safeTimeAgo(session.modified).replace('about ', '~').replace(' ago', '')}</span>
                        </div>
                      </div>
                      {i === selectedIdx && (
                        <ArrowRight size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Empty states */}
              {query.trim() && !loading && results.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-text-muted">
                  No conversations match that description
                </div>
              )}

              {!query.trim() && (
                <div className="px-5 py-6 text-center text-sm text-text-muted">
                  Try: "debugging the auth flow" or "exchange form improvements"
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-2.5 border-t border-border-subtle text-[10px] font-mono text-text-muted">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="bg-surface-card rounded px-1 py-0.5 border border-border-subtle">&uarr;</kbd>
                    <kbd className="bg-surface-card rounded px-1 py-0.5 border border-border-subtle">&darr;</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-surface-card rounded px-1 py-0.5 border border-border-subtle">&crarr;</kbd>
                    open
                  </span>
                </div>
                <span>fuzzy search</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
