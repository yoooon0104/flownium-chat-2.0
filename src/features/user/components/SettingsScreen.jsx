function SettingsScreen({ themePreference, onChangeTheme, onBack }) {
  return (
    <section className="settings-screen mobile-active">
      <header className="settings-screen-header">
        <button type="button" className="back-button visible" aria-label="뒤로 이동" onClick={onBack}>
          ←
        </button>
        <div className="settings-screen-main">
          <h3>설정</h3>
          <p>앱에서 사용하는 화면 테마를 바꿀 수 있어요.</p>
        </div>
      </header>

      <div className="settings-screen-body">
        <div className="settings-form-card">
          <label className="settings-field">
            <span>테마</span>
            <select value={themePreference} onChange={(event) => onChangeTheme(event.target.value)}>
              <option value="system">시스템 설정 따르기</option>
              <option value="light">라이트 모드</option>
              <option value="dark">다크 모드</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}

export default SettingsScreen
