import { useEffect, useMemo, useState } from 'react'

// 방 초대 모달은 현재 방 멤버를 제외한 친구만 보여준다.
// 1:1/다인방 여부는 서버가 판단하므로 여기서는 선택과 제출만 담당한다.
function InviteFriendsModal({ isOpen, friends, roomName, errorMessage, onClose, onSubmit }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([])
      setLocalError('')
      return
    }

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

  const selectedFriends = useMemo(() => {
    const selectedSet = new Set(selectedIds)
    return friends.filter((friend) => selectedSet.has(friend.id))
  }, [friends, selectedIds])

  if (!isOpen) return null

  const toggleFriend = (friendId) => {
    setSelectedIds((current) => {
      if (current.includes(friendId)) {
        return current.filter((id) => id !== friendId)
      }
      return [...current, friendId]
    })
  }

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setLocalError('초대할 친구를 한 명 이상 선택해야 한다.')
      return
    }

    setLocalError('')
    const result = await onSubmit(selectedIds)
    if (result?.ok) {
      setSelectedIds([])
      setLocalError('')
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section className="modal-card create-chat-modal" role="dialog" aria-modal="true" aria-label="친구 초대">
        <h3>친구 초대</h3>
        <p>{roomName ? `${roomName}에 초대할 친구를 선택해 주세요.` : '초대할 친구를 선택해 주세요.'}</p>

        <ul className="friend-picker-list">
          {friends.length === 0 && <li className="state-item friend-picker-empty">초대 가능한 친구가 없습니다.</li>}
          {friends.map((friend) => {
            const isSelected = selectedIds.includes(friend.id)
            return (
              <li key={friend.id}>
                <button
                  type="button"
                  className={`friend-picker-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleFriend(friend.id)}
                >
                  <span className="friend-avatar">
                    {friend.profileImage ? <img src={friend.profileImage} alt="" /> : friend.nickname.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="friend-main">
                    <strong>{friend.nickname || '이름 없음'}</strong>
                    <small>{friend.email || '이메일 미등록'}</small>
                  </span>
                  <span className={`selection-indicator ${isSelected ? 'checked' : ''}`}>{isSelected ? '선택' : ''}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {(localError || errorMessage) && <p className="error-text modal-error">{localError || errorMessage}</p>}

        <div className="selected-friends-summary">
          {selectedFriends.map((friend) => (
            <span key={friend.id} className="selected-friend-chip">{friend.nickname || '이름 없음'}</span>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            취소
          </button>
          <button type="button" onClick={() => void handleSubmit()} disabled={friends.length === 0}>
            초대
          </button>
        </div>
      </section>
    </div>
  )
}

export default InviteFriendsModal
