import { useCallback, useMemo, useState } from 'react'

const resolveErrorMessage = (body, fallback) => {
  if (body?.error?.message) return String(body.error.message)
  if (typeof body?.error === 'string') return body.error
  return fallback
}

// 방 목록 상태와 채팅방 생성 흐름을 관리한다.
// 이번 브랜치부터는 기존 문자열 기반 생성과 친구 선택 기반 생성이 함께 들어오기 때문에
// createRoom이 payload 형태를 유연하게 받도록 확장한다.
export const useChatRooms = ({ chatApi }) => {
  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const fetchRooms = useCallback(async () => {
    if (!chatApi) return

    setRoomsLoading(true)
    const { ok, body } = await chatApi.getRooms()
    if (!ok) {
      setErrorMessage(resolveErrorMessage(body, '채팅방 목록을 불러오지 못했습니다.'))
      setRoomsLoading(false)
      return
    }

    setRooms(Array.isArray(body?.rooms) ? body.rooms : [])
    setRoomsLoading(false)
  }, [chatApi])

  // payload가 문자열이면 기존 name 기반 생성으로, 객체면 새 친구 선택 기반 생성으로 보낸다.
  const createRoom = useCallback(async (payload) => {
    if (!chatApi) return { ok: false, roomId: '' }

    const normalized = typeof payload === 'string' ? { name: String(payload || '').trim() } : payload
    const { ok, body } = await chatApi.createRoom(normalized)
    if (!ok) {
      setErrorMessage(resolveErrorMessage(body, '채팅방 생성에 실패했습니다.'))
      return { ok: false, roomId: '' }
    }

    const roomId = String(body?.room?.id || '')
    await fetchRooms()
    return { ok: true, roomId, reused: Boolean(body?.reused) }
  }, [chatApi, fetchRooms])

  const clearRooms = useCallback(() => {
    setRooms([])
    setSearchKeyword('')
    setRoomsLoading(false)
  }, [])

  const filteredRooms = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) return rooms

    // 전역 검색창에서 방 탭이 사용할 결과다.
    // 방 이름과 마지막 메시지를 함께 검색 대상으로 둔다.
    return rooms.filter((room) => {
      const roomName = String(room.name || '').toLowerCase()
      const lastMessage = String(room.lastMessage || '').toLowerCase()
      return roomName.includes(keyword) || lastMessage.includes(keyword)
    })
  }, [rooms, searchKeyword])

  return {
    rooms,
    roomsLoading,
    searchKeyword,
    setSearchKeyword,
    errorMessage,
    setErrorMessage,
    filteredRooms,
    fetchRooms,
    createRoom,
    clearRooms,
  }
}