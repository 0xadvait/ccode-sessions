import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../../store/store'
import { useSearch } from '../../hooks/useSearch'
import { SearchInput } from './SearchInput'
import { SessionCard } from './SessionCard'
import { Clock, FolderTree, PanelLeftClose } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const sessions = useStore((s) => s.sessions)
  const selectedId = useStore((s) => s.selectedId)
  const setSelectedId = useStore((s) => s.setSelectedId)
  const viewMode = useStore((s) => s.viewMode)
  const setViewMode = useStore((s) => s.setViewMode)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useSearch()

  const displaySessions = searchQuery.trim() ? searchResults : sessions

  // Group sessions by date (Today, Yesterday, This Week, This Month, Older)
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
      const key = s.projectName
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(s)
    }
    return Array.from(groups.entries()).sort(([, a], [, b]) => {
      const latestA = Math.max(...a.map((s) => new Date(s.modified).getTime()))
      const latestB = Math.max(...b.map((s) => new Date(s.modified).getTime()))
      return latestB - latestA
    })
  }, [displaySessions, viewMode, searchQuery])

  return (
    <div className="flex flex-col h-full w-[360px] bg-surface-raised border-r border-border-subtle">
      {/* Header */}
      <div className="p-4 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
              <span className="text-brand-400 text-sm font-mono font-bold">C</span>
            </div>
            <div>
              <h1 className="text-sm font-medium tracking-[-0.01em] text-text-primary leading-none">
                Sessions
              </h1>
              <span className="text-[11px] text-text-muted font-mono">
                {sessions.length} conversations
              </span>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        <SearchInput value={searchQuery} onChange={setSearchQuery} isSearching={isSearching} />

        {/* View toggle */}
        {!searchQuery.trim() && (
          <div className="flex gap-0.5 mt-3 mb-3 rounded-xl p-0.5 bg-surface-base">
            <ViewTab
              active={viewMode === 'recent'}
              onClick={() => setViewMode('recent')}
              icon={<Clock size={12} />}
              label="Recent"
            />
            <ViewTab
              active={viewMode === 'project'}
              onClick={() => setViewMode('project')}
              icon={<FolderTree size={12} />}
              label="Projects"
            />
          </div>
        )}
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {/* Search results */}
        {searchQuery.trim() && (
          <>
            {isSearching && (
              <div className="px-3 py-6 text-center">
                <div className="inline-block w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              </div>
            )}
            {!isSearching && displaySessions.length === 0 && (
              <div className="text-center py-10 px-4">
                <p className="text-sm text-text-muted">No matches found</p>
                <p className="text-xs text-text-muted mt-1">Try describing what you were working on</p>
              </div>
            )}
            {!isSearching && displaySessions.length > 0 && (
              <div className="px-2 py-2 text-[11px] font-mono uppercase tracking-widest text-text-muted">
                {displaySessions.length} result{displaySessions.length !== 1 ? 's' : ''}
              </div>
            )}
            {displaySessions.map((s, i) => (
              <motion.div
                key={s.sessionId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <SessionCard
                  session={s}
                  isSelected={selectedId === s.sessionId}
                  onClick={() => setSelectedId(s.sessionId)}
                />
              </motion.div>
            ))}
          </>
        )}

        {/* Date-grouped view */}
        {!searchQuery.trim() && dateGroups && dateGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-widest text-text-muted sticky top-0 bg-surface-raised z-10">
              {group.label}
            </div>
            {group.sessions.map((s) => (
              <SessionCard
                key={s.sessionId}
                session={s}
                isSelected={selectedId === s.sessionId}
                onClick={() => setSelectedId(s.sessionId)}
              />
            ))}
          </div>
        ))}

        {/* Project-grouped view */}
        {!searchQuery.trim() && projectGroups && projectGroups.map(([name, projectSessions]) => (
          <div key={name} className="mb-1">
            <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-widest text-brand-600 sticky top-0 bg-surface-raised z-10 flex items-center gap-1.5">
              <FolderTree size={10} />
              {name}
              <span className="text-text-muted ml-auto">{projectSessions.length}</span>
            </div>
            {projectSessions.map((s) => (
              <SessionCard
                key={s.sessionId}
                session={s}
                isSelected={selectedId === s.sessionId}
                onClick={() => setSelectedId(s.sessionId)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all duration-150',
        active
          ? 'bg-surface-card text-text-primary shadow-sm'
          : 'text-text-muted hover:text-text-secondary'
      )}
    >
      {icon}
      {label}
    </button>
  )
}
