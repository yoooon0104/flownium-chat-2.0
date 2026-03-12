import { useEffect, useMemo, useState } from 'react'
import brandWordmarkDark from '../../../../assets/branding/logo/flownium-wordmark-dark.png'
import brandWordmarkLight from '../../../../assets/branding/logo/flownium-wordmark-light.png'
import EmailLoginForm from './EmailLoginForm'
import EmailSignupForm from './EmailSignupForm'
import './LoginGate.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_LETTER_PATTERN = /[A-Za-z]/
const PASSWORD_NUMBER_PATTERN = /\d/

const getSignupValidationMessage = ({
  email,
  nickname,
  password,
  confirmPassword,
  agreedToTerms,
}) => {
  const trimmedEmail = String(email || '').trim().toLowerCase()
  const trimmedNickname = String(nickname || '').trim()

  if (!agreedToTerms) return '회원가입을 진행하려면 약관 동의가 필요합니다.'
  if (!trimmedEmail) return '이메일을 입력해주세요.'
  if (!EMAIL_PATTERN.test(trimmedEmail)) return '올바른 이메일 형식으로 입력해주세요.'
  if (trimmedNickname.length < 2 || trimmedNickname.length > 20) return '닉네임은 2~20자로 입력해주세요.'
  if (password.length < 8 || password.length > 72) return '비밀번호는 8~72자로 입력해주세요.'
  if (!PASSWORD_LETTER_PATTERN.test(password) || !PASSWORD_NUMBER_PATTERN.test(password)) {
    return '비밀번호는 영문과 숫자를 모두 포함해야 합니다.'
  }
  if (!confirmPassword) return '비밀번호 확인을 입력해주세요.'
  if (password !== confirmPassword) return '비밀번호와 비밀번호 확인이 일치하지 않습니다.'

  return ''
}

const getPasswordResetValidationMessage = ({ email, password }) => {
  const trimmedEmail = String(email || '').trim().toLowerCase()

  if (!trimmedEmail) return '이메일을 입력해주세요.'
  if (!EMAIL_PATTERN.test(trimmedEmail)) return '올바른 이메일 형식으로 입력해주세요.'
  if (password.length < 8 || password.length > 72) return '새 비밀번호는 8~72자로 입력해주세요.'
  if (!PASSWORD_LETTER_PATTERN.test(password) || !PASSWORD_NUMBER_PATTERN.test(password)) {
    return '새 비밀번호는 영문과 숫자를 모두 포함해야 합니다.'
  }

  return ''
}

