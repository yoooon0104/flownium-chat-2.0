const parseJsonSafe = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

// 인증이 필요한 API 호출을 한 곳으로 모아둔다.
// accessToken이 만료되면 refresh를 한 번 시도한 뒤 같은 요청을 재호출한다.
// 이번 브랜치에서는 채팅방, 친구, 알림 관련 엔드포인트를 모두 여기서 다룬다.
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

  const getRooms = async () => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/chatrooms`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  // 채팅방 생성 API는 이번 스코프부터 두 가지 입력을 동시에 지원한다.
  // 1) 기존 호환: { name }
  // 2) 새 구조: { memberUserIds, name? }
  // 호출부가 문자열을 넘기면 기존 호환용으로 변환해 준다.
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

  const getRoomMessages = async (roomId, limit = 50) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/chatrooms/${roomId}/messages?limit=${limit}`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  // 친구 목록은 accepted / pendingReceived / pendingSent 구조로 내려온다.
  const getFriends = async () => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/friends`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  // 친구 검색은 이메일과 닉네임을 모두 대상으로 수행한다.
  // 검색 결과에는 사용자 정보와 현재 친구 관계 상태가 함께 포함된다.
  const searchFriends = async (keyword) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/friends/search?keyword=${encodeURIComponent(keyword)}`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  // 친구 요청 생성은 선택한 대상 사용자 ID 하나만 받는다.
  const requestFriend = async (targetUserId) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/friends/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  // 친구 요청 응답은 수락/거절/차단 액션 문자열로 처리한다.
  const respondFriendRequest = async (requestId, action) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/friends/request/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  // 알림 목록은 이번 브랜치에서 직접 UI를 크게 붙이진 않지만,
  // 친구 요청/방 초대 흐름 검증을 위해 API는 미리 노출한다.
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
    getFriends,
    searchFriends,
    requestFriend,
    respondFriendRequest,
    getNotifications,
    markNotificationRead,
  }
}