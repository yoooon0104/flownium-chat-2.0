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
  if (!EMAIL_PATTERN.test(trimmedEmail)) return '올바른 이메일 형식을 입력해주세요.'
  if (trimmedNickname.length < 2 || trimmedNickname.length > 20) return '닉네임은 2~20자로 입력해주세요.'
  if (password.length < 8 || password.length > 72) return '비밀번호는 8~72자로 입력해주세요.'
  if (!PASSWORD_LETTER_PATTERN.test(password) || !PASSWORD_NUMBER_PATTERN.test(password)) {
    return '비밀번호는 영문과 숫자를 모두 포함해야 합니다.'
  }
  if (!confirmPassword) return '비밀번호 확인을 입력해주세요.'
  if (password !== confirmPassword) return '비밀번호와 비밀번호 확인이 일치하지 않습니다.'
  return ''
}

function LoginGate({
  isLoading,
  authError,
  resolvedTheme = 'light',
  pendingEmailVerification,
  onStartKakaoLogin,
  onStartEmailSignup,
  onVerifyEmailSignup,
  onLoginWithEmail,
  onClearPendingEmailVerification,
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
    setAuthView('signup')
  }, [pendingEmailVerification])

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

  const isPendingVerification = Boolean(pendingEmailVerification?.email)
  const canSubmitEmailLogin = !isSubmitting && EMAIL_PATTERN.test(email.trim()) && password.length >= 8
  const canStartEmailSignup = !isSubmitting && !signupValidationMessage
  const canVerifyEmailSignup =
    !isSubmitting &&
    Boolean(pendingEmailVerification?.email) &&
    verificationCode.trim().length === 6

  const brandWordmark = resolvedTheme === 'dark' ? brandWordmarkLight : brandWordmarkDark

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

  const openLoginView = () => {
    setAuthView('login')
    if (isPendingVerification) {
      setVerificationCode('')
      onClearPendingEmailVerification()
    }
  }

  const openSignupView = () => {
    setAuthView('signup')
  }

  return (
    <main className="auth-gate">
      <section className={`auth-card auth-card-${authView}`}>
        <div className="auth-brand-wrap">
          <img className="auth-brand-logo" src={brandWordmark} alt="Flownium" />
        </div>

        <div className="auth-hero">
          <span className="auth-hero-eyebrow">Flownium Chat</span>
          <h1>{authView === 'signup' ? '회원가입을 진행할게요' : '대화를 더 가볍게 시작하세요'}</h1>
          <p>
            {authView === 'signup'
              ? '약관 동의와 이메일 인증을 먼저 마치고, 가입이 끝나면 간편로그인 연결도 이어서 진행할 수 있어요.'
              : '카카오 간편로그인으로 바로 들어오거나, 이메일 로그인으로 기존 계정을 이어서 사용할 수 있어요.'}
          </p>
        </div>

        {authError && <p className="auth-error-banner">{authError}</p>}

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
              <strong>아직 계정이 없나요?</strong>
              <p>회원가입 화면으로 이동해 이메일 인증과 약관 동의를 먼저 완료해주세요.</p>
              <button type="button" className="secondary-action-button" onClick={openSignupView}>
                이메일 회원가입
              </button>
            </div>
          </>
        ) : (
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
        )}
      </section>
    </main>
  )
}

export default LoginGate
