import { useEffect, useState } from 'react'
import './LoginGate.css'
import brandWordmarkLight from '../../../../assets/branding/logo/flownium-wordmark-light.png'

const TEXT = {
  checking: '로그인 상태를 확인하고 있습니다...',
  intro: '카카오 또는 이메일로 Flownium을 시작할 수 있습니다.',
  startKakao: '카카오로 시작하기',
  continueWithEmail: '또는 이메일로 계속하기',
  emailLoginTab: '이메일 로그인',
  emailSignupTab: '이메일 회원가입',
  passwordResetTab: '비밀번호 재설정',
  email: '이메일',
  nickname: '닉네임',
  password: '비밀번호',
  emailPlaceholder: 'name@example.com',
  nicknamePlaceholder: '사용할 닉네임',
  passwordPlaceholder: '8자 이상 비밀번호',
  verificationCode: '인증 코드',
  verificationCodePlaceholder: '6자리 인증 코드',
  loginButton: '이메일 로그인',
  verifyButton: '이메일 인증 완료',
  resetPasswordButton: '비밀번호 재설정 완료',
  resetButton: '다시 입력',
  requestCodeButton: '인증 코드 받기',
  requestResetCodeButton: '재설정 코드 받기',
  debugCodeLabel: '개발용 인증 코드',
}

