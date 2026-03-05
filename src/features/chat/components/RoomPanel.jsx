// 방 목록 패널: 검색 + 리스트 + FAB 생성 액션을 담당한다.
function RoomPanel({
  isMobileChatView,
  roomsLoading,
  rooms,
  filteredRooms,
  searchKeyword,
  onSearch,
  joinedRoomId,
  onJoinRoom,
  onOpenCreateRoom,
  toTimeLabel,
}) {
  return (
    <aside className={`room-panel ${isMobileChatView ? 'mobile-hidden' : ''}`}>
      <div className="panel-header">
        <h2>Rooms</h2>
      </div>

      <div className="room-search">
        <input
          value={searchKeyword}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="방 이름 또는 메시지 검색"
        />
      </div>

      <ul className="room-list">
        {roomsLoading && <li className="state-item">Loading rooms...</li>}
        {!roomsLoading && rooms.length === 0 && <li className="state-item">No rooms yet.</li>}
        {!roomsLoading && rooms.length > 0 && filteredRooms.length === 0 && (
          <li className="state-item">검색 결과가 없습니다.</li>
        )}

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
                  <small>{room.lastMessage || 'No messages yet'}</small>
                </span>
                <span className="room-time">{toTimeLabel(room.lastMessageAt)}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <button type="button" className="fab-create-room" aria-label="새 방 만들기" onClick={onOpenCreateRoom}>
        +
      </button>
    </aside>
  )
}

export default RoomPanel
