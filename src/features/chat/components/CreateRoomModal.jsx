import { useEffect, useMemo, useState } from 'react'

// 친구 선택 기반 채팅 생성 모달이다.
// 선택이 1명이면 1:1 생성/재사용으로 바로 보내고,
// 2명 이상이면 그룹 이름을 추가로 받아 새 그룹 채팅을 만든다.
function CreateRoomModal({ isOpen, friends, errorMessage, onClose, onSubmit }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [groupName, setGroupName] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([])
      setGroupName('')
      setSearchKeyword('')
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

  const filteredFriends = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) return friends

    return friends.filter((friend) => {
      const nickname = String(friend.nickname || '').toLowerCase()
      const email = String(friend.email || '').toLowerCase()
      return nickname.includes(keyword) || email.includes(keyword)
    })
  }, [friends, searchKeyword])

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
      setLocalError('친구를 한 명 이상 선택해야 한다.')
      return
    }

    if (selectedIds.length > 1 && !groupName.trim()) {
      setLocalError('그룹 채팅방 이름을 입력해야 한다.')
      return
    }

    setLocalError('')
    const payload = {
      memberUserIds: selectedIds,
      ...(selectedIds.length > 1 ? { name: groupName.trim() } : {}),
    }

    const result = await onSubmit(payload)
    if (result?.ok) {
      setSelectedIds([])
      setGroupName('')
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
      <section className="modal-card create-chat-modal" role="dialog" aria-modal="true" aria-label="채팅 생성">
        <h3>채팅 시작</h3>
        <p>친구를 선택하면 1:1 또는 그룹 채팅을 만들 수 있다.</p>

        <input
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="이름 또는 이메일로 친구 찾기"
        />

        <ul className="friend-picker-list">
          {friends.length === 0 && <li className="state-item friend-picker-empty">선택 가능한 친구가 없습니다.</li>}
          {friends.length > 0 && filteredFriends.length === 0 && (
            <li className="state-item friend-picker-empty">검색 결과가 없습니다.</li>
          )}
          {filteredFriends.map((friend) => {
            const isSelected = selectedIds.includes(friend.id)
            const fallbackName = String(friend.nickname || '').trim() || '이름 없음'
            const fallbackEmail = String(friend.email || '').trim() || '이메일 미등록'
            return (
              <li key={friend.id}>
                <button
                  type="button"
                  className={`friend-picker-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleFriend(friend.id)}
                >
                  <span className="friend-avatar">
                    {friend.profileImage ? <img src={friend.profileImage} alt="" /> : fallbackName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="friend-main">
                    <strong>{fallbackName}</strong>
                    <small>{fallbackEmail}</small>
                  </span>
                  <span className={`selection-indicator ${isSelected ? 'checked' : ''}`}>{isSelected ? '선택' : ''}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {selectedIds.length > 1 && (
          <input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="그룹 채팅방 이름"
          />
        )}

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
            생성
          </button>
        </div>
      </section>
    </div>
  )
}

export default CreateRoomModal
