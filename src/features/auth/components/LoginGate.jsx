import { useEffect, useState } from 'react'
import './LoginGate.css'
import brandWordmarkLight from '../../../../assets/branding/logo/flownium-wordmark-light.png'

const TEXT = {
  checking: '\uB85C\uADF8\uC778 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4...',
  intro: '\uCE74\uCE74\uC624 \uB610\uB294 \uC774\uBA54\uC77C\uB85C Flownium\uC744 \uC2DC\uC791\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  startKakao: '\uCE74\uCE74\uC624\uB85C \uC2DC\uC791\uD558\uAE30',
  continueWithEmail: '\uB610\uB294 \uC774\uBA54\uC77C\uB85C \uACC4\uC18D\uD558\uAE30',
  emailLoginTab: '\uC774\uBA54\uC77C \uB85C\uADF8\uC778',
  emailSignupTab: '\uC774\uBA54\uC77C \uD68C\uC6D0\uAC00\uC785',
  email: '\uC774\uBA54\uC77C',
  nickname: '\uB2C9\uB124\uC784',
  password: '\uBE44\uBC00\uBC88\uD638',
  emailPlaceholder: 'name@example.com',
  nicknamePlaceholder: '\uC0AC\uC6A9\uD560 \uB2C9\uB124\uC784',
  passwordPlaceholder: '8\uC790 \uC774\uC0C1 \uBE44\uBC00\uBC88\uD638',
  verificationCode: '\uC778\uC99D \uCF54\uB4DC',
  verificationCodePlaceholder: '6\uC790\uB9AC \uC778\uC99D \uCF54\uB4DC',
  loginButton: '\uC774\uBA54\uC77C \uB85C\uADF8\uC778',
  verifyButton: '\uC774\uBA54\uC77C \uC778\uC99D \uC644\uB8CC',
  resetButton: '\uB2E4\uC2DC \uC785\uB825',
  requestCodeButton: '\uC778\uC99D \uCF54\uB4DC \uBC1B\uAE30',
  debugCodeLabel: '\uAC1C\uBC1C\uC6A9 \uC778\uC99D \uCF54\uB4DC',
}

function LoginGate({
  isLoading,
  authError,
  pendingEmailVerification,
  onStartKakaoLogin,
  onStartEmailSignup,
  onVerifyEmailSignup,
  onLoginWithEmail,
  onClearPendingEmailVerification,
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
    setAuthMode('signup')
  }, [pendingEmailVerification])

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

  const isPendingVerification = Boolean(pendingEmailVerification?.email)
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

  return (
    <main className="auth-gate">
      <section className="auth-card">
        <div className="auth-brand-wrap">
          <img className="auth-brand-logo" src={brandWordmarkLight} alt="Flownium" />
        </div>
        <p>{isLoading ? TEXT.checking : TEXT.intro}</p>

        {authError && <p className="auth-error">{authError}</p>}

        {!isLoading && (
          <>
            <button type="button" className="kakao-login-button" onClick={onStartKakaoLogin}>
              {TEXT.startKakao}
            </button>

            <div className="auth-divider">
              <span>{TEXT.continueWithEmail}</span>
            </div>

            <div className="auth-mode-toggle">
              <button
                type="button"
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('login')
                  if (isPendingVerification) onClearPendingEmailVerification()
                }}
              >
                {TEXT.emailLoginTab}
              </button>
              <button
                type="button"
                className={authMode === 'signup' ? 'active' : ''}
                onClick={() => setAuthMode('signup')}
              >
                {TEXT.emailSignupTab}
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
                  disabled={isSubmitting || isPendingVerification}
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
                  disabled={isSubmitting || isPendingVerification}
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

              {authMode === 'login' ? (
                <button type="button" className="email-action-button" onClick={() => void handleEmailLogin()} disabled={!canSubmitEmailLogin}>
                  {TEXT.loginButton}
                </button>
              ) : isPendingVerification ? (
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
              )}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default LoginGate
