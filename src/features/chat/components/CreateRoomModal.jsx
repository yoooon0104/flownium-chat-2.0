import { useEffect } from 'react'

// FAB로 연 방 생성 모달: ESC/오버레이/버튼 모두 닫힘 경로를 제공한다.
function CreateRoomModal({ isOpen, roomName, onChangeRoomName, onClose, onSubmit }) {
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

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section className="modal-card" role="dialog" aria-modal="true" aria-label="방 생성">
        <h3>새 방 만들기</h3>
        <p>방 이름을 입력하면 생성 후 자동으로 입장합니다.</p>
        <input
          value={roomName}
          onChange={(event) => onChangeRoomName(event.target.value)}
          onKeyUp={(event) => {
            if (event.key === 'Enter') {
              void onSubmit()
            }
          }}
          placeholder="예: 프로젝트 회의방"
        />
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            취소
          </button>
          <button type="button" onClick={() => void onSubmit()} disabled={!roomName.trim()}>
            생성
          </button>
        </div>
      </section>
    </div>
  )
}

export default CreateRoomModal
