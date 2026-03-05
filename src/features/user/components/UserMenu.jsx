import { useEffect, useRef } from 'react'

// 우측 상단 점3개 메뉴: 내 정보/설정/로그아웃 진입점.
function UserMenu({ isOpen, onToggle, onOpenProfile, onOpenSettings, onLogout }) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    // 메뉴 외부 클릭 시 드롭다운을 닫아 모바일/데스크톱 UX를 통일한다.
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
    <div className="user-menu" ref={menuRef}>
      <button type="button" className="kebab-button" onClick={() => onToggle(!isOpen)} aria-label="사용자 메뉴">
        ⋮
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
