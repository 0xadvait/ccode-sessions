export interface SessionIndex {
  sessionId: string
  projectDir: string
  projectName: string
  projectPath: string
  firstPrompt: string
  userPrompts: string[]
  messageCount: number
  created: string
  modified: string
  gitBranch: string
  jsonlPath: string | null
  fileSizeBytes: number
  isWorktree: boolean
  cwd: string
}

export interface ParsedMessage {
  uuid: string
  parentUuid: string | null
  type: 'user' | 'assistant'
  timestamp: string
  content: ContentBlock[]
  isSidechain: boolean
}

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'tool_use'; toolName: string; input: string }
  | { type: 'tool_result'; toolName: string; content: string; isError: boolean }

export interface MessagesResponse {
  messages: ParsedMessage[]
  hasMore: boolean
  nextCursor: number | null
  totalLines: number
}

export interface SearchResult {
  session: SessionIndex
  score: number
  matches: Array<{
    field: string
    value: string
    indices: [number, number][]
  }>
}
