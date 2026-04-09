import { Search, X } from 'lucide-react'
import { useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  isSearching: boolean
}

export function SearchInput({ value, onChange, isSearching }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('')
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onChange])

  return (
    <div className="relative group">
      <Search
        size={14}
        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150 ${
          isSearching
            ? 'text-brand-400 animate-[pulse-subtle_1s_ease-in-out_infinite]'
            : value
              ? 'text-text-secondary'
              : 'text-text-muted group-focus-within:text-text-secondary'
        }`}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search conversations..."
        className="w-full bg-surface-base border border-border-subtle rounded-xl py-2 pl-9 pr-16 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:border-brand-500/40 focus:shadow-[0_0_0_3px_rgba(36,188,227,0.08)] transition-all duration-200"
      />
      {!value && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-muted bg-surface-card border border-border-subtle rounded-md px-1.5 py-0.5 pointer-events-none">
          {/Mac|iPod|iPhone|iPad/.test(navigator.userAgent) ? '\u2318' : 'Ctrl+'}K
        </kbd>
      )}
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
