const toCreatedLabel = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

// 모바일에서는 드롭다운보다 전체 화면 전환이 더 안정적이다.
// 알림 전용 화면에서 친구 요청, 보낸 요청, 최근 알림을 한 번에 처리한다.
function NotificationsScreen({
  unreadCount,
  notificationsLoading,
  notifications,
  pendingReceived,
  pendingSent,
  notificationErrorMessage,
  onRespondFriendRequest,
  onMarkNotificationRead,
  onBack,
}) {
  return (
    <section className="notification-screen mobile-active">
      <header className="notification-screen-header">
        <button type="button" className="back-button visible" aria-label="목록으로 이동" onClick={onBack}>
          ←
        </button>
        <div className="notification-screen-main">
          <h3>알림</h3>
          <p>읽지 않은 알림 {unreadCount}건</p>
        </div>
      </header>

      <div className="notification-screen-body">
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
      </div>
    </section>
  )
}

export default NotificationsScreen
