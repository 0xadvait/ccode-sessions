import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Wrench, ChevronRight, AlertTriangle, Terminal } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ToolUseProps {
  toolName: string
  input: string
}

export function ToolUseBlock({ toolName, input }: ToolUseProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="my-1.5 rounded-xl border border-border-subtle overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono text-text-muted hover:text-text-secondary hover:bg-surface-hover/50 transition-colors"
      >
        <Terminal size={11} className="text-brand-700" />
        <span className="text-brand-500/70 uppercase tracking-wider">{toolName}</span>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="ml-auto"
        >
          <ChevronRight size={11} />
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
            <pre className="px-3 py-2 text-[12px] text-text-secondary border-t border-border-subtle bg-surface-base/50 max-h-[300px] overflow-auto whitespace-pre-wrap font-mono">
              {input}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ToolResultProps {
  content: string
  isError: boolean
}

export function ToolResultBlock({ content, isError }: ToolResultProps) {
  const [expanded, setExpanded] = useState(false)

  if (!content) return null

  return (
    <div className={cn(
      'my-1.5 rounded-xl border overflow-hidden',
      isError ? 'border-error/20' : 'border-border-subtle'
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono hover:bg-surface-hover/50 transition-colors',
          isError ? 'text-error' : 'text-text-muted hover:text-text-secondary'
        )}
      >
        {isError ? <AlertTriangle size={11} /> : <Wrench size={11} className="text-text-muted" />}
        <span className="uppercase tracking-wider">{isError ? 'Error' : 'Output'}</span>
        <span className="text-text-muted/50 normal-case tracking-normal">
          {content.length > 1000 ? `${(content.length / 1000).toFixed(1)}k chars` : `${content.length} chars`}
        </span>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="ml-auto"
        >
          <ChevronRight size={11} />
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
            <pre className={cn(
              'px-3 py-2 text-[12px] border-t bg-surface-base/50 max-h-[300px] overflow-auto whitespace-pre-wrap font-mono',
              isError ? 'text-error/80 border-error/10' : 'text-text-secondary border-border-subtle'
            )}>
              {content}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
