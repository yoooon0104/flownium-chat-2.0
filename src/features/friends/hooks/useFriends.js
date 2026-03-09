import { useCallback, useState } from 'react'

const resolveErrorMessage = (body, fallback) => {
  if (body?.error?.message) return String(body.error.message)
  if (typeof body?.error === 'string') return body.error
  return fallback
}

// 친구 목록, 친구 검색, 친구 요청/응답 상태를 한곳에서 관리한다.
// Friends 화면은 accepted 목록만 바로 보여주고, pending 상태는 알림 허브에서 처리한다.
export const useFriends = ({ chatApi }) => {
  const [acceptedFriends, setAcceptedFriends] = useState([])
  const [pendingReceived, setPendingReceived] = useState([])
  const [pendingSent, setPendingSent] = useState([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendSearchResults, setFriendSearchResults] = useState([])
  const [friendSearchLoading, setFriendSearchLoading] = useState(false)
  const [friendErrorMessage, setFriendErrorMessage] = useState('')
  const [lastFriendKeyword, setLastFriendKeyword] = useState('')

  const fetchFriends = useCallback(async () => {
    if (!chatApi) return

    setFriendsLoading(true)
    const { ok, body } = await chatApi.getFriends()
    if (!ok) {
      setFriendErrorMessage(resolveErrorMessage(body, '친구 목록을 불러오지 못했습니다.'))
      setFriendsLoading(false)
      return
    }

    setAcceptedFriends(Array.isArray(body?.accepted) ? body.accepted : [])
    setPendingReceived(Array.isArray(body?.pendingReceived) ? body.pendingReceived : [])
    setPendingSent(Array.isArray(body?.pendingSent) ? body.pendingSent : [])
    setFriendErrorMessage('')
    setFriendsLoading(false)
  }, [chatApi])

  const searchFriends = useCallback(async (keyword) => {
    const normalized = String(keyword || '').trim()
    setLastFriendKeyword(normalized)

    if (!chatApi) return { ok: false, results: [] }

    if (!normalized) {
      setFriendSearchResults([])
      setFriendSearchLoading(false)
      return { ok: true, results: [] }
    }

    setFriendSearchLoading(true)
    const { ok, body } = await chatApi.searchFriends(normalized)
    if (!ok) {
      setFriendErrorMessage(resolveErrorMessage(body, '친구 검색에 실패했습니다.'))
      setFriendSearchLoading(false)
      return { ok: false, results: [] }
    }

    const results = Array.isArray(body?.results) ? body.results : []
    setFriendSearchResults(results)
    setFriendErrorMessage('')
    setFriendSearchLoading(false)
    return { ok: true, results }
  }, [chatApi])

  const requestFriend = useCallback(async (targetUserId) => {
    if (!chatApi) return { ok: false }

    const { ok, body } = await chatApi.requestFriend(targetUserId)
    if (!ok) {
      setFriendErrorMessage(resolveErrorMessage(body, '친구 요청에 실패했습니다.'))
      return { ok: false, body }
    }

    await fetchFriends()
    if (lastFriendKeyword) {
      await searchFriends(lastFriendKeyword)
    }
    setFriendErrorMessage('')
    return { ok: true, body }
  }, [chatApi, fetchFriends, lastFriendKeyword, searchFriends])

  const respondToFriendRequest = useCallback(async (requestId, action) => {
    if (!chatApi) return { ok: false }

    const { ok, body } = await chatApi.respondFriendRequest(requestId, action)
    if (!ok) {
      setFriendErrorMessage(resolveErrorMessage(body, '친구 요청 처리에 실패했습니다.'))
      return { ok: false, body }
    }

    await fetchFriends()
    setFriendErrorMessage('')
    return { ok: true, body }
  }, [chatApi, fetchFriends])

  const clearFriends = useCallback(() => {
    setAcceptedFriends([])
    setPendingReceived([])
    setPendingSent([])
    setFriendsLoading(false)
    setFriendSearchResults([])
    setFriendSearchLoading(false)
    setFriendErrorMessage('')
    setLastFriendKeyword('')
  }, [])

  return {
    acceptedFriends,
    pendingReceived,
    pendingSent,
    friendsLoading,
    friendSearchResults,
    friendSearchLoading,
    friendErrorMessage,
    setFriendErrorMessage,
    fetchFriends,
    searchFriends,
    requestFriend,
    respondToFriendRequest,
    clearFriends,
  }
}
