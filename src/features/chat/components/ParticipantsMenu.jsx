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
    <div className="relative justify-self-end" ref={menuRef}>
      <button
        type="button"
        className="inline-flex h-10 items-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-3 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] disabled:text-[var(--text-secondary)]"
        onClick={() => onToggle(!isOpen)}
        disabled={!joinedRoomId}
      >
        참여자 ({participants.length})
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[280px] overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-[var(--panel-raised)] p-4 shadow-[0_24px_60px_rgba(2,6,23,0.22)] backdrop-blur">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">대화상대</p>
          {participants.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">참여자 정보가 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {participants.map((participant) => {
                const isMe = participant.userId === currentUserId
                return (
                  <li key={participant.userId} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)]">
                    <span className="min-w-0 truncate">{participant.nickname}{isMe ? ' (나)' : ''}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${participant.online ? 'border-brand-primary/15 bg-brand-primary/8 text-[var(--text-primary)]' : 'border-[var(--border-soft)]/60 bg-[color-mix(in_srgb,var(--surface-elevated)_72%,transparent)] text-[color:color-mix(in_srgb,var(--text-secondary)_72%,transparent)]'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${participant.online ? 'bg-brand-primary/70' : 'bg-[color:color-mix(in_srgb,var(--text-tertiary)_55%,transparent)]'}`} />
                      {participant.online ? 'online' : 'offline'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--border-soft)] pt-3">
            <button
              type="button"
              className="cta-button h-10 rounded-2xl border text-xs font-semibold shadow-[var(--shadow-glow)] transition"
              onClick={onOpenInvite}
              disabled={!joinedRoomId || !canInvite}
            >
              + 초대
            </button>
            <button
              type="button"
              className="h-10 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] disabled:text-[var(--text-secondary)]"
              onClick={() => onToggle(false)}
              disabled={!joinedRoomId}
            >
              취소
            </button>
          </div>

          <div className="mt-2 border-t border-[var(--border-soft)] pt-3">
            <button
              type="button"
              className="h-10 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] text-xs font-semibold text-rose-300 transition hover:border-rose-300/40 hover:bg-rose-400/10 disabled:text-[var(--text-secondary)]"
              onClick={onLeaveRoom}
              disabled={!joinedRoomId}
            >
              나가기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParticipantsMenu
