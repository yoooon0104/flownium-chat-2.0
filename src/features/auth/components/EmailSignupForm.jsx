const TERMS_ITEMS = [
  'Flownium은 친구 기반 채팅과 그룹 채팅 기능을 제공하며, 서비스 운영을 위해 계정 정보와 대화 데이터를 처리합니다.',
  '이용자는 타인의 개인정보를 무단으로 수집하거나 스팸, 사칭, 불법 콘텐츠를 전송해서는 안 됩니다.',
  '서비스 품질과 안전을 위해 부적절한 계정이나 콘텐츠는 제한될 수 있으며, 회원 탈퇴 시 대화 문맥 보존을 위한 최소 정보가 남을 수 있습니다.',
]

function EmailSignupForm({
  email,
  nickname,
  password,
  confirmPassword,
  agreedToTerms,
  verificationCode,
  pendingEmailVerification,
  isSubmitting,
  canStartSignup,
  canVerifySignup,
  validationMessage,
  onEmailChange,
  onNicknameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onAgreedToTermsChange,
  onVerificationCodeChange,
  onStartSignup,
  onVerifySignup,
  onResetVerification,
}) {
  const isPendingVerification = Boolean(pendingEmailVerification?.email)

  return (
    <section className="auth-panel auth-panel-signup" aria-label="이메일 회원가입">
      <div className="auth-panel-header">
        <span className="auth-panel-eyebrow">Email Sign Up</span>
        <h2>이메일 회원가입</h2>
        <p>약관 동의와 이메일 인증을 마치면 바로 가입이 완료되고 로그인됩니다.</p>
      </div>

      <div className="auth-form">
        <div className="auth-terms-card">
          <strong>서비스 이용 약관 요약</strong>
          <ul>
            {TERMS_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <label className="auth-checkbox-field">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(event) => onAgreedToTermsChange(event.target.checked)}
            disabled={isSubmitting || isPendingVerification}
          />
          <span>위 약관을 읽었고, 회원가입에 동의합니다. (필수)</span>
        </label>

        <label className="auth-field">
          <span>이메일</span>
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            disabled={isSubmitting || isPendingVerification}
          />
        </label>

        <label className="auth-field">
          <span>닉네임</span>
          <input
            value={nickname}
            onChange={(event) => onNicknameChange(event.target.value)}
            placeholder="2~20자 닉네임"
            autoComplete="nickname"
            disabled={isSubmitting || isPendingVerification}
          />
        </label>

        <label className="auth-field">
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="영문과 숫자를 포함한 8자 이상"
            autoComplete="new-password"
            disabled={isSubmitting || isPendingVerification}
          />
        </label>

        <label className="auth-field">
          <span>비밀번호 확인</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
            placeholder="비밀번호를 한 번 더 입력해주세요"
            autoComplete="new-password"
            disabled={isSubmitting || isPendingVerification}
          />
        </label>

        {validationMessage && <p className="auth-validation-hint">{validationMessage}</p>}

        {isPendingVerification && (
          <>
            <label className="auth-field">
              <span>인증 코드</span>
              <input
                value={verificationCode}
                onChange={(event) => onVerificationCodeChange(event.target.value)}
                placeholder="6자리 인증 코드"
                inputMode="numeric"
                maxLength={6}
                disabled={isSubmitting}
              />
            </label>

            <div className="auth-verification-meta">
              <small>인증 코드는 10분 동안 유효합니다.</small>
              <small>재발송 제한은 60초입니다.</small>
            </div>

            {pendingEmailVerification?.debugCode && (
              <p className="auth-debug-code">
                개발용 인증 코드: <strong>{pendingEmailVerification.debugCode}</strong>
              </p>
            )}
          </>
        )}

        {isPendingVerification ? (
          <div className="auth-action-group">
            <button
              type="button"
              className="email-action-button"
              onClick={() => void onVerifySignup()}
              disabled={!canVerifySignup}
            >
              이메일 인증 완료
            </button>
            <button
              type="button"
              className="secondary-action-button"
              onClick={onResetVerification}
              disabled={isSubmitting}
            >
              입력 다시 하기
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="email-action-button"
            onClick={() => void onStartSignup()}
            disabled={!canStartSignup}
          >
            인증 코드 받기
          </button>
        )}
      </div>
    </section>
  )
}

export default EmailSignupForm
