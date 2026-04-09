import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn, safeFormat } from '../../lib/utils'
import { ThinkingBlock } from './ThinkingBlock'
import { ToolUseBlock, ToolResultBlock } from './ToolBlock'
import { CodeBlock } from './CodeBlock'
import type { ParsedMessage } from '../../store/store'

interface Props {
  message: ParsedMessage
}

export function MessageBubble({ message }: Props) {
  const isUser = message.type === 'user'
  const time = safeFormat(message.timestamp, 'h:mm a')

  return (
    <div className={cn(
      'px-6 py-5',
      isUser ? 'bg-surface-card/40' : '',
    )}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className={cn(
            'flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mt-0.5',
            isUser
              ? 'bg-surface-active/80 text-text-muted'
              : 'bg-brand-500/15 text-brand-400'
          )}
        >
          {isUser ? <User size={12} /> : <Bot size={12} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'text-xs font-medium',
              isUser ? 'text-text-secondary' : 'text-brand-400'
            )}>
              {isUser ? 'You' : 'Claude'}
            </span>
            <span className="text-[10px] text-text-muted font-mono">{time}</span>
          </div>

          {/* Blocks */}
          <div className="text-[14px] leading-[1.7]">
            {message.content.map((block, i) => {
              switch (block.type) {
                case 'text':
                  return (
                    <div key={i} className="prose-chat">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            const codeStr = String(children).replace(/\n$/, '')
                            const isInline = !match && !codeStr.includes('\n')
                            if (isInline) {
                              return <code className={className} {...props}>{children}</code>
                            }
                            return <CodeBlock code={codeStr} language={match?.[1]} />
                          },
                          pre({ children }) {
                            return <>{children}</>
                          },
                        }}
                      >
                        {block.text}
                      </ReactMarkdown>
                    </div>
                  )
                case 'thinking':
                  return <ThinkingBlock key={i} text={block.text} />
                case 'tool_use':
                  return <ToolUseBlock key={i} toolName={block.toolName} input={block.input} />
                case 'tool_result':
                  return <ToolResultBlock key={i} content={block.content} isError={block.isError} />
                default:
                  return null
              }
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
