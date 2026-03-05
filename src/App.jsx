import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

// 로컬 개발 기준 API/Socket 엔드포인트.
const API_BASE_URL = 'http://localhost:3010'

// JWT payload를 파싱해 현재 사용자 식별자/닉네임을 추출한다.
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

// 방 목록 우측의 마지막 메시지 시간을 시:분 형식으로 표기한다.
const toTimeLabel = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function App() {
  const messagesEndRef = useRef(null)
  const currentRoomRef = useRef('')
  const participantsMenuRef = useRef(null)

  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [socketId, setSocketId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')

  const [joinedRoomId, setJoinedRoomId] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const [participants, setParticipants] = useState([])
  const [isParticipantsMenuOpen, setIsParticipantsMenuOpen] = useState(false)

  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

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

  // 검색 입력을 기준으로 방 이름/마지막 메시지를 필터링한다.
  const filteredRooms = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) return rooms

    return rooms.filter((room) => {
      const roomName = String(room.name || '').toLowerCase()
      const lastMessage = String(room.lastMessage || '').toLowerCase()
      return roomName.includes(keyword) || lastMessage.includes(keyword)
    })
  }, [rooms, searchKeyword])

  // 로컬 스토리지 accessToken을 REST Authorization 헤더에 붙이는 헬퍼.
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('accessToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  // 현재 사용자 기준 참여 방 목록을 가져온다.
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

  // 방 입장 시 최근 메시지 히스토리를 불러온다.
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

  // 방 생성 API 호출 성공 시 목록 갱신 + 자동 입장을 수행한다.
  const createRoom = useCallback(async (roomName) => {
    const normalizedRoomName = String(roomName || '').trim()
    if (!normalizedRoomName) return false

    try {
      setErrorMessage('')
      const res = await fetch(`${API_BASE_URL}/api/chatrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name: normalizedRoomName }),
      })

      if (!res.ok) {
        throw new Error('failed to create room')
      }

      const data = await res.json()
      const createdRoomId = data?.room?.id

      await fetchRooms()

      if (createdRoomId && socket) {
        socket.emit('join_room', { roomId: createdRoomId })
      }

      return true
    } catch {
      setErrorMessage('Failed to create chat room.')
      return false
    }
  }, [fetchRooms, getAuthHeaders, socket])

  // FAB -> 모달 -> 생성 확인 버튼 흐름으로 방을 추가한다.
  const handleCreateRoomSubmit = useCallback(async () => {
    const created = await createRoom(newRoomName)
    if (!created) return

    setIsCreateRoomModalOpen(false)
    setNewRoomName('')
  }, [createRoom, newRoomName])

  // 사용자가 목록에서 방을 클릭했을 때 서버에 입장 이벤트를 보낸다.
  const joinRoom = useCallback((roomId) => {
    if (!socket || !roomId) return

    setErrorMessage('')
    setParticipants([])
    setIsParticipantsMenuOpen(false)
    currentRoomRef.current = roomId
    socket.emit('join_room', { roomId })
  }, [socket])

  // 현재 선택된 방으로 텍스트 메시지를 전송한다.
  const handleSendMessage = useCallback(() => {
    if (!canSend) return

    socket.emit('send_message', {
      roomId: joinedRoomId,
      text: text.trim(),
      type: 'text',
    })
    setText('')
  }, [canSend, joinedRoomId, socket, text])

  // 사용자 요청에 맞춰 Enter keyup 시 전송한다.
  const handleComposerKeyUp = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSendMessage()
    }
  }, [handleSendMessage])

  useEffect(() => {
    currentRoomRef.current = joinedRoomId
  }, [joinedRoomId])

  useEffect(() => {
    if (!isParticipantsMenuOpen) return

    // 메뉴 바깥 클릭 시 참여자 드롭다운을 닫아 카카오톡 메뉴 UX처럼 동작하게 한다.
    const handleOutsideClick = (event) => {
      if (!participantsMenuRef.current) return
      if (!participantsMenuRef.current.contains(event.target)) {
        setIsParticipantsMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isParticipantsMenuOpen])

  useEffect(() => {
    if (!isCreateRoomModalOpen) return

    // 생성 모달이 열려 있을 때 ESC 키로 닫을 수 있게 한다.
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsCreateRoomModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isCreateRoomModalOpen])

  useEffect(() => {
    // 소켓 연결/이벤트 바인딩은 앱 생명주기 동안 1회만 유지한다.
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
      setIsParticipantsMenuOpen(false)
      setIsCreateRoomModalOpen(false)
    })

    client.on('connect_error', (error) => {
      setErrorMessage(error?.message || 'Socket connection failed.')
    })

    client.on('room_joined', (payload) => {
      const nextRoomId = String(payload?.roomId || '').trim()
      if (!nextRoomId) return

      setJoinedRoomId(nextRoomId)
      setIsMobileChatView(true)
      setIsParticipantsMenuOpen(false)
      void loadMessageHistory(nextRoomId)
      void fetchRooms()
    })

    client.on('room_participants', (payload) => {
      // 현재 보고 있는 방의 참여자 목록만 반영해 UI 불일치를 방지한다.
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
    // 메시지가 추가되면 마지막 항목으로 자동 스크롤한다.
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

          <div className="room-search">
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="방 이름 또는 메시지 검색"
            />
          </div>

          <ul className="room-list">
            {roomsLoading && <li className="state-item">Loading rooms...</li>}
            {!roomsLoading && rooms.length === 0 && <li className="state-item">No rooms yet.</li>}
            {!roomsLoading && rooms.length > 0 && filteredRooms.length === 0 && (
              <li className="state-item">검색 결과가 없습니다.</li>
            )}

            {filteredRooms.map((room) => {
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

          <button
            type="button"
            className="fab-create-room"
            aria-label="새 방 만들기"
            onClick={() => setIsCreateRoomModalOpen(true)}
          >
            +
          </button>
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

            <div className="participants-menu" ref={participantsMenuRef}>
              <button
                type="button"
                className="participants-menu-button"
                onClick={() => setIsParticipantsMenuOpen((prev) => !prev)}
                disabled={!joinedRoomId}
              >
                참여자 ({participants.length})
              </button>

              {isParticipantsMenuOpen && (
                <div className="participants-dropdown">
                  <p className="participants-title">대화상대</p>
                  {participants.length === 0 ? (
                    <p className="participants-empty">참여자 정보가 없습니다.</p>
                  ) : (
                    <ul className="participants-list">
                      {participants.map((participant) => {
                        const isMe = participant.userId === currentUserId
                        return (
                          <li key={participant.userId} className="participants-row">
                            <span>{participant.nickname}{isMe ? ' (나)' : ''}</span>
                            <span className={`participant-chip ${participant.online ? 'online' : 'offline'}`}>
                              {participant.online ? 'online' : 'offline'}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
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

      {isCreateRoomModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            // 오버레이 자체를 눌렀을 때만 닫아 내부 카드 클릭과 구분한다.
            if (event.target === event.currentTarget) {
              setIsCreateRoomModalOpen(false)
            }
          }}
        >
          <section className="modal-card" role="dialog" aria-modal="true" aria-label="방 생성">
            <h3>새 방 만들기</h3>
            <p>방 이름을 입력하면 생성 후 자동으로 입장합니다.</p>
            <input
              value={newRoomName}
              onChange={(event) => setNewRoomName(event.target.value)}
              onKeyUp={(event) => {
                if (event.key === 'Enter') {
                  void handleCreateRoomSubmit()
                }
              }}
              placeholder="예: 프로젝트 회의방"
            />
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setIsCreateRoomModalOpen(false)}>
                취소
              </button>
              <button type="button" onClick={() => void handleCreateRoomSubmit()} disabled={!newRoomName.trim()}>
                생성
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
