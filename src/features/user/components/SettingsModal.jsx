// 설정 모달은 앱 환경 설정만 다룬다. 계정 정보 관리는 내 정보 화면으로 분리한다.
function SettingsModal({ isOpen, themePreference, onChangeTheme, onClose }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label="설정">
        <h3>설정</h3>
        <p>앱에서 사용하는 화면 테마를 바꿀 수 있어요.</p>

        <label className="settings-field">
          <span>테마</span>
          <select value={themePreference} onChange={(event) => onChangeTheme(event.target.value)}>
            <option value="system">시스템 설정 따르기</option>
            <option value="light">라이트 모드</option>
            <option value="dark">다크 모드</option>
          </select>
        </label>

        <div className="modal-actions single-column-actions">
          <button type="button" className="secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </section>
    </div>
  )
}

export default SettingsModal
