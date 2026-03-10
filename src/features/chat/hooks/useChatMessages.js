import { useCallback, useState } from 'react'

const getMessageIdentity = (message) => {
  if (message?.id) return `id:${message.id}`
  if (message?.clientMessageId) return `client:${message.clientMessageId}`
  return `ts:${message?.timestamp || ''}:${message?.senderId || ''}:${message?.text || ''}`
}

const sortMessagesByTimestamp = (messages) => {
  return [...messages].sort((left, right) => {
    return new Date(left?.timestamp || 0).getTime() - new Date(right?.timestamp || 0).getTime()
  })
}

const mergeMessageLists = (historyMessages, currentMessages) => {
  const mergedByIdentity = new Map()

  historyMessages.forEach((message) => {
    mergedByIdentity.set(getMessageIdentity(message), message)
  })

  currentMessages.forEach((message) => {
    const identity = getMessageIdentity(message)
    const existingMessage = mergedByIdentity.get(identity)
    if (!existingMessage) {
      mergedByIdentity.set(identity, message)
      return
    }

    mergedByIdentity.set(identity, {
      ...existingMessage,
      ...message,
    })
  })

  return sortMessagesByTimestamp([...mergedByIdentity.values()])
}

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

    setMessages((prev) => {
      const historyMessages = Array.isArray(body?.messages) ? body.messages : []

      // room 재입장/재연결 직후에는 히스토리 요청과 실시간 이벤트가 겹칠 수 있다.
      // 이때 단순 replace를 하면 방금 도착한 메시지와 read-count 갱신이 사라질 수 있으므로 merge로 보존한다.
      return mergeMessageLists(historyMessages, prev)
    })
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
        return prev.map((item) => {
          if (item?.id !== message.id) return item
          return { ...item, ...message }
        })
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
