import { useEffect, useRef } from 'react'

const toCreatedLabel = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

// 알림 메뉴는 친구 요청과 방 초대를 친구 목록 본문과 분리해서 보여준다.
// Friends 탭은 친구 탐색에만 집중시키고, 처리성 액션은 벨 허브에서 모은다.
function NotificationMenu({
  isOpen,
  onToggle,
  unreadCount,
  notificationsLoading,
  notifications,
  pendingReceived,
  pendingSent,
  notificationErrorMessage,
  onRespondFriendRequest,
  onMarkNotificationRead,
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
    <div className="notification-menu" ref={menuRef}>
      <button type="button" className="notification-button" aria-label="알림 메뉴" onClick={() => onToggle(!isOpen)}>
        <span className="notification-button-icon">🔔</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <section className="notification-dropdown" role="dialog" aria-label="알림 목록">
          <header className="notification-header">
            <strong>알림 허브</strong>
            <small>친구 요청과 방 초대, 최근 알림을 한곳에서 확인한다.</small>
          </header>

          {notificationErrorMessage && <p className="error-text modal-error">{notificationErrorMessage}</p>}

          <div className="notification-section">
            <div className="notification-section-title">받은 친구 요청</div>
            {pendingReceived.length === 0 && <p className="notification-empty">받은 요청이 없습니다.</p>}
            <ul className="notification-list">
              {pendingReceived.map((item) => (
                <li key={item.id} className="notification-row actionable">
                  <div className="notification-main">
                    <strong>{item.counterpart.nickname || '이름 없음'}</strong>
                    <small>{item.counterpart.email || '이메일 미등록'}</small>
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
            <div className="notification-section-title">보낸 친구 요청</div>
            {pendingSent.length === 0 && <p className="notification-empty">보낸 요청이 없습니다.</p>}
            <ul className="notification-list">
              {pendingSent.map((item) => (
                <li key={item.id} className="notification-row">
                  <div className="notification-main">
                    <strong>{item.counterpart.nickname || '이름 없음'}</strong>
                    <small>응답 대기 중</small>
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
                    <strong>{item.type === 'room_invite' ? '방 초대' : item.type === 'friend_request' ? '친구 요청' : item.type}</strong>
                    <small>{item.payload?.roomName || item.payload?.requester?.nickname || '추가 정보 없음'}</small>
                    <small>{toCreatedLabel(item.createdAt)}</small>
                  </div>
                  {!item.isRead && (
                    <button type="button" className="secondary inline-action-button" onClick={() => void onMarkNotificationRead(item.id)}>
                      읽음
                    </button>
                  )}
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
