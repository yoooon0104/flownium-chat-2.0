const parseJsonSafe = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

// accessToken 만료 시 refresh 후 재시도하는 공통 fetch 래퍼를 제공한다.
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

  const createRoom = async (name) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/chatrooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const getRoomMessages = async (roomId, limit = 50) => {
    const response = await fetchWithAuth(`${apiBaseUrl}/api/chatrooms/${roomId}/messages?limit=${limit}`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  return {
    fetchWithAuth,
    getRooms,
    createRoom,
    getRoomMessages,
  }
}
