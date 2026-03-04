import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const SOCKET_SERVER_URL = 'http://localhost:3010'

function App() {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [socketId, setSocketId] = useState('')
  const [roomId, setRoomId] = useState('room-1')
  const [joinedRoomId, setJoinedRoomId] = useState('')
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const canSend = useMemo(() => {
    return !!socket && !!joinedRoomId && text.trim().length > 0
  }, [socket, joinedRoomId, text])

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
    const token = localStorage.getItem('accessToken')
    const client = io(SOCKET_SERVER_URL, {
      auth: token ? { token } : undefined,
    })

    setSocket(client)

    client.on('connect', () => {
      setIsConnected(true)
      setSocketId(client.id)
      setErrorMessage('')
      console.log('Connected to socket server:', client.id)
    })

    client.on('disconnect', () => {
      setIsConnected(false)
      setSocketId('')
      setJoinedRoomId('')
      console.log('Disconnected from socket server')
    })

    client.on('connect_error', (error) => {
      setErrorMessage(error?.message || '소켓 인증에 실패했습니다.')
    })

    client.on('room_joined', (payload) => {
      setJoinedRoomId(payload.roomId)
      void loadMessageHistory(payload.roomId)
    })

    client.on('receive_message', (payload) => {
      setMessages((prev) => [...prev, payload])
    })

    client.on('error', (payload) => {
      setErrorMessage(payload?.message || '알 수 없는 소켓 오류')
    })

    return () => {
      client.disconnect()
    }
  }, [])

  const handleJoinRoom = () => {
    if (!socket) return
    setErrorMessage('')
    socket.emit('join_room', { roomId })
  }

  const handleSendMessage = () => {
    if (!canSend) return

    socket.emit('send_message', {
      roomId: joinedRoomId,
      text: text.trim(),
      type: 'text',
    })
    setText('')
  }

  return (
    <main style={{ maxWidth: 760, margin: '24px auto', padding: 16 }}>
      <h1>Socket.IO 이벤트 테스트</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Socket ID: {socketId || 'Not connected yet'}</p>
      <p>Server: {SOCKET_SERVER_URL}</p>

      <hr />

      <h2>1) 방 입장</h2>
      <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="room id" />
      <button onClick={handleJoinRoom} disabled={!isConnected || !roomId.trim()} style={{ marginLeft: 8 }}>
        join_room
      </button>
      <p>Joined Room: {joinedRoomId || '아직 입장 전'}</p>

      <h2>2) 메시지 전송</h2>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="message text" />
      <button onClick={handleSendMessage} disabled={!canSend} style={{ marginLeft: 8 }}>
        send_message
      </button>

      {errorMessage && <p style={{ color: 'crimson' }}>Error: {errorMessage}</p>}

      <h2>3) 수신 메시지</h2>
      {isLoadingHistory && <p>히스토리 불러오는 중...</p>}
      {historyError && <p style={{ color: 'darkorange' }}>{historyError}</p>}
      {messages.length === 0 ? (
        <p>아직 수신된 메시지가 없습니다.</p>
      ) : (
        <ul>
          {messages.map((msg, idx) => (
            <li key={`${msg.timestamp}-${idx}`}>
              [{msg.chatRoomId}] {msg.senderNickname}: {msg.text} ({msg.timestamp})
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App