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
import AddFriendModal from '../features/friends/components/AddFriendModal'
import FriendActionSheet from '../features/friends/components/FriendActionSheet'
import { useFriends } from '../features/friends/hooks/useFriends'
import ProfileModal from '../features/user/components/ProfileModal'
import SettingsModal from '../features/user/components/SettingsModal'
import { useNotifications } from '../features/notifications/hooks/useNotifications'
import NotificationsScreen from '../features/notifications/components/NotificationsScreen'
import MobileBottomTabBar from '../features/navigation/components/MobileBottomTabBar'
import { createChatApi } from '../services/api/chatApi'
import { createChatSocketClient } from '../services/socket/chatSocketClient'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010').replace(/\/$/, '')

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
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false)

  const [text, setText] = useState('')
  const [isMobileChatView, setIsMobileChatView] = useState(false)
  const [isMobileNotificationView, setIsMobileNotificationView] = useState(false)
  const [activeTab, setActiveTab] = useState('friends')
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 1023
  })

  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false)
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false)
  const [selectedMobileFriend, setSelectedMobileFriend] = useState(null)

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
      email: '',
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
    totalUnreadCount,
    fetchRooms,
    createRoom,
    markRoomRead,
    clearRooms,
  } = useChatRooms({ chatApi })

  const {
    acceptedFriends,
    pendingReceived,
    pendingSent,
    friendsLoading,
    friendSearchResults,
    friendSearchLoading,
    friendErrorMessage,
    fetchFriends,
    searchFriends,
    requestFriend,
    respondToFriendRequest,
    clearFriends,
  } = useFriends({ chatApi })

  const {
    notifications,
    unreadCount,
    notificationsLoading,
    notificationErrorMessage,
    fetchNotifications,
    markAllNotificationsRead,
    clearNotifications,
  } = useNotifications({ chatApi })

  const handleLogout = useCallback(() => {
    clearSession('')
    setJoinedRoomId('')
    setParticipants([])
    setText('')
    setIsMobileChatView(false)
    setIsMobileNotificationView(false)
    setIsParticipantsMenuOpen(false)
    setIsNotificationMenuOpen(false)
    setIsCreateRoomModalOpen(false)
    setIsAddFriendModalOpen(false)
    setSelectedMobileFriend(null)
    setIsUserMenuOpen(false)
    setIsProfileModalOpen(false)
    setIsSettingsModalOpen(false)
    setErrorMessage('')
    clearRooms()
    clearMessages()
    clearFriends()
    clearNotifications()
  }, [clearFriends, clearMessages, clearNotifications, clearRooms, clearSession, setErrorMessage])

  // 소켓 재연결 시점에는 서버 메모리 상태가 바뀌었을 수 있으므로, 방/친구/알림 목록을 모두 다시 불러와 화면 기준 상태를 맞춘다.
  const handleSocketConnect = useCallback(() => {
    setErrorMessage('')
    void fetchRooms()
    void fetchFriends()
    void fetchNotifications()
  }, [fetchFriends, fetchNotifications, fetchRooms, setErrorMessage])

  const handleSocketUnauthorized = useCallback(async () => {
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      handleLogout()
    }
    return refreshed
  }, [handleLogout, refreshAccessToken])

  // 방 입장 직후 흐름:
  // 1) 현재 방 상태 반영
  // 2) 과거 메시지 로드
  // 3) 방을 실제로 열어본 시점으로 읽음 처리
  // 이 순서를 지켜야 새로 입장한 방의 unread 배지가 바로 정리된다.
  const handleSocketRoomJoined = useCallback((nextRoomId, payload) => {
    setJoinedRoomId(nextRoomId)
    setIsMobileChatView(true)
    setIsMobileNotificationView(false)
    setIsParticipantsMenuOpen(false)

    // room_participants ??????? ??? ??????, ? ?? ??? ?? ??? ??? ??? ??.
    // ??? room_joined? ?? ? participants? ?? ???? ?? ??? ???? ?? ??? ????.
    setParticipants(Array.isArray(payload?.participants) ? payload.participants : [])

    void (async () => {
      await loadMessageHistory(nextRoomId)
      await markRoomRead(nextRoomId)
    })()
  }, [loadMessageHistory, markRoomRead])

  // 실시간 메시지 수신 분기:
  // - 현재 열려 있는 방이면 본문에 바로 append
  // - 그중 상대 메시지면 읽음 처리까지 이어서 호출
  // - 다른 방 메시지는 본문에는 넣지 않고 방 목록 unread만 갱신
  const handleSocketReceiveMessage = useCallback((message) => {
    void (async () => {
      if (message?.chatRoomId === joinedRoomId) {
        appendMessage(message)

        if (message?.senderId && message.senderId !== currentUser?.id) {
          await markRoomRead(message.chatRoomId)
        }
        return
      }

      await fetchRooms()
    })()
  }, [appendMessage, currentUser?.id, fetchRooms, joinedRoomId, markRoomRead])

  const handleSocketParticipants = useCallback((nextParticipants) => {
    setParticipants(nextParticipants)
  }, [])

  const handleSocketNotificationCreated = useCallback(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  const handleSocketNotificationRead = useCallback(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  // 친구 요청/수락/거절은 Friends와 알림 허브를 함께 바꾸므로 둘 다 다시 조회한다.
  const handleSocketFriendshipUpdated = useCallback(() => {
    void fetchFriends()
    void fetchNotifications()
  }, [fetchFriends, fetchNotifications])

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
    onNotificationCreated: handleSocketNotificationCreated,
    onNotificationRead: handleSocketNotificationRead,
    onFriendshipUpdated: handleSocketFriendshipUpdated,
    onError: handleSocketError,
  })

  useEffect(() => {
    setCurrentRoom(joinedRoomId)
  }, [joinedRoomId, setCurrentRoom])

  useEffect(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, joinedRoomId, isLoadingHistory])

  useEffect(() => {
    if (!accessToken || !chatApi) return
    void fetchRooms()
    void fetchFriends()
    void fetchNotifications()
  }, [accessToken, chatApi, fetchFriends, fetchNotifications, fetchRooms])

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth <= 1023)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!chatApi) return
    if (!isNotificationMenuOpen && !isMobileNotificationView) return
    if (notificationsLoading || unreadCount === 0) return

    void markAllNotificationsRead()
  }, [chatApi, isMobileNotificationView, isNotificationMenuOpen, markAllNotificationsRead, notificationsLoading, unreadCount])

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

  const handleCreateRoomSubmit = useCallback(async (payload) => {
    const result = await createRoom(payload)
    if (!result.ok) return result

    setIsCreateRoomModalOpen(false)
    setIsMobileNotificationView(false)
    void fetchNotifications()
    if (result.roomId) {
      emitJoinRoom(result.roomId)
    }
    return result
  }, [createRoom, emitJoinRoom, fetchNotifications])

  const startDirectChat = useCallback(async (friend) => {
    if (!friend?.id) return

    const result = await createRoom({ memberUserIds: [friend.id] })
    if (!result.ok) return

    setActiveTab('rooms')
    setSelectedMobileFriend(null)
    setIsMobileNotificationView(false)
    void fetchNotifications()
    if (result.roomId) {
      emitJoinRoom(result.roomId)
    }
  }, [createRoom, emitJoinRoom, fetchNotifications])

  const handleRequestFriend = useCallback(async (targetUserId) => {
    await requestFriend(targetUserId)
    void fetchNotifications()
  }, [fetchNotifications, requestFriend])

  const handleRespondFriendRequest = useCallback(async (requestId, action) => {
    await respondToFriendRequest(requestId, action)
    void fetchNotifications()
  }, [fetchNotifications, respondToFriendRequest])

  const activeRoom = useMemo(() => {
    return rooms.find((room) => room.id === joinedRoomId) || null
  }, [rooms, joinedRoomId])

  const canSend = Boolean(isConnected && joinedRoomId && text.trim().length > 0)

  // 모바일 하단 탭바는 현재 어떤 1차 화면을 보고 있는지에 따라 활성 상태를 바꾼다.
  // 알림 화면이 열려 있으면 notifications를 우선으로 보고, 그 외에는 Friends/Rooms 탭 상태를 그대로 따른다.
  const mobileNavActiveItem = useMemo(() => {
    if (isMobileNotificationView) return 'notifications'
    return activeTab === 'rooms' ? 'rooms' : 'friends'
  }, [activeTab, isMobileNotificationView])

  // 모바일 하단 탭은 단순 화면 전환만 담당한다.
  // 실제 데이터는 기존 Friends/Rooms/Notifications 화면이 그대로 사용하므로, 여기서는 관련 상태만 정리한다.
  const handleSelectMobileFriends = useCallback(() => {
    setActiveTab('friends')
    setIsMobileChatView(false)
    setIsMobileNotificationView(false)
    setIsNotificationMenuOpen(false)
  }, [])

  const handleSelectMobileRooms = useCallback(() => {
    setActiveTab('rooms')
    setIsMobileChatView(false)
    setIsMobileNotificationView(false)
    setIsNotificationMenuOpen(false)
  }, [])

  const handleSelectMobileNotifications = useCallback(() => {
    setIsMobileChatView(false)
    setIsMobileNotificationView(true)
    setIsNotificationMenuOpen(false)
  }, [])

  const handleSelectMobileSettings = useCallback(() => {
    setIsMobileChatView(false)
    setIsMobileNotificationView(false)
    setIsNotificationMenuOpen(false)
    setIsUserMenuOpen(false)
    setIsSettingsModalOpen(true)
  }, [])

  const filteredFriends = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    const friends = acceptedFriends
      .map((item) => ({
        id: item.counterpart.id,
        nickname: item.counterpart.nickname || '',
        email: item.counterpart.email || '',
        profileImage: item.counterpart.profileImage || '',
      }))
      .sort((a, b) => {
        const left = `${a.nickname} ${a.email}`.trim()
        const right = `${b.nickname} ${b.email}`.trim()
        return left.localeCompare(right, 'ko')
      })

    if (!keyword) return friends

    return friends.filter((friend) => {
      const nickname = String(friend.nickname || '').toLowerCase()
      const email = String(friend.email || '').toLowerCase()
      return nickname.includes(keyword) || email.includes(keyword)
    })
  }, [acceptedFriends, searchKeyword])

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
      <section className="chat-layout">
        <RoomPanel
          isMobileChatView={isMobileChatView}
          isMobileNotificationView={isMobileNotificationView}
          isMobileViewport={isMobileViewport}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          roomsLoading={roomsLoading}
          friendsLoading={friendsLoading}
          filteredRooms={filteredRooms}
          filteredFriends={filteredFriends}
          searchKeyword={searchKeyword}
          onSearch={setSearchKeyword}
          joinedRoomId={joinedRoomId}
          onJoinRoom={joinRoom}
          onOpenCreateRoom={() => setIsCreateRoomModalOpen(true)}
          onOpenAddFriend={() => setIsAddFriendModalOpen(true)}
          onFriendDoubleClick={startDirectChat}
          onFriendTap={(friend) => {
            if (window.innerWidth <= 1023) {
              setSelectedMobileFriend(friend)
              return
            }
            void startDirectChat(friend)
          }}
          toTimeLabel={toTimeLabel}
          currentUser={currentUser}
          totalUnreadCount={totalUnreadCount}
          notificationUnreadCount={unreadCount}
          isNotificationMenuOpen={isNotificationMenuOpen}
          onToggleNotificationMenu={(next) => {
            if (isMobileViewport) {
              setIsMobileNotificationView(Boolean(next))
              setIsNotificationMenuOpen(false)
              return
            }
            setIsNotificationMenuOpen(Boolean(next))
          }}
          notificationsLoading={notificationsLoading}
          notifications={notifications}
          pendingReceived={pendingReceived}
          pendingSent={pendingSent}
          notificationErrorMessage={notificationErrorMessage}
          onRespondFriendRequest={handleRespondFriendRequest}
          isUserMenuOpen={isUserMenuOpen}
          onToggleUserMenu={setIsUserMenuOpen}
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
          errorMessage={errorMessage || friendErrorMessage || notificationErrorMessage}
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

        {isMobileNotificationView && (
          <NotificationsScreen
            unreadCount={unreadCount}
            notificationsLoading={notificationsLoading}
            notifications={notifications}
            pendingReceived={pendingReceived}
            notificationErrorMessage={notificationErrorMessage}
            onRespondFriendRequest={handleRespondFriendRequest}
            onBack={() => setIsMobileNotificationView(false)}
          />
        )}
      </section>

      {isMobileViewport && !isMobileChatView && (
        <MobileBottomTabBar
          activeItem={mobileNavActiveItem}
          totalUnreadCount={totalUnreadCount}
          notificationUnreadCount={unreadCount}
          onSelectFriends={handleSelectMobileFriends}
          onSelectRooms={handleSelectMobileRooms}
          onSelectNotifications={handleSelectMobileNotifications}
          onSelectSettings={handleSelectMobileSettings}
        />
      )}
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        friends={filteredFriends}
        errorMessage={errorMessage}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onSubmit={handleCreateRoomSubmit}
      />

      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        isLoading={friendSearchLoading}
        results={friendSearchResults}
        errorMessage={friendErrorMessage}
        onSearch={searchFriends}
        onRequestFriend={handleRequestFriend}
        onClose={() => setIsAddFriendModalOpen(false)}
      />

      <FriendActionSheet
        friend={selectedMobileFriend}
        isOpen={Boolean(selectedMobileFriend)}
        onStartChat={startDirectChat}
        onClose={() => setSelectedMobileFriend(null)}
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










