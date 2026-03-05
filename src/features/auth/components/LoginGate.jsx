import './LoginGate.css'
import brandWordmarkLight from '../../../../assets/branding/logo/flownium-wordmark-light.png'

// 로그인 전용 화면: 로딩/에러/카카오 로그인 버튼을 분리해 App 복잡도를 낮춘다.
function LoginGate({ isLoading, authError, onStartKakaoLogin }) {
  return (
    <main className="auth-gate">
      <section className="auth-card">
        {/* 텍스트 타이틀 대신 브랜드 로고 워드마크를 사용한다. */}
        <div className="auth-brand-wrap">
          <img className="auth-brand-logo" src={brandWordmarkLight} alt="Flownium" />
        </div>
        <p>{isLoading ? '로그인 상태를 확인하고 있습니다...' : '카카오 로그인 후 그룹 채팅을 시작할 수 있습니다.'}</p>

        {authError && <p className="auth-error">{authError}</p>}

        {!isLoading && (
          <button type="button" className="kakao-login-button" onClick={onStartKakaoLogin}>
            카카오로 시작하기
          </button>
        )}
      </section>
    </main>
  )
}

export default LoginGate

