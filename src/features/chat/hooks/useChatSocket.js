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
  onMessageUpdated,
  onRoomParticipants,
  onRoomUpdated,
  onRoomDeleted,
  onNotificationCreated,
  onNotificationRead,
  onFriendshipUpdated,
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

    client.on('room_updated', (payload) => {
      onRoomUpdated?.(payload?.room || payload)
    })

    client.on('room_deleted', (payload) => {
      onRoomDeleted?.(payload || {})
    })

    // 메시지는 현재 방 여부와 상관없이 AppShell까지 모두 전달한다.
    // 현재 방이면 본문에 append하고, 다른 방이면 목록 unread만 갱신하는 쪽이 상위 레벨에서 더 안전하다.
    client.on('receive_message', (payload) => {
      onReceiveMessage?.(payload)
    })

    client.on('message_updated', (payload) => {
      if (String(payload?.chatRoomId || '') !== currentRoomRef.current) return
      onMessageUpdated?.(payload)
    })

    client.on('notification_created', (payload) => {
      onNotificationCreated?.(payload?.notification || payload)
    })

    client.on('notification_read', (payload) => {
      onNotificationRead?.(payload?.notification || payload)
    })

    // 친구 요청/수락/거절은 양쪽 목록을 다시 그려야 하므로 최소 이벤트만 전달한다.
    client.on('friendship_updated', (payload) => {
      onFriendshipUpdated?.(payload || {})
    })

    client.on('error', (payload) => {
      const code = String(payload?.code || '').trim()
      const message = String(payload?.message || 'Unknown socket error')
      onError?.(code ? `${message} (${code})` : message)
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
    onRoomDeleted,
    onRoomUpdated,
    onNotificationCreated,
    onNotificationRead,
    onFriendshipUpdated,
    onMessageUpdated,
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
    if (!socketRef.current) {
      return Promise.resolve({
        ok: false,
        code: 'SOCKET_NOT_CONNECTED',
        message: 'Socket is not connected.',
      })
    }

    return new Promise((resolve) => {
      let isSettled = false
      const finish = (result) => {
        if (isSettled) return
        isSettled = true
        clearTimeout(timeoutId)
        resolve(result)
      }

      const timeoutId = setTimeout(() => {
        finish({
          ok: false,
          code: 'SEND_MESSAGE_TIMEOUT',
          message: 'Message send acknowledgement timed out.',
        })
      }, 5000)

      socketRef.current.emit('send_message', payload, (response) => {
        finish(response || {
          ok: false,
          code: 'SEND_MESSAGE_ACK_EMPTY',
          message: 'Message acknowledgement was empty.',
        })
      })
    })
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
