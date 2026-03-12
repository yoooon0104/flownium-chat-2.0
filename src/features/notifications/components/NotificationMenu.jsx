import { useEffect, useRef } from 'react'

const toCreatedLabel = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

const getNotificationTitle = (item) => {
  if (item?.type === 'friend_request') return '친구 요청'
  return String(item?.type || '알림')
}

const getNotificationSummary = (item) => {
  if (item?.type === 'friend_request') {
    return String(item?.payload?.requester?.nickname || '').trim() || '새 친구 요청이 도착했습니다.'
  }

  return '추가 정보가 없습니다.'
}

function NotificationMenu({
  isMobile,
  isOpen,
  onToggle,
  onOpenMobileScreen,
  unreadCount,
  notificationsLoading,
  notifications,
  pendingReceived,
  notificationErrorMessage,
  onRespondFriendRequest,
}) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isOpen || isMobile) return

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
  }, [isMobile, isOpen, onToggle])

  return (
    <div className="notification-menu" ref={menuRef}>
      <button
        type="button"
        className="notification-button"
        aria-label="알림 메뉴"
        onClick={() => {
          if (isMobile) {
            onOpenMobileScreen()
            return
          }
          onToggle(!isOpen)
        }}
      >
        <span className="notification-button-icon">종</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {!isMobile && isOpen && (
        <section className="notification-dropdown" role="dialog" aria-label="알림 목록">
          <header className="notification-header">
            <strong>알림 허브</strong>
            <small>지금 처리할 요청과 최근 알림을 한곳에서 확인합니다.</small>
          </header>

          {notificationErrorMessage && <p className="error-text modal-error">{notificationErrorMessage}</p>}

          <div className="notification-section">
            <div className="notification-section-title">받은 친구 요청</div>
            {pendingReceived.length === 0 && <p className="notification-empty">처리할 친구 요청이 없습니다.</p>}
            <ul className="notification-list">
              {pendingReceived.map((item) => (
                <li key={item.id} className="notification-row actionable">
                  <div className="notification-main">
                    <strong>{item.counterpart.nickname || '이름 없음'}</strong>
                    <p className="notification-summary">{item.counterpart.email || '이메일 정보를 불러오지 못했습니다.'}</p>
                  </div>
                  <div className="notification-actions">
                    <button type="button" onClick={() => void onRespondFriendRequest(item.id, 'accept')}>수락</button>
                    <button type="button" className="secondary" onClick={() => void onRespondFriendRequest(item.id, 'reject')}>거절</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="notification-section">
            <div className="notification-section-title">최근 알림</div>
            {notificationsLoading && <p className="notification-empty">알림을 불러오는 중입니다.</p>}
            {!notificationsLoading && notifications.length === 0 && <p className="notification-empty">표시할 알림이 없습니다.</p>}
            <ul className="notification-list">
              {notifications.map((item) => (
                <li key={item.id} className={`notification-row ${item.isRead ? 'read' : 'unread'}`}>
                  <div className="notification-main">
                    <strong>{getNotificationTitle(item)}</strong>
                    <p className="notification-summary">{getNotificationSummary(item)}</p>
                    <span className="notification-time">{toCreatedLabel(item.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}

export default NotificationMenu
