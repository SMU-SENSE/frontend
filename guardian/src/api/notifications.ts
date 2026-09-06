import { apiConfig, apiRequest } from './client'

export interface GuardianNotification {
  id: number
  aacUserId: number
  aacUserName: string
  message: string
  read: boolean
  createdAt: string
}

const MOCK_STORAGE_KEY = 'malmoa-mock-notifications'

const mockSeed: GuardianNotification[] = [
  {
    id: 3,
    aacUserId: 1,
    aacUserName: '민준',
    message: '민준님이 긴급 상징 "도와주세요"을(를) 사용했습니다.',
    read: false,
    createdAt: '2026-09-06T13:32:00.000Z',
  },
  {
    id: 2,
    aacUserId: 1,
    aacUserName: '민준',
    message: '민준님이 긴급 상징 "아파요"을(를) 사용했습니다.',
    read: false,
    createdAt: '2026-09-05T09:18:00.000Z',
  },
  {
    id: 1,
    aacUserId: 1,
    aacUserName: '민준',
    message: '민준님이 긴급 상징 "도와주세요"을(를) 사용했습니다.',
    read: true,
    createdAt: '2026-09-03T04:10:00.000Z',
  },
]

function readMockNotifications(): GuardianNotification[] {
  if (typeof window === 'undefined') return mockSeed.map((item) => ({ ...item }))

  const raw = window.localStorage.getItem(MOCK_STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockSeed))
    return mockSeed.map((item) => ({ ...item }))
  }

  try {
    return JSON.parse(raw) as GuardianNotification[]
  } catch {
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockSeed))
    return mockSeed.map((item) => ({ ...item }))
  }
}

function writeMockNotifications(notifications: GuardianNotification[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(notifications))
}

async function listMockNotifications() {
  await new Promise((resolve) => setTimeout(resolve, 180))
  return readMockNotifications().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function markMockNotificationRead(id: number) {
  await new Promise((resolve) => setTimeout(resolve, 120))
  const notifications = readMockNotifications().map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  )
  writeMockNotifications(notifications)
}

export const notificationsApi = {
  list(): Promise<GuardianNotification[]> {
    if (apiConfig.useMockApi) return listMockNotifications()
    return apiRequest<GuardianNotification[]>('/api/v1/me/notifications')
  },

  async markRead(id: number): Promise<void> {
    if (apiConfig.useMockApi) {
      await markMockNotificationRead(id)
      return
    }
    await apiRequest<void>(`/api/v1/me/notifications/${id}/read`, { method: 'PATCH' })
  },

  async registerPushToken(token: string): Promise<void> {
    if (apiConfig.useMockApi) return
    await apiRequest<void>('/api/v1/me/push-token', {
      method: 'POST',
      body: { token },
    })
  },
}
