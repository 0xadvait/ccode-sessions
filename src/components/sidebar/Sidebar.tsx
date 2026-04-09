import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../../store/store'
import { useSearch } from '../../hooks/useSearch'
import { SearchInput } from './SearchInput'
import { SessionCard } from './SessionCard'
import { Clock, FolderTree, PanelLeftClose } from 'lucide-react'
import { cn } from '../../lib/utils'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
}
const fadeItem = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
}

export function Sidebar() {
  const sessions = useStore((s) => s.sessions)
  const selectedId = useStore((s) => s.selectedId)
  const setSelectedId = useStore((s) => s.setSelectedId)
  const viewMode = useStore((s) => s.viewMode)
  const setViewMode = useStore((s) => s.setViewMode)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch()

  const displaySessions = searchQuery.trim() ? searchResults : sessions

  // Group by date
  const dateGroups = useMemo(() => {
    if (viewMode === 'project' || searchQuery.trim()) return null
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const weekAgo = new Date(today.getTime() - 7 * 86400000)
    const monthAgo = new Date(today.getTime() - 30 * 86400000)

    const groups: { label: string; sessions: typeof sessions }[] = [
      { label: 'Today', sessions: [] },
      { label: 'Yesterday', sessions: [] },
      { label: 'This Week', sessions: [] },
      { label: 'This Month', sessions: [] },
      { label: 'Older', sessions: [] },
    ]
    for (const s of displaySessions) {
      const d = new Date(s.modified)
      if (d >= today) groups[0].sessions.push(s)
      else if (d >= yesterday) groups[1].sessions.push(s)
      else if (d >= weekAgo) groups[2].sessions.push(s)
      else if (d >= monthAgo) groups[3].sessions.push(s)
      else groups[4].sessions.push(s)
    }
    return groups.filter((g) => g.sessions.length > 0)
  }, [displaySessions, viewMode, searchQuery])

  // Group by project
  const projectGroups = useMemo(() => {
    if (viewMode !== 'project' || searchQuery.trim()) return null
    const groups = new Map<string, typeof sessions>()
    for (const s of displaySessions) {
      if (!groups.has(s.projectName)) groups.set(s.projectName, [])
      groups.get(s.projectName)!.push(s)
    }
    return Array.from(groups.entries()).sort(([, a], [, b]) =>
      Math.max(...b.map((s) => new Date(s.modified).getTime())) -
      Math.max(...a.map((s) => new Date(s.modified).getTime()))
    )
  }, [displaySessions, viewMode, searchQuery])

  return (
    <div className="flex flex-col h-full w-[340px] bg-surface-raised">
      {/* Header */}
      <div className="p-4 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <span className="text-brand-400 text-xs font-mono font-bold tracking-tight">C</span>
            </div>
            <div>
              <h1 className="text-[13px] font-medium tracking-[-0.01em] text-text-primary leading-none">
                Sessions
              </h1>
              <span className="text-[10px] text-text-muted font-mono mt-0.5 block">
                {sessions.length} conversations
              </span>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>

        <SearchInput value={searchQuery} onChange={setSearchQuery} isSearching={isSearching} />

        {/* View toggle */}
        {!searchQuery.trim() && (
          <div className="flex gap-0.5 mt-3 mb-2 rounded-lg p-[3px] bg-surface-base/80">
            {(['recent', 'project'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-[5px] rounded-md text-[10px] font-mono uppercase tracking-widest transition-all duration-150',
                  viewMode === mode
                    ? 'bg-surface-card text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {mode === 'recent' ? <Clock size={10} /> : <FolderTree size={10} />}
                {mode}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 pt-1">
        {/* Search results */}
        {searchQuery.trim() && (
          <>
            {isSearching && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              </div>
            )}
            {!isSearching && displaySessions.length === 0 && (
              <div className="text-center py-12 px-4">
                <p className="text-sm text-text-muted">No matches</p>
                <p className="text-xs text-text-muted/60 mt-1">Try describing what you were working on</p>
              </div>
            )}
            {!isSearching && displaySessions.length > 0 && (
              <motion.div variants={stagger} initial="hidden" animate="visible">
                <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-text-muted">
                  {displaySessions.length} result{displaySessions.length !== 1 ? 's' : ''}
                </div>
                {displaySessions.map((s) => (
                  <motion.div key={s.sessionId} variants={fadeItem}>
                    <SessionCard session={s} isSelected={selectedId === s.sessionId} onClick={() => setSelectedId(s.sessionId)} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}

        {/* Date groups */}
        {!searchQuery.trim() && dateGroups && (
          <motion.div variants={stagger} initial="hidden" animate="visible">
            {dateGroups.map((group) => (
              <motion.div key={group.label} variants={fadeItem} className="mb-1">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-text-muted sticky top-0 bg-surface-raised z-10">
                  {group.label}
                </div>
                {group.sessions.map((s) => (
                  <SessionCard key={s.sessionId} session={s} isSelected={selectedId === s.sessionId} onClick={() => setSelectedId(s.sessionId)} />
                ))}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Project groups */}
        {!searchQuery.trim() && projectGroups && (
          <motion.div variants={stagger} initial="hidden" animate="visible">
            {projectGroups.map(([name, projectSessions]) => (
              <motion.div key={name} variants={fadeItem} className="mb-1">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-brand-600 sticky top-0 bg-surface-raised z-10 flex items-center gap-1.5">
                  <FolderTree size={9} />
                  {name}
                  <span className="text-text-muted ml-auto">{projectSessions.length}</span>
                </div>
                {projectSessions.map((s) => (
                  <SessionCard key={s.sessionId} session={s} isSelected={selectedId === s.sessionId} onClick={() => setSelectedId(s.sessionId)} />
                ))}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
