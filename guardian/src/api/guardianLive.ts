import { apiConfig, apiRawRequest, apiRequest } from './client'
import type { BackendGridSize, Category, Sentence } from '../types/models'

export type LiveId = string | number
export type LiveStatus = 'STABLE' | 'EMERGENCY'

export interface LiveBoardCategory {
  id: LiveId
  name: string
  color: string
  displayOrder: number
}

export interface LiveBoardCard {
  id: LiveId
  categoryId: LiveId
  text: string
  imageUrl: string | null
  ttsText: string | null
  emergency: boolean
  favorite: boolean
  displayOrder: number
}

export interface LiveBoard {
  aacUserId: number
  version: number
  gridSize: BackendGridSize
  status: LiveStatus
  categories: LiveBoardCategory[]
  cards: LiveBoardCard[]
}

export interface PairingResponse {
  pairingId: number
  qrPayload: string
  inviteCode: string
  expiresAt: string
  remainingSeconds: number
}

export interface CurrentPairingResponse {
  pairingId: number
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED'
  expiresAt: string
  remainingSeconds: number
}

export interface DeviceResponse {
  id: number
  deviceId: string
  deviceName: string | null
  deviceType: 'TABLET' | 'MOBILE' | 'WEB' | 'UNKNOWN'
  status: string
  pairedAt: string
  lastSeenAt: string | null
}

export interface LiveRoutine {
  id: LiveId
  title: string
  message: string
  timeOfDay: string
  daysOfWeek: string[]
  timezone: string
  enabled: boolean
  lastTriggeredDate?: string | null
}

export interface LivePlace {
  id: LiveId
  name: string
  placeType: 'HOME' | 'SCHOOL' | 'HOSPITAL' | 'THERAPY' | 'OTHER' | string
  address: string
  latitude: number
  longitude: number
  radiusMeters: number
  activeFrom: string
  activeTo: string
}

export interface LiveLocation {
  id: LiveId
  latitude: number
  longitude: number
  accuracyMeters: number | null
  recordedAt: string
  outsidePlaceIds: number[]
}

export interface ReportCountItem { id: LiveId; name: string; count: number }
export interface ReportShareItem { id: LiveId; name: string; count: number; percent: number }
export interface ReportSensorItem { type: string; value: number | null; label: string | null; recordedAt: string }
export interface LiveReport {
  aacUserId: number
  from: string
  to: string
  totalCardActions: number
  emergencyCount: number
  topCards: ReportCountItem[]
  categoryShares: ReportShareItem[]
  sensors: ReportSensorItem[]
  insights: string[]
}

const pairingKey = (userId: number) => `malmoa-live-pairing-${userId}`
const routineKey = (userId: number) => `malmoa-live-routines-${userId}`
const placeKey = (userId: number) => `malmoa-live-places-${userId}`
const latestLocationKey = (userId: number) => `malmoa-live-location-${userId}`

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key: string, value: unknown) {
  if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value))
}

async function mockBoard(userId: number): Promise<LiveBoard> {
  const [categories, sentences] = await Promise.all([
    apiRequest<Category[]>('/api/v1/categories'),
    apiRequest<Sentence[]>('/api/v1/sentences?type=all'),
  ])
  return {
    aacUserId: userId,
    version: Date.now(),
    gridSize: 'GRID_4X4',
    status: 'STABLE',
    categories: categories.map((item) => ({
      id: item.id,
      name: item.name,
      color: item.color,
      displayOrder: item.order,
    })),
    cards: sentences.map((item, index) => ({
      id: item.id,
      categoryId: item.categoryId ?? categories[0]?.id ?? 'uncategorized',
      text: item.content,
      imageUrl: item.imageUrl ?? null,
      ttsText: item.content,
      emergency: item.categoryName === '긴급어',
      favorite: item.favorite,
      displayOrder: index,
    })),
  }
}

function mockPairing(userId: number, refresh = false): PairingResponse {
  const existing = readLocal<PairingResponse | null>(pairingKey(userId), null)
  if (!refresh && existing && new Date(existing.expiresAt).getTime() > Date.now()) return existing
  const inviteCode = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
  const next: PairingResponse = {
    pairingId: Date.now(),
    qrPayload: `malmoa://pair?token=${token}`,
    inviteCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    remainingSeconds: 600,
  }
  writeLocal(pairingKey(userId), next)
  return next
}

