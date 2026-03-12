import { useEffect, useMemo, useState } from 'react'
import { UserProfile } from '../../../domain/user/UserProfile'

const getLinkedProviderLabel = (provider) => {
  if (provider === 'kakao') return '카카오'
  if (provider === 'email') return '이메일'
  return provider
}

function AccountPanel({
  user,
  onSubmitNickname,
  onChangePassword,
  onStartKakaoLink,
  onDeleteAccount,
  emphasizeKakaoLink = false,
}) {
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingNickname, setIsSavingNickname] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLinkingKakao, setIsLinkingKakao] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setNicknameDraft(String(user?.nickname || ''))
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    setIsEditingProfile(false)
    setIsSavingNickname(false)
    setIsChangingPassword(false)
    setIsLinkingKakao(false)
    setIsDeleting(false)
  }, [user])

  const normalizedNickname = nicknameDraft.trim()
  const emailLabel = String(user?.email || '').trim() || '이메일 정보를 불러오지 못했습니다.'
  const linkedProviders = Array.isArray(user?.linkedProviders) ? user.linkedProviders : []
  const isKakaoLinked = linkedProviders.includes('kakao')
  const hasEmailPassword = linkedProviders.includes('email')

  const passwordValidationMessage = useMemo(() => {
    if (!hasEmailPassword) return ''
    if (!currentPassword && !newPassword && !confirmPassword) return ''
    if (currentPassword.length < 8) return '현재 비밀번호를 입력해주세요.'
    if (newPassword.length < 8 || newPassword.length > 72) return '새 비밀번호는 8~72자로 입력해주세요.'
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return '새 비밀번호는 영문과 숫자를 모두 포함해야 합니다.'
    }
    if (!confirmPassword) return '새 비밀번호 확인을 입력해주세요.'
    if (newPassword !== confirmPassword) return '새 비밀번호와 확인 값이 일치하지 않습니다.'
    return ''
  }, [confirmPassword, currentPassword, hasEmailPassword, newPassword])

  const handleSaveNickname = async () => {
    if (normalizedNickname.length < 2 || normalizedNickname.length > 20) {
      setError('닉네임은 2~20자로 입력해주세요.')
      setSuccess('')
      return
    }

    try {
      setIsSavingNickname(true)
      setError('')
      setSuccess('')
      await onSubmitNickname(normalizedNickname)
      setIsEditingProfile(false)
      setSuccess('내 정보가 저장되었습니다.')
    } catch (nextError) {
      setError(nextError.message || '내 정보 저장에 실패했습니다.')
      setSuccess('')
    } finally {
      setIsSavingNickname(false)
    }
  }

  const handleCancelEdit = () => {
    setNicknameDraft(String(user?.nickname || ''))
    setError('')
    setSuccess('')
    setIsEditingProfile(false)
  }

  const handleChangePassword = async () => {
    if (passwordValidationMessage) {
      setError(passwordValidationMessage)
      setSuccess('')
      return
    }

    try {
      setIsChangingPassword(true)
      setError('')
      setSuccess('')
      await onChangePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess('비밀번호가 변경되었습니다.')
    } catch (nextError) {
      setError(nextError.message || '비밀번호 변경에 실패했습니다.')
      setSuccess('')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleStartKakaoLink = async () => {
    if (isKakaoLinked) return

    try {
      setIsLinkingKakao(true)
      setError('')
      setSuccess('')
      await onStartKakaoLink()
    } catch (nextError) {
      setError(nextError.message || '카카오 계정 연결에 실패했습니다.')
      setSuccess('')
      setIsLinkingKakao(false)
    }
  }

  const handleDeleteAccount = async () => {
    const shouldDelete = window.confirm('정말 회원탈퇴하시겠어요? 이 작업은 되돌릴 수 없습니다.')
    if (!shouldDelete) return

    try {
      setIsDeleting(true)
      setError('')
      setSuccess('')
      await onDeleteAccount()
    } catch (nextError) {
      setError(nextError.message || '회원탈퇴 처리에 실패했습니다.')
      setSuccess('')
      setIsDeleting(false)
    }
  }

  return (
    <div className="account-panel subtle-scroll">
      <div className="account-panel-hero">
        <div className="profile-modal-avatar">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="profile" />
          ) : (
            <span>{UserProfile.getInitial(user)}</span>
          )}
        </div>
        <div className="account-panel-summary">
          <h3>{UserProfile.getDisplayName(user)}</h3>
          <p>{emailLabel}</p>
          <div className="account-provider-list">
            {linkedProviders.map((provider) => (
              <span key={provider} className="account-provider-chip">
                {getLinkedProviderLabel(provider)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {emphasizeKakaoLink && !isKakaoLinked && (
        <div className="account-highlight-card">
          <strong>카카오 간편로그인을 연결할까요?</strong>
          <p>지금 연결해두면 다음부터 더 빠르게 로그인할 수 있어요.</p>
        </div>
      )}

      <section className="account-section">
        <div className="account-section-header">
          <h4>내 정보</h4>
          <p>계정의 기본 정보는 수정 버튼을 눌렀을 때만 변경할 수 있어요.</p>
        </div>

        <label className="settings-field">
          <span>이메일</span>
          <input value={emailLabel} readOnly disabled />
        </label>

        <label className="settings-field">
          <span>닉네임</span>
          <input
            value={nicknameDraft}
            onChange={(event) => setNicknameDraft(event.target.value)}
            placeholder="2~20자 닉네임"
            readOnly={!isEditingProfile}
            disabled={!isEditingProfile || isSavingNickname}
          />
        </label>

        {isEditingProfile ? (
          <div className="account-inline-actions">
            <button
              type="button"
              className="inline-action-button"
              onClick={() => void handleSaveNickname()}
              disabled={isSavingNickname || isChangingPassword || isLinkingKakao || isDeleting}
            >
              {isSavingNickname ? '저장 중...' : '확인'}
            </button>
            <button
              type="button"
              className="secondary inline-action-button"
              onClick={handleCancelEdit}
              disabled={isSavingNickname || isChangingPassword || isLinkingKakao || isDeleting}
            >
              취소
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="inline-action-button secondary"
            onClick={() => {
              setError('')
              setSuccess('')
              setIsEditingProfile(true)
            }}
            disabled={isChangingPassword || isLinkingKakao || isDeleting}
          >
            내 정보 변경
          </button>
        )}
      </section>

      <section className="account-section">
        <div className="account-section-header">
          <h4>간편로그인</h4>
          <p>이메일 계정에 카카오 계정을 연결하면 다음부터 더 쉽게 로그인할 수 있어요.</p>
        </div>

        <button
          type="button"
          className="secondary inline-action-button"
          onClick={() => void handleStartKakaoLink()}
          disabled={isSavingNickname || isChangingPassword || isLinkingKakao || isDeleting || isKakaoLinked}
        >
          {isKakaoLinked ? '카카오 계정 연결됨' : isLinkingKakao ? '카카오 연결 중...' : '카카오 계정 연결'}
        </button>
      </section>

      <section className="account-section">
        <div className="account-section-header">
          <h4>비밀번호 변경</h4>
          <p>이메일 로그인 계정인 경우에만 현재 비밀번호 확인 후 변경할 수 있어요.</p>
        </div>

        {hasEmailPassword ? (
          <>
            <label className="settings-field">
              <span>현재 비밀번호</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="현재 비밀번호"
              />
            </label>

            <label className="settings-field">
              <span>새 비밀번호</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="영문과 숫자를 포함한 8자 이상"
              />
            </label>

            <label className="settings-field">
              <span>새 비밀번호 확인</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="새 비밀번호를 한 번 더 입력해주세요"
              />
            </label>

            {passwordValidationMessage && <p className="muted-text">{passwordValidationMessage}</p>}

            <button
              type="button"
              className="inline-action-button"
              onClick={() => void handleChangePassword()}
              disabled={isSavingNickname || isChangingPassword || isLinkingKakao || isDeleting}
            >
              {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
            </button>
          </>
        ) : (
          <p className="muted-text">이 계정은 이메일 비밀번호 로그인을 사용하지 않습니다.</p>
        )}
      </section>

      <section className="account-section account-section-danger">
        <div className="account-section-header">
          <h4>계정 관리</h4>
          <p>탈퇴하면 복구할 수 없고, 기존 대화 기록에서는 탈퇴한 회원으로만 남게 됩니다.</p>
        </div>

        <button
          type="button"
          className="secondary inline-action-button danger-zone-button"
          onClick={() => void handleDeleteAccount()}
          disabled={isSavingNickname || isChangingPassword || isLinkingKakao || isDeleting}
        >
          {isDeleting ? '회원탈퇴 처리 중...' : '회원탈퇴'}
        </button>
      </section>

      {error && <p className="error-text account-feedback">{error}</p>}
      {success && <p className="success-text account-feedback">{success}</p>}
    </div>
  )
}

export default AccountPanel
