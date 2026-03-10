import { useEffect, useRef } from 'react'
import ParticipantsMenu from './ParticipantsMenu'

// 채팅 본문 패널: 헤더/메시지/입력창을 조합하고 모바일 뒤로가기를 처리한다.
// 상단으로 스크롤하면 이전 메시지를 추가 조회하고, 기존 스크롤 위치는 유지한다.
function ChatPanel({
  isMobileChatView,
  activeRoom,
  joinedRoomId,
  onBack,
  participantsProps,
  errorMessage,
  isLoadingHistory,
  isLoadingOlderHistory,
  hasMoreHistory,
  historyError,
  messages,
  currentUserId,
  messagesEndRef,
  onLoadOlderMessages,
  text,
  onTextChange,
  onComposerKeyUp,
  onSendMessage,
  canSend,
}) {
  const historyViewportRef = useRef(null)
  const restoreScrollRef = useRef(null)

  useEffect(() => {
    const viewport = historyViewportRef.current
    if (!viewport || restoreScrollRef.current == null || isLoadingOlderHistory) return

    const previousScrollHeight = restoreScrollRef.current
    viewport.scrollTop = viewport.scrollHeight - previousScrollHeight
    restoreScrollRef.current = null
  }, [isLoadingOlderHistory, messages.length])

  const handleHistoryScroll = (event) => {
    const viewport = event.currentTarget
    if (!hasMoreHistory || isLoadingHistory || isLoadingOlderHistory || viewport.scrollTop > 48) return

    restoreScrollRef.current = viewport.scrollHeight
    onLoadOlderMessages?.()
  }

  return (
    <section className={`chat-panel ${isMobileChatView ? 'mobile-active' : ''} grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-[var(--panel-bg)] shadow-[var(--shadow-panel)] backdrop-blur`}>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--border-soft)] px-4 py-4 md:px-5">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] md:hidden"
          aria-label="채팅 목록으로 이동"
          onClick={onBack}
        >
          ←
        </button>

        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {activeRoom?.name || '채팅방을 선택해 주세요'}
          </h3>
          <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
            {joinedRoomId ? `방 ID: ${joinedRoomId}` : '좌측 패널에서 채팅방을 선택하면 대화를 시작할 수 있다.'}
          </p>
        </div>

        <ParticipantsMenu {...participantsProps} />
      </div>

      <div
        ref={historyViewportRef}
        className="min-h-0 overflow-auto bg-[linear-gradient(180deg,var(--panel-soft)_0%,transparent_100%)] px-4 py-4 md:px-5"
        onScroll={handleHistoryScroll}
      >
        {errorMessage && <p className="mb-3 text-sm text-rose-300">오류: {errorMessage}</p>}
        {historyError && <p className="mb-3 text-sm text-amber-300">{historyError}</p>}

        {messages.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">표시할 메시지가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((msg, idx) => {
              const isMine = currentUserId && msg.senderId === currentUserId
              if (msg.type === 'system') {
                return (
                  <li key={msg.id || `${msg.timestamp}-${idx}`} className="mx-auto max-w-[88%] text-center">
                    <p className="inline-flex rounded-full border border-[var(--border-soft)] bg-[var(--system-pill-bg)] px-4 py-2 text-xs font-semibold text-[var(--system-pill-text)]">
                      {msg.text}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </li>
                )
              }

              return (
                <li key={msg.id || `${msg.timestamp}-${idx}`} className={`max-w-[78%] ${isMine ? 'self-end text-right' : 'self-start text-left'}`}>
                  <p className="mb-1 text-[11px] text-[var(--text-secondary)]">{msg.senderNickname}</p>
                  <div className={`inline-flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {isMine && Number(msg.unreadCount) > 0 && (
                      <span className="shrink-0 text-[11px] font-semibold text-brand-accent">{msg.unreadCount > 99 ? '99+' : msg.unreadCount}</span>
                    )}
                    <p
                      className={`whitespace-pre-wrap break-words rounded-[22px] px-4 py-3 text-sm leading-6 shadow-[0_10px_24px_rgba(0,0,0,0.12)] ${isMine ? 'border border-brand-primary/25' : 'border border-[var(--border-soft)]'}`}
                      style={{
                        background: isMine ? 'var(--bubble-mine-bg)' : 'var(--bubble-other-bg)',
                        color: isMine ? 'var(--bubble-mine-text)' : 'var(--bubble-other-text)',
                      }}
                    >
                      {msg.text}
                    </p>
                    {!isMine && Number(msg.unreadCount) > 0 && (
                      <span className="shrink-0 text-[11px] font-semibold text-brand-accent">{msg.unreadCount > 99 ? '99+' : msg.unreadCount}</span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
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

      <div className="grid grid-cols-[1fr_auto] gap-3 border-t border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-4 md:px-5">
        <input
          className="h-12 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-brand-primary/40 focus:bg-[var(--panel-bg)]"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyUp={onComposerKeyUp}
          placeholder={joinedRoomId ? '메시지를 입력해 주세요' : '먼저 채팅방에 입장해 주세요'}
          disabled={!joinedRoomId}
        />
        <button
          type="button"
          className="h-12 rounded-2xl border border-brand-primary/25 bg-[var(--cta-bg)] px-5 text-sm font-semibold text-[var(--cta-text)] shadow-[var(--shadow-glow)] transition hover:brightness-105 disabled:border-[var(--border-soft)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-secondary)] disabled:shadow-none"
          onClick={onSendMessage}
          disabled={!canSend}
        >
          전송
        </button>
      </div>
    </section>
  )
}

export default ChatPanel
