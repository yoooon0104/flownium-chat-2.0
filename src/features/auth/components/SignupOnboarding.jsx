import { useMemo, useState } from 'react'
import { UserProfile } from '../../../domain/user/UserProfile'
import './SignupOnboarding.css'

const TERMS_ITEMS = [
  'Flownium은 친구 기반 채팅과 그룹 채팅 기능을 제공하며, 서비스 운영을 위해 계정 정보와 대화 데이터를 처리합니다.',
  '이용자는 타인의 개인정보를 무단으로 수집하거나 스팸, 사칭, 불법 콘텐츠를 전송해서는 안 됩니다.',
  '서비스 품질과 안전을 위해 부적절한 계정이나 콘텐츠는 제한될 수 있으며, 회원 탈퇴 시 대화 문맥 보존을 위한 최소 정보가 남을 수 있습니다.',
]

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
        <p>처음 로그인하셨습니다. 이용 약관에 동의한 뒤 닉네임을 확인해주세요.</p>

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

        <div className="onboarding-terms-card">
          <strong>서비스 이용 약관 요약</strong>
          <ul>
            {TERMS_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <label className="onboarding-checkbox">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(event) => setAgreedToTerms(event.target.checked)}
          />
          <span>위 약관을 읽었고, 회원가입에 동의합니다. (필수)</span>
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
