import AccountPanel from './AccountPanel'

function AccountScreen({
  user,
  onSubmitNickname,
  onChangePassword,
  onStartKakaoLink,
  onUnlinkKakao,
  onDeleteAccount,
  onBack,
  emphasizeKakaoLink = false,
}) {
  return (
    <section className="settings-screen mobile-active">
      <header className="settings-screen-header">
        <button type="button" className="back-button visible" aria-label="뒤로 이동" onClick={onBack}>
          ←
        </button>
        <div className="settings-screen-main">
          <h3>내 정보</h3>
          <p>계정 정보, 비밀번호, 간편로그인 연결을 한 곳에서 관리할 수 있어요.</p>
        </div>
      </header>

      <div className="settings-screen-body subtle-scroll">
        <AccountPanel
          user={user}
          onSubmitNickname={onSubmitNickname}
          onChangePassword={onChangePassword}
          onStartKakaoLink={onStartKakaoLink}
          onUnlinkKakao={onUnlinkKakao}
          onDeleteAccount={onDeleteAccount}
          emphasizeKakaoLink={emphasizeKakaoLink}
        />
      </div>
    </section>
  )
}

export default AccountScreen
