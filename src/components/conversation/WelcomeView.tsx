import { motion } from 'motion/react'
import { useStore } from '../../store/store'
import { Search, MessageSquare, GitFork, Folder, Zap } from 'lucide-react'

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
const modKey = isMac ? '\u2318' : 'Ctrl'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
}

export function WelcomeView() {
  const sessions = useStore((s) => s.sessions)

  const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0)
  const totalProjects = new Set(sessions.map((s) => s.projectName)).size
  const worktrees = sessions.filter((s) => s.isWorktree).length

  const stats = [
    { icon: MessageSquare, label: 'Conversations', value: sessions.length },
    { icon: Zap, label: 'Messages', value: totalMessages.toLocaleString() },
    { icon: Folder, label: 'Projects', value: totalProjects },
    { icon: GitFork, label: 'Worktrees', value: worktrees },
  ]

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/8 border border-brand-500/15 mb-5 glow-sm">
            <Search size={24} className="text-brand-400" />
          </div>
          <h1 className="text-[28px] font-medium tracking-[-0.03em] text-text-primary mb-2">
            Claude Sessions
          </h1>
          <p className="text-[15px] text-text-secondary leading-relaxed">
            Search, browse, and resume your conversations
            <br />across every project and worktree.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-2.5 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border-subtle bg-surface-card/40 p-3 hover:border-border-default transition-colors"
            >
              <stat.icon size={14} className="text-brand-500/70 mx-auto mb-1.5" />
              <div className="text-lg font-medium tracking-[-0.02em] text-text-primary leading-none">
                {stat.value}
              </div>
              <div className="text-[9px] font-mono uppercase tracking-[0.1em] text-text-muted mt-1.5">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Shortcuts */}
        <motion.div variants={fadeUp} className="space-y-1.5">
          <ShortcutHint keys={[modKey, 'K']} label="Search conversations" />
          <ShortcutHint keys={[modKey, 'B']} label="Toggle sidebar" />
          <ShortcutHint keys={['Esc']} label="Clear search" />
        </motion.div>
      </motion.div>
    </div>
  )
}

function ShortcutHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-[13px] text-text-muted/70">
      <div className="flex items-center gap-0.5">
        {keys.map((key) => (
          <kbd
            key={key}
            className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md bg-surface-card border border-border-default text-[10px] font-mono text-text-secondary"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span>{label}</span>
    </div>
  )
}
