import { useRef, useCallback, useState } from 'react'
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
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300) loadMore()
  }, [messagesLoading, hasMoreMessages, loadMore])

  const handleResume = async () => {
    if (!selectedId) return
    try { await resumeSession(selectedId) } catch {}
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
      {/* Header — glass effect */}
      <div className="flex-shrink-0 glass-strong border-b border-border-subtle px-6 py-3.5 z-10">
        <div className="flex items-start justify-between gap-4 max-w-4xl mx-auto">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-medium tracking-[-0.015em] text-text-primary leading-snug line-clamp-2 mb-2">
              {session.firstPrompt || '(empty conversation)'}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill icon={<Folder size={9} />} text={session.projectName} accent />
              {session.isWorktree && <Pill icon={<GitFork size={9} />} text="Worktree" />}
              {session.gitBranch && <Pill icon={<GitBranch size={9} />} text={session.gitBranch} />}
              <Pill icon={<MessageSquare size={9} />} text={`${session.messageCount}`} />
              {created && <Pill text={created} />}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleCopyId}
              className="p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors"
              title="Copy session ID"
            >
              {copiedId ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            </button>
            <button
              onClick={handleResume}
              className="flex items-center gap-1.5 px-4 py-[7px] rounded-xl text-[10px] font-mono uppercase tracking-[0.08em] font-medium bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 transition-colors glow-sm"
            >
              <Play size={10} fill="currentColor" />
              Resume
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        {messagesLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.uuid}
              initial={i < 8 ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i < 8 ? i * 0.04 : 0, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <MessageBubble message={msg} />
            </motion.div>
          ))}
        </div>

        {hasMoreMessages && messages.length > 0 && (
          <div className="flex justify-center py-6">
            {messagesLoading ? (
              <Loader2 size={16} className="animate-spin text-text-muted" />
            ) : (
              <button
                onClick={loadMore}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider text-text-muted hover:text-text-secondary hover:bg-surface-hover border border-border-subtle transition-all"
              >
                <ChevronDown size={11} />
                Load more
              </button>
            )}
          </div>
        )}

        {!hasMoreMessages && messages.length > 0 && (
          <div className="text-center py-8 text-[10px] font-mono uppercase tracking-widest text-text-muted/50">
            end of conversation
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

function Pill({ icon, text, accent }: { icon?: React.ReactNode; text: string; accent?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-md text-[10px] font-mono tracking-wide ${
      accent
        ? 'text-brand-400 bg-brand-500/8 border border-brand-500/10'
        : 'text-text-muted bg-surface-card/60 border border-border-subtle'
    }`}>
      {icon}
      {text}
    </span>
  )
}
