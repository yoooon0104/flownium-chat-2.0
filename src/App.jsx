import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const SOCKET_SERVER_URL = 'http://localhost:3010'

// JWT payload를 빠르게 확인하기 위한 유틸 함수.
// 현재 UI에서는 "내 메시지 판별(userId)"과 "닉네임 표시"에 사용한다.
const parseJwtPayload = (token) => {
  try {
    if (!token) return null
    const [, payload] = token.split('.')
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized)
    return JSON.parse(decoded)
  } catch (_error) {
    return null
  }
}

function App() {
  const messagesEndRef = useRef(null)
  // socket 인스턴스를 상태로 관리하면 이벤트 핸들러/버튼 로직에서 재사용하기 쉽다.
  const [socket, setSocket] = useState(null)
  // 연결 상태는 상단 배지, 버튼 활성화, 에러 메시지 해석에 사용한다.
  const [isConnected, setIsConnected] = useState(false)
  const [socketId, setSocketId] = useState('')
  // 사용자가 입장할 room id 입력값.
  const [roomIdInput, setRoomIdInput] = useState('room-1')
  // 서버에서 room_joined를 받은 실제 입장 room id.
  const [joinedRoomId, setJoinedRoomId] = useState('')
  // 메시지 입력창 값.
  const [text, setText] = useState('')
  // 현재 room 기준 메시지 목록(히스토리 + 실시간 수신 누적).
  const [messages, setMessages] = useState([])
  // 소켓 인증/이벤트 관련 일반 에러.
  const [errorMessage, setErrorMessage] = useState('')
  // 히스토리 API 호출 상태/에러.
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')
  // 모바일에서 "방 목록 화면 / 대화 화면" 전환 제어용.
  const [isMobileChatView, setIsMobileChatView] = useState(false)

  // 좌측 방 목록에 보여줄 후보 room id를 만든다.
  // Set을 사용해 중복 room id가 생기지 않도록 보장한다.
  const roomCandidates = useMemo(() => {
    const roomSet = new Set()
    if (joinedRoomId) {
      roomSet.add(joinedRoomId)
    }
    roomSet.add('room-1')

    messages.forEach((msg) => {
      const id = String(msg.chatRoomId || '').trim()
      if (id) {
        roomSet.add(id)
      }
    })

    return Array.from(roomSet)
  }, [joinedRoomId, messages])

  // 메시지 전송 버튼/엔터 전송 가능 여부.
  // 소켓 연결 + room 입장 + 입력값 존재 조건을 모두 만족해야 전송할 수 있다.
  const canSend = useMemo(() => {
    return !!socket && !!joinedRoomId && text.trim().length > 0
  }, [socket, joinedRoomId, text])

  // 방 입장 직후 과거 메시지를 가져온다.
  // 503(DB 미연결)은 기능상 허용 상태라 사용자에게 안내만 띄우고 앱은 계속 동작한다.
  const loadMessageHistory = async (targetRoomId) => {
    try {
      setIsLoadingHistory(true)
      setHistoryError('')

      const res = await fetch(`${SOCKET_SERVER_URL}/api/chatrooms/${targetRoomId}/messages?limit=50`)

      if (res.status === 503) {
        setMessages([])
        setHistoryError('DB 미연결 상태입니다. 실시간 메시지만 사용됩니다.')
        return
      }

      if (!res.ok) {
        throw new Error('failed to load history')
      }

      const data = await res.json()
      setMessages(Array.isArray(data.messages) ? data.messages : [])
    } catch (_error) {
      setHistoryError('메시지 히스토리 로드에 실패했습니다.')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    // 로컬 저장소 토큰이 있으면 소켓 handshake auth에 포함한다.
    // 서버의 io.use JWT 검증 로직과 맞물리는 핵심 부분.
    const token = localStorage.getItem('accessToken')
    const client = io(SOCKET_SERVER_URL, {
      auth: token ? { token } : undefined,
    })

    setSocket(client)

    client.on('connect', () => {
      // 정상 연결 시 상태를 갱신하고 이전 에러를 정리한다.
      setIsConnected(true)
      setSocketId(client.id)
      setErrorMessage('')
    })

    client.on('disconnect', () => {
      // 연결이 끊기면 room/모바일 뷰 상태를 초기화해 UI 불일치를 방지한다.
      setIsConnected(false)
      setSocketId('')
      setJoinedRoomId('')
      setIsMobileChatView(false)
    })

    client.on('connect_error', (error) => {
      // JWT 미설정/만료/서버 비밀키 문제는 connect_error로 들어온다.
      setErrorMessage(error?.message || '소켓 인증에 실패했습니다.')
    })

    client.on('room_joined', (payload) => {
      // 방 입장이 확인되면 상세 화면으로 전환하고 히스토리를 로드한다.
      setJoinedRoomId(payload.roomId)
      setIsMobileChatView(true)
      void loadMessageHistory(payload.roomId)
    })

    client.on('receive_message', (payload) => {
      setMessages((prev) => [...prev, payload])
    })

    client.on('error', (payload) => {
      // 커스텀 이벤트 에러(roomId 누락 등) 표시.
      setErrorMessage(payload?.message || '알 수 없는 소켓 오류')
    })

    // 컴포넌트 해제 시 연결을 반드시 정리해 중복 소켓/리스너 누수를 막는다.
    return () => {
      client.disconnect()
    }
  }, [])

  // 방 입장 요청.
  // 입력값 공백을 방지하고, 유효할 때만 join_room 이벤트를 보낸다.
  const handleJoinRoom = () => {
    if (!socket) return
    const nextRoomId = roomIdInput.trim()
    if (!nextRoomId) return

    setErrorMessage('')
    socket.emit('join_room', { roomId: nextRoomId })
  }

  // 메시지 전송 요청.
  // 서버 저장/브로드캐스트는 send_message 이벤트에서 처리된다.
  const handleSendMessage = () => {
    if (!canSend) return

    socket.emit('send_message', {
      roomId: joinedRoomId,
      text: text.trim(),
      type: 'text',
    })
    setText('')
  }

  // 요구사항: Enter key up 시 전송.
  // keydown이 아닌 keyup으로 처리해 사용자의 요청 동작과 정확히 맞춘다.
  const handleComposerKeyUp = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage()
    }
  }

  // JWT payload에서 닉네임/사용자 식별자를 계산한다.
  // 내 메시지 말풍선 정렬 판별(isMine)에 사용된다.
  const authPayload = useMemo(() => {
    const token = localStorage.getItem('accessToken')
    return parseJwtPayload(token)
  }, [])

  const displayName = useMemo(() => {
    return authPayload?.nickname || '게스트'
  }, [authPayload])

  const currentUserId = useMemo(() => {
    return authPayload?.userId || authPayload?.sub || ''
  }, [authPayload])

  // 메시지 목록이 갱신되면 마지막 메시지로 자동 스크롤한다.
  useEffect(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, joinedRoomId, isLoadingHistory])

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
            <h2>채팅</h2>
            <button type="button" className="ghost-button" disabled>
              새 채팅
            </button>
          </div>

          <div className="join-form">
            <input
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="room id 입력"
            />
            <button type="button" onClick={handleJoinRoom} disabled={!isConnected || !roomIdInput.trim()}>
              입장
            </button>
          </div>

          <ul className="room-list">
            {roomCandidates.map((room) => {
              const isActive = room === joinedRoomId
              return (
                <li key={room}>
                  <button
                    type="button"
                    className={`room-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setRoomIdInput(room)
                      if (room !== joinedRoomId) {
                        socket?.emit('join_room', { roomId: room })
                      } else {
                        setIsMobileChatView(true)
                      }
                    }}
                  >
                    <span className="avatar">{room.slice(0, 2).toUpperCase()}</span>
                    <span className="room-main">
                      <strong>{room}</strong>
                      <small>{isActive ? '현재 입장 중' : '입장 가능'}</small>
                    </span>
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
              목록
            </button>
            <div>
              <h3>{joinedRoomId || '방을 선택하세요'}</h3>
              <p>{joinedRoomId ? '대화 중' : '좌측에서 방을 선택하거나 입장하세요'}</p>
            </div>
          </div>

          <div className="message-area">
            {errorMessage && <p className="error-text">Error: {errorMessage}</p>}
            {isLoadingHistory && <p className="muted-text">히스토리 불러오는 중...</p>}
            {historyError && <p className="warn-text">{historyError}</p>}

            {messages.length === 0 ? (
              <p className="muted-text">아직 수신된 메시지가 없습니다.</p>
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
              placeholder={joinedRoomId ? '메시지를 입력하세요' : '먼저 방에 입장하세요'}
              disabled={!joinedRoomId}
            />
            <button type="button" onClick={handleSendMessage} disabled={!canSend}>
              전송
            </button>
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
