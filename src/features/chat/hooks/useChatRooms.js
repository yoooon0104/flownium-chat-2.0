import { useCallback, useMemo, useState } from 'react'

const resolveErrorMessage = (body, fallback) => {
  if (body?.error?.message) return String(body.error.message)
  if (typeof body?.error === 'string') return body.error
  return fallback
}

// 방 목록 조회/검색/생성 책임을 하나의 훅으로 분리한다.
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

  const createRoom = useCallback(async (roomName) => {
    const normalized = String(roomName || '').trim()
    if (!normalized || !chatApi) return { ok: false, roomId: '' }

    const { ok, body } = await chatApi.createRoom(normalized)
    if (!ok) {
      setErrorMessage(resolveErrorMessage(body, 'Failed to create chat room.'))
      return { ok: false, roomId: '' }
    }

    const roomId = String(body?.room?.id || '')
    await fetchRooms()
    return { ok: true, roomId }
  }, [chatApi, fetchRooms])

  const clearRooms = useCallback(() => {
    setRooms([])
    setSearchKeyword('')
    setRoomsLoading(false)
  }, [])

  const filteredRooms = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) return rooms

    // 검색은 방 이름과 마지막 메시지를 동시에 기준으로 한다.
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
