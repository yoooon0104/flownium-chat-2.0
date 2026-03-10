const parseJsonSafe = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

// 인증이 필요한 API 호출을 한곳으로 모은다.
// accessToken이 만료되면 refresh를 한 번 재시도한 뒤 같은 요청을 다시 호출한다.
export const createChatApi = ({ apiBaseUrl, getAccessToken, onUnauthorizedRetry }) => {
  const fetchWithAuth = async (url, options = {}, allowRetry = true) => {
    const token = getAccessToken()
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (response.status === 401 && allowRetry && onUnauthorizedRetry) {
      const retryable = await onUnauthorizedRetry()
      if (retryable) {
        return fetchWithAuth(url, options, false)
      }
    }

    return response
  }

  // 방 목록 응답에는 각 방 unreadCount와 전체 totalUnreadCount가 함께 들어온다.
  const getRooms = async () => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/chatrooms`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  // 채팅방 생성 API는 기존 name 기반 생성과 친구 선택 기반 생성 두 구조를 모두 지원한다.
  const createRoom = async (payload) => {
    const normalized = typeof payload === 'string' ? { name: payload } : payload
    const response = await fetchWithAuth(`${apiBaseUrl}/api/chatrooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  // 메시지 히스토리 응답에는 텍스트뿐 아니라 메시지별 unreadCount도 포함된다.
  const getRoomMessages = async (roomId, options = {}) => {
    const normalizedOptions = typeof options === 'number' ? { limit: options } : options
    const limit = Math.min(Math.max(Number(normalizedOptions?.limit) || 50, 1), 100)
    const query = new URLSearchParams({ limit: String(limit) })

    if (normalizedOptions?.before) {
      query.set('before', String(normalizedOptions.before))
    }

    const response = await fetchWithAuth(`${apiBaseUrl}/api/chatrooms/${roomId}/messages?${query.toString()}`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const inviteToRoom = async (roomId, userIds) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/chatrooms/${roomId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const leaveRoom = async (roomId) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/chatrooms/${roomId}/leave`, {
      method: 'POST',
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  // 사용자가 실제로 방에 들어왔을 때 마지막 읽은 시점을 서버에 반영한다.
  // 이 호출이 성공하면 이후 방 목록 배지와 메시지 unread 숫자가 다시 계산된다.
  const markRoomRead = async (roomId) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/chatrooms/${roomId}/read`, {
      method: 'PATCH',
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const getFriends = async () => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/friends`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const searchFriends = async (keyword) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/friends/search?keyword=${encodeURIComponent(keyword)}`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const requestFriend = async (targetUserId) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/friends/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const respondFriendRequest = async (requestId, action) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/friends/request/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const getNotifications = async () => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/notifications`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const markNotificationRead = async (notificationId) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  return {
    fetchWithAuth,
    getRooms,
    createRoom,
    getRoomMessages,
    inviteToRoom,
    leaveRoom,
    markRoomRead,
    getFriends,
    searchFriends,
    requestFriend,
    respondFriendRequest,
    getNotifications,
    markNotificationRead,
  }
}

