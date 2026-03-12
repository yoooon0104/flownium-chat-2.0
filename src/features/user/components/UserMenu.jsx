import { useEffect, useRef } from 'react'

// 사용자 메뉴는 상단 우측 액션 영역에서 내 정보/설정/로그아웃 진입점을 담당한다.
// 버튼 기호를 외부에서 주입할 수 있게 열어둬서 헤더 레이아웃에 맞게 재사용한다.
function UserMenu({
  isOpen,
  onToggle,
  onOpenProfile,
  onOpenSettings,
  onLogout,
  isFloating = false,
  buttonLabel = '메뉴',
  buttonSymbol = '☰',
}) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        onToggle(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onToggle(false)
      }
    }

    window.addEventListener('mousedown', handleOutside)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onToggle])

  return (
    <div className={`user-menu ${isFloating ? 'floating' : ''}`} ref={menuRef}>
      <button type="button" className="kebab-button" onClick={() => onToggle(!isOpen)} aria-label={buttonLabel}>
        {buttonSymbol}
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <button type="button" onClick={onOpenProfile}>내 정보</button>
          <button type="button" onClick={onOpenSettings}>설정</button>
          <button type="button" className="danger" onClick={onLogout}>로그아웃</button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
