import { useEffect, useState } from 'react'

// 설정 모달 1차: 닉네임 변경 기능만 제공한다.
function SettingsModal({ isOpen, user, onClose, onSubmit }) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setNickname(String(user?.nickname || ''))
    setError('')
  }, [isOpen, user])

  if (!isOpen) return null

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
      onClose()
    } catch (nextError) {
      setError(nextError.message || '설정 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label="설정">
        <h3>설정</h3>
        <p>닉네임을 변경할 수 있습니다.</p>
        <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="닉네임" />
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose} disabled={isSaving}>취소</button>
          <button type="button" onClick={() => void handleSave()} disabled={isSaving}>저장</button>
        </div>
      </section>
    </div>
  )
}

export default SettingsModal