function LoginGate({
  isLoading,
  authError,
  authNotice,
  pendingEmailVerification,
  pendingPasswordReset,
  onStartKakaoLogin,
  onStartEmailSignup,
  onVerifyEmailSignup,
  onLoginWithEmail,
  onStartPasswordReset,
  onVerifyPasswordReset,
  onClearPendingEmailVerification,
  onClearPendingPasswordReset,
}) {
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!pendingEmailVerification?.email) return
    setEmail(String(pendingEmailVerification.email || ''))
    setNickname(String(pendingEmailVerification.nickname || ''))
    setPassword(String(pendingEmailVerification.password || ''))
    setVerificationCode('')
    setAuthMode('signup')
  }, [pendingEmailVerification])

  useEffect(() => {
    if (!pendingPasswordReset?.email) return
    setEmail(String(pendingPasswordReset.email || ''))
    setPassword(String(pendingPasswordReset.password || ''))
    setVerificationCode('')
    setAuthMode('reset')
  }, [pendingPasswordReset])

  const handleEmailLogin = async () => {
    if (isSubmitting || !email.trim() || !password) return

    try {
      setIsSubmitting(true)
      await onLoginWithEmail({ email, password })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailSignupStart = async () => {
    if (isSubmitting || !email.trim() || !password || nickname.trim().length < 2) return

    try {
      setIsSubmitting(true)
      await onStartEmailSignup({ email, password, nickname })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailSignupVerify = async () => {
    if (isSubmitting || !pendingEmailVerification?.email || !verificationCode.trim()) return

    try {
      setIsSubmitting(true)
      await onVerifyEmailSignup({
        email: pendingEmailVerification.email,
        code: verificationCode,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordResetStart = async () => {
    if (isSubmitting || !email.trim() || !password) return

    try {
      setIsSubmitting(true)
      await onStartPasswordReset({ email, password })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordResetVerify = async () => {
    if (isSubmitting || !pendingPasswordReset?.email || !verificationCode.trim()) return

    try {
      setIsSubmitting(true)
      await onVerifyPasswordReset({
        email: pendingPasswordReset.email,
        code: verificationCode,
      })
      setAuthMode('login')
      setVerificationCode('')
      setPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPendingVerification = Boolean(pendingEmailVerification?.email)
  const isPendingPasswordReset = Boolean(pendingPasswordReset?.email)
  const canSubmitEmailLogin = !isSubmitting && Boolean(email.trim()) && Boolean(password)
  const canStartEmailSignup =
    !isSubmitting &&
    Boolean(email.trim()) &&
    Boolean(password) &&
    nickname.trim().length >= 2
  const canVerifyEmailSignup =
    !isSubmitting &&
    Boolean(pendingEmailVerification?.email) &&
    verificationCode.trim().length === 6
  const canStartPasswordReset =
    !isSubmitting &&
    Boolean(email.trim()) &&
    Boolean(password)
  const canVerifyPasswordReset =
    !isSubmitting &&
    Boolean(pendingPasswordReset?.email) &&
    verificationCode.trim().length === 6

  return (
    <main className="auth-gate">
      <section className="auth-card">
        <div className="auth-brand-wrap">
          <img className="auth-brand-logo" src={brandWordmarkLight} alt="Flownium" />
        </div>
        <p>{isLoading ? TEXT.checking : TEXT.intro}</p>

        {authError && <p className="auth-error">{authError}</p>}
        {authNotice && <p className="auth-notice">{authNotice}</p>}

        {!isLoading && (
          <>
            <button type="button" className="kakao-login-button" onClick={onStartKakaoLogin}>
              {TEXT.startKakao}
            </button>

            <div className="auth-divider">
              <span>{TEXT.continueWithEmail}</span>
            </div>

            <div className="auth-mode-toggle auth-mode-toggle-triple">
              <button
                type="button"
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => {
                  if (isPendingVerification) onClearPendingEmailVerification()
                  if (isPendingPasswordReset) onClearPendingPasswordReset()
                  setAuthMode('login')
                }}
              >
                {TEXT.emailLoginTab}
              </button>
              <button
                type="button"
                className={authMode === 'signup' ? 'active' : ''}
                onClick={() => {
                  if (isPendingPasswordReset) onClearPendingPasswordReset()
                  setAuthMode('signup')
                }}
              >
                {TEXT.emailSignupTab}
              </button>
              <button
                type="button"
                className={authMode === 'reset' ? 'active' : ''}
                onClick={() => {
                  if (isPendingVerification) onClearPendingEmailVerification()
                  setAuthMode('reset')
                }}
              >
                {TEXT.passwordResetTab}
              </button>
            </div>

            <div className="auth-form">
              <label className="auth-field">
                <span>{TEXT.email}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={TEXT.emailPlaceholder}
                  disabled={isSubmitting || isPendingVerification || isPendingPasswordReset}
                />
              </label>

              {authMode === 'signup' && (
                <label className="auth-field">
                  <span>{TEXT.nickname}</span>
                  <input
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder={TEXT.nicknamePlaceholder}
                    disabled={isSubmitting || isPendingVerification}
                  />
                </label>
              )}

              <label className="auth-field">
                <span>{TEXT.password}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={TEXT.passwordPlaceholder}
                  disabled={isSubmitting || isPendingVerification || isPendingPasswordReset}
                />
              </label>

              {authMode === 'signup' && isPendingVerification && (
                <>
                  <label className="auth-field">
                    <span>{TEXT.verificationCode}</span>
                    <input
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value)}
                      placeholder={TEXT.verificationCodePlaceholder}
                      inputMode="numeric"
                      maxLength={6}
                      disabled={isSubmitting}
                    />
                  </label>
                  {pendingEmailVerification?.debugCode && (
                    <p className="auth-debug-code">
                      {TEXT.debugCodeLabel}: <strong>{pendingEmailVerification.debugCode}</strong>
                    </p>
                  )}
                </>
              )}

              {authMode === 'reset' && isPendingPasswordReset && (
                <>
                  <label className="auth-field">
                    <span>{TEXT.verificationCode}</span>
                    <input
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value)}
                      placeholder={TEXT.verificationCodePlaceholder}
                      inputMode="numeric"
                      maxLength={6}
                      disabled={isSubmitting}
                    />
                  </label>
                  {pendingPasswordReset?.debugCode && (
                    <p className="auth-debug-code">
                      {TEXT.debugCodeLabel}: <strong>{pendingPasswordReset.debugCode}</strong>
                    </p>
                  )}
                </>
              )}

              {authMode === 'login' ? (
                <button type="button" className="email-action-button" onClick={() => void handleEmailLogin()} disabled={!canSubmitEmailLogin}>
                  {TEXT.loginButton}
                </button>
              ) : authMode === 'signup' ? (
                isPendingVerification ? (
                  <div className="auth-action-group">
                    <button type="button" className="email-action-button" onClick={() => void handleEmailSignupVerify()} disabled={!canVerifyEmailSignup}>
                      {TEXT.verifyButton}
                    </button>
                    <button
                      type="button"
                      className="secondary-action-button"
                      onClick={() => {
                        setVerificationCode('')
                        onClearPendingEmailVerification()
                      }}
                      disabled={isSubmitting}
                    >
                      {TEXT.resetButton}
                    </button>
                  </div>
                ) : (
                  <button type="button" className="email-action-button" onClick={() => void handleEmailSignupStart()} disabled={!canStartEmailSignup}>
                    {TEXT.requestCodeButton}
                  </button>
                )
              ) : isPendingPasswordReset ? (
                <div className="auth-action-group">
                  <button type="button" className="email-action-button" onClick={() => void handlePasswordResetVerify()} disabled={!canVerifyPasswordReset}>
                    {TEXT.resetPasswordButton}
                  </button>
                  <button
                    type="button"
                    className="secondary-action-button"
                    onClick={() => {
                      setVerificationCode('')
                      onClearPendingPasswordReset()
                    }}
                    disabled={isSubmitting}
                  >
                    {TEXT.resetButton}
                  </button>
                </div>
              ) : (
                <button type="button" className="email-action-button" onClick={() => void handlePasswordResetStart()} disabled={!canStartPasswordReset}>
                  {TEXT.requestResetCodeButton}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default LoginGate
