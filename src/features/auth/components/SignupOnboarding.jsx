import { useMemo, useState } from 'react'
import { UserProfile } from '../../../domain/user/UserProfile'
import './SignupOnboarding.css'

// 최초 로그인 사용자의 가입 의사와 닉네임을 확정하는 온보딩 화면.
function SignupOnboarding({ pendingSignup, errorMessage, onCompleteSignup, onCancel }) {
  const [nickname, setNickname] = useState(() => String(pendingSignup?.nickname || '').trim())
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const previewUser = useMemo(() => {
    return {
      nickname,
      profileImage: pendingSignup?.profileImage || '',
    }
  }, [nickname, pendingSignup])

  const handleSubmit = async () => {
    if (nickname.trim().length < 2 || nickname.trim().length > 20 || !agreedToTerms || isSubmitting) return

    try {
      setIsSubmitting(true)
      await onCompleteSignup({
        signupToken: pendingSignup.signupToken,
        nickname,
        agreedToTerms,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="onboarding-wrap">
      <section className="onboarding-card">
        <h1>회원가입 완료</h1>
        <p>처음 로그인하셨습니다. 이용 약관 동의 후 닉네임을 설정해주세요.</p>

        <div className="onboarding-profile-preview">
          {previewUser.profileImage ? (
            <img src={previewUser.profileImage} alt="profile" />
          ) : (
            <span>{UserProfile.getInitial(previewUser)}</span>
          )}
        </div>

        <label className="onboarding-field">
          <span>닉네임 (2~20자)</span>
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="사용할 닉네임"
          />
        </label>

        <label className="onboarding-checkbox">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(event) => setAgreedToTerms(event.target.checked)}
          />
          <span>서비스 이용을 위한 회원가입에 동의합니다.</span>
        </label>

        {errorMessage && <p className="onboarding-error">{errorMessage}</p>}

        <div className="onboarding-actions">
          <button type="button" className="secondary" onClick={onCancel} disabled={isSubmitting}>
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || nickname.trim().length < 2 || nickname.trim().length > 20 || !agreedToTerms}
          >
            가입 완료
          </button>
        </div>
      </section>
    </main>
  )
}

export default SignupOnboarding
