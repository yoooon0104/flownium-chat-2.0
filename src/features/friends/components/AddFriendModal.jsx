import { useEffect, useState } from 'react'

// 친구 추가 모달은 사용자 검색과 친구 요청 전송만 담당한다.
// 검색 키워드는 이메일 기준으로 서버 검색과 연결한다.
function AddFriendModal({ isOpen, isLoading, results, errorMessage, onSearch, onRequestFriend, onClose }) {
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setKeyword('')
      return
    }

    const timeoutId = window.setTimeout(() => {
      void onSearch(keyword)
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isOpen, keyword, onSearch])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const renderActionLabel = (friendship) => {
    if (!friendship) return '친구 요청'
    if (friendship.status === 'accepted') return '친구'
    if (friendship.status === 'pending') return '대기 중'
    if (friendship.status === 'blocked') return '차단됨'
    if (friendship.status === 'rejected') return '다시 요청'
    return '친구 요청'
  }

  const isActionDisabled = (friendship) => (
    friendship?.status === 'accepted' || friendship?.status === 'pending' || friendship?.status === 'blocked'
  )

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section className="modal-card friend-modal" role="dialog" aria-modal="true" aria-label="친구 추가">
        <h3>친구 추가</h3>
        <p>이메일로 사용자를 검색한다.</p>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="이메일 검색"
        />

        {errorMessage && <p className="error-text modal-error">{errorMessage}</p>}
        {isLoading && <p className="muted-text modal-hint">검색 중...</p>}
        {!isLoading && keyword.trim() && results.length === 0 && <p className="muted-text modal-hint">검색 결과가 없습니다.</p>}

        <ul className="friend-search-list">
          {results.map((item) => (
            <li key={item.user.id} className="friend-search-row">
              <span className="friend-avatar">
                {item.user.profileImage ? <img src={item.user.profileImage} alt="" /> : item.user.nickname.slice(0, 1).toUpperCase()}
              </span>
              <span className="friend-main">
                <strong>{item.user.nickname || '이름 없음'}</strong>
                <small>{item.user.email || '이메일 미등록'}</small>
              </span>
              <button
                type="button"
                className="secondary inline-action-button"
                disabled={isActionDisabled(item.friendship)}
                onClick={() => void onRequestFriend(item.user.id)}
              >
                {renderActionLabel(item.friendship)}
              </button>
            </li>
          ))}
        </ul>

        <div className="modal-actions single-column-actions">
          <button type="button" className="secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </section>
    </div>
  )
}

export default AddFriendModal
