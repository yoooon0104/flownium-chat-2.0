import ParticipantsMenu from './ParticipantsMenu'

// 채팅 본문 패널: 헤더/메시지/입력창을 조합하고 모바일 뒤로가기를 처리한다.
// unread 숫자는 메시지별 unreadCount를 그대로 받아 '(숫자) 메시지' 형태로 렌더링한다.
function ChatPanel({
  isMobileChatView,
  activeRoom,
  joinedRoomId,
  onBack,
  participantsProps,
  errorMessage,
  isLoadingHistory,
  historyError,
  messages,
  currentUserId,
  messagesEndRef,
  text,
  onTextChange,
  onComposerKeyUp,
  onSendMessage,
  canSend,
}) {
  return (
    <section className={`chat-panel ${isMobileChatView ? 'mobile-active' : ''}`}>
      <div className="chat-header">
        <button
          type="button"
          className="back-button"
          aria-label="채팅 목록으로 이동"
          onClick={onBack}
        >
          ←
        </button>

        <div className="chat-header-main">
          <h3>{activeRoom?.name || '채팅방을 선택해 주세요'}</h3>
          <p>{joinedRoomId ? `방 ID: ${joinedRoomId}` : '좌측 패널에서 채팅방을 선택하면 대화를 시작할 수 있다.'}</p>
        </div>

        <ParticipantsMenu {...participantsProps} />
      </div>

      <div className="message-area">
        {errorMessage && <p className="error-text">오류: {errorMessage}</p>}
        {isLoadingHistory && <p className="muted-text">이전 메시지를 불러오는 중입니다.</p>}
        {historyError && <p className="warn-text">{historyError}</p>}

        {messages.length === 0 ? (
          <p className="muted-text">표시할 메시지가 없습니다.</p>
        ) : (
          <ul className="message-list">
            {messages.map((msg, idx) => {
              const isMine = currentUserId && msg.senderId === currentUserId
              if (msg.type === 'system') {
                return (
                  <li key={msg.id || `${msg.timestamp}-${idx}`} className="system">
                    <p className="system-message">{msg.text}</p>
                    <p className="time system-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </li>
                )
              }

              return (
                <li key={msg.id || `${msg.timestamp}-${idx}`} className={isMine ? 'mine' : 'other'}>
                  <p className="meta">{msg.senderNickname}</p>
                  <div className={`bubble-row ${isMine ? 'mine' : 'other'}`}>
                    {/* unreadCount는 읽지 않은 사람 수이므로 0보다 클 때만 노출한다.
                        현재 UX 규칙은 말풍선이 아니라 텍스트 숫자만 메시지 앞에 붙이는 방식이다. */}
                    {!isMine && Number(msg.unreadCount) > 0 && (
                      <span className="message-unread-count">{msg.unreadCount > 99 ? '99+' : msg.unreadCount}</span>
                    )}
                    <p className="bubble">{msg.text}</p>
                    {isMine && Number(msg.unreadCount) > 0 && (
                      <span className="message-unread-count">{msg.unreadCount > 99 ? '99+' : msg.unreadCount}</span>
                    )}
                  </div>
                  <p className="time">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="composer">
        <input
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyUp={onComposerKeyUp}
          placeholder={joinedRoomId ? '메시지를 입력해 주세요' : '먼저 채팅방에 입장해 주세요'}
          disabled={!joinedRoomId}
        />
        <button type="button" onClick={onSendMessage} disabled={!canSend}>
          전송
        </button>
      </div>
    </section>
  )
}

export default ChatPanel


