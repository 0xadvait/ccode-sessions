import { useEffect, useCallback } from 'react'
import { useStore } from '../store/store'
import { fetchMessages } from '../api/client'

export function useConversation() {
  const selectedId = useStore((s) => s.selectedId)
  const messages = useStore((s) => s.messages)
  const setMessages = useStore((s) => s.setMessages)
  const appendMessages = useStore((s) => s.appendMessages)
  const messagesLoading = useStore((s) => s.messagesLoading)
  const setMessagesLoading = useStore((s) => s.setMessagesLoading)
  const hasMoreMessages = useStore((s) => s.hasMoreMessages)
  const setHasMoreMessages = useStore((s) => s.setHasMoreMessages)
  const messageCursor = useStore((s) => s.messageCursor)
  const setMessageCursor = useStore((s) => s.setMessageCursor)

  // Load initial messages when session changes
  useEffect(() => {
    if (!selectedId) return

    setMessagesLoading(true)
    fetchMessages(selectedId, 0)
      .then((data) => {
        setMessages(data.messages)
        setHasMoreMessages(data.hasMore)
        setMessageCursor(data.nextCursor)
      })
      .catch(console.error)
      .finally(() => setMessagesLoading(false))
  }, [selectedId, setMessages, setMessagesLoading, setHasMoreMessages, setMessageCursor])

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!selectedId || !hasMoreMessages || messagesLoading || messageCursor === null) return

    setMessagesLoading(true)
    try {
      const data = await fetchMessages(selectedId, messageCursor)
      appendMessages(data.messages)
      setHasMoreMessages(data.hasMore)
      setMessageCursor(data.nextCursor)
    } catch (err) {
      console.error(err)
    } finally {
      setMessagesLoading(false)
    }
  }, [selectedId, hasMoreMessages, messagesLoading, messageCursor, appendMessages, setMessagesLoading, setHasMoreMessages, setMessageCursor])

  return { messages, messagesLoading, hasMoreMessages, loadMore }
}
