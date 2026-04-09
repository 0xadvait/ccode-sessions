import { create } from 'zustand'

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

interface AppState {
  // Sessions
  sessions: SessionIndex[]
  setSessions: (s: SessionIndex[]) => void
  upsertSession: (s: SessionIndex) => void

  // Selected session
  selectedId: string | null
  setSelectedId: (id: string | null) => void

  // Messages for selected session
  messages: ParsedMessage[]
  setMessages: (m: ParsedMessage[]) => void
  appendMessages: (m: ParsedMessage[]) => void
  messagesLoading: boolean
  setMessagesLoading: (v: boolean) => void
  hasMoreMessages: boolean
  setHasMoreMessages: (v: boolean) => void
  messageCursor: number | null
  setMessageCursor: (c: number | null) => void

  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchResults: SessionIndex[]
  setSearchResults: (r: SessionIndex[]) => void
  isSearching: boolean
  setIsSearching: (v: boolean) => void

  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  viewMode: 'recent' | 'project'
  setViewMode: (m: 'recent' | 'project') => void
}

export const useStore = create<AppState>((set) => ({
  sessions: [],
  setSessions: (sessions) => set({ sessions }),
  upsertSession: (session) =>
    set((state) => {
      const idx = state.sessions.findIndex((s) => s.sessionId === session.sessionId)
      const updated = [...state.sessions]
      if (idx >= 0) {
        updated[idx] = session
      } else {
        updated.unshift(session)
      }
      // Keep sorted by modified desc
      updated.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
      return { sessions: updated }
    }),

  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id, messages: [], messageCursor: null, hasMoreMessages: true }),

  messages: [],
  setMessages: (messages) => set({ messages }),
  appendMessages: (newMsgs) => set((s) => ({ messages: [...s.messages, ...newMsgs] })),
  messagesLoading: false,
  setMessagesLoading: (v) => set({ messagesLoading: v }),
  hasMoreMessages: true,
  setHasMoreMessages: (v) => set({ hasMoreMessages: v }),
  messageCursor: null,
  setMessageCursor: (c) => set({ messageCursor: c }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  searchResults: [],
  setSearchResults: (r) => set({ searchResults: r }),
  isSearching: false,
  setIsSearching: (v) => set({ isSearching: v }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  viewMode: 'recent',
  setViewMode: (m) => set({ viewMode: m }),
}))
