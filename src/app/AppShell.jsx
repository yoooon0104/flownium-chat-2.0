import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../App.css'
import LoginGate from '../features/auth/components/LoginGate'
import SignupOnboarding from '../features/auth/components/SignupOnboarding'
import { useKakaoAuth } from '../features/auth/hooks/useKakaoAuth'
import RoomPanel from '../features/chat/components/RoomPanel'
import ChatPanel from '../features/chat/components/ChatPanel'
import CreateRoomModal from '../features/chat/components/CreateRoomModal'
import { useChatMessages } from '../features/chat/hooks/useChatMessages'
import { useChatRooms } from '../features/chat/hooks/useChatRooms'
import { useChatSocket } from '../features/chat/hooks/useChatSocket'
import UserMenu from '../features/user/components/UserMenu'
import ProfileModal from '../features/user/components/ProfileModal'
import SettingsModal from '../features/user/components/SettingsModal'
import { createChatApi } from '../services/api/chatApi'
import { createChatSocketClient } from '../services/socket/chatSocketClient'

// 배포 환경에서는 VITE_API_BASE_URL을 사용하고, 미설정 시 로컬 기본값으로 동작한다.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010').replace(/\/$/, '')

// 토큰 payload에서 사용자 식별자를 복구해 초기 렌더 fallback으로 사용한다.
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

