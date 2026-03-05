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
    setMessages((prev) => [...prev, message])
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
    clearMessages,
  }
}
