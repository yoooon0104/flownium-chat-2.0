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
