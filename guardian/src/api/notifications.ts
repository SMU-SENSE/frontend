import { apiConfig, apiRequest } from './client'

export interface GuardianNotification {
  id: number
  aacUserId: number
  aacUserName: string
  message: string
  read: boolean
  createdAt: string
}

interface BackendAlert {
  id: number
  type: string
  title: string
  message: string
  occurredAt: string
  acknowledgedAt: string | null
}

const MOCK_STORAGE_KEY = 'malmoa-mock-notifications'

const mockSeed: GuardianNotification[] = [
  { id: 3, aacUserId: 1, aacUserName: '민준', message: '긴급 상징 "도와주세요"을 사용했습니다.', read: false, createdAt: '2026-09-16T13:32:00.000Z' },
  { id: 2, aacUserId: 1, aacUserName: '민준', message: '안심존을 벗어났습니다.', read: false, createdAt: '2026-09-15T09:18:00.000Z' },
]

function readMockNotifications(): GuardianNotification[] {
  if (typeof window === 'undefined') return mockSeed.map((item) => ({ ...item }))
  const raw = window.localStorage.getItem(MOCK_STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockSeed))
    return mockSeed.map((item) => ({ ...item }))
  }
  try { return JSON.parse(raw) as GuardianNotification[] } catch { return mockSeed.map((item) => ({ ...item })) }
}

function writeMockNotifications(value: GuardianNotification[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(value))
}

export const notificationsApi = {
  async list(userId: number, userName = '사용자'): Promise<GuardianNotification[]> {
    if (apiConfig.useMockApi) return readMockNotifications().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - 30)
    const alerts = await apiRequest<BackendAlert[]>(`/api/v1/me/aac-users/${userId}/alerts?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`)
    return alerts.map((alert) => ({
      id: alert.id,
      aacUserId: userId,
      aacUserName: userName,
      message: alert.title ? `${alert.title} · ${alert.message}` : alert.message,
      read: Boolean(alert.acknowledgedAt),
      createdAt: alert.occurredAt,
    }))
  },

  async markRead(userId: number, id: number): Promise<void> {
    if (apiConfig.useMockApi) {
      writeMockNotifications(readMockNotifications().map((item) => item.id === id ? { ...item, read: true } : item))
      return
    }
    await apiRequest<void>(`/api/v1/me/aac-users/${userId}/alerts/${id}/acknowledge`, { method: 'POST' })
  },
}
