import { useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../../store/store'
import { useConversation } from '../../hooks/useConversation'
import { MessageBubble } from './MessageBubble'
import { resumeSession } from '../../api/client'
import { safeFormat } from '../../lib/utils'
import {
  Play,
  GitBranch,
  MessageSquare,
  Folder,
  Loader2,
  ChevronDown,
  GitFork,
  Copy,
  Check,
} from 'lucide-react'
import { useState } from 'react'

export function ConversationView() {
  const selectedId = useStore((s) => s.selectedId)
  const sessions = useStore((s) => s.sessions)
  const session = sessions.find((s) => s.sessionId === selectedId)
  const { messages, messagesLoading, hasMoreMessages, loadMore } = useConversation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState(false)

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || messagesLoading || !hasMoreMessages) return
    const el = scrollRef.current
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
      loadMore()
    }
  }, [messagesLoading, hasMoreMessages, loadMore])

  const handleResume = async () => {
    if (!selectedId) return
    try {
      await resumeSession(selectedId)
    } catch (err) {
      console.error('Failed to resume:', err)
    }
  }

  const handleCopyId = async () => {
    if (!selectedId) return
    await navigator.clipboard.writeText(selectedId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  if (!session) return null

  const created = safeFormat(session.created, "MMM d, yyyy 'at' h:mm a")

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border-subtle px-6 py-4">
        <div className="flex items-start justify-between gap-4 max-w-4xl mx-auto">
          <div className="min-w-0 flex-1">
            {/* First prompt as title */}
            <h2 className="text-base font-medium tracking-[-0.01em] text-text-primary leading-snug line-clamp-2 mb-2">
              {session.firstPrompt || '(empty conversation)'}
            </h2>

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <MetaPill icon={<Folder size={10} />} text={session.projectName} accent />
              {session.isWorktree && (
                <MetaPill icon={<GitFork size={10} />} text="Worktree" />
              )}
              {session.gitBranch && (
                <MetaPill icon={<GitBranch size={10} />} text={session.gitBranch} />
              )}
              <MetaPill icon={<MessageSquare size={10} />} text={`${session.messageCount}`} />
              {created && <MetaPill text={created} />}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopyId}
              className="p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors"
              title="Copy session ID"
            >
              {copiedId ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </button>
            <button
              onClick={handleResume}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            >
              <Play size={11} fill="currentColor" />
              Resume
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {/* Loading state */}
        {messagesLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Messages */}
        <div className="max-w-4xl mx-auto">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.uuid}
              initial={i < 10 ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i < 10 ? i * 0.04 : 0, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <MessageBubble message={msg} />
            </motion.div>
          ))}
        </div>

        {/* Load more */}
        {hasMoreMessages && messages.length > 0 && (
          <div className="flex justify-center py-6">
            {messagesLoading ? (
              <Loader2 size={18} className="animate-spin text-text-muted" />
            ) : (
              <button
                onClick={loadMore}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider text-text-muted hover:text-text-secondary hover:bg-surface-hover border border-border-subtle transition-all"
              >
                <ChevronDown size={12} />
                Load more
              </button>
            )}
          </div>
        )}

        {!hasMoreMessages && messages.length > 0 && (
          <div className="text-center py-8 text-[11px] font-mono uppercase tracking-wider text-text-muted">
            End of conversation
          </div>
        )}

        {!messagesLoading && messages.length === 0 && (
          <div className="text-center py-20 text-text-muted text-sm">
            No messages in this conversation
          </div>
        )}
      </div>
    </div>
  )
}

function MetaPill({ icon, text, accent }: { icon?: React.ReactNode; text: string; accent?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono ${
      accent
        ? 'text-brand-400 bg-brand-500/8'
        : 'text-text-muted bg-surface-card'
    }`}>
      {icon}
      {text}
    </span>
  )
}
