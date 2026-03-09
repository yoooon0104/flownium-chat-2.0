import { useCallback, useMemo, useState } from 'react'

const resolveErrorMessage = (body, fallback) => {
  if (body?.error?.message) return String(body.error.message)
  if (typeof body?.error === 'string') return body.error
  return fallback
}

// 방 목록 상태와 채팅방 생성 흐름을 관리한다.
// unread count는 방 목록 응답과 함께 받아 각 방 배지와 전체 합계에 재사용한다.
export const useChatRooms = ({ chatApi }) => {
  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)

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
    setTotalUnreadCount(Number(body?.totalUnreadCount) || 0)
    setRoomsLoading(false)
  }, [chatApi])

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

  const markRoomRead = useCallback(async (roomId) => {
    if (!chatApi || !roomId) return { ok: false }

    const { ok, body } = await chatApi.markRoomRead(roomId)
    if (!ok) {
      setErrorMessage(resolveErrorMessage(body, '읽음 상태를 갱신하지 못했습니다.'))
      return { ok: false, body }
    }

    await fetchRooms()
    return { ok: true, body }
  }, [chatApi, fetchRooms])

  const clearRooms = useCallback(() => {
    setRooms([])
    setSearchKeyword('')
    setRoomsLoading(false)
    setTotalUnreadCount(0)
  }, [])

  const filteredRooms = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) return rooms

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
    totalUnreadCount,
    fetchRooms,
    createRoom,
    markRoomRead,
    clearRooms,
  }
}
