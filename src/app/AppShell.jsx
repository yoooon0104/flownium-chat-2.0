import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import '../App.css'
import LoginGate from '../features/auth/components/LoginGate'
import SignupOnboarding from '../features/auth/components/SignupOnboarding'
import { useKakaoAuth } from '../features/auth/hooks/useKakaoAuth'
import RoomPanel from '../features/chat/components/RoomPanel'
import ChatPanel from '../features/chat/components/ChatPanel'
import CreateRoomModal from '../features/chat/components/CreateRoomModal'
import InviteFriendsModal from '../features/chat/components/InviteFriendsModal'
import { useChatMessages } from '../features/chat/hooks/useChatMessages'
import { useChatRooms } from '../features/chat/hooks/useChatRooms'
import { useChatSocket } from '../features/chat/hooks/useChatSocket'
import AddFriendModal from '../features/friends/components/AddFriendModal'
import FriendActionSheet from '../features/friends/components/FriendActionSheet'
import { useFriends } from '../features/friends/hooks/useFriends'
import ProfileModal from '../features/user/components/ProfileModal'
import SettingsModal from '../features/user/components/SettingsModal'
import SettingsScreen from '../features/user/components/SettingsScreen'
import { useNotifications } from '../features/notifications/hooks/useNotifications'
import NotificationsScreen from '../features/notifications/components/NotificationsScreen'
import MobileBottomTabBar from '../features/navigation/components/MobileBottomTabBar'
import { createChatApi } from '../services/api/chatApi'
import { createChatSocketClient } from '../services/socket/chatSocketClient'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010').replace(/\/$/, '')
const THEME_PREFERENCE_KEY = 'themePreference'

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
  const shouldScrollToBottomRef = useRef(false)
  const [themePreference, setThemePreference] = useState(() => {
    if (typeof window === 'undefined') return 'system'
    return localStorage.getItem(THEME_PREFERENCE_KEY) || 'system'
  })
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const {
    authState,
    startKakaoLogin,
    refreshAccessToken,
    completeSignup,
    updateProfileNickname,
    deleteAccount,
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
  const [isMobileSettingsView, setIsMobileSettingsView] = useState(false)
  const [activeTab, setActiveTab] = useState('friends')
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 1023
  })

  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false)
  const [isInviteFriendsModalOpen, setIsInviteFriendsModalOpen] = useState(false)
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

  const resolvedTheme = themePreference === 'system'
    ? (systemPrefersDark ? 'dark' : 'light')
    : themePreference

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
    isLoadingOlderHistory,
    hasMoreHistory,
    hasLoadedInitialHistory,
    historyError,
    lastMessageMutation,
    prepareMessageHistory,
    loadMessageHistory,
    loadOlderMessageHistory,
    appendMessage,
    removeMessageByClientMessageId,
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
    inviteToRoom,
    leaveRoom,
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
    markNotificationRead,
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
    setIsMobileSettingsView(false)
    setIsParticipantsMenuOpen(false)
    setIsNotificationMenuOpen(false)
    setIsCreateRoomModalOpen(false)
    setIsInviteFriendsModalOpen(false)
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
    shouldScrollToBottomRef.current = true
    prepareMessageHistory()
    setJoinedRoomId(nextRoomId)
    setIsMobileChatView(true)
    setIsMobileNotificationView(false)
    setIsMobileSettingsView(false)
    setIsParticipantsMenuOpen(false)

    // room_participants 이벤트가 뒤늦게 오더라도, 방 입장 직후 헤더와 참여자 목록이
    // 비어 보이지 않게 room_joined payload의 participants를 먼저 반영한다.
    setParticipants(Array.isArray(payload?.participants) ? payload.participants : [])

    void (async () => {
      await loadMessageHistory(nextRoomId)
      await markRoomRead(nextRoomId)
    })()
  }, [loadMessageHistory, markRoomRead, prepareMessageHistory])

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

  const handleSocketMessageUpdated = useCallback((message) => {
    if (message?.chatRoomId !== joinedRoomId) return
    appendMessage(message)
  }, [appendMessage, joinedRoomId])

  const handleSocketParticipants = useCallback((nextParticipants) => {
    setParticipants(nextParticipants)
  }, [])

  const clearActiveRoom = useCallback(() => {
    shouldScrollToBottomRef.current = false
    setJoinedRoomId('')
    setParticipants([])
    setIsParticipantsMenuOpen(false)
    setIsInviteFriendsModalOpen(false)
    setIsMobileChatView(false)
    clearMessages()
  }, [clearMessages])

  const handleSocketRoomUpdated = useCallback(() => {
    void fetchRooms()
  }, [fetchRooms])

  const handleSocketRoomDeleted = useCallback((payload) => {
    const deletedRoomId = String(payload?.roomId || '').trim()
    if (!deletedRoomId) return

    if (deletedRoomId === joinedRoomId) {
      clearActiveRoom()
    }

    void fetchRooms()
  }, [clearActiveRoom, fetchRooms, joinedRoomId])

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
    onMessageUpdated: handleSocketMessageUpdated,
    onRoomParticipants: handleSocketParticipants,
    onRoomUpdated: handleSocketRoomUpdated,
    onRoomDeleted: handleSocketRoomDeleted,
    onNotificationCreated: handleSocketNotificationCreated,
    onNotificationRead: handleSocketNotificationRead,
    onFriendshipUpdated: handleSocketFriendshipUpdated,
    onError: handleSocketError,
  })

  useEffect(() => {
    setCurrentRoom(joinedRoomId)
  }, [joinedRoomId, setCurrentRoom])

  const previousRoomIdRef = useRef('')

  useLayoutEffect(() => {
    if (!messagesEndRef.current || isLoadingHistory || isLoadingOlderHistory) return

    const roomChanged = shouldScrollToBottomRef.current || previousRoomIdRef.current !== joinedRoomId
    const appendedNewMessage = lastMessageMutation === 'append'

    if (joinedRoomId && (roomChanged || appendedNewMessage)) {
      messagesEndRef.current.scrollIntoView({ behavior: roomChanged ? 'auto' : 'smooth', block: 'end' })
      shouldScrollToBottomRef.current = false
    }

    previousRoomIdRef.current = joinedRoomId
  }, [isLoadingHistory, isLoadingOlderHistory, joinedRoomId, lastMessageMutation, messages.length])

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
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => {
      setSystemPrefersDark(event.matches)
    }

    setSystemPrefersDark(mediaQuery.matches)
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.theme = themePreference
    document.documentElement.dataset.resolvedTheme = resolvedTheme
  }, [resolvedTheme, themePreference])

  const handleChangeTheme = useCallback((nextTheme) => {
    const normalized = ['light', 'dark', 'system'].includes(nextTheme) ? nextTheme : 'system'
    setThemePreference(normalized)
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_PREFERENCE_KEY, normalized)
    }
  }, [])

  useEffect(() => {
    if (!chatApi) return
    if (!isNotificationMenuOpen && !isMobileNotificationView) return
    if (notificationsLoading || unreadCount === 0) return

    void markAllNotificationsRead()
  }, [chatApi, isMobileNotificationView, isNotificationMenuOpen, markAllNotificationsRead, notificationsLoading, unreadCount])

  const joinRoom = useCallback((roomId) => {
    if (!roomId) return

    shouldScrollToBottomRef.current = true
    prepareMessageHistory()
    setJoinedRoomId(roomId)
    setIsMobileChatView(true)
    setIsMobileNotificationView(false)
    setIsMobileSettingsView(false)
    setErrorMessage('')
    setParticipants([])
    setIsParticipantsMenuOpen(false)
    emitJoinRoom(roomId)
  }, [emitJoinRoom, prepareMessageHistory, setErrorMessage])


  const handleCreateRoomSubmit = useCallback(async (payload) => {
    const result = await createRoom(payload)
    if (!result.ok) return result

    setIsCreateRoomModalOpen(false)
    setIsMobileNotificationView(false)
    setIsMobileSettingsView(false)
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
    setIsMobileSettingsView(false)
    void fetchNotifications()
    if (result.roomId) {
      emitJoinRoom(result.roomId)
    }
  }, [createRoom, emitJoinRoom, fetchNotifications])

  const handleRequestFriend = useCallback(async (targetUserId) => {
    await requestFriend(targetUserId)
    void fetchNotifications()
  }, [fetchNotifications, requestFriend])

  const handleDeleteAccount = useCallback(async () => {
    await deleteAccount()
    disconnectSocket()
    handleLogout()
  }, [deleteAccount, disconnectSocket, handleLogout])

  const handleRespondFriendRequest = useCallback(async (requestId, action) => {
    await respondToFriendRequest(requestId, action)
    void fetchNotifications()
  }, [fetchNotifications, respondToFriendRequest])

  const handleOpenRoomInvite = useCallback(async (notification) => {
    const roomId = String(notification?.payload?.roomId || '').trim()
    if (!roomId) return

    await markNotificationRead(notification.id)
    setActiveTab('rooms')
    setIsNotificationMenuOpen(false)
    setIsMobileNotificationView(false)
    setIsMobileSettingsView(false)
    emitJoinRoom(roomId)
  }, [emitJoinRoom, markNotificationRead])

  const handleInviteFriends = useCallback(async (userIds) => {
    if (!joinedRoomId) return { ok: false }

    const result = await inviteToRoom(joinedRoomId, userIds)
    if (!result.ok) return result

    setIsInviteFriendsModalOpen(false)
    if (result.createdNewRoom && result.roomId) {
      emitJoinRoom(result.roomId)
    }

    return result
  }, [emitJoinRoom, inviteToRoom, joinedRoomId])

  const handleLeaveRoom = useCallback(async () => {
    if (!joinedRoomId) return

    const shouldLeave = window.confirm('현재 채팅방에서 나가시겠습니까?')
    if (!shouldLeave) return

    const result = await leaveRoom(joinedRoomId)
    if (!result.ok) return

    clearActiveRoom()
  }, [clearActiveRoom, joinedRoomId, leaveRoom])

  const activeRoom = useMemo(() => {
    return rooms.find((room) => room.id === joinedRoomId) || null
  }, [rooms, joinedRoomId])

  const roomMemberCount = Array.isArray(activeRoom?.memberIds)
    ? activeRoom.memberIds.length
    : Array.isArray(participants)
      ? participants.length
      : 0

  const optimisticUnreadCount = Math.max(roomMemberCount - 1, 0)


  const canSend = Boolean(isConnected && joinedRoomId && !isLoadingHistory && text.trim().length > 0)

  const handleSendMessage = useCallback(async () => {
    const normalized = text.trim()
    if (!joinedRoomId || !normalized || isLoadingHistory) return

    // 히스토리 로딩이 끝난 뒤에만 optimistic 메시지를 붙여야
    // 직후 도착한 과거 메시지 응답이 방금 보낸 메시지를 덮어쓰지 않는다.
    // 실패/타임아웃 시에는 같은 clientMessageId로 optimistic 메시지를 제거한다.
    const clientMessageId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    appendMessage({
      clientMessageId,
      id: clientMessageId,
      chatRoomId: joinedRoomId,
      senderId: currentUser?.id || '',
      senderNickname: currentUser?.nickname || '?',
      type: 'text',
      text: normalized,
      timestamp: new Date().toISOString(),
      unreadCount: optimisticUnreadCount,
    })

    setText('')

    const result = await sendMessage({
      roomId: joinedRoomId,
      text: normalized,
      type: 'text',
      clientMessageId,
    })

    if (result?.ok) return

    removeMessageByClientMessageId(clientMessageId)
    setText(normalized)
    setErrorMessage(String(result?.message || '메시지 전송에 실패했습니다.'))
  }, [
    appendMessage,
    currentUser?.id,
    currentUser?.nickname,
    isLoadingHistory,
    joinedRoomId,
    optimisticUnreadCount,
    removeMessageByClientMessageId,
    sendMessage,
    setErrorMessage,
    text,
  ])

  const handleComposerKeyUp = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSendMessage()
    }
  }, [handleSendMessage])




  // 모바일 하단 탭바는 현재 어떤 1차 화면을 보고 있는지에 따라 활성 상태를 바꾼다.
  // 알림 화면이 열려 있으면 notifications를 우선으로 보고, 그 외에는 Friends/Rooms 탭 상태를 그대로 따른다.
  const mobileNavActiveItem = useMemo(() => {
    if (isMobileNotificationView) return 'notifications'
    if (isMobileSettingsView) return 'settings'
    return activeTab === 'rooms' ? 'rooms' : 'friends'
  }, [activeTab, isMobileNotificationView, isMobileSettingsView])

  // 모바일 하단 탭은 단순 화면 전환만 담당한다.
  // 실제 데이터는 기존 Friends/Rooms/Notifications 화면이 그대로 사용하므로, 여기서는 관련 상태만 정리한다.
  const handleSelectMobileFriends = useCallback(() => {
    setActiveTab('friends')
    setIsMobileChatView(false)
    setIsMobileNotificationView(false)
    setIsMobileSettingsView(false)
    setIsNotificationMenuOpen(false)
  }, [])

  const handleSelectMobileRooms = useCallback(() => {
    setActiveTab('rooms')
    setIsMobileChatView(false)
    setIsMobileNotificationView(false)
    setIsMobileSettingsView(false)
    setIsNotificationMenuOpen(false)
  }, [])

  const handleSelectMobileNotifications = useCallback(() => {
    setIsMobileChatView(false)
    setIsMobileNotificationView(true)
    setIsMobileSettingsView(false)
    setIsNotificationMenuOpen(false)
  }, [])

  const handleSelectMobileSettings = useCallback(() => {
    setIsMobileChatView(false)
    setIsMobileNotificationView(false)
    setIsMobileSettingsView(true)
    setIsNotificationMenuOpen(false)
    setIsUserMenuOpen(false)
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

  const inviteableFriends = useMemo(() => {
    const currentMemberIds = new Set(Array.isArray(activeRoom?.memberIds) ? activeRoom.memberIds : [])
    return acceptedFriends
      .map((item) => ({
        id: item.counterpart.id,
        nickname: item.counterpart.nickname || '',
        email: item.counterpart.email || '',
        profileImage: item.counterpart.profileImage || '',
      }))
      .filter((friend) => !currentMemberIds.has(friend.id))
      .sort((a, b) => {
        const left = `${a.nickname} ${a.email}`.trim()
        const right = `${b.nickname} ${b.email}`.trim()
        return left.localeCompare(right, 'ko')
      })
  }, [acceptedFriends, activeRoom?.memberIds])

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
    <main className="min-h-[100dvh] overflow-hidden px-3 py-3 text-[var(--text-primary)] md:px-5 md:py-5">
      <section className="mx-auto grid h-[calc(100dvh-24px)] w-full max-w-[1440px] min-h-0 grid-cols-1 gap-3 md:h-[calc(100dvh-40px)] lg:grid-cols-[minmax(380px,440px)_1fr]">
        <RoomPanel
          isMobileChatView={isMobileChatView}
          isMobileNotificationView={isMobileNotificationView}
          isMobileSettingsView={isMobileSettingsView}
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
          onOpenRoomInvite={handleOpenRoomInvite}
          isUserMenuOpen={isUserMenuOpen}
          onToggleUserMenu={setIsUserMenuOpen}
          onOpenProfile={() => {
            setIsUserMenuOpen(false)
            setIsProfileModalOpen(true)
          }}
          onOpenSettings={() => {
            setIsUserMenuOpen(false)
            if (isMobileViewport) {
              setIsMobileChatView(false)
              setIsMobileNotificationView(false)
              setIsMobileSettingsView(true)
              return
            }
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
            onOpenInvite: () => setIsInviteFriendsModalOpen(true),
            onLeaveRoom: () => void handleLeaveRoom(),
            canInvite: inviteableFriends.length > 0,
          }}
          errorMessage={errorMessage || friendErrorMessage || notificationErrorMessage}
          isLoadingHistory={isLoadingHistory}
          isLoadingOlderHistory={isLoadingOlderHistory}
          hasMoreHistory={hasMoreHistory}
          hasLoadedInitialHistory={hasLoadedInitialHistory}
          historyError={historyError}
          messages={messages}
          currentUserId={currentUser?.id || ''}
          messagesEndRef={messagesEndRef}
          onLoadOlderMessages={() => void loadOlderMessageHistory(joinedRoomId)}
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
            onOpenRoomInvite={handleOpenRoomInvite}
            onBack={() => setIsMobileNotificationView(false)}
          />
        )}

        {isMobileSettingsView && (
          <SettingsScreen
            user={currentUser}
            themePreference={themePreference}
            onChangeTheme={handleChangeTheme}
            onSubmit={updateProfileNickname}
            onDeleteAccount={handleDeleteAccount}
            onBack={() => setIsMobileSettingsView(false)}
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

      <InviteFriendsModal
        isOpen={isInviteFriendsModalOpen}
        friends={inviteableFriends}
        roomName={activeRoom?.name || ''}
        errorMessage={errorMessage}
        onClose={() => setIsInviteFriendsModalOpen(false)}
        onSubmit={handleInviteFriends}
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
        isOpen={isSettingsModalOpen && !isMobileViewport}
        user={currentUser}
        themePreference={themePreference}
        onChangeTheme={handleChangeTheme}
        onClose={() => setIsSettingsModalOpen(false)}
        onSubmit={updateProfileNickname}
        onDeleteAccount={handleDeleteAccount}
      />
    </main>
  )
}

export default AppShell












