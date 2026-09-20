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

export const notificationsApi = {
  async list(userId: number, userName = '사용자'): Promise<GuardianNotification[]> {
    if (apiConfig.useMockApi) return [] // No paired user or real alert stream in browser-only demo.
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
    if (apiConfig.useMockApi) return
    await apiRequest<void>(`/api/v1/me/aac-users/${userId}/alerts/${id}/acknowledge`, { method: 'POST' })
  },
}
