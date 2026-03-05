import ParticipantsMenu from './ParticipantsMenu'

// 채팅 본문 패널: 헤더/메시지/입력창을 조합하고 모바일 뒤로가기를 처리한다.
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
          <h3>{activeRoom?.name || 'Select a room'}</h3>
          <p>{joinedRoomId ? `Room ID: ${joinedRoomId}` : 'Choose a room from left panel.'}</p>
        </div>

        <ParticipantsMenu {...participantsProps} />
      </div>

      <div className="message-area">
        {errorMessage && <p className="error-text">Error: {errorMessage}</p>}
        {isLoadingHistory && <p className="muted-text">Loading history...</p>}
        {historyError && <p className="warn-text">{historyError}</p>}

        {messages.length === 0 ? (
          <p className="muted-text">No messages.</p>
        ) : (
          <ul className="message-list">
            {messages.map((msg, idx) => {
              const isMine = currentUserId && msg.senderId === currentUserId
              return (
                <li key={`${msg.timestamp}-${idx}`} className={isMine ? 'mine' : 'other'}>
                  <p className="meta">{msg.senderNickname}</p>
                  <p className="bubble">{msg.text}</p>
                  <p className="time">{new Date(msg.timestamp).toLocaleTimeString()}</p>
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
          placeholder={joinedRoomId ? 'Type a message' : 'Join a room first'}
          disabled={!joinedRoomId}
        />
        <button type="button" onClick={onSendMessage} disabled={!canSend}>
          Send
        </button>
      </div>
    </section>
  )
}

export default ChatPanel
