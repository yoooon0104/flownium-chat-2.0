import { useCallback, useState } from 'react'

const resolveErrorMessage = (body, fallback) => {
  if (body?.error?.message) return String(body.error.message)
  if (typeof body?.error === 'string') return body.error
  return fallback
}

// 알림 목록과 읽지 않은 개수를 관리한다.
// 이번 브랜치에서는 친구 요청/방 초대 알림을 상단 벨 메뉴에서 보여주는 용도다.
export const useNotifications = ({ chatApi }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationErrorMessage, setNotificationErrorMessage] = useState('')

  const fetchNotifications = useCallback(async () => {
    if (!chatApi) return

    setNotificationsLoading(true)
    const { ok, body } = await chatApi.getNotifications()
    if (!ok) {
      setNotificationErrorMessage(resolveErrorMessage(body, '알림 목록을 불러오지 못했습니다.'))
      setNotificationsLoading(false)
      return
    }

    setNotifications(Array.isArray(body?.notifications) ? body.notifications : [])
    setUnreadCount(Number(body?.unreadCount) || 0)
    setNotificationErrorMessage('')
    setNotificationsLoading(false)
  }, [chatApi])

  const markNotificationRead = useCallback(async (notificationId) => {
    if (!chatApi || !notificationId) return { ok: false }

    const { ok, body } = await chatApi.markNotificationRead(notificationId)
    if (!ok) {
      setNotificationErrorMessage(resolveErrorMessage(body, '알림 읽음 처리에 실패했습니다.'))
      return { ok: false, body }
    }

    await fetchNotifications()
    return { ok: true, body }
  }, [chatApi, fetchNotifications])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
    setNotificationsLoading(false)
    setNotificationErrorMessage('')
  }, [])

  return {
    notifications,
    unreadCount,
    notificationsLoading,
    notificationErrorMessage,
    fetchNotifications,
    markNotificationRead,
    clearNotifications,
  }
}