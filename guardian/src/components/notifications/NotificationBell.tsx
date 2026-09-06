'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  type GuardianNotification,
  notificationsApi,
} from '../../api/notifications'
import styles from './NotificationBell.module.css'

const notificationQueryKey = ['guardian-notifications'] as const

function formatCreatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const notifications = useQuery({
    queryKey: notificationQueryKey,
    queryFn: notificationsApi.list,
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: (_, id) => {
      queryClient.setQueryData<GuardianNotification[]>(notificationQueryKey, (current) =>
        current?.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      )
    },
  })

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const items = notifications.data ?? []
  const unreadCount = items.filter((notification) => !notification.read).length

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}개 확인` : '알림 확인'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={20} aria-hidden />
        {unreadCount > 0 ? (
          <span className={styles.badge} aria-hidden>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section className={styles.panel} role="dialog" aria-label="보호자 알림">
          <div className={styles.header}>
            <div>
              <strong>알림</strong>
              <span>{unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '새 알림이 없어요'}</span>
            </div>
          </div>

          {notifications.isLoading ? (
            <div className={styles.state}>
              <LoaderCircle className={styles.spinner} size={20} aria-hidden />
              알림을 불러오는 중이에요
            </div>
          ) : notifications.isError ? (
            <div className={styles.state}>
              <span>알림을 불러오지 못했어요</span>
              <button type="button" onClick={() => notifications.refetch()}>
                다시 시도
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.state}>아직 받은 알림이 없어요</div>
          ) : (
            <div className={styles.list}>
              {items.map((notification) => (
                <button
                  type="button"
                  className={`${styles.item} ${notification.read ? styles.read : styles.unread}`}
                  key={notification.id}
                  disabled={markRead.isPending && markRead.variables === notification.id}
                  onClick={() => {
                    if (!notification.read) markRead.mutate(notification.id)
                  }}
                >
                  <span className={styles.itemIcon} aria-hidden>
                    {notification.read ? <Check size={15} /> : <Bell size={15} />}
                  </span>
                  <span className={styles.itemBody}>
                    <strong>{notification.aacUserName}</strong>
                    <span>{notification.message}</span>
                    <time dateTime={notification.createdAt}>{formatCreatedAt(notification.createdAt)}</time>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
