function EmailLoginForm({
  email,
  password,
  isSubmitting,
  canSubmit,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <section className="auth-panel" aria-label="이메일 로그인">
      <div className="auth-panel-header">
        <span className="auth-panel-eyebrow">Email Sign In</span>
        <h2>이메일 로그인</h2>
        <p>가입한 이메일과 비밀번호로 계정을 이어서 사용할 수 있어요.</p>
      </div>

      <div className="auth-form">
        <label className="auth-field">
          <span>이메일</span>
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            disabled={isSubmitting}
          />
        </label>

        <label className="auth-field">
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="비밀번호를 입력해주세요"
            autoComplete="current-password"
            disabled={isSubmitting}
          />
        </label>

        <button
          type="button"
          className="email-action-button"
          onClick={() => void onSubmit()}
          disabled={!canSubmit}
        >
          이메일 로그인
        </button>
      </div>
    </section>
  )
}

export default EmailLoginForm
