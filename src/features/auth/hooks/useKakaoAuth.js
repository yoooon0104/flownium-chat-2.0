import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthSession } from '../../../domain/auth/AuthSession'
import { UserProfile } from '../../../domain/user/UserProfile'
import { createAuthApi } from '../../../services/api/authApi'

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_REST_API_KEY || import.meta.env.VITE_KAKAO_CLIENT_ID || ''
const normalizeRedirectUri = (value) => String(value || '').trim().replace(/\/+$/, '')
const KAKAO_REDIRECT_URI = normalizeRedirectUri(import.meta.env.VITE_KAKAO_REDIRECT_URI || `${window.location.origin}`)
const KAKAO_AUTH_CODE_STORAGE_KEY = 'flownium:kakao-auth-code'
const KAKAO_AUTH_IN_PROGRESS_STORAGE_KEY = 'flownium:kakao-auth-in-progress'

const resolveErrorMessage = (body, fallback) => {
  const code = String(body?.error?.code || '').trim()
  if (code === 'EMAIL_NOT_REGISTERED') return '가입되지 않은 이메일입니다. 먼저 회원가입을 진행해주세요.'
  if (code === 'EMAIL_NOT_VERIFIED') return '이메일 인증을 먼저 완료해주세요.'
  if (code === 'INVALID_EMAIL_PASSWORD') return '비밀번호가 올바르지 않습니다.'
  if (code === 'ACCOUNT_NOT_AVAILABLE') return '사용할 수 없는 계정입니다.'
  if (code === 'EMAIL_ALREADY_REGISTERED') return '이미 가입된 이메일입니다.'
  if (code === 'INVALID_VERIFICATION_CODE') return '인증 코드가 올바르지 않습니다.'
  if (code === 'VERIFICATION_CODE_EXPIRED') return '인증 코드가 만료되었습니다. 다시 요청해주세요.'
  if (code === 'VERIFICATION_RESEND_COOLDOWN') return '인증 코드를 너무 자주 요청하고 있습니다. 잠시 후 다시 시도해주세요.'
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
  const [pendingEmailVerification, setPendingEmailVerification] = useState(null)
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
    setPendingEmailVerification(null)
    setError('')
  }, [])

  const clearSession = useCallback((nextError = '') => {
    AuthSession.clear()
    setAccessToken('')
    setRefreshToken('')
    setUser(null)
    setPendingSignup(null)
    setPendingEmailVerification(null)
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

  const startEmailSignup = useCallback(async (payload) => {
    const { ok, body } = await authApi.startEmailSignup(payload)
    if (!ok || !body?.email) {
      const message = resolveErrorMessage(body, '이메일 회원가입 시작에 실패했습니다.')
      setError(message)
      throw new Error(message)
    }

    setPendingEmailVerification({
      email: String(body.email || '').trim().toLowerCase(),
      nickname: String(payload?.nickname || '').trim(),
      password: String(payload?.password || ''),
      resendAvailableAt: String(body.resendAvailableAt || ''),
      expiresAt: String(body.expiresAt || ''),
      debugCode: String(body.debugCode || ''),
    })
    setError('')
    return body
  }, [authApi])

  const verifyEmailSignup = useCallback(async (payload) => {
    const { ok, body } = await authApi.verifyEmailSignup(payload)
    if (!ok || !body?.accessToken || !body?.refreshToken) {
      const message = resolveErrorMessage(body, '이메일 인증에 실패했습니다.')
      setError(message)
      throw new Error(message)
    }

    saveSession(body)
  }, [authApi, saveSession])

  const loginWithEmail = useCallback(async (payload) => {
    const { ok, body } = await authApi.loginWithEmail(payload)
    if (!ok || !body?.accessToken || !body?.refreshToken) {
      const message = resolveErrorMessage(body, '이메일 로그인에 실패했습니다.')
      setError(message)
      throw new Error(message)
    }

    saveSession(body)
  }, [authApi, saveSession])

  const clearPendingEmailVerification = useCallback(() => {
    setPendingEmailVerification(null)
    setError('')
  }, [])

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

  const deleteAccount = useCallback(async () => {
    const currentToken = AuthSession.load().accessToken || accessToken
    if (!currentToken) {
      throw new Error('로그인이 필요합니다.')
    }

    const first = await authApi.deleteAccount(currentToken)
    if (first.ok) {
      clearSession('')
      return true
    }

    if (first.status === 401) {
      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
      }

      const retriedToken = AuthSession.load().accessToken
      const retried = await authApi.deleteAccount(retriedToken)
      if (retried.ok) {
        clearSession('')
        return true
      }

      throw new Error(resolveErrorMessage(retried.body, '회원탈퇴 처리에 실패했습니다.'))
    }

    throw new Error(resolveErrorMessage(first.body, '회원탈퇴 처리에 실패했습니다.'))
  }, [accessToken, authApi, clearSession, refreshAccessToken])

  const redirectToKakao = useCallback((authorizeUrl) => {
    if (!authorizeUrl) {
      setError('카카오 로그인 설정이 비어 있습니다. VITE_KAKAO_* 값을 확인하세요.')
      return
    }

    window.location.href = authorizeUrl
  }, [])

  const startKakaoLogin = useCallback(() => {
    if (!kakaoAuthorizeUrl) {
      setError('카카오 로그인 설정이 비어 있습니다. VITE_KAKAO_* 값을 확인하세요.')
      return
    }

    redirectToKakao(kakaoAuthorizeUrl)
  }, [kakaoAuthorizeUrl, redirectToKakao])

  const startKakaoLink = useCallback(async () => {
    const currentToken = AuthSession.load().accessToken || accessToken
    if (!currentToken) {
      throw new Error('로그인이 필요합니다.')
    }

    const first = await authApi.startKakaoLink(currentToken)
    if (first.status === 401) {
      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
      }

      const retriedToken = AuthSession.load().accessToken
      const retried = await authApi.startKakaoLink(retriedToken)
      if (!retried.ok || !retried.body?.authorizeUrl) {
        throw new Error(resolveErrorMessage(retried.body, '카카오 계정 연결을 시작하지 못했습니다.'))
      }

      redirectToKakao(retried.body.authorizeUrl)
      return
    }

    const { ok, body } = first
    if (!ok || !body?.authorizeUrl) {
      throw new Error(resolveErrorMessage(body, '카카오 계정 연결을 시작하지 못했습니다.'))
    }

    redirectToKakao(body.authorizeUrl)
  }, [accessToken, authApi, redirectToKakao, refreshAccessToken])

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
          const state = String(params.get('state') || '').trim()
          // 같은 인가 코드를 새로고침/중복 렌더로 다시 보내지 않도록 먼저 URL query를 제거한다.
          clearKakaoCallbackQuery()

          if (code === handledCode || code === inProgressCode) {
            throw new Error('이미 처리한 로그인 요청입니다. 처음 화면에서 다시 로그인해주세요.')
          }

          // 카카오 인가 코드는 1회용이므로 처리 중 상태를 먼저 기록해 중복 교환을 차단한다.
          window.sessionStorage.setItem(KAKAO_AUTH_IN_PROGRESS_STORAGE_KEY, code)

          const { ok, body } = await authApi.getKakaoCallback(code, state)
          if (!ok || !body) {
            throw new Error(resolveErrorMessage(body, '카카오 로그인 처리에 실패했습니다.'))
          }

          // 가입 완료 사용자는 즉시 세션을 저장하고 채팅 화면으로 이동한다.
          if (body.resultType === 'LOGIN_SUCCESS') {
            saveSession(body)
          } else if (body.resultType === 'LINK_SUCCESS') {
            setUser(UserProfile.normalize(body.user || null))
            setError('')
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
      pendingEmailVerification,
      isInitializing,
      error,
    },
    setUser,
    startKakaoLogin,
    startKakaoLink,
    refreshAccessToken,
    completeSignup,
    startEmailSignup,
    verifyEmailSignup,
    loginWithEmail,
    clearPendingEmailVerification,
    updateProfileNickname,
    deleteAccount,
    clearSession,
  }
}

