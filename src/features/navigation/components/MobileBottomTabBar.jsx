// 모바일 하단 탭바는 친구/채팅방/알림/설정의 1차 이동만 담당한다.
// 실제 화면 전환은 상위 AppShell 상태를 바꾸는 방식으로 처리하고,
// 여기서는 현재 활성 탭과 배지만 렌더링한다.
function MobileBottomTabBar({
  activeItem,
  totalUnreadCount,
  notificationUnreadCount,
  onSelectFriends,
  onSelectRooms,
  onSelectNotifications,
  onSelectSettings,
}) {
  return (
    <nav className="mobile-bottom-tabbar" aria-label="모바일 하단 메뉴">
      <button
        type="button"
        className={activeItem === 'friends' ? 'active' : ''}
        onClick={onSelectFriends}
      >
        <span className="mobile-bottom-tabbar-icon" aria-hidden="true">👤</span>
        <span>친구</span>
      </button>

      <button
        type="button"
        className={activeItem === 'rooms' ? 'active' : ''}
        onClick={onSelectRooms}
      >
        <span className="mobile-bottom-tabbar-icon" aria-hidden="true">💬</span>
        <span>채팅방</span>
        {totalUnreadCount > 0 && (
          <span className="mobile-bottom-tabbar-badge">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>

      <button
        type="button"
        className={activeItem === 'notifications' ? 'active' : ''}
        onClick={onSelectNotifications}
      >
        <span className="mobile-bottom-tabbar-icon" aria-hidden="true">🔔</span>
        <span>알림</span>
        {notificationUnreadCount > 0 && (
          <span className="mobile-bottom-tabbar-badge">
            {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
          </span>
        )}
      </button>

      <button
        type="button"
        className={activeItem === 'settings' ? 'active' : ''}
        onClick={onSelectSettings}
      >
        <span className="mobile-bottom-tabbar-icon" aria-hidden="true">⚙</span>
        <span>설정</span>
      </button>
    </nav>
  )
}

export default MobileBottomTabBar
