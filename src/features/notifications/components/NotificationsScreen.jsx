const toCreatedLabel = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

const getNotificationTitle = (item) => {
  if (item?.type === 'room_invite') return '방 초대'
  if (item?.type === 'friend_request') return '친구 요청'
  return String(item?.type || '알림')
}

const getNotificationSummary = (item) => {
  if (item?.type === 'room_invite') {
    const inviterName = String(item?.payload?.inviter?.nickname || '').trim() || '알 수 없는 사용자'
    const roomName = String(item?.payload?.roomName || '').trim() || '이름 없는 채팅방'
    return `${inviterName}님이 ${roomName}에 초대했습니다.`
  }

  if (item?.type === 'friend_request') {
    return String(item?.payload?.requester?.nickname || '').trim() || '새 친구 요청이 도착했습니다.'
  }

  return '추가 정보 없음'
}

// 모바일 알림 화면은 처리할 요청과 최근 알림만 보여준다.
// 보낸 요청은 별도 섹션으로 분리하지 않고 최근 알림 흐름에 흡수한다.
function NotificationsScreen({
  unreadCount,
  notificationsLoading,
  notifications,
  pendingReceived,
  notificationErrorMessage,
  onRespondFriendRequest,
  onOpenRoomInvite,
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
          {pendingReceived.length === 0 && <p className="notification-empty">처리할 친구 요청이 없습니다.</p>}
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
          <div className="notification-section-title">최근 알림</div>
          {notificationsLoading && <p className="notification-empty">알림을 불러오는 중입니다.</p>}
          {!notificationsLoading && notifications.length === 0 && <p className="notification-empty">표시할 알림이 없습니다.</p>}
          <ul className="notification-list">
            {notifications.map((item) => (
              <li key={item.id} className={`notification-row ${item.isRead ? 'read' : 'unread'}`}>
                <div className="notification-main">
                  <strong>{getNotificationTitle(item)}</strong>
                  <small>{getNotificationSummary(item)}</small>
                  <small>{toCreatedLabel(item.createdAt)}</small>
                </div>
                {item.type === 'room_invite' && (
                  <div className="notification-actions">
                    <button
                      type="button"
                      onClick={() => void onOpenRoomInvite?.(item)}
                      disabled={!item?.payload?.roomId}
                    >
                      방으로 이동
                    </button>
                  </div>
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
