import AccountPanel from './AccountPanel'

// 데스크톱에서는 계정 관련 편집을 모달로 열고, 모바일에서는 전용 화면으로 분리한다.
function ProfileModal({
  isOpen,
  user,
  onClose,
  onSubmitNickname,
  onChangePassword,
  onStartKakaoLink,
  onDeleteAccount,
  emphasizeKakaoLink = false,
}) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card account-modal" role="dialog" aria-modal="true" aria-label="내 정보">
        <div className="account-modal-header">
          <div>
            <h3>내 정보</h3>
            <p>기본 정보 수정, 비밀번호 변경, 간편로그인 연결을 이곳에서 관리할 수 있어요.</p>
          </div>
          <button type="button" className="account-close-button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="account-modal-body subtle-scroll">
          <AccountPanel
            user={user}
            onSubmitNickname={onSubmitNickname}
            onChangePassword={onChangePassword}
            onStartKakaoLink={onStartKakaoLink}
            onDeleteAccount={onDeleteAccount}
            emphasizeKakaoLink={emphasizeKakaoLink}
          />
        </div>
      </section>
    </div>
  )
}

export default ProfileModal
