import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  code: string
  language?: string
}

export function CodeBlock({ code, language }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-2.5 rounded-xl overflow-hidden border border-border-subtle bg-surface-base">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border-subtle">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] font-mono text-text-muted hover:text-text-secondary transition-colors py-0.5 px-1.5 rounded-md hover:bg-surface-hover"
        >
          {copied ? (
            <>
              <Check size={11} className="text-success" />
              <span className="text-success">Copied</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-[1.6] font-mono text-text-secondary">
        <code>{code}</code>
      </pre>
    </div>
  )
}
