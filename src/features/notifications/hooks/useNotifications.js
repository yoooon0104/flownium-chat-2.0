import { useCallback, useState } from 'react'

const resolveErrorMessage = (body, fallback) => {
  if (body?.error?.message) return String(body.error.message)
  if (typeof body?.error === 'string') return body.error
  return fallback
}

// 알림 목록과 읽지 않은 개수를 관리한다.
// 현재 단계에서는 알림 허브를 열람하면 최근 알림을 자동 읽음 처리한다.
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

    const nextNotifications = (Array.isArray(body?.notifications) ? body.notifications : []).filter(
      (item) => String(item?.type || '').trim() !== 'room_invite'
    )
    setNotifications(nextNotifications)
    setUnreadCount(nextNotifications.filter((item) => !item?.isRead).length)
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

    return { ok: true, body }
  }, [chatApi])

  const markAllNotificationsRead = useCallback(async () => {
    if (!chatApi) return { ok: false }

    const unreadNotifications = notifications.filter((item) => !item.isRead)
    if (unreadNotifications.length === 0) return { ok: true, body: null }

    for (const item of unreadNotifications) {
      const { ok, body } = await chatApi.markNotificationRead(item.id)
      if (!ok) {
        setNotificationErrorMessage(resolveErrorMessage(body, '알림 읽음 처리에 실패했습니다.'))
        return { ok: false, body }
      }
    }

    await fetchNotifications()
    return { ok: true, body: null }
  }, [chatApi, fetchNotifications, notifications])

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
    markAllNotificationsRead,
    clearNotifications,
  }
}
