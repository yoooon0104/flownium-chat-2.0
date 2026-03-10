import { useMemo, useState } from 'react'
import NotificationMenu from '../../notifications/components/NotificationMenu'
import UserMenu from '../../user/components/UserMenu'

const getFriendInitial = (friend) => {
  const value = String(friend?.nickname || friend?.email || '?').trim()
  return value ? value.slice(0, 1).toUpperCase() : '?'
}

const getFriendSectionLabel = (friend) => {
  const base = String(friend?.nickname || friend?.email || '#').trim()
  if (!base) return '#'

  const first = base[0].toUpperCase()
  if (/[A-Z]/.test(first)) return first

  return first
}

// 좌측 패널은 현재 사용자 프로필, 액션 버튼, Friends/Rooms 탭, 목록을 한 번에 묶는다.
// Friends 탭은 친구 목록만 보여주고 요청/초대 알림은 상단 벨 메뉴로 분리한다.
function RoomPanel({
  isMobileChatView,
  isMobileNotificationView,
  isMobileSettingsView,
  isMobileViewport,
  activeTab,
  onChangeTab,
  roomsLoading,
  friendsLoading,
  filteredRooms,
  filteredFriends,
  searchKeyword,
  onSearch,
  joinedRoomId,
  onJoinRoom,
  onOpenCreateRoom,
  onOpenAddFriend,
  onFriendDoubleClick,
  onFriendTap,
  toTimeLabel,
  currentUser,
  totalUnreadCount,
  notificationUnreadCount,
  isNotificationMenuOpen,
  onToggleNotificationMenu,
  notificationsLoading,
  notifications,
  pendingReceived,
  pendingSent,
  notificationErrorMessage,
  onRespondFriendRequest,
  isUserMenuOpen,
  onToggleUserMenu,
  onOpenProfile,
  onOpenSettings,
  onLogout,
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const groupedFriends = useMemo(() => {
    const groups = []
    let currentLabel = ''

    filteredFriends.forEach((friend) => {
      const nextLabel = getFriendSectionLabel(friend)
      if (nextLabel !== currentLabel) {
        currentLabel = nextLabel
        groups.push({ type: 'label', value: nextLabel })
      }
      groups.push({ type: 'friend', value: friend })
    })

    return groups
  }, [filteredFriends])

  return (
    <aside className={`room-panel ${isMobileChatView || isMobileNotificationView || isMobileSettingsView ? 'mobile-hidden' : ''}`}>
      <div className="panel-profile-header">
        <button type="button" className="panel-profile" onClick={onOpenProfile}>
          <span className="panel-profile-avatar">
            {currentUser?.profileImage ? <img src={currentUser.profileImage} alt="" /> : String(currentUser?.nickname || '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="panel-profile-text">
            <strong>{currentUser?.nickname || '게스트'}</strong>
            <small>{activeTab === 'friends' ? '친구' : '채팅방'}</small>
          </span>
        </button>

        <div className="panel-top-actions">
          <button
            type="button"
            className={`panel-icon-button ${isSearchOpen ? 'active' : ''}`}
            aria-label="검색 열기"
            onClick={() => setIsSearchOpen((current) => !current)}
          >
            ⌕
          </button>
          <button type="button" className="panel-icon-button" aria-label="친구 추가" onClick={onOpenAddFriend}>
            ＋
          </button>
          <NotificationMenu
            isMobile={isMobileViewport}
            isOpen={isNotificationMenuOpen}
            onToggle={onToggleNotificationMenu}
            onOpenMobileScreen={() => onToggleNotificationMenu(true)}
            unreadCount={notificationUnreadCount}
            notificationsLoading={notificationsLoading}
            notifications={notifications}
            pendingReceived={pendingReceived}
            pendingSent={pendingSent}
            notificationErrorMessage={notificationErrorMessage}
            onRespondFriendRequest={onRespondFriendRequest}
          />
          <UserMenu
            isOpen={isUserMenuOpen}
            onToggle={onToggleUserMenu}
            onOpenProfile={onOpenProfile}
            onOpenSettings={onOpenSettings}
            onLogout={onLogout}
            isFloating={false}
            buttonLabel="설정 메뉴"
            buttonSymbol="⚙"
          />
        </div>
      </div>

      <div className="panel-tabs">
        <button type="button" className={activeTab === 'friends' ? 'active' : ''} onClick={() => onChangeTab('friends')}>
          친구
        </button>
        <button type="button" className={activeTab === 'rooms' ? 'active' : ''} onClick={() => onChangeTab('rooms')}>
          채팅방
          {totalUnreadCount > 0 && <span className="tab-badge">{totalUnreadCount > 99 ? '99+' : totalUnreadCount}</span>}
        </button>
      </div>

      {isSearchOpen && (
        <div className="panel-search-shell">
          <div className="room-search panel-search-input">
            <input
              value={searchKeyword}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={activeTab === 'friends' ? '친구 이름 또는 이메일 검색' : '방 이름 또는 메시지 검색'}
            />
          </div>
        </div>
      )}

      {activeTab === 'friends' ? (
        <div className="friend-panel-content friend-list-only-panel">
          <div className="friend-list-section">
            <ul className="friend-list grouped-friend-list">
              {friendsLoading && <li className="state-item">친구 목록을 불러오는 중입니다.</li>}
              {!friendsLoading && groupedFriends.map((entry, index) => {
                if (entry.type === 'label') {
                  return <li key={`label-${entry.value}-${index}`} className="friend-group-label">{entry.value}</li>
                }

                const friend = entry.value
                return (
                  <li key={friend.id}>
                    <button
                      type="button"
                      className="friend-item"
                      onDoubleClick={() => onFriendDoubleClick(friend)}
                      onClick={() => onFriendTap(friend)}
                      title="친구와 1:1 채팅 시작"
                    >
                      <span className="friend-avatar">
                        {friend.profileImage ? <img src={friend.profileImage} alt="" /> : getFriendInitial(friend)}
                      </span>
                      <span className="friend-main">
                        <strong>{friend.nickname || '이름 없음'}</strong>
                        <small>{friend.email || '이메일 미등록'}</small>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ) : (
        <ul className="room-list">
          {roomsLoading && <li className="state-item">채팅방 목록을 불러오는 중입니다.</li>}
          {!roomsLoading && filteredRooms.length === 0 && <li className="state-item">표시할 채팅방이 없습니다.</li>}
          {filteredRooms.map((room) => {
            const isActive = room.id === joinedRoomId
            return (
              <li key={room.id}>
                <button
                  type="button"
                  className={`room-item ${isActive ? 'active' : ''}`}
                  onClick={() => onJoinRoom(room.id)}
                >
                  <span className="avatar">{room.name.slice(0, 2).toUpperCase()}</span>
                  <span className="room-main">
                    <strong>{room.name}</strong>
                    <small>{room.lastMessage || '메시지가 없습니다.'}</small>
                  </span>
                  <span className="room-side-meta">
                    <span className="room-time">{toTimeLabel(room.lastMessageAt)}</span>
                    {room.unreadCount > 0 && <span className="room-unread-badge">{room.unreadCount > 99 ? '99+' : room.unreadCount}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <button type="button" className="fab-create-room" aria-label="새 채팅 만들기" onClick={onOpenCreateRoom}>
        <span>+</span>
      </button>
    </aside>
  )
}

export default RoomPanel

