import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthSession } from '../../../domain/auth/AuthSession'
import { UserProfile } from '../../../domain/user/UserProfile'
import { createAuthApi } from '../../../services/api/authApi'

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_REST_API_KEY || import.meta.env.VITE_KAKAO_CLIENT_ID || ''
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI || `${window.location.origin}`

// 인증 상태와 온보딩 분기를 훅으로 묶어 AppShell이 화면 조합에만 집중하도록 만든다.
export const useKakaoAuth = (apiBaseUrl) => {
  const callbackHandledRef = useRef(false)
  const authApi = useMemo(() => createAuthApi(apiBaseUrl), [apiBaseUrl])

  const initialSession = useMemo(() => AuthSession.load(), [])

  const [accessToken, setAccessToken] = useState(initialSession.accessToken)
  const [refreshToken, setRefreshToken] = useState(initialSession.refreshToken)
  const [user, setUser] = useState(null)
  const [pendingSignup, setPendingSignup] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState('')

  const kakaoAuthorizeUrl = useMemo(() => {
    if (!KAKAO_CLIENT_ID || !KAKAO_REDIRECT_URI) return ''

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: KAKAO_CLIENT_ID,
      redirect_uri: KAKAO_REDIRECT_URI,
    })

    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
  }, [])

  const saveSession = useCallback((payload) => {
    AuthSession.save({ accessToken: payload.accessToken, refreshToken: payload.refreshToken })
    setAccessToken(payload.accessToken)
    setRefreshToken(payload.refreshToken)
    setUser(UserProfile.normalize(payload.user || null))
    setPendingSignup(null)
    setError('')
  }, [])

  const clearSession = useCallback((nextError = '') => {
    AuthSession.clear()
    setAccessToken('')
    setRefreshToken('')
    setUser(null)
    setPendingSignup(null)
    setError(nextError)
  }, [])

  const refreshAccessToken = useCallback(async () => {
    const tokenForRefresh = refreshToken || AuthSession.load().refreshToken
    if (!tokenForRefresh) {
      clearSession('세션이 만료되었습니다. 다시 로그인해주세요.')
      return false
    }

    const { ok, body } = await authApi.refresh(tokenForRefresh)
    if (!ok || !body?.accessToken || !body?.refreshToken) {
      clearSession('세션이 만료되었습니다. 다시 로그인해주세요.')
      return false
    }

    saveSession(body)
    return true
  }, [authApi, clearSession, refreshToken, saveSession])

  const completeSignup = useCallback(async (payload) => {
    const { ok, body } = await authApi.completeSignup(payload)
    if (!ok || !body?.accessToken || !body?.refreshToken) {
      const message = body?.error || '회원가입 처리에 실패했습니다.'
      setError(message)
      throw new Error(message)
    }

    saveSession(body)
  }, [authApi, saveSession])

  const updateProfileNickname = useCallback(async (nickname) => {
    const currentToken = AuthSession.load().accessToken || accessToken
    if (!currentToken) {
      throw new Error('로그인이 필요합니다.')
    }

    const first = await authApi.updateProfile({ nickname }, currentToken)
    if (first.ok && first.body?.user) {
      setUser(UserProfile.normalize(first.body.user))
      return first.body.user
    }

    if (first.status === 401) {
      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
      }

      const retriedToken = AuthSession.load().accessToken
      const retried = await authApi.updateProfile({ nickname }, retriedToken)
      if (retried.ok && retried.body?.user) {
        setUser(UserProfile.normalize(retried.body.user))
        return retried.body.user
      }
    }

    throw new Error(first.body?.error || '프로필 업데이트에 실패했습니다.')
  }, [accessToken, authApi, refreshAccessToken])

  const startKakaoLogin = useCallback(() => {
    if (!kakaoAuthorizeUrl) {
      setError('카카오 로그인 설정이 비어 있습니다. VITE_KAKAO_* 값을 확인하세요.')
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
        setIsInitializing(false)
        return
      }

      try {
        setError('')
        const { ok, body } = await authApi.getKakaoCallback(code)
        if (!ok || !body) {
          throw new Error(body?.error || '카카오 로그인 처리에 실패했습니다.')
        }

        // 가입 완료 사용자는 즉시 세션을 저장하고 채팅 화면으로 이동한다.
        if (body.resultType === 'LOGIN_SUCCESS') {
          saveSession(body)
        } else if (body.resultType === 'SIGNUP_REQUIRED') {
          AuthSession.clear()
          setAccessToken('')
          setRefreshToken('')
          setUser(null)
          setPendingSignup({
            signupToken: String(body.signupToken || ''),
            kakaoId: String(body?.kakaoProfile?.kakaoId || ''),
            nickname: String(body?.kakaoProfile?.nickname || ''),
            profileImage: String(body?.kakaoProfile?.profileImage || ''),
          })
        } else {
          throw new Error('지원하지 않는 인증 응답입니다.')
        }

        // 콜백 처리 완료 후 주소창 query를 제거한다.
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (nextError) {
        console.error('[kakao:callback] failed', nextError)
        clearSession(nextError.message || '카카오 로그인 처리에 실패했습니다.')
      } finally {
        setIsInitializing(false)
      }
    }

    void run()
  }, [authApi, clearSession, saveSession])

  return {
    authState: {
      accessToken,
      refreshToken,
      user,
      pendingSignup,
      isInitializing,
      error,
    },
    setUser,
    startKakaoLogin,
    refreshAccessToken,
    completeSignup,
    updateProfileNickname,
    clearSession,
  }
}
