import { useEffect } from 'react'

// 모바일에서는 친구 항목을 탭했을 때 액션 시트를 열어 1:1 시작 동작을 분리한다.
function FriendActionSheet({ friend, isOpen, onStartChat, onClose }) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !friend) return null

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section className="modal-card friend-action-sheet" role="dialog" aria-modal="true" aria-label="친구 액션">
        <div className="friend-sheet-header">
          <span className="friend-avatar large">
            {friend.profileImage ? <img src={friend.profileImage} alt="" /> : friend.nickname.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h3>{friend.nickname || '이름 없음'}</h3>
            <p>{friend.email || '이메일 미등록'}</p>
          </div>
        </div>
        <div className="modal-actions single-column-actions">
          <button type="button" onClick={() => void onStartChat(friend)}>
            채팅 시작
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </section>
    </div>
  )
}

export default FriendActionSheet