function LoginGate({
  isLoading,
  authError,
  authNotice,
  resolvedTheme = 'light',
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
  const [authView, setAuthView] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!pendingEmailVerification?.email) return

    setEmail(String(pendingEmailVerification.email || ''))
    setNickname(String(pendingEmailVerification.nickname || ''))
    setPassword(String(pendingEmailVerification.password || ''))
    setConfirmPassword(String(pendingEmailVerification.password || ''))
    setAgreedToTerms(true)
    setVerificationCode('')
    setAuthView('signup')
  }, [pendingEmailVerification])

  useEffect(() => {
    if (!pendingPasswordReset?.email) return

    setEmail(String(pendingPasswordReset.email || ''))
    setPassword(String(pendingPasswordReset.password || ''))
    setVerificationCode('')
    setAuthView('reset')
  }, [pendingPasswordReset])

  const signupValidationMessage = useMemo(() => {
    if (pendingEmailVerification?.email) return ''
    return getSignupValidationMessage({
      email,
      nickname,
      password,
      confirmPassword,
      agreedToTerms,
    })
  }, [agreedToTerms, confirmPassword, email, nickname, password, pendingEmailVerification?.email])

  const passwordResetValidationMessage = useMemo(
    () => getPasswordResetValidationMessage({ email, password }),
    [email, password]
  )

  const isPendingVerification = Boolean(pendingEmailVerification?.email)
  const isPendingPasswordReset = Boolean(pendingPasswordReset?.email)
  const canSubmitEmailLogin = !isSubmitting && EMAIL_PATTERN.test(email.trim()) && password.length >= 8
  const canStartEmailSignup = !isSubmitting && !signupValidationMessage
  const canVerifyEmailSignup =
    !isSubmitting &&
    Boolean(pendingEmailVerification?.email) &&
    verificationCode.trim().length === 6
  const canStartPasswordReset = !isSubmitting && !passwordResetValidationMessage
  const canVerifyPasswordReset =
    !isSubmitting &&
    Boolean(pendingPasswordReset?.email) &&
    verificationCode.trim().length === 6

  const brandWordmark = resolvedTheme === 'dark' ? brandWordmarkLight : brandWordmarkDark

  const openLoginView = () => {
    setAuthView('login')
    setVerificationCode('')

    if (isPendingVerification) {
      onClearPendingEmailVerification()
    }

    if (isPendingPasswordReset) {
      onClearPendingPasswordReset()
    }
  }

  const openSignupView = () => {
    if (isPendingPasswordReset) {
      onClearPendingPasswordReset()
    }
    setAuthView('signup')
  }

  const openResetView = () => {
    if (isPendingVerification) {
      onClearPendingEmailVerification()
    }
    setAuthView('reset')
  }

  const handleEmailLogin = async () => {
    if (!canSubmitEmailLogin) return

    try {
      setIsSubmitting(true)
      await onLoginWithEmail({ email, password })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailSignupStart = async () => {
    if (!canStartEmailSignup) return

    try {
      setIsSubmitting(true)
      await onStartEmailSignup({ email, password, nickname, agreedToTerms })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailSignupVerify = async () => {
    if (!canVerifyEmailSignup) return

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
    if (!canStartPasswordReset) return

    try {
      setIsSubmitting(true)
      await onStartPasswordReset({ email, password })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordResetVerify = async () => {
    if (!canVerifyPasswordReset) return

    try {
      setIsSubmitting(true)
      await onVerifyPasswordReset({
        email: pendingPasswordReset.email,
        code: verificationCode,
      })
      setAuthView('login')
      setPassword('')
      setVerificationCode('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-gate">
      <section className={`auth-card auth-card-${authView}`}>
        <div className="auth-brand-wrap">
          <img className="auth-brand-logo" src={brandWordmark} alt="Flownium" />
        </div>

        <div className="auth-hero">
          <span className="auth-hero-eyebrow">Flownium Chat</span>
          <h1>
            {authView === 'signup'
              ? '회원가입을 진행할게요'
              : authView === 'reset'
                ? '비밀번호를 다시 설정할게요'
                : '대화를 가볍게 시작해보세요'}
          </h1>
          <p>
            {authView === 'signup'
              ? '약관 동의와 이메일 인증을 마치면 바로 가입이 완료되고, 이후 간편로그인 연결도 이어서 진행할 수 있어요.'
              : authView === 'reset'
                ? '가입한 이메일과 새 비밀번호를 입력하고 인증 코드를 확인한 뒤 비밀번호를 다시 설정할 수 있어요.'
                : '카카오 간편로그인으로 바로 들어오거나 이메일 로그인으로 기존 계정을 이어서 사용할 수 있어요.'}
          </p>
        </div>

        {authError && <p className="auth-error-banner">{authError}</p>}
        {authNotice && <p className="auth-notice-banner">{authNotice}</p>}

        {isLoading ? (
          <p className="auth-status-copy">로그인 상태를 확인하고 있습니다...</p>
        ) : authView === 'login' ? (
          <>
            <button type="button" className="kakao-login-button" onClick={onStartKakaoLogin}>
              카카오로 시작하기
            </button>

            <div className="auth-divider">
              <span>또는 이메일로 로그인</span>
            </div>

            <EmailLoginForm
              email={email}
              password={password}
              isSubmitting={isSubmitting}
              canSubmit={canSubmitEmailLogin}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleEmailLogin}
            />

            <div className="auth-footer-card">
              <strong>처음 오셨나요?</strong>
              <p>회원가입을 먼저 진행하면 이메일 로그인과 카카오 간편로그인을 함께 사용할 수 있어요.</p>
              <div className="auth-action-group">
                <button type="button" className="secondary-action-button" onClick={openSignupView}>
                  이메일 회원가입
                </button>
                <button type="button" className="secondary-action-button" onClick={openResetView}>
                  비밀번호 재설정
                </button>
              </div>
            </div>
          </>
        ) : authView === 'signup' ? (
          <>
            <button type="button" className="auth-back-link" onClick={openLoginView}>
              로그인 화면으로 돌아가기
            </button>

            <EmailSignupForm
              email={email}
              nickname={nickname}
              password={password}
              confirmPassword={confirmPassword}
              agreedToTerms={agreedToTerms}
              verificationCode={verificationCode}
              pendingEmailVerification={pendingEmailVerification}
              isSubmitting={isSubmitting}
              canStartSignup={canStartEmailSignup}
              canVerifySignup={canVerifyEmailSignup}
              validationMessage={signupValidationMessage}
              onEmailChange={setEmail}
              onNicknameChange={setNickname}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onAgreedToTermsChange={setAgreedToTerms}
              onVerificationCodeChange={setVerificationCode}
              onStartSignup={handleEmailSignupStart}
              onVerifySignup={handleEmailSignupVerify}
              onResetVerification={() => {
                setVerificationCode('')
                onClearPendingEmailVerification()
              }}
            />
          </>
        ) : (
          <>
            <button type="button" className="auth-back-link" onClick={openLoginView}>
              로그인 화면으로 돌아가기
            </button>

            <section className="auth-panel" aria-label="비밀번호 재설정">
              <div className="auth-panel-header">
                <span className="auth-panel-eyebrow">Password Reset</span>
                <h2>비밀번호 재설정</h2>
                <p>가입한 이메일과 새 비밀번호를 입력한 뒤 6자리 코드를 확인해 비밀번호를 다시 설정하세요.</p>
              </div>

              <div className="auth-form">
                <label className="auth-field">
                  <span>이메일</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    disabled={isSubmitting || isPendingPasswordReset}
                  />
                </label>

                <label className="auth-field">
                  <span>새 비밀번호</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="영문과 숫자를 포함한 8자 이상"
                    autoComplete="new-password"
                    disabled={isSubmitting || isPendingPasswordReset}
                  />
                </label>

                {passwordResetValidationMessage && (
                  <p className="auth-validation-hint">{passwordResetValidationMessage}</p>
                )}

                {isPendingPasswordReset && (
                  <>
                    <label className="auth-field">
                      <span>재설정 코드</span>
                      <input
                        value={verificationCode}
                        onChange={(event) => setVerificationCode(event.target.value)}
                        placeholder="6자리 재설정 코드"
                        inputMode="numeric"
                        maxLength={6}
                        disabled={isSubmitting}
                      />
                    </label>

                    <div className="auth-verification-meta">
                      <small>재설정 코드는 10분 동안 유효합니다.</small>
                      <small>재발송 제한은 60초입니다.</small>
                    </div>

                    {pendingPasswordReset?.debugCode && (
                      <p className="auth-debug-code">
                        개발용 재설정 코드: <strong>{pendingPasswordReset.debugCode}</strong>
                      </p>
                    )}
                  </>
                )}

                {isPendingPasswordReset ? (
                  <div className="auth-action-group">
                    <button
                      type="button"
                      className="email-action-button"
                      onClick={() => void handlePasswordResetVerify()}
                      disabled={!canVerifyPasswordReset}
                    >
                      비밀번호 재설정 완료
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
                      다시 입력
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="email-action-button"
                    onClick={() => void handlePasswordResetStart()}
                    disabled={!canStartPasswordReset}
                  >
                    재설정 코드 받기
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  )
}

export default LoginGate