function defaultRoutines(): LiveRoutine[] {
  return [
    { id: 'school', title: '등교 준비', message: '등교 준비 — 학교 상징 우선', timeOfDay: '08:00:00', daysOfWeek: ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'], timezone: 'Asia/Seoul', enabled: true },
    { id: 'medicine', title: '점심 약', message: '점심 약 복용 알림 팝업', timeOfDay: '12:30:00', daysOfWeek: ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'], timezone: 'Asia/Seoul', enabled: true },
  ]
}

export const guardianLiveApi = {
  board(userId: number): Promise<LiveBoard> {
    return apiConfig.useMockApi
      ? mockBoard(userId)
      : apiRequest<LiveBoard>(`/api/v1/me/aac-users/${userId}/board`)
  },

  async issuePairing(userId: number): Promise<PairingResponse> {
    const cacheKey = `malmoa-pairing-secret-${userId}`
    if (typeof window !== 'undefined') {
      try {
        const raw = window.sessionStorage.getItem(cacheKey)
        if (raw) {
          const cached = JSON.parse(raw) as PairingResponse
          if (new Date(cached.expiresAt).getTime() > Date.now()) return cached
        }
      } catch {}
    }
    const issued = apiConfig.useMockApi
      ? mockPairing(userId, false)
      : await apiRequest<PairingResponse>(`/api/v1/me/aac-users/${userId}/device-pairings`, { method: 'POST' })
    if (typeof window !== 'undefined') window.sessionStorage.setItem(cacheKey, JSON.stringify(issued))
    return issued
  },

  async refreshPairing(userId: number): Promise<PairingResponse> {
    const refreshed = apiConfig.useMockApi
      ? mockPairing(userId, true)
      : await apiRequest<PairingResponse>(`/api/v1/me/aac-users/${userId}/device-pairings/refresh`, { method: 'POST' })
    if (typeof window !== 'undefined') window.sessionStorage.setItem(`malmoa-pairing-secret-${userId}`, JSON.stringify(refreshed))
    return refreshed
  },

  currentPairing(userId: number): Promise<CurrentPairingResponse> {
    if (apiConfig.useMockApi) {
      const pairing = readLocal<PairingResponse | null>(pairingKey(userId), null)
      if (!pairing) return Promise.reject(new Error('활성 기기 연결 세션이 없습니다.'))
      const remainingSeconds = Math.max(0, Math.floor((new Date(pairing.expiresAt).getTime() - Date.now()) / 1000))
      return Promise.resolve({ pairingId: pairing.pairingId, status: remainingSeconds > 0 ? 'ACTIVE' : 'EXPIRED', expiresAt: pairing.expiresAt, remainingSeconds })
    }
    return apiRequest<CurrentPairingResponse>(`/api/v1/me/aac-users/${userId}/device-pairings/current`)
  },

  devices(userId: number): Promise<DeviceResponse[]> {
    return apiConfig.useMockApi
      ? Promise.resolve([])
      : apiRequest<DeviceResponse[]>(`/api/v1/me/aac-users/${userId}/devices`)
  },

  revokeDevice(userId: number, deviceId: number) {
    return apiRequest<void>(`/api/v1/me/aac-users/${userId}/devices/${deviceId}`, { method: 'DELETE' })
  },

  createCategory(userId: number, input: { name: string; color: string; displayOrder: number }) {
    if (apiConfig.useMockApi) {
      return apiRequest<Category>('/api/v1/categories', { method: 'POST', body: { name: input.name, color: input.color } })
    }
    return apiRequest<LiveBoardCategory>(`/api/v1/me/aac-users/${userId}/board/categories`, { method: 'POST', body: input })
  },

  updateCategory(userId: number, categoryId: LiveId, input: Partial<{ name: string; color: string; displayOrder: number }>) {
    if (apiConfig.useMockApi) {
      return apiRequest<Category>(`/api/v1/categories/${categoryId}`, { method: 'PATCH', body: { name: input.name, color: input.color, order: input.displayOrder } })
    }
    return apiRequest<LiveBoardCategory>(`/api/v1/me/aac-users/${userId}/board/categories/${categoryId}`, { method: 'PATCH', body: input })
  },

  deleteCategory(userId: number, categoryId: LiveId) {
    return apiConfig.useMockApi
      ? apiRequest<void>(`/api/v1/categories/${categoryId}`, { method: 'DELETE' })
      : apiRequest<void>(`/api/v1/me/aac-users/${userId}/board/categories/${categoryId}`, { method: 'DELETE' })
  },

  createCard(userId: number, input: { categoryId: LiveId; text: string; imageUrl?: string | null; ttsText?: string | null; emergency?: boolean; displayOrder: number }) {
    if (apiConfig.useMockApi) {
      return apiRequest<Sentence>('/api/v1/sentences', {
        method: 'POST',
        body: { content: input.text, categoryId: String(input.categoryId), favorite: false, imageUrl: input.imageUrl ?? null },
      })
    }
    return apiRequest<LiveBoardCard>(`/api/v1/me/aac-users/${userId}/board/cards`, { method: 'POST', body: input })
  },

  updateCard(userId: number, cardId: LiveId, input: Partial<{ categoryId: LiveId; text: string; imageUrl: string | null; ttsText: string | null; emergency: boolean; displayOrder: number }>) {
    if (apiConfig.useMockApi) {
      return apiRequest<Sentence>(`/api/v1/sentences/${cardId}`, {
        method: 'PATCH',
        body: { content: input.text, categoryId: input.categoryId ? String(input.categoryId) : undefined, imageUrl: input.imageUrl },
      })
    }
    return apiRequest<LiveBoardCard>(`/api/v1/me/aac-users/${userId}/board/cards/${cardId}`, { method: 'PATCH', body: input })
  },

  setFavorite(userId: number, cardId: LiveId, favorite: boolean) {
    return apiConfig.useMockApi
      ? apiRequest<Sentence>(`/api/v1/sentences/${cardId}/favorite`, { method: 'PATCH', body: { favorite } })
      : apiRequest<LiveBoardCard>(`/api/v1/me/aac-users/${userId}/board/cards/${cardId}/favorite`, { method: 'PATCH', body: { favorite } })
  },

  deleteCard(userId: number, cardId: LiveId) {
    return apiConfig.useMockApi
      ? apiRequest<void>(`/api/v1/sentences/${cardId}`, { method: 'DELETE' })
      : apiRequest<void>(`/api/v1/me/aac-users/${userId}/board/cards/${cardId}`, { method: 'DELETE' })
  },

  sentenceLevel(userId: number, level: 1 | 2 | 3 | 4) {
    if (apiConfig.useMockApi) return Promise.resolve({ level })
    return apiRequest<unknown>(`/api/v1/me/aac-users/${userId}/sentence-level`, { method: 'PATCH', body: { level } })
  },

  status(userId: number, status: LiveStatus) {
    if (apiConfig.useMockApi) return Promise.resolve({ status })
    return apiRequest<unknown>(`/api/v1/me/aac-users/${userId}/status`, { method: 'PATCH', body: { status } })
  },

  uploadImage(userId: number, file: File): Promise<{ url: string }> {
    if (apiConfig.useMockApi) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
        reader.onload = () => resolve({ url: String(reader.result ?? '') })
        reader.readAsDataURL(file)
      })
    }
    const form = new FormData()
    form.append('file', file)
    return apiRawRequest<{ url: string }>(`/api/v1/me/aac-users/${userId}/media/images`, { method: 'POST', body: form })
  },

  routines(userId: number): Promise<LiveRoutine[]> {
    if (apiConfig.useMockApi) {
      const current = readLocal<LiveRoutine[]>(routineKey(userId), defaultRoutines())
      return Promise.resolve(current)
    }
    return apiRequest<LiveRoutine[]>(`/api/v1/me/aac-users/${userId}/routines`)
  },

  createRoutine(userId: number, input: Omit<LiveRoutine, 'id'>) {
    if (apiConfig.useMockApi) {
      const next: LiveRoutine = { ...input, id: crypto.randomUUID() }
      const list = readLocal<LiveRoutine[]>(routineKey(userId), defaultRoutines())
      writeLocal(routineKey(userId), [...list, next])
      return Promise.resolve(next)
    }
    return apiRequest<LiveRoutine>(`/api/v1/me/aac-users/${userId}/routines`, { method: 'POST', body: input })
  },

  updateRoutine(userId: number, routineId: LiveId, input: Omit<LiveRoutine, 'id'>) {
    if (apiConfig.useMockApi) {
      const list = readLocal<LiveRoutine[]>(routineKey(userId), defaultRoutines())
      const next = list.map((item) => String(item.id) === String(routineId) ? { ...input, id: routineId } : item)
      writeLocal(routineKey(userId), next)
      return Promise.resolve(next.find((item) => String(item.id) === String(routineId))!)
    }
    return apiRequest<LiveRoutine>(`/api/v1/me/aac-users/${userId}/routines/${routineId}`, { method: 'PUT', body: input })
  },

  deleteRoutine(userId: number, routineId: LiveId) {
    if (apiConfig.useMockApi) {
      const list = readLocal<LiveRoutine[]>(routineKey(userId), defaultRoutines()).filter((item) => String(item.id) !== String(routineId))
      writeLocal(routineKey(userId), list)
      return Promise.resolve()
    }
    return apiRequest<void>(`/api/v1/me/aac-users/${userId}/routines/${routineId}`, { method: 'DELETE' })
  },

  places(userId: number): Promise<LivePlace[]> {
    if (apiConfig.useMockApi) return Promise.resolve(readLocal<LivePlace[]>(placeKey(userId), []))
    return apiRequest<LivePlace[]>(`/api/v1/me/aac-users/${userId}/places`)
  },

  createPlace(userId: number, input: Omit<LivePlace, 'id'>) {
    if (apiConfig.useMockApi) {
      const next: LivePlace = { ...input, id: crypto.randomUUID() }
      const list = readLocal<LivePlace[]>(placeKey(userId), [])
      writeLocal(placeKey(userId), [...list, next])
      return Promise.resolve(next)
    }
    return apiRequest<LivePlace>(`/api/v1/me/aac-users/${userId}/places`, { method: 'POST', body: input })
  },

  deletePlace(userId: number, placeId: LiveId) {
    if (apiConfig.useMockApi) {
      const list = readLocal<LivePlace[]>(placeKey(userId), []).filter((item) => String(item.id) !== String(placeId))
      writeLocal(placeKey(userId), list)
      return Promise.resolve()
    }
    return apiRequest<void>(`/api/v1/me/aac-users/${userId}/places/${placeId}`, { method: 'DELETE' })
  },

  latestLocation(userId: number): Promise<LiveLocation> {
    if (apiConfig.useMockApi) {
      const fallback: LiveLocation = {
        id: 'mock',
        latitude: 37.5665,
        longitude: 126.978,
        accuracyMeters: 30,
        recordedAt: new Date().toISOString(),
        outsidePlaceIds: [],
      }
      const value = readLocal<LiveLocation>(latestLocationKey(userId), fallback)
      return Promise.resolve(value)
    }
    return apiRequest<LiveLocation>(`/api/v1/me/aac-users/${userId}/locations/latest`)
  },

  report(userId: number, from: string, to: string): Promise<LiveReport> {
    if (apiConfig.useMockApi) {
      return mockBoard(userId).then((board) => ({
        aacUserId: userId,
        from,
        to,
        totalCardActions: board.cards.length * 5,
        emergencyCount: board.cards.filter((item) => item.emergency).length,
        topCards: board.cards.slice(0, 5).map((item, index) => ({ id: item.id, name: item.text, count: 12 - index })),
        categoryShares: board.categories.slice(0, 5).map((item, index) => ({ id: item.id, name: item.name, count: 5 - index, percent: 20 })),
        sensors: [],
        insights: board.cards[0] ? [`가장 자주 사용한 카드는 '${board.cards[0].text}'입니다.`] : [],
      }))
    }
    return apiRequest<LiveReport>(`/api/v1/me/aac-users/${userId}/report?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
  },

  async downloadReportPdf(userId: number, from: string, to: string) {
    if (apiConfig.useMockApi) {
      window.print()
      return
    }
    const blob = await apiRawRequest<Blob>(`/api/v1/me/aac-users/${userId}/report/pdf?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
      method: 'GET',
      headers: { Accept: 'application/pdf' },
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'malmoa-report.pdf'
    anchor.click()
    URL.revokeObjectURL(url)
  },
}
