import { UserProfile } from '../../../domain/user/UserProfile'

// 현재 로그인 사용자 정보를 조회 전용으로 보여주는 모달.
function ProfileModal({ isOpen, user, onClose }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card profile-modal" role="dialog" aria-modal="true" aria-label="내 정보">
        <h3>내 정보</h3>
        <div className="profile-modal-avatar">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="profile" />
          ) : (
            <span>{UserProfile.getInitial(user)}</span>
          )}
        </div>
        <p className="profile-modal-name">{UserProfile.getDisplayName(user)}</p>
        <p className="profile-modal-id">User ID: {user?.id || '-'}</p>
        <button type="button" onClick={onClose}>닫기</button>
      </section>
    </div>
  )
}

export default ProfileModal
