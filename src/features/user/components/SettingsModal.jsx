import { useEffect, useState } from 'react'

// 데스크톱 설정 모달은 닉네임 수정, 테마 변경, 카카오 연결, 회원탈퇴를 한 곳에서 다룬다.
function SettingsModal({
  isOpen,
  user,
  themePreference,
  onChangeTheme,
  onClose,
  onSubmit,
  onStartKakaoLink,
  onDeleteAccount,
}) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLinkingKakao, setIsLinkingKakao] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setNickname(String(user?.nickname || ''))
    setError('')
    setIsSaving(false)
    setIsDeleting(false)
    setIsLinkingKakao(false)
  }, [isOpen, user])

  if (!isOpen) return null

  const normalized = nickname.trim()
  const isKakaoLinked = Array.isArray(user?.linkedProviders) && user.linkedProviders.includes('kakao')

  const handleSave = async () => {
    if (normalized.length < 2 || normalized.length > 20) {
      setError('닉네임은 2~20자여야 합니다.')
      return
    }

    try {
      setIsSaving(true)
      setError('')
      await onSubmit(normalized)
      onClose()
    } catch (nextError) {
      setError(nextError.message || '설정 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartKakaoLink = async () => {
    if (isKakaoLinked) return

    try {
      setIsLinkingKakao(true)
      setError('')
      await onStartKakaoLink()
    } catch (nextError) {
      setError(nextError.message || '카카오 계정 연결에 실패했습니다.')
      setIsLinkingKakao(false)
    }
  }

  const handleDeleteAccount = async () => {
    const shouldDelete = window.confirm('정말 회원탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    if (!shouldDelete) return

    try {
      setIsDeleting(true)
      setError('')
      await onDeleteAccount()
    } catch (nextError) {
      setError(nextError.message || '회원탈퇴 처리에 실패했습니다.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label="설정">
        <h3>설정</h3>
        <p>닉네임과 테마를 바꾸거나 계정 연결 및 회원탈퇴를 진행할 수 있습니다.</p>
        <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="닉네임" />
        <label className="settings-field">
          <span>테마</span>
          <select value={themePreference} onChange={(event) => onChangeTheme(event.target.value)}>
            <option value="system">시스템 설정 따르기</option>
            <option value="light">라이트 모드</option>
            <option value="dark">다크 모드</option>
          </select>
        </label>
        <button
          type="button"
          className="secondary"
          onClick={() => void handleStartKakaoLink()}
          disabled={isSaving || isDeleting || isLinkingKakao || isKakaoLinked}
        >
          {isKakaoLinked ? '카카오 계정 연결됨' : (isLinkingKakao ? '카카오 연결 중...' : '카카오 계정 연결')}
        </button>
        <button
          type="button"
          className="secondary danger-zone-button"
          onClick={() => void handleDeleteAccount()}
          disabled={isSaving || isDeleting || isLinkingKakao}
        >
          {isDeleting ? '회원탈퇴 처리 중...' : '회원탈퇴'}
        </button>
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose} disabled={isSaving || isDeleting || isLinkingKakao}>
            취소
          </button>
          <button type="button" onClick={() => void handleSave()} disabled={isSaving || isDeleting || isLinkingKakao}>
            저장
          </button>
        </div>
      </section>
    </div>
  )
}

export default SettingsModal
