import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthSession } from '../../../domain/auth/AuthSession'
import { UserProfile } from '../../../domain/user/UserProfile'
import { createAuthApi } from '../../../services/api/authApi'

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_REST_API_KEY || import.meta.env.VITE_KAKAO_CLIENT_ID || ''
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI || `${window.location.origin}`
const KAKAO_AUTH_CODE_STORAGE_KEY = 'flownium:kakao-auth-code'
const KAKAO_AUTH_IN_PROGRESS_STORAGE_KEY = 'flownium:kakao-auth-in-progress'

const resolveErrorMessage = (body, fallback) => {
  if (body?.error?.message) return String(body.error.message)
  if (typeof body?.error === 'string') return body.error
  return fallback
}

const clearKakaoCallbackQuery = () => {
  const nextUrl = `${window.location.pathname}${window.location.hash || ''}`
  window.history.replaceState({}, document.title, nextUrl)
}

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
      const message = resolveErrorMessage(body, '회원가입 처리에 실패했습니다.')
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

    throw new Error(resolveErrorMessage(first.body, '프로필 업데이트에 실패했습니다.'))
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
      const handledCode = window.sessionStorage.getItem(KAKAO_AUTH_CODE_STORAGE_KEY)
      const inProgressCode = window.sessionStorage.getItem(KAKAO_AUTH_IN_PROGRESS_STORAGE_KEY)

      try {
        setError('')

        if (code) {
          // 같은 인가 코드를 새로고침/중복 렌더로 다시 보내지 않도록 먼저 URL query를 제거한다.
          clearKakaoCallbackQuery()

          if (code === handledCode || code === inProgressCode) {
            throw new Error('이미 처리한 로그인 요청입니다. 처음 화면에서 다시 로그인해주세요.')
          }

          // 카카오 인가 코드는 1회용이므로 처리 중 상태를 먼저 기록해 중복 교환을 차단한다.
          window.sessionStorage.setItem(KAKAO_AUTH_IN_PROGRESS_STORAGE_KEY, code)

          const { ok, body } = await authApi.getKakaoCallback(code)
          if (!ok || !body) {
            throw new Error(resolveErrorMessage(body, '카카오 로그인 처리에 실패했습니다.'))
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
              email: String(body?.kakaoProfile?.email || ''),
              nickname: String(body?.kakaoProfile?.nickname || ''),
              profileImage: String(body?.kakaoProfile?.profileImage || ''),
            })
          } else {
            throw new Error('지원하지 않는 인증 응답입니다.')
          }

          window.sessionStorage.setItem(KAKAO_AUTH_CODE_STORAGE_KEY, code)
          window.sessionStorage.removeItem(KAKAO_AUTH_IN_PROGRESS_STORAGE_KEY)
          return
        }

        // 콜백 코드가 없는 일반 진입에서는 /auth/me로 사용자 상태를 복원한다.
        const token = AuthSession.load().accessToken
        if (!token) {
          return
        }

        const me = await authApi.getMe(token)
        if (me.ok && me.body?.user) {
          setUser(UserProfile.normalize(me.body.user))
          return
        }

        if (me.status === 401) {
          const refreshed = await refreshAccessToken()
          if (!refreshed) {
            return
          }

          const retriedToken = AuthSession.load().accessToken
          const retried = await authApi.getMe(retriedToken)
          if (retried.ok && retried.body?.user) {
            setUser(UserProfile.normalize(retried.body.user))
            return
          }
        }

        clearSession(resolveErrorMessage(me.body, '세션 정보를 불러오지 못했습니다. 다시 로그인해주세요.'))
      } catch (nextError) {
        window.sessionStorage.removeItem(KAKAO_AUTH_IN_PROGRESS_STORAGE_KEY)
        console.error('[auth:init] failed', nextError)
        clearSession(nextError.message || '카카오 로그인 처리에 실패했습니다.')
      } finally {
        setIsInitializing(false)
      }
    }

    void run()
  }, [authApi, clearSession, refreshAccessToken, saveSession])

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
