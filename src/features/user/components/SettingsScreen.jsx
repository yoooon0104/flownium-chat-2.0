import { useEffect, useState } from 'react'

// 모바일 설정 화면은 데스크톱 모달과 같은 항목을 화면 형태로 제공한다.
function SettingsScreen({ user, themePreference, onChangeTheme, onSubmit, onBack }) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setNickname(String(user?.nickname || ''))
    setError('')
  }, [user])

  const normalized = nickname.trim()

  const handleSave = async () => {
    if (normalized.length < 2 || normalized.length > 20) {
      setError('닉네임은 2~20자여야 합니다.')
      return
    }

    try {
      setIsSaving(true)
      setError('')
      await onSubmit(normalized)
      onBack()
    } catch (nextError) {
      setError(nextError.message || '설정 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="settings-screen mobile-active">
      <header className="settings-screen-header">
        <button type="button" className="back-button visible" aria-label="목록으로 이동" onClick={onBack}>
          ←
        </button>
        <div className="settings-screen-main">
          <h3>설정</h3>
          <p>닉네임과 테마를 설정할 수 있습니다.</p>
        </div>
      </header>

      <div className="settings-screen-body">
        <div className="settings-form-card">
          <label className="settings-field">
            <span>닉네임</span>
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="닉네임" />
          </label>
          <label className="settings-field">
            <span>테마</span>
            <select value={themePreference} onChange={(event) => onChangeTheme(event.target.value)}>
              <option value="system">시스템 설정 따라가기</option>
              <option value="light">라이트 모드</option>
              <option value="dark">다크 모드</option>
            </select>
          </label>
          {error && <p className="error-text modal-error">{error}</p>}
          <div className="modal-actions single-column-actions">
            <button type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SettingsScreen
