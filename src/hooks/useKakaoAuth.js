import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_REST_API_KEY || import.meta.env.VITE_KAKAO_CLIENT_ID || ''
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI || `${window.location.origin}`

// JSON 파싱 실패를 null로 처리해 에러 흐름을 단순화한다.
const parseJsonSafe = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

// 토큰 저장/갱신/콜백 처리 로직을 훅으로 분리해 App의 책임을 줄인다.
export const useKakaoAuth = (apiBaseUrl) => {
  const callbackHandledRef = useRef(false)

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || '')
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || '')
  const [authUser, setAuthUser] = useState(null)
  const [isAuthInitializing, setIsAuthInitializing] = useState(true)
  const [authError, setAuthError] = useState('')

  const kakaoAuthorizeUrl = useMemo(() => {
    if (!KAKAO_CLIENT_ID || !KAKAO_REDIRECT_URI) return ''

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: KAKAO_CLIENT_ID,
      redirect_uri: KAKAO_REDIRECT_URI,
    })

    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
  }, [])

  const clearAuthSession = useCallback((nextError = '') => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setAccessToken('')
    setRefreshToken('')
    setAuthUser(null)
    setAuthError(nextError)
  }, [])

  const refreshAccessToken = useCallback(async () => {
    const tokenForRefresh = refreshToken || localStorage.getItem('refreshToken') || ''
    if (!tokenForRefresh) {
      clearAuthSession('세션이 만료되었습니다. 다시 로그인해주세요.')
      return false
    }

    try {
      const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokenForRefresh }),
      })

      if (!response.ok) {
        clearAuthSession('세션이 만료되었습니다. 다시 로그인해주세요.')
        return false
      }

      const data = await parseJsonSafe(response)
      if (!data?.accessToken || !data?.refreshToken) {
        clearAuthSession('토큰 재발급 응답이 올바르지 않습니다.')
        return false
      }

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      setAuthUser(data.user || null)
      setAuthError('')
      return true
    } catch {
      clearAuthSession('네트워크 오류로 세션을 복구하지 못했습니다.')
      return false
    }
  }, [apiBaseUrl, clearAuthSession, refreshToken])

  const fetchWithAuth = useCallback(async (url, options = {}, allowRetry = true) => {
    const currentAccessToken = localStorage.getItem('accessToken') || accessToken
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {}),
      },
    })

    if (response.status === 401 && allowRetry) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return fetchWithAuth(url, options, false)
      }
    }

    return response
  }, [accessToken, refreshAccessToken])

  const startKakaoLogin = useCallback(() => {
    if (!kakaoAuthorizeUrl) {
      setAuthError('카카오 로그인 설정이 비어 있습니다. VITE_KAKAO_* 값을 확인하세요.')
      return
    }

    window.location.href = kakaoAuthorizeUrl
  }, [kakaoAuthorizeUrl])

  useEffect(() => {
    if (callbackHandledRef.current) return
    callbackHandledRef.current = true

    // 현재 페이지 URL의 code를 읽어 서버 콜백 API를 호출한다.
    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = String(params.get('code') || '').trim()

      if (!code) {
        setIsAuthInitializing(false)
        return
      }

      try {
        setAuthError('')
        const response = await fetch(`${apiBaseUrl}/auth/kakao/callback?code=${encodeURIComponent(code)}`)
        if (!response.ok) {
          const body = await parseJsonSafe(response)
          throw new Error(body?.error || '카카오 로그인 처리에 실패했습니다.')
        }

        const data = await parseJsonSafe(response)
        if (!data?.accessToken || !data?.refreshToken) {
          throw new Error('로그인 응답 형식이 올바르지 않습니다.')
        }

        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        setAccessToken(data.accessToken)
        setRefreshToken(data.refreshToken)
        setAuthUser(data.user || null)

        // 콜백 처리 완료 후 주소창 query를 제거한다.
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (error) {
        console.error('[kakao:callback] failed', error)
        clearAuthSession(error.message || '카카오 로그인 처리에 실패했습니다.')
      } finally {
        setIsAuthInitializing(false)
      }
    }

    void run()
  }, [apiBaseUrl, clearAuthSession])

  return {
    accessToken,
    authUser,
    authError,
    isAuthInitializing,
    refreshAccessToken,
    fetchWithAuth,
    startKakaoLogin,
    clearAuthSession,
  }
}
