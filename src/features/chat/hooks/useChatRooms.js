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

  // 목록 재조회는 방 이름/최근 메시지뿐 아니라 unreadCount와 totalUnreadCount를 같이 갱신하는 역할을 한다.
  const fetchRooms = useCallback(async () => {
    if (!chatApi) return

    const shouldShowBlockingLoading = rooms.length === 0
    if (shouldShowBlockingLoading) {
      setRoomsLoading(true)
    }

    const { ok, body } = await chatApi.getRooms()
    if (!ok) {
      setErrorMessage(resolveErrorMessage(body, '채팅방 목록을 불러오지 못했습니다.'))
      setRoomsLoading(false)
      return
    }

    setRooms(Array.isArray(body?.rooms) ? body.rooms : [])
    setTotalUnreadCount(Number(body?.totalUnreadCount) || 0)
    setRoomsLoading(false)
  }, [chatApi, rooms.length])

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

  const inviteToRoom = useCallback(async (roomId, userIds) => {
    if (!chatApi || !roomId) return { ok: false, roomId: '' }

    const { ok, body } = await chatApi.inviteToRoom(roomId, userIds)
    if (!ok) {
      setErrorMessage(resolveErrorMessage(body, '채팅방 초대에 실패했습니다.'))
      return { ok: false, roomId: '' }
    }

    const nextRoomId = String(body?.room?.id || roomId)
    await fetchRooms()
    return { ok: true, roomId: nextRoomId, createdNewRoom: Boolean(body?.createdNewRoom) }
  }, [chatApi, fetchRooms])

  const leaveRoom = useCallback(async (roomId) => {
    if (!chatApi || !roomId) return { ok: false, deleted: false }

    const { ok, body } = await chatApi.leaveRoom(roomId)
    if (!ok) {
      setErrorMessage(resolveErrorMessage(body, '채팅방 나가기에 실패했습니다.'))
      return { ok: false, deleted: false }
    }

    await fetchRooms()
    return { ok: true, deleted: Boolean(body?.deleted), roomId: String(body?.roomId || roomId) }
  }, [chatApi, fetchRooms])

  // 사용자가 방에 진입했거나 현재 열려 있는 방에서 새 메시지를 확인한 시점에 호출한다.
  // 서버에 읽음 상태를 기록한 뒤 방 목록을 다시 받아와 배지를 즉시 줄인다.
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
    inviteToRoom,
    leaveRoom,
    markRoomRead,
    clearRooms,
  }
}

