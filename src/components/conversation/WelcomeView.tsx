import { motion } from 'motion/react'
import { useStore } from '../../store/store'
import { Search, MessageSquare, GitFork, Folder, Zap } from 'lucide-react'

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
const modKey = isMac ? 'Cmd' : 'Ctrl'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
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
        className="max-w-lg w-full text-center"
      >
        {/* Logo area */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-5">
            <Search size={28} className="text-brand-400" />
          </div>
          <h1 className="text-3xl font-medium tracking-[-0.03em] text-text-primary mb-2">
            Claude Sessions
          </h1>
          <p className="text-base text-text-secondary leading-relaxed max-w-sm mx-auto">
            Search, browse, and resume your conversations across every project and worktree.
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border-subtle bg-surface-card/50 p-3"
            >
              <stat.icon size={16} className="text-brand-500 mx-auto mb-1.5" />
              <div className="text-xl font-medium tracking-tight text-text-primary">
                {stat.value}
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Keyboard shortcuts */}
        <motion.div variants={fadeUp} className="space-y-2">
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
    <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
      <div className="flex items-center gap-1">
        {keys.map((key) => (
          <kbd
            key={key}
            className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-surface-card border border-border-default text-[11px] font-mono text-text-secondary"
          >
            {key === 'Cmd' ? '\u2318' : key}
          </kbd>
        ))}
      </div>
      <span>{label}</span>
    </div>
  )
}
