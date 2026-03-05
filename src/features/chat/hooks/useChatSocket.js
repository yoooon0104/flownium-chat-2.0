import { useCallback, useEffect, useRef, useState } from 'react'

// 소켓 연결/이벤트 바인딩/정리를 훅으로 분리한다.
export const useChatSocket = ({
  accessToken,
  isAuthInitializing,
  createSocketClient,
  onConnect,
  onUnauthorized,
  onRoomJoined,
  onReceiveMessage,
  onRoomParticipants,
  onError,
}) => {
  const socketRef = useRef(null)
  const currentRoomRef = useRef('')

  const [isConnected, setIsConnected] = useState(false)
  const [socketId, setSocketId] = useState('')

  const setCurrentRoom = useCallback((roomId) => {
    currentRoomRef.current = String(roomId || '')
  }, [])

  const disconnectSocket = useCallback(() => {
    if (!socketRef.current) return
    socketRef.current.disconnect()
    socketRef.current = null
    setIsConnected(false)
    setSocketId('')
  }, [])

  useEffect(() => {
    if (!accessToken || isAuthInitializing) return

    const client = createSocketClient(accessToken)
    socketRef.current = client

    client.on('connect', () => {
      setIsConnected(true)
      setSocketId(client.id)
      onConnect?.()
    })

    client.on('disconnect', () => {
      setIsConnected(false)
      setSocketId('')
    })

    client.on('connect_error', (error) => {
      const message = String(error?.message || 'Socket connection failed.')

      // unauthorized는 refresh 후 재연결, 그 외는 UI 에러로 전달한다.
      if (message.includes('unauthorized')) {
        void (async () => {
          const refreshed = await onUnauthorized?.()
          if (!refreshed) {
            disconnectSocket()
            return
          }
          client.auth = { token: localStorage.getItem('accessToken') || '' }
          client.connect()
        })()
        return
      }

      onError?.(message)
    })

    client.on('room_joined', (payload) => {
      const nextRoomId = String(payload?.roomId || '').trim()
      if (!nextRoomId) return
      currentRoomRef.current = nextRoomId
      onRoomJoined?.(nextRoomId, payload)
    })

    client.on('room_participants', (payload) => {
      if (String(payload?.roomId || '') !== currentRoomRef.current) return
      onRoomParticipants?.(Array.isArray(payload?.participants) ? payload.participants : [])
    })

    client.on('receive_message', (payload) => {
      if (payload?.chatRoomId !== currentRoomRef.current) return
      onReceiveMessage?.(payload)
    })

    client.on('error', (payload) => {
      onError?.(payload?.message || 'Unknown socket error')
    })

    return () => {
      client.disconnect()
      if (socketRef.current === client) {
        socketRef.current = null
      }
    }
  }, [
    accessToken,
    createSocketClient,
    disconnectSocket,
    isAuthInitializing,
    onConnect,
    onError,
    onReceiveMessage,
    onRoomJoined,
    onRoomParticipants,
    onUnauthorized,
  ])

  const joinRoom = useCallback((roomId) => {
    if (!socketRef.current || !roomId) return
    currentRoomRef.current = String(roomId)
    socketRef.current.emit('join_room', { roomId })
  }, [])

  const sendMessage = useCallback((payload) => {
    if (!socketRef.current) return
    socketRef.current.emit('send_message', payload)
  }, [])

  return {
    isConnected,
    socketId,
    joinRoom,
    sendMessage,
    setCurrentRoom,
    disconnectSocket,
  }
}
