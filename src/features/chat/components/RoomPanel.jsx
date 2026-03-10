import { useMemo } from 'react'
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

// 좌측 패널은 프로필, 액션 버튼, 검색창, 친구/방 목록을 함께 렌더링한다.
// 모바일에서는 하단 탭이 Friends/Rooms 전환을 담당하므로 상단 토글은 숨긴다.
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
    <aside
      className={`room-panel ${isMobileChatView || isMobileNotificationView || isMobileSettingsView ? 'mobile-hidden' : ''} flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-[var(--panel-bg)] shadow-[var(--shadow-panel)] backdrop-blur`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border-soft)] px-4 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onOpenProfile}>
          <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] text-sm font-semibold text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            {currentUser?.profileImage ? <img src={currentUser.profileImage} alt="" className="h-full w-full object-cover" /> : String(currentUser?.nickname || '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-[24px] font-semibold leading-tight tracking-[-0.03em] text-[var(--text-primary)] md:text-[28px]">
              {currentUser?.nickname || '게스트'}
            </strong>
            <small className="mt-1 block text-xs font-medium uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              {activeTab === 'friends' ? 'Friends' : 'Rooms'}
            </small>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-primary/25 bg-[var(--cta-bg)] text-xl font-bold leading-none text-[var(--cta-text)] shadow-[var(--shadow-glow)] transition hover:brightness-105"
            aria-label="친구 추가"
            onClick={onOpenAddFriend}
          >
            +
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

      <div className="hidden px-4 pb-3 pt-4 md:block md:px-5">
        <div className="inline-flex rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] p-1">
          <button
            type="button"
            className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition ${activeTab === 'friends' ? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-text)] shadow-[var(--shadow-panel)]' : 'text-[var(--tab-inactive-text)] hover:text-[var(--text-primary)]'}`}
            onClick={() => onChangeTab('friends')}
          >
            친구
          </button>
          <button
            type="button"
            className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition ${activeTab === 'rooms' ? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-text)] shadow-[var(--shadow-panel)]' : 'text-[var(--tab-inactive-text)] hover:text-[var(--text-primary)]'}`}
            onClick={() => onChangeTab('rooms')}
          >
            채팅방
            {totalUnreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--badge-bg)] px-1.5 text-[10px] font-bold text-white shadow-[var(--shadow-glow)]">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 pb-5 pt-1 md:px-5">
        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <input
            className="w-full border-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            value={searchKeyword}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={activeTab === 'friends' ? '친구 이름 또는 이메일 검색' : '방 이름 또는 메시지 검색'}
          />
        </div>
      </div>

      {activeTab === 'friends' ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="h-full min-h-0 overflow-hidden">
            <ul className="flex h-full min-h-0 flex-col gap-2 overflow-auto px-3 pb-24 md:px-4">
              {friendsLoading && <li className="px-3 py-3 text-xs text-[var(--text-secondary)]">친구 목록을 불러오는 중입니다.</li>}
              {!friendsLoading && groupedFriends.map((entry, index) => {
                if (entry.type === 'label') {
                  return (
                    <li
                      key={`label-${entry.value}-${index}`}
                      className="sticky top-0 z-[1] px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-tertiary)] backdrop-blur"
                    >
                      {entry.value}
                    </li>
                  )
                }

                const friend = entry.value
                return (
                  <li key={friend.id}>
                    <button
                      type="button"
                      className="grid w-full grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border border-transparent bg-[var(--panel-soft)] px-3 py-3 text-left transition hover:border-[var(--border-soft)] hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      onDoubleClick={() => onFriendDoubleClick(friend)}
                      onClick={() => onFriendTap(friend)}
                      title="친구와 1:1 채팅 시작"
                    >
                      <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)]">
                        {friend.profileImage ? <img src={friend.profileImage} alt="" className="h-full w-full object-cover" /> : getFriendInitial(friend)}
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-semibold text-[var(--text-primary)]">{friend.nickname || '이름 없음'}</strong>
                        <small className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{friend.email || '이메일 미등록'}</small>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-auto px-3 pb-24 md:px-4">
          {roomsLoading && <li className="px-3 py-3 text-xs text-[var(--text-secondary)]">채팅방 목록을 불러오는 중입니다.</li>}
          {!roomsLoading && filteredRooms.length === 0 && <li className="px-3 py-3 text-xs text-[var(--text-secondary)]">표시할 채팅방이 없습니다.</li>}
          {filteredRooms.map((room) => {
            const isActive = room.id === joinedRoomId
            return (
              <li key={room.id} className="mb-2">
                <button
                  type="button"
                  className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${isActive ? 'border-brand-primary/35 bg-[var(--surface-elevated)] shadow-[var(--shadow-glow)] ring-1 ring-brand-primary/15' : 'border-transparent bg-[var(--panel-soft)] hover:border-[var(--border-soft)] hover:bg-[var(--surface-muted)]'}`}
                  onClick={() => onJoinRoom(room.id)}
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)]">
                    {room.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-semibold text-[var(--text-primary)]">{room.name}</strong>
                    <small className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{room.lastMessage || '메시지가 없습니다.'}</small>
                  </span>
                  <span className="flex min-w-[58px] flex-col items-end gap-2">
                    <span className="text-[11px] text-[var(--text-secondary)]">{toTimeLabel(room.lastMessageAt)}</span>
                    {room.unreadCount > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--badge-bg)] px-2 py-0.5 text-[10px] font-bold text-white shadow-[var(--shadow-glow)]">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        className="absolute bottom-4 right-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-brand-primary/25 bg-[var(--cta-bg)] text-[30px] font-semibold leading-none text-[var(--cta-text)] shadow-[var(--shadow-glow)] transition hover:scale-[1.02] hover:brightness-105"
        aria-label="새 채팅 만들기"
        onClick={onOpenCreateRoom}
      >
        <span>+</span>
      </button>
    </aside>
  )
}

export default RoomPanel
