import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import '../App.css'
import KakaoLinkPromptModal from '../features/auth/components/KakaoLinkPromptModal'
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
import AccountScreen from '../features/user/components/AccountScreen'
import SettingsModal from '../features/user/components/SettingsModal'
import SettingsScreen from '../features/user/components/SettingsScreen'
import { useNotifications } from '../features/notifications/hooks/useNotifications'
import NotificationsScreen from '../features/notifications/components/NotificationsScreen'
import MobileBottomTabBar from '../features/navigation/components/MobileBottomTabBar'
import { UserProfile } from '../domain/user/UserProfile'
import { createAuthApi } from '../services/api/authApi'
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
  const chatHistoryViewportRef = useRef(null)
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
    setUser,
    startKakaoLogin,
    startKakaoLink,
    refreshAccessToken,
    completeSignup,
    startEmailSignup,
    verifyEmailSignup,
    loginWithEmail,
    startPasswordReset,
    verifyPasswordReset,
    clearPendingEmailVerification,
    dismissKakaoLinkPrompt,
    clearPendingPasswordReset,
    updateProfileNickname,
    changePassword,
    unlinkKakao,
    deleteAccount,
    clearSession,
  } = useKakaoAuth(API_BASE_URL)

  const {
    accessToken,
    user,
    pendingSignup,
    pendingEmailVerification,
    pendingPasswordReset,
    shouldPromptKakaoLink,
    isInitializing,
    error,
    notice,
  } = authState

  const [joinedRoomId, setJoinedRoomId] = useState('')
  const [participants, setParticipants] = useState([])
  const [isParticipantsMenuOpen, setIsParticipantsMenuOpen] = useState(false)
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false)

  const [text, setText] = useState('')
  const [isMobileChatView, setIsMobileChatView] = useState(false)
  const [isMobileNotificationView, setIsMobileNotificationView] = useState(false)
  const [isMobileSettingsView, setIsMobileSettingsView] = useState(false)
  const [isMobileAccountView, setIsMobileAccountView] = useState(false)
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
  const [pendingEmailChange, setPendingEmailChange] = useState(null)

  const authPayload = useMemo(() => parseJwtPayload(accessToken), [accessToken])

  const currentUser = useMemo(() => {
    if (user?.id) return user
    return {
      id: String(authPayload?.userId || authPayload?.sub || ''),
      nickname: String(authPayload?.nickname || 'Guest'),
      profileImage: '',
      email: '',
      linkedProviders: [],
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

  const authApi = useMemo(() => createAuthApi(API_BASE_URL), [])

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
    setPendingEmailChange(null)
    setJoinedRoomId('')
    setParticipants([])
    setText('')
    setIsMobileChatView(false)
    setIsMobileNotificationView(false)
    setIsMobileSettingsView(false)
    setIsMobileAccountView(false)
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

  const handleStartEmailChange = useCallback(async (payload) => {
    const execute = async (token) => authApi.startEmailChange(payload, token)

    let currentToken = accessToken || localStorage.getItem('accessToken') || ''
    if (!currentToken) {
      throw new Error('로그인이 필요합니다.')
    }

    let result = await execute(currentToken)
    if (result.status === 401) {
      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
      }

      currentToken = localStorage.getItem('accessToken') || ''
      result = await execute(currentToken)
    }

    if (!result.ok || !result.body?.nextEmail) {
      const code = String(result.body?.error?.code || '').trim()
      if (code === 'EMAIL_CHANGE_NOT_AVAILABLE') throw new Error('이메일 변경을 사용할 수 없습니다.')
      if (code === 'EMAIL_UNCHANGED') throw new Error('기존 이메일과 다른 주소를 입력해주세요.')
      if (code === 'INVALID_CURRENT_PASSWORD') throw new Error('현재 비밀번호가 올바르지 않습니다.')
      if (code === 'EMAIL_ALREADY_REGISTERED') throw new Error('이미 가입된 이메일입니다.')
      if (code === 'EMAIL_CHANGE_RESEND_COOLDOWN') throw new Error('이메일 변경 코드를 너무 자주 요청하고 있습니다. 잠시 후 다시 시도해주세요.')
      if (code === 'INVALID_EMAIL') throw new Error('올바른 이메일 형식으로 입력해주세요.')
      if (code === 'INVALID_PASSWORD') throw new Error('현재 비밀번호를 확인해주세요.')
      throw new Error(String(result.body?.error?.message || '이메일 변경을 시작하지 못했습니다.'))
    }

    setPendingEmailChange({
      currentEmail: String(result.body.currentEmail || ''),
      nextEmail: String(result.body.nextEmail || ''),
      expiresAt: String(result.body.expiresAt || ''),
      resendAvailableAt: String(result.body.resendAvailableAt || ''),
      debugCode: String(result.body.debugCode || ''),
    })

    return result.body
  }, [accessToken, authApi, refreshAccessToken])

  const handleVerifyEmailChange = useCallback(async (payload) => {
    const execute = async (token) => authApi.verifyEmailChange(payload, token)

    let currentToken = accessToken || localStorage.getItem('accessToken') || ''
    if (!currentToken) {
      throw new Error('로그인이 필요합니다.')
    }

    let result = await execute(currentToken)
    if (result.status === 401) {
      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
      }

      currentToken = localStorage.getItem('accessToken') || ''
      result = await execute(currentToken)
    }

    if (!result.ok || result.body?.changed !== true || !result.body?.user) {
      const code = String(result.body?.error?.code || '').trim()
      if (code === 'EMAIL_CHANGE_NOT_FOUND') throw new Error('이메일 변경 인증 요청을 찾지 못했습니다.')
      if (code === 'INVALID_EMAIL_CHANGE_CODE') throw new Error('이메일 변경 코드가 올바르지 않습니다.')
      if (code === 'EMAIL_CHANGE_CODE_EXPIRED') throw new Error('이메일 변경 코드가 만료되었습니다. 다시 요청해주세요.')
      if (code === 'EMAIL_ALREADY_REGISTERED') throw new Error('이미 가입된 이메일입니다.')
      if (code === 'EMAIL_CHANGE_NOT_AVAILABLE') throw new Error('이메일 변경을 사용할 수 없습니다.')
      if (code === 'INVALID_EMAIL') throw new Error('올바른 이메일 형식으로 입력해주세요.')
      throw new Error(String(result.body?.error?.message || '이메일 변경을 완료하지 못했습니다.'))
    }

    setUser(UserProfile.normalize(result.body.user))
    setPendingEmailChange(null)
    return result.body.user
  }, [accessToken, authApi, refreshAccessToken, setUser])

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
    setIsMobileAccountView(false)
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
    setIsMobileAccountView(false)
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
    if (!chatHistoryViewportRef.current || isLoadingHistory || isLoadingOlderHistory) return

    const roomChanged = shouldScrollToBottomRef.current || previousRoomIdRef.current !== joinedRoomId
    const appendedNewMessage = lastMessageMutation === 'append'

    if (joinedRoomId && (roomChanged || appendedNewMessage)) {
      const viewport = chatHistoryViewportRef.current
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: roomChanged ? 'auto' : 'smooth',
      })
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
    setIsMobileAccountView(false)
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
    if (friend?.isDeleted) {
      setErrorMessage('탈퇴한 회원입니다.')
      setSelectedMobileFriend(null)
      return
    }

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
  }, [createRoom, emitJoinRoom, fetchNotifications, setErrorMessage])

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

  const composerDisabledReason = activeRoom?.directChatDisabled
    ? '탈퇴한 회원입니다.'
    : ''

  const roomMemberCount = Array.isArray(activeRoom?.memberIds)
    ? activeRoom.memberIds.length
    : Array.isArray(participants)
      ? participants.length
      : 0

  const optimisticUnreadCount = Math.max(roomMemberCount - 1, 0)


  const canSend = Boolean(
    isConnected &&
    joinedRoomId &&
    !isLoadingHistory &&
    !activeRoom?.directChatDisabled &&
    text.trim().length > 0
  )

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
    if (isMobileAccountView) return 'settings'
    if (isMobileSettingsView) return 'settings'
    return activeTab === 'rooms' ? 'rooms' : 'friends'
  }, [activeTab, isMobileAccountView, isMobileNotificationView, isMobileSettingsView])

  // 모바일 하단 탭은 단순 화면 전환만 담당한다.
  // 실제 데이터는 기존 Friends/Rooms/Notifications 화면이 그대로 사용하므로, 여기서는 관련 상태만 정리한다.
  const handleSelectMobileFriends = useCallback(() => {
    setActiveTab('friends')
    setIsMobileChatView(false)
    setIsMobileNotificationView(false)
    setIsMobileSettingsView(false)
    setIsMobileAccountView(false)
    setIsNotificationMenuOpen(false)
  }, [])

  const handleSelectMobileRooms = useCallback(() => {
    setActiveTab('rooms')
    setIsMobileChatView(false)
    setIsMobileNotificationView(false)
    setIsMobileSettingsView(false)
    setIsMobileAccountView(false)
    setIsNotificationMenuOpen(false)
  }, [])

  const handleSelectMobileNotifications = useCallback(() => {
    setIsMobileChatView(false)
    setIsMobileNotificationView(true)
    setIsMobileSettingsView(false)
    setIsMobileAccountView(false)
    setIsNotificationMenuOpen(false)
  }, [])

  const handleSelectMobileSettings = useCallback(() => {
    setIsMobileChatView(false)
    setIsMobileNotificationView(false)
    setIsMobileSettingsView(true)
    setIsMobileAccountView(false)
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
        isDeleted: item.counterpart.isDeleted === true,
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
        isDeleted: item.counterpart.isDeleted === true,
      }))
      .filter((friend) => !currentMemberIds.has(friend.id) && !friend.isDeleted)
      .sort((a, b) => {
        const left = `${a.nickname} ${a.email}`.trim()
        const right = `${b.nickname} ${b.email}`.trim()
        return left.localeCompare(right, 'ko')
      })
  }, [acceptedFriends, activeRoom?.memberIds])

  const creatableFriends = useMemo(
    () => filteredFriends.filter((friend) => !friend.isDeleted),
    [filteredFriends]
  )

  if (isInitializing) {
    return (
      <LoginGate
        isLoading
        authError={error}
        authNotice={notice}
        resolvedTheme={resolvedTheme}
        onStartKakaoLogin={startKakaoLogin}
      />
    )
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
    return (
      <LoginGate
        isLoading={false}
        authError={error}
        resolvedTheme={resolvedTheme}
        authNotice={notice}
        authNotice={notice}
        resolvedTheme={resolvedTheme}
        pendingEmailVerification={pendingEmailVerification}
        pendingPasswordReset={pendingPasswordReset}
        onStartKakaoLogin={startKakaoLogin}
        onStartEmailSignup={startEmailSignup}
        onVerifyEmailSignup={verifyEmailSignup}
        onLoginWithEmail={loginWithEmail}
        onStartPasswordReset={startPasswordReset}
        onVerifyPasswordReset={verifyPasswordReset}
        onClearPendingEmailVerification={clearPendingEmailVerification}
        onClearPendingPasswordReset={clearPendingPasswordReset}
      />
    )
  }

  return (
    <main className="min-h-[100dvh] overflow-hidden px-3 py-3 text-[var(--text-primary)] md:px-5 md:py-5">
      <section className="mx-auto grid h-[calc(100dvh-24px)] w-full max-w-[1440px] min-h-0 grid-cols-1 gap-3 md:h-[calc(100dvh-40px)] lg:grid-cols-[minmax(380px,440px)_1fr]">
        <RoomPanel
          isMobileChatView={isMobileChatView}
          isMobileNotificationView={isMobileNotificationView}
          isMobileSettingsView={isMobileSettingsView}
          isMobileAccountView={isMobileAccountView}
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
            if (isMobileViewport) {
              setIsMobileChatView(false)
              setIsMobileNotificationView(false)
              setIsMobileSettingsView(false)
              setIsMobileAccountView(true)
              return
            }
            setIsProfileModalOpen(true)
          }}
          onOpenSettings={() => {
            setIsUserMenuOpen(false)
            if (isMobileViewport) {
              setIsMobileChatView(false)
              setIsMobileNotificationView(false)
              setIsMobileSettingsView(true)
              setIsMobileAccountView(false)
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
            canInvite: !activeRoom?.directChatDisabled && inviteableFriends.length > 0,
          }}
          errorMessage={errorMessage || friendErrorMessage || notificationErrorMessage}
          isLoadingHistory={isLoadingHistory}
          isLoadingOlderHistory={isLoadingOlderHistory}
          hasMoreHistory={hasMoreHistory}
          hasLoadedInitialHistory={hasLoadedInitialHistory}
          historyError={historyError}
          messages={messages}
          currentUserId={currentUser?.id || ''}
          historyViewportRef={chatHistoryViewportRef}
          onLoadOlderMessages={() => void loadOlderMessageHistory(joinedRoomId)}
          text={text}
          onTextChange={setText}
          onComposerKeyUp={handleComposerKeyUp}
          onSendMessage={handleSendMessage}
          canSend={canSend}
          composerDisabledReason={composerDisabledReason}
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

        {isMobileAccountView && (
          <AccountScreen
            user={currentUser}
            pendingEmailChange={pendingEmailChange}
            onSubmitNickname={updateProfileNickname}
            onStartEmailChange={handleStartEmailChange}
            onVerifyEmailChange={handleVerifyEmailChange}
            onChangePassword={changePassword}
            onStartKakaoLink={startKakaoLink}
            onUnlinkKakao={unlinkKakao}
            onDeleteAccount={handleDeleteAccount}
            onBack={() => setIsMobileAccountView(false)}
            emphasizeKakaoLink={shouldPromptKakaoLink && !currentUser?.linkedProviders?.includes('kakao')}
          />
        )}

        {isMobileSettingsView && (
          <SettingsScreen
            themePreference={themePreference}
            onChangeTheme={handleChangeTheme}
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
          friends={creatableFriends}
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
        pendingEmailChange={pendingEmailChange}
        onSubmitNickname={updateProfileNickname}
        onStartEmailChange={handleStartEmailChange}
        onVerifyEmailChange={handleVerifyEmailChange}
        onChangePassword={changePassword}
        onStartKakaoLink={startKakaoLink}
        onUnlinkKakao={unlinkKakao}
        onDeleteAccount={handleDeleteAccount}
        emphasizeKakaoLink={shouldPromptKakaoLink && !currentUser?.linkedProviders?.includes('kakao')}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen && !isMobileViewport}
        themePreference={themePreference}
        onChangeTheme={handleChangeTheme}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <KakaoLinkPromptModal
        isOpen={shouldPromptKakaoLink && !currentUser?.linkedProviders?.includes('kakao')}
        onDismiss={dismissKakaoLinkPrompt}
        onConfirm={() => {
          dismissKakaoLinkPrompt()
          if (isMobileViewport) {
            setIsMobileAccountView(true)
            setIsMobileSettingsView(false)
            setIsMobileNotificationView(false)
            setIsMobileChatView(false)
            return
          }
          setIsProfileModalOpen(true)
        }}
      />
    </main>
  )
}

export default AppShell














