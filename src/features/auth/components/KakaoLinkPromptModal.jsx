function KakaoLinkPromptModal({ isOpen, onConfirm, onDismiss }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onDismiss()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label="카카오 간편로그인 연결 안내">
        <h3>카카오 간편로그인 연결</h3>
        <p>회원가입은 완료됐어요. 원하시면 지금 카카오 계정을 연결해서 다음부터 더 빠르게 로그인할 수 있어요.</p>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onDismiss}>
            나중에
          </button>
          <button type="button" onClick={onConfirm}>
            지금 연결
          </button>
        </div>
      </section>
    </div>
  )
}

export default KakaoLinkPromptModal
