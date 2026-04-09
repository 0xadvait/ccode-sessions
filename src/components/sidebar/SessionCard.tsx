import { MessageSquare, GitFork } from 'lucide-react'
import { cn, safeTimeAgo } from '../../lib/utils'
import type { SessionIndex } from '../../store/store'

interface Props {
  session: SessionIndex
  isSelected: boolean
  onClick: () => void
}

export function SessionCard({ session, isSelected, onClick }: Props) {
  const timeAgo = safeTimeAgo(session.modified)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group',
        isSelected
          ? 'bg-brand-500/10 border border-brand-500/20'
          : 'border border-transparent hover:bg-surface-hover'
      )}
    >
      {/* First prompt - the main content */}
      <p
        className={cn(
          'text-[13px] leading-[1.4] line-clamp-2 mb-1.5 transition-colors duration-150',
          isSelected ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'
        )}
      >
        {session.firstPrompt || '(empty conversation)'}
      </p>

      {/* Meta line */}
      <div className="flex items-center gap-2 text-[11px] text-text-muted">
        {/* Project */}
        <span className={cn(
          'font-mono uppercase tracking-wider truncate max-w-[120px]',
          isSelected ? 'text-brand-500' : 'text-text-muted'
        )}>
          {session.projectName}
        </span>

        {session.isWorktree && (
          <GitFork size={10} className="text-brand-600 flex-shrink-0" />
        )}

        {/* Spacer */}
        <span className="flex-1" />

        {/* Message count */}
        <span className="flex items-center gap-0.5 flex-shrink-0">
          <MessageSquare size={9} />
          {session.messageCount}
        </span>

        {/* Time */}
        <span className="flex-shrink-0 whitespace-nowrap">
          {timeAgo.replace('about ', '~').replace(' ago', '')}
        </span>
      </div>
    </button>
  )
}
