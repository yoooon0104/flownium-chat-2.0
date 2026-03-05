const parseJsonSafe = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export const createAuthApi = (apiBaseUrl) => {
  const getKakaoCallback = async (code) => {
    const response = await fetch(`${apiBaseUrl}/auth/kakao/callback?code=${encodeURIComponent(code)}`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const refresh = async (refreshToken) => {
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const completeSignup = async (payload) => {
    const response = await fetch(`${apiBaseUrl}/auth/signup/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const getMe = async (accessToken) => {
    const response = await fetch(`${apiBaseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const updateProfile = async (payload, accessToken) => {
    const response = await fetch(`${apiBaseUrl}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  return {
    getKakaoCallback,
    refresh,
    completeSignup,
    getMe,
    updateProfile,
  }
}