function AppShell() {
  const messagesEndRef = useRef(null)

  const {
    authState,
    startKakaoLogin,
    refreshAccessToken,
    completeSignup,
    updateProfileNickname,
    clearSession,
  } = useKakaoAuth(API_BASE_URL)

  const { accessToken, user, pendingSignup, isInitializing, error } = authState

  const [joinedRoomId, setJoinedRoomId] = useState('')
  const [participants, setParticipants] = useState([])
  const [isParticipantsMenuOpen, setIsParticipantsMenuOpen] = useState(false)

  const [text, setText] = useState('')
  const [isMobileChatView, setIsMobileChatView] = useState(false)

  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  const authPayload = useMemo(() => parseJwtPayload(accessToken), [accessToken])

  const currentUser = useMemo(() => {
    if (user?.id) return user
    return {
      id: String(authPayload?.userId || authPayload?.sub || ''),
      nickname: String(authPayload?.nickname || '게스트'),
      profileImage: '',
    }
  }, [authPayload, user])

  const createSocketClient = useCallback((token) => createChatSocketClient(API_BASE_URL, token), [])

  const chatApi = useMemo(() => {
    if (!accessToken) return null
    return createChatApi({
      apiBaseUrl: API_BASE_URL,
      getAccessToken: () => localStorage.getItem('accessToken') || accessToken,
      onUnauthorizedRetry: refreshAccessToken,
    })
  }, [accessToken, refreshAccessToken])

  const {
    messages,
    isLoadingHistory,
    historyError,
    loadMessageHistory,
    appendMessage,
    clearMessages,
  } = useChatMessages({ chatApi })

  const {
    rooms,
    roomsLoading,
    searchKeyword,
    setSearchKeyword,
    errorMessage,
    setErrorMessage,
    filteredRooms,
    fetchRooms,
    createRoom,
    clearRooms,
  } = useChatRooms({ chatApi })

  const handleLogout = useCallback(() => {
    clearSession('')
    setJoinedRoomId('')
    setParticipants([])
    setText('')
    setIsMobileChatView(false)
    setIsParticipantsMenuOpen(false)
    setIsCreateRoomModalOpen(false)
    setNewRoomName('')
    setIsUserMenuOpen(false)
    setIsProfileModalOpen(false)
    setIsSettingsModalOpen(false)
    setErrorMessage('')
    clearRooms()
    clearMessages()
  }, [clearMessages, clearRooms, clearSession, setErrorMessage])

  const handleSocketConnect = useCallback(() => {
    setErrorMessage('')
    void fetchRooms()
  }, [fetchRooms, setErrorMessage])

  const handleSocketUnauthorized = useCallback(async () => {
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      handleLogout()
    }
    return refreshed
  }, [handleLogout, refreshAccessToken])

  const handleSocketRoomJoined = useCallback((nextRoomId) => {
    setJoinedRoomId(nextRoomId)
    setIsMobileChatView(true)
    setIsParticipantsMenuOpen(false)
    void loadMessageHistory(nextRoomId)
    void fetchRooms()
  }, [fetchRooms, loadMessageHistory])

  const handleSocketReceiveMessage = useCallback((message) => {
    appendMessage(message)
    void fetchRooms()
  }, [appendMessage, fetchRooms])

  const handleSocketParticipants = useCallback((nextParticipants) => {
    setParticipants(nextParticipants)
  }, [])

  const handleSocketError = useCallback((message) => {
    setErrorMessage(message)
  }, [setErrorMessage])

  const {
    isConnected,
    joinRoom: emitJoinRoom,
    sendMessage,
    setCurrentRoom,
    disconnectSocket,
  } = useChatSocket({
    accessToken,
    isAuthInitializing: isInitializing,
    createSocketClient,
    onConnect: handleSocketConnect,
    onUnauthorized: handleSocketUnauthorized,
    onRoomJoined: handleSocketRoomJoined,
    onReceiveMessage: handleSocketReceiveMessage,
    onRoomParticipants: handleSocketParticipants,
    onError: handleSocketError,
  })

  useEffect(() => {
    setCurrentRoom(joinedRoomId)
  }, [joinedRoomId, setCurrentRoom])

  useEffect(() => {
    // 메시지가 추가되면 마지막 항목으로 자동 스크롤한다.
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, joinedRoomId, isLoadingHistory])

  const joinRoom = useCallback((roomId) => {
    if (!roomId) return

    setErrorMessage('')
    setParticipants([])
    setIsParticipantsMenuOpen(false)
    emitJoinRoom(roomId)
  }, [emitJoinRoom, setErrorMessage])

  const handleSendMessage = useCallback(() => {
    const normalized = text.trim()
    if (!joinedRoomId || !normalized) return

    sendMessage({
      roomId: joinedRoomId,
      text: normalized,
      type: 'text',
    })
    setText('')
  }, [joinedRoomId, sendMessage, text])

  const handleComposerKeyUp = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleCreateRoomSubmit = useCallback(async () => {
    const { ok, roomId } = await createRoom(newRoomName)
    if (!ok) return

    setIsCreateRoomModalOpen(false)
    setNewRoomName('')

    if (roomId) {
      emitJoinRoom(roomId)
    }
  }, [createRoom, emitJoinRoom, newRoomName])

  const activeRoom = useMemo(() => {
    return rooms.find((room) => room.id === joinedRoomId) || null
  }, [rooms, joinedRoomId])

  const canSend = Boolean(isConnected && joinedRoomId && text.trim().length > 0)

  if (isInitializing) {
    return <LoginGate isLoading authError={error} onStartKakaoLogin={startKakaoLogin} />
  }

  if (!accessToken && pendingSignup?.signupToken) {
    return (
      <SignupOnboarding
        pendingSignup={pendingSignup}
        errorMessage={error}
        onCompleteSignup={completeSignup}
        onCancel={handleLogout}
      />
    )
  }

  if (!accessToken) {
    return <LoginGate isLoading={false} authError={error} onStartKakaoLogin={startKakaoLogin} />
  }

  return (
    <main className="chat-app">
      <UserMenu
        isOpen={isUserMenuOpen}
        onToggle={setIsUserMenuOpen}
        isFloating
        onOpenProfile={() => {
          setIsUserMenuOpen(false)
          setIsProfileModalOpen(true)
        }}
        onOpenSettings={() => {
          setIsUserMenuOpen(false)
          setIsSettingsModalOpen(true)
        }}
        onLogout={() => {
          disconnectSocket()
          handleLogout()
        }}
      />

      <section className="chat-layout">
        <RoomPanel
          isMobileChatView={isMobileChatView}
          roomsLoading={roomsLoading}
          rooms={rooms}
          filteredRooms={filteredRooms}
          searchKeyword={searchKeyword}
          onSearch={setSearchKeyword}
          joinedRoomId={joinedRoomId}
          onJoinRoom={joinRoom}
          onOpenCreateRoom={() => setIsCreateRoomModalOpen(true)}
          toTimeLabel={toTimeLabel}
        />

        <ChatPanel
          isMobileChatView={isMobileChatView}
          activeRoom={activeRoom}
          joinedRoomId={joinedRoomId}
          onBack={() => setIsMobileChatView(false)}
          participantsProps={{
            joinedRoomId,
            participants,
            isOpen: isParticipantsMenuOpen,
            onToggle: setIsParticipantsMenuOpen,
            currentUserId: currentUser?.id || '',
          }}
          errorMessage={errorMessage}
          isLoadingHistory={isLoadingHistory}
          historyError={historyError}
          messages={messages}
          currentUserId={currentUser?.id || ''}
          messagesEndRef={messagesEndRef}
          text={text}
          onTextChange={setText}
          onComposerKeyUp={handleComposerKeyUp}
          onSendMessage={handleSendMessage}
          canSend={canSend}
        />
      </section>

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        roomName={newRoomName}
        onChangeRoomName={setNewRoomName}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onSubmit={handleCreateRoomSubmit}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        user={currentUser}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        user={currentUser}
        onClose={() => setIsSettingsModalOpen(false)}
        onSubmit={updateProfileNickname}
      />
    </main>
  )
}

export default AppShell

