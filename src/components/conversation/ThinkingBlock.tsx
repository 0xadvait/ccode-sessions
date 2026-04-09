import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Brain, ChevronRight } from 'lucide-react'

interface Props {
  text: string
}

export function ThinkingBlock({ text }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="my-2 rounded-xl border border-border-subtle overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-text-muted hover:text-text-secondary hover:bg-surface-hover/50 transition-colors"
      >
        <Brain size={12} className="text-brand-700" />
        <span>Thinking</span>
        <span className="text-text-muted/50 normal-case tracking-normal lowercase">
          {text.length > 200 ? `${(text.length / 1000).toFixed(1)}k chars` : `${text.length} chars`}
        </span>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="ml-auto"
        >
          <ChevronRight size={12} />
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="px-3 py-2.5 text-[13px] text-text-secondary leading-relaxed border-t border-border-subtle bg-surface-base/50 max-h-[400px] overflow-y-auto whitespace-pre-wrap">
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
