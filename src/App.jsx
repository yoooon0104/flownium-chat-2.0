import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import LoginGate from './components/auth/LoginGate.jsx'
import { useKakaoAuth } from './hooks/useKakaoAuth.js'
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

// JSON 파싱 실패를 null로 처리해 호출부 예외 분기를 단순화한다.
const parseJsonSafe = async (response) => {
  try {
    return await response.json()
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
  const socketRef = useRef(null)

  const {
    accessToken,
    authUser,
    authError,
    isAuthInitializing,
    refreshAccessToken,
    fetchWithAuth,
    startKakaoLogin,
    clearAuthSession,
  } = useKakaoAuth(API_BASE_URL)

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

  const authPayload = useMemo(() => parseJwtPayload(accessToken), [accessToken])

  const displayName = useMemo(() => {
    return authUser?.nickname || authPayload?.nickname || '게스트'
  }, [authPayload, authUser])

  const currentUserId = useMemo(() => {
    return authUser?.id || authPayload?.userId || authPayload?.sub || ''
  }, [authPayload, authUser])

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

  // 현재 사용자 기준 참여 방 목록을 가져온다.
  const fetchRooms = useCallback(async () => {
    if (!accessToken) return

    try {
      setRoomsLoading(true)
      const res = await fetchWithAuth(`${API_BASE_URL}/api/chatrooms`)

      if (!res.ok) {
        throw new Error('failed to load rooms')
      }

      const data = await parseJsonSafe(res)
      setRooms(Array.isArray(data?.rooms) ? data.rooms : [])
    } catch {
      setErrorMessage('채팅방 목록을 불러오지 못했습니다.')
    } finally {
      setRoomsLoading(false)
    }
  }, [accessToken, fetchWithAuth])

  // 방 입장 시 최근 메시지 히스토리를 불러온다.
  const loadMessageHistory = useCallback(async (roomId) => {
    if (!accessToken) return

    try {
      setIsLoadingHistory(true)
      setHistoryError('')
      setMessages([])

      const res = await fetchWithAuth(`${API_BASE_URL}/api/chatrooms/${roomId}/messages?limit=50`)

      if (res.status === 503) {
        setHistoryError('Database is not connected.')
        return
      }

      if (!res.ok) {
        throw new Error('failed to load history')
      }

      const data = await parseJsonSafe(res)
      setMessages(Array.isArray(data?.messages) ? data.messages : [])
    } catch {
      setHistoryError('Failed to load message history.')
    } finally {
      setIsLoadingHistory(false)
    }
  }, [accessToken, fetchWithAuth])

  // 방 생성 API 호출 성공 시 목록 갱신 + 자동 입장을 수행한다.
  const createRoom = useCallback(async (roomName) => {
    const normalizedRoomName = String(roomName || '').trim()
    if (!normalizedRoomName) return false

    try {
      setErrorMessage('')
      const res = await fetchWithAuth(`${API_BASE_URL}/api/chatrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: normalizedRoomName }),
      })

      if (!res.ok) {
        throw new Error('failed to create room')
      }

      const data = await parseJsonSafe(res)
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
  }, [fetchRooms, fetchWithAuth, socket])

  // FAB -> 모달 -> 생성 확인 버튼 흐름으로 방을 추가한다.
  const handleCreateRoomSubmit = useCallback(async () => {
    const created = await createRoom(newRoomName)
    if (!created) return

    setIsCreateRoomModalOpen(false)
    setNewRoomName('')
  }, [createRoom, newRoomName])

  const handleLogout = useCallback(() => {
    // 최신 소켓 인스턴스를 ref로 참조해 로그아웃 시점의 stale state 문제를 피한다.
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
    }

    clearAuthSession('')
    setRooms([])
    setMessages([])
    setParticipants([])
    setJoinedRoomId('')
    setSocketId('')
    setIsConnected(false)
    setIsParticipantsMenuOpen(false)
    setIsCreateRoomModalOpen(false)
    setIsMobileChatView(false)
    setErrorMessage('')
    setHistoryError('')
  }, [clearAuthSession])

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
    if (!accessToken || isAuthInitializing) return

    // 소켓 연결/이벤트 바인딩은 로그인 상태에서만 유지한다.
    const client = io(API_BASE_URL, {
      autoConnect: true,
      auth: { token: accessToken },
    })

    socketRef.current = client
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
      const message = String(error?.message || 'Socket connection failed.')
      if (message.includes('unauthorized')) {
        void (async () => {
          const refreshed = await refreshAccessToken()
          if (!refreshed) {
            handleLogout()
            return
          }
          client.auth = { token: localStorage.getItem('accessToken') || '' }
          client.connect()
        })()
        return
      }

      setErrorMessage(message)
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
      if (socketRef.current === client) {
        socketRef.current = null
      }
      setSocket(null)
    }
  }, [accessToken, fetchRooms, isAuthInitializing, loadMessageHistory, refreshAccessToken, handleLogout])

  useEffect(() => {
    // 메시지가 추가되면 마지막 항목으로 자동 스크롤한다.
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, joinedRoomId, isLoadingHistory])

  const activeRoom = useMemo(() => {
    return rooms.find((room) => room.id === joinedRoomId) || null
  }, [rooms, joinedRoomId])

  if (!accessToken || isAuthInitializing) {
    return (
      <LoginGate
        isLoading={isAuthInitializing}
        authError={authError}
        onStartKakaoLogin={startKakaoLogin}
      />
    )
  }

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
          <button type="button" className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
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
              aria-label="채팅 목록으로 이동"
              onClick={() => setIsMobileChatView(false)}
            >
              ←
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

