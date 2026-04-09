import fs from 'fs'
import readline from 'readline'
import type { ParsedMessage, ContentBlock, MessagesResponse } from './types.js'

const PAGE_SIZE = 50

/**
 * Extract simplified content blocks from a message.
 */
function extractContent(message: any): ContentBlock[] {
  if (!message || !message.content) return []

  const blocks: ContentBlock[] = []

  if (typeof message.content === 'string') {
    blocks.push({ type: 'text', text: message.content })
    return blocks
  }

  if (!Array.isArray(message.content)) return blocks

  for (const block of message.content) {
    switch (block.type) {
      case 'text':
        if (block.text) blocks.push({ type: 'text', text: block.text })
        break
      case 'thinking':
        if (block.thinking) blocks.push({ type: 'thinking', text: block.thinking })
        break
      case 'tool_use':
        blocks.push({
          type: 'tool_use',
          toolName: block.name || 'unknown',
          input: typeof block.input === 'string'
            ? block.input.slice(0, 2000)
            : JSON.stringify(block.input || {}).slice(0, 2000),
        })
        break
      case 'tool_result':
        let resultContent = ''
        if (typeof block.content === 'string') {
          resultContent = block.content
        } else if (Array.isArray(block.content)) {
          resultContent = block.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('\n')
        }
        blocks.push({
          type: 'tool_result',
          toolName: '',
          content: resultContent.slice(0, 5000),
          isError: block.is_error || false,
        })
        break
    }
  }

  return blocks
}

/**
 * Parse a conversation JSONL file with cursor-based pagination.
 * Cursor is the line number to start from.
 */
export async function parseConversation(
  jsonlPath: string,
  cursor: number = 0
): Promise<MessagesResponse> {
  const messages: ParsedMessage[] = []
  let lineNum = 0
  let totalMessageLines = 0

  const stream = fs.createReadStream(jsonlPath, { encoding: 'utf-8' })
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line)

      // Only count user and assistant messages
      if (entry.type !== 'user' && entry.type !== 'assistant') continue
      totalMessageLines++

      // Skip until we reach the cursor
      if (totalMessageLines <= cursor) continue

      // Stop if we have enough messages
      if (messages.length >= PAGE_SIZE) continue // keep counting for totalLines

      const content = extractContent(entry.message)
      if (content.length === 0) continue

      messages.push({
        uuid: entry.uuid || `line-${lineNum}`,
        parentUuid: entry.parentUuid || null,
        type: entry.type,
        timestamp: entry.timestamp || '',
        content,
        isSidechain: entry.isSidechain || false,
      })
    } catch {
      // skip malformed lines
    }
    lineNum++
  }

  const nextCursor = cursor + messages.length
  const hasMore = nextCursor < totalMessageLines

  return {
    messages,
    hasMore,
    nextCursor: hasMore ? nextCursor : null,
    totalLines: totalMessageLines,
  }
}
