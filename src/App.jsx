import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const API_BASE_URL = 'http://localhost:3010'

const parseJwtPayload = (token) => {
  try {
    if (!token) return null
    const [, payload] = token.split('.')
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

const toTimeLabel = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function App() {
  const messagesEndRef = useRef(null)
  const currentRoomRef = useRef('')

  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [socketId, setSocketId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [roomNameInput, setRoomNameInput] = useState('')

  const [joinedRoomId, setJoinedRoomId] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const [participants, setParticipants] = useState([])

  const [text, setText] = useState('')
  const [isMobileChatView, setIsMobileChatView] = useState(false)

  const authPayload = useMemo(() => {
    const token = localStorage.getItem('accessToken')
    return parseJwtPayload(token)
  }, [])

  const displayName = useMemo(() => authPayload?.nickname || 'Guest', [authPayload])
  const currentUserId = useMemo(() => authPayload?.userId || authPayload?.sub || '', [authPayload])

  const canSend = useMemo(() => {
    return !!socket && !!joinedRoomId && text.trim().length > 0
  }, [socket, joinedRoomId, text])

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('accessToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const fetchRooms = useCallback(async () => {
    try {
      setRoomsLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/chatrooms`, {
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!res.ok) {
        throw new Error('failed to load rooms')
      }

      const data = await res.json()
      setRooms(Array.isArray(data.rooms) ? data.rooms : [])
    } catch {
      setErrorMessage('Failed to load chat rooms.')
    } finally {
      setRoomsLoading(false)
    }
  }, [getAuthHeaders])

  const loadMessageHistory = useCallback(async (roomId) => {
    try {
      setIsLoadingHistory(true)
      setHistoryError('')
      setMessages([])

      const res = await fetch(`${API_BASE_URL}/api/chatrooms/${roomId}/messages?limit=50`, {
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (res.status === 503) {
        setHistoryError('Database is not connected.')
        return
      }

      if (!res.ok) {
        throw new Error('failed to load history')
      }

      const data = await res.json()
      setMessages(Array.isArray(data.messages) ? data.messages : [])
    } catch {
      setHistoryError('Failed to load message history.')
    } finally {
      setIsLoadingHistory(false)
    }
  }, [getAuthHeaders])

  const createRoom = useCallback(async () => {
    const roomName = roomNameInput.trim()
    if (!roomName) return

    try {
      setErrorMessage('')
      const res = await fetch(`${API_BASE_URL}/api/chatrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name: roomName }),
      })

      if (!res.ok) {
        throw new Error('failed to create room')
      }

      const data = await res.json()
      const createdRoomId = data?.room?.id

      setRoomNameInput('')
      await fetchRooms()

      if (createdRoomId && socket) {
        socket.emit('join_room', { roomId: createdRoomId })
      }
    } catch {
      setErrorMessage('Failed to create chat room.')
    }
  }, [fetchRooms, getAuthHeaders, roomNameInput, socket])

  const joinRoom = useCallback((roomId) => {
    if (!socket || !roomId) return

    setErrorMessage('')
    setParticipants([])
    currentRoomRef.current = roomId
    socket.emit('join_room', { roomId })
  }, [socket])

  const handleSendMessage = useCallback(() => {
    if (!canSend) return

    socket.emit('send_message', {
      roomId: joinedRoomId,
      text: text.trim(),
      type: 'text',
    })
    setText('')
  }, [canSend, joinedRoomId, socket, text])

  const handleComposerKeyUp = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSendMessage()
    }
  }, [handleSendMessage])

  useEffect(() => {
    currentRoomRef.current = joinedRoomId
  }, [joinedRoomId])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const client = io(API_BASE_URL, {
      auth: token ? { token } : undefined,
    })

    setSocket(client)

    client.on('connect', () => {
      setIsConnected(true)
      setSocketId(client.id)
      setErrorMessage('')
      void fetchRooms()
    })

    client.on('disconnect', () => {
      setIsConnected(false)
      setSocketId('')
      setParticipants([])
      setIsMobileChatView(false)
    })

    client.on('connect_error', (error) => {
      setErrorMessage(error?.message || 'Socket connection failed.')
    })

    client.on('room_joined', (payload) => {
      const nextRoomId = String(payload?.roomId || '').trim()
      if (!nextRoomId) return

      setJoinedRoomId(nextRoomId)
      setIsMobileChatView(true)
      void loadMessageHistory(nextRoomId)
      void fetchRooms()
    })

    client.on('room_participants', (payload) => {
      if (String(payload?.roomId || '') !== currentRoomRef.current) return
      setParticipants(Array.isArray(payload?.participants) ? payload.participants : [])
    })

    client.on('receive_message', (payload) => {
      if (payload?.chatRoomId !== currentRoomRef.current) return
      setMessages((prev) => [...prev, payload])
      void fetchRooms()
    })

    client.on('error', (payload) => {
      setErrorMessage(payload?.message || 'Unknown socket error')
    })

    return () => {
      client.disconnect()
    }
  }, [fetchRooms, loadMessageHistory])

  useEffect(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, joinedRoomId, isLoadingHistory])

  const activeRoom = useMemo(() => {
    return rooms.find((room) => room.id === joinedRoomId) || null
  }, [rooms, joinedRoomId])

  return (
    <main className="chat-app">
      <header className="top-bar">
        <div className="brand-wrap">
          <strong className="brand-name">Flownium Talk</strong>
          <span className={`status-badge ${isConnected ? 'online' : 'offline'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="meta-wrap">
          <span>{displayName}</span>
          <span className="dot">•</span>
          <span>{socketId || 'No Socket'}</span>
        </div>
      </header>

      <section className="chat-layout">
        <aside className={`room-panel ${isMobileChatView ? 'mobile-hidden' : ''}`}>
          <div className="panel-header">
            <h2>Rooms</h2>
          </div>

          <div className="create-form">
            <input
              value={roomNameInput}
              onChange={(e) => setRoomNameInput(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && createRoom()}
              placeholder="New group room name"
            />
            <button type="button" onClick={createRoom} disabled={!roomNameInput.trim()}>
              Create
            </button>
          </div>

          <ul className="room-list">
            {roomsLoading && <li className="state-item">Loading rooms...</li>}
            {!roomsLoading && rooms.length === 0 && <li className="state-item">No rooms yet.</li>}

            {rooms.map((room) => {
              const isActive = room.id === joinedRoomId
              return (
                <li key={room.id}>
                  <button
                    type="button"
                    className={`room-item ${isActive ? 'active' : ''}`}
                    onClick={() => joinRoom(room.id)}
                  >
                    <span className="avatar">{room.name.slice(0, 2).toUpperCase()}</span>
                    <span className="room-main">
                      <strong>{room.name}</strong>
                      <small>{room.lastMessage || 'No messages yet'}</small>
                    </span>
                    <span className="room-time">{toTimeLabel(room.lastMessageAt)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <section className={`chat-panel ${isMobileChatView ? 'mobile-active' : ''}`}>
          <div className="chat-header">
            <button
              type="button"
              className="back-button"
              onClick={() => setIsMobileChatView(false)}
            >
              Rooms
            </button>

            <div className="chat-header-main">
              <h3>{activeRoom?.name || 'Select a room'}</h3>
              <p>{joinedRoomId ? `Room ID: ${joinedRoomId}` : 'Choose a room from left panel.'}</p>
            </div>

            <div className="participant-list">
              {participants.map((participant) => {
                const isMe = participant.userId === currentUserId
                return (
                  <span key={participant.userId} className={`participant-chip ${participant.online ? 'online' : 'offline'}`}>
                    {participant.nickname}{isMe ? ' (me)' : ''}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="message-area">
            {errorMessage && <p className="error-text">Error: {errorMessage}</p>}
            {isLoadingHistory && <p className="muted-text">Loading history...</p>}
            {historyError && <p className="warn-text">{historyError}</p>}

            {messages.length === 0 ? (
              <p className="muted-text">No messages.</p>
            ) : (
              <ul className="message-list">
                {messages.map((msg, idx) => {
                  const isMine = currentUserId && msg.senderId === currentUserId
                  return (
                    <li key={`${msg.timestamp}-${idx}`} className={isMine ? 'mine' : 'other'}>
                      <p className="meta">{msg.senderNickname}</p>
                      <p className="bubble">{msg.text}</p>
                      <p className="time">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </li>
                  )
                })}
              </ul>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="composer">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyUp={handleComposerKeyUp}
              placeholder={joinedRoomId ? 'Type a message' : 'Join a room first'}
              disabled={!joinedRoomId}
            />
            <button type="button" onClick={handleSendMessage} disabled={!canSend}>
              Send
            </button>
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
