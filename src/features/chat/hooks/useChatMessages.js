import { useCallback, useState } from 'react'

// 메시지 히스토리 조회와 실시간 목록 업데이트를 분리한다.
export const useChatMessages = ({ chatApi }) => {
  const [messages, setMessages] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const loadMessageHistory = useCallback(async (roomId) => {
    if (!chatApi || !roomId) return

    setIsLoadingHistory(true)
    setHistoryError('')
    setMessages([])

    const { ok, status, body } = await chatApi.getRoomMessages(roomId, 50)
    if (!ok) {
      if (status === 503) {
        setHistoryError('Database is not connected.')
      } else {
        setHistoryError(body?.error || 'Failed to load message history.')
      }
      setIsLoadingHistory(false)
      return
    }

    setMessages(Array.isArray(body?.messages) ? body.messages : [])
    setIsLoadingHistory(false)
  }, [chatApi])

  const appendMessage = useCallback((message) => {
    setMessages((prev) => {
      // 서버 응답에 clientMessageId가 있으면 먼저 임시 메시지 교체 대상을 찾는다.
      // 같은 clientMessageId를 가진 optimistic 메시지가 있으면 실제 메시지로 덮어쓴다.
      if (message?.clientMessageId) {
        const optimisticIndex = prev.findIndex((item) => item?.clientMessageId === message.clientMessageId)
        if (optimisticIndex >= 0) {
          const next = [...prev]
          next[optimisticIndex] = { ...next[optimisticIndex], ...message }
          return next
        }
      }

      if (message?.id && prev.some((item) => item?.id === message.id)) {
        return prev
      }

      return [...prev, message]
    })
  }, [])

  const removeMessageByClientMessageId = useCallback((clientMessageId) => {
    if (!clientMessageId) return

    setMessages((prev) => {
      return prev.filter((item) => item?.clientMessageId !== clientMessageId)
    })
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setHistoryError('')
    setIsLoadingHistory(false)
  }, [])

  return {
    messages,
    isLoadingHistory,
    historyError,
    setHistoryError,
    loadMessageHistory,
    appendMessage,
    removeMessageByClientMessageId,
    clearMessages,
  }
}

