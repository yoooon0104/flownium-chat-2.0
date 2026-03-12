const parseJsonSafe = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export const createAuthApi = (apiBaseUrl) => {
  const getKakaoCallback = async (code, state = '') => {
    const params = new URLSearchParams({
      code: String(code || ''),
    })
    if (state) {
      params.set('state', String(state || ''))
    }

    const response = await fetch(`${apiBaseUrl}/auth/kakao/callback?${params.toString()}`)
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const startKakaoLink = async (accessToken) => {
    const response = await fetch(`${apiBaseUrl}/auth/kakao/link/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const unlinkKakao = async (accessToken) => {
    const response = await fetch(`${apiBaseUrl}/auth/kakao/link`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
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

  const startEmailSignup = async (payload) => {
    const response = await fetch(`${apiBaseUrl}/auth/email/signup/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const verifyEmailSignup = async (payload) => {
    const response = await fetch(`${apiBaseUrl}/auth/email/signup/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const loginWithEmail = async (payload) => {
    const response = await fetch(`${apiBaseUrl}/auth/email/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const startPasswordReset = async (payload) => {
    const response = await fetch(`${apiBaseUrl}/auth/email/password-reset/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const verifyPasswordReset = async (payload) => {
    const response = await fetch(`${apiBaseUrl}/auth/email/password-reset/verify`, {
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

  const changePassword = async (payload, accessToken) => {
    const response = await fetch(`${apiBaseUrl}/auth/password`, {
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

  const startEmailChange = async (payload, accessToken) => {
    const response = await fetch(`${apiBaseUrl}/auth/email/change/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const verifyEmailChange = async (payload, accessToken) => {
    const response = await fetch(`${apiBaseUrl}/auth/email/change/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  const deleteAccount = async (accessToken) => {
    const response = await fetch(`${apiBaseUrl}/auth/account`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const body = await parseJsonSafe(response)
    return { ok: response.ok, status: response.status, body }
  }

  return {
    getKakaoCallback,
    startKakaoLink,
    unlinkKakao,
    refresh,
    completeSignup,
    startEmailSignup,
    verifyEmailSignup,
    loginWithEmail,
    startPasswordReset,
    verifyPasswordReset,
    getMe,
    updateProfile,
    changePassword,
    startEmailChange,
    verifyEmailChange,
    deleteAccount,
  }
}
