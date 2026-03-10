import { useEffect, useRef } from 'react'

// 참여자 메뉴는 헤더 우측에서 room_participants 이벤트를 시각화한다.
function ParticipantsMenu({
  joinedRoomId,
  participants,
  isOpen,
  onToggle,
  currentUserId,
  onOpenInvite,
  onLeaveRoom,
  canInvite,
}) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        onToggle(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen, onToggle])

  return (
    <div className="participants-menu" ref={menuRef}>
      <button
        type="button"
        className="participants-menu-button"
        onClick={() => onToggle(!isOpen)}
        disabled={!joinedRoomId}
      >
        참여자 ({participants.length})
      </button>

      {isOpen && (
        <div className="participants-dropdown">
          <p className="participants-title">대화상대</p>
          {participants.length === 0 ? (
            <p className="participants-empty">참여자 정보가 없습니다.</p>
          ) : (
            <ul className="participants-list">
              {participants.map((participant) => {
                const isMe = participant.userId === currentUserId
                return (
                  <li key={participant.userId} className="participants-row">
                    <span>{participant.nickname}{isMe ? ' (나)' : ''}</span>
                    <span className={`participant-chip ${participant.online ? 'online' : 'offline'}`}>
                      {participant.online ? 'online' : 'offline'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="participants-actions">
            <button type="button" className="participants-inline-button" onClick={onOpenInvite} disabled={!joinedRoomId || !canInvite}>
              + 초대
            </button>
            <button type="button" className="participants-inline-button danger" onClick={onLeaveRoom} disabled={!joinedRoomId}>
              나가기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParticipantsMenu
