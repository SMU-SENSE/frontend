import type {
  AiRecommendationRequest,
  AuthSession,
  Category,
  RoutineRecommendation,
  Sentence,
  TransformRequest,
  User,
  UserPreferences,
} from '../types/models'

const STORAGE_KEY = 'malmoa-mock-db'

// 실제 Spring Boot 응답 구조를 그대로 흉내 내는 브라우저 전용 데이터베이스.
// 백엔드가 완성되기 전에도 프론트 화면과 사용자 흐름을 독립적으로 검증할 수 있다.
interface MockDatabase {
  user: User
  password: string
  categories: Category[]
  sentences: Sentence[]
  preferences: UserPreferences
}

interface MockOptions {
  method?: string
  body?: unknown
}

const now = () => new Date().toISOString()
const id = () => crypto.randomUUID()

// 첫 실행 시 제공하는 데모 데이터. 새로고침 후에도 localStorage에 유지된다.
const seed: MockDatabase = {
  user: {
    id: 'user-demo',
    email: 'demo@malmoa.app',
    nickname: '말모아 사용자',
    name: '김동석',
    joinedAt: '2026-03-11T08:37:15.000Z',
  },
  password: 'Malmoa!123',
  categories: [
    { id: 'category-daily', name: '일상', color: '#56a276', order: 0, sentenceCount: 3 },
    { id: 'category-feeling', name: '감정', color: '#f0b65d', order: 1, sentenceCount: 2 },
    { id: 'category-request', name: '요청', color: '#7d79c9', order: 2, sentenceCount: 2 },
  ],
  sentences: [
    {
      id: 'sentence-1',
      content: '안녕하세요',
      categoryId: 'category-daily',
      categoryName: '일상',
      favorite: true,
      source: 'manual',
      useCount: 18,
      lastUsedAt: '2026-07-30T08:30:00.000Z',
      createdAt: '2026-07-01T09:00:00.000Z',
    },
    {
      id: 'sentence-2',
      content: '물 한 잔 주세요',
      categoryId: 'category-request',
      categoryName: '요청',
      favorite: true,
      source: 'manual',
      useCount: 12,
      lastUsedAt: '2026-07-30T07:40:00.000Z',
      createdAt: '2026-07-01T09:10:00.000Z',
    },
    {
      id: 'sentence-3',
      content: '잠시 쉬고 싶어요',
      categoryId: 'category-feeling',
      categoryName: '감정',
      favorite: false,
      source: 'manual',
      useCount: 8,
      lastUsedAt: '2026-07-29T12:10:00.000Z',
      createdAt: '2026-07-03T03:20:00.000Z',
    },
    {
      id: 'sentence-4',
      content: '도와주세요',
      categoryId: 'category-request',
      categoryName: '요청',
      favorite: true,
      source: 'manual',
      useCount: 21,
      lastUsedAt: '2026-07-28T13:10:00.000Z',
      createdAt: '2026-07-04T07:20:00.000Z',
    },
    {
      id: 'sentence-5',
      content: '오늘 기분이 좋아요',
      categoryId: 'category-feeling',
      categoryName: '감정',
      favorite: false,
      source: 'manual',
      useCount: 4,
      lastUsedAt: null,
      createdAt: '2026-07-08T10:00:00.000Z',
    },
  ],
  preferences: {
    gridColumns: 4,
    scanSpeedMs: 1200,
    voiceId: 'ko-KR-default',
    voiceRate: 1,
    voicePitch: 1,
    autoSpeak: true,
  },
}

const clone = <T>(value: T): T => structuredClone(value)

/** 손상된 Mock 데이터가 있어도 앱이 빈 화면으로 멈추지 않도록 초기값으로 복구한다. */
function readDb(): MockDatabase {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return clone(seed)
  }

  try {
    return JSON.parse(raw) as MockDatabase
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return clone(seed)
  }
}

function writeDb(db: MockDatabase) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function ok<T>(data: T): T {
  return clone(data)
}

function fail(status: number, message: string, code = 'MOCK_API_ERROR'): never {
  throw Object.assign(new Error(message), { status, code })
}

function session(user: User): AuthSession {
  return {
    accessToken: `mock-access-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`,
    user,
  }
}

const sleep = (ms = 280) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 최소한의 Mock 라우터.
 * apiRequest가 전달한 path/method/body를 실제 REST API처럼 분기한다.
 * 새 백엔드 API를 추가할 때 실 API 모듈과 이 Mock 분기를 함께 추가하면 된다.
 */
export async function mockRequest<T>(path: string, options: MockOptions = {}): Promise<T> {
  await sleep()
  const db = readDb()
  const method = (options.method ?? 'GET').toUpperCase()
  const body = (options.body ?? {}) as Record<string, unknown>

  // ── 인증 ────────────────────────────────────────────────────────────────
  if (path === '/api/v1/auth/login' && method === 'POST') {
    if (body.email !== db.user.email || body.password !== db.password) {
      fail(401, '이메일 또는 비밀번호를 확인해 주세요.', 'INVALID_CREDENTIALS')
    }
    return ok(session(db.user)) as T
  }

  if (path === '/api/v1/auth/signup' && method === 'POST') {
    const email = String(body.email ?? '')
    if (email === db.user.email) fail(409, '이미 가입된 이메일입니다.', 'EMAIL_ALREADY_EXISTS')
    db.user = {
      id: id(),
      email,
      nickname: email.split('@')[0] || '말모아 사용자',
      joinedAt: now(),
    }
    db.password = String(body.password ?? '')
    writeDb(db)
    return ok({ email }) as T
  }

  if (path === '/api/v1/auth/oauth/kakao' && method === 'GET') {
    return ok({ redirectUrl: 'https://kauth.kakao.com/oauth/authorize' }) as T
  }

  if (path === '/api/v1/auth/oauth/google' && method === 'GET') {
    return ok({ redirectUrl: 'https://accounts.google.com/o/oauth2/v2/auth' }) as T
  }

  // ── 프로필 및 사용자 환경 설정 ─────────────────────────────────────────
  if (path === '/api/v1/users/me' && method === 'GET') return ok(db.user) as T

  if (path === '/api/v1/users/me' && method === 'PATCH') {
    db.user = { ...db.user, ...body }
    writeDb(db)
    return ok(db.user) as T
  }

  if (path === '/api/v1/users/me/preferences' && method === 'GET') {
    return ok(db.preferences) as T
  }

  if (path === '/api/v1/users/me/preferences' && method === 'PATCH') {
    db.preferences = { ...db.preferences, ...body }
    writeDb(db)
    return ok(db.preferences) as T
  }

  // ── 사용자 카테고리 ────────────────────────────────────────────────────
  if (path === '/api/v1/categories' && method === 'GET') return ok(db.categories) as T

  if (path === '/api/v1/categories' && method === 'POST') {
    const category: Category = {
      id: id(),
      name: String(body.name ?? '새 카테고리'),
      color: String(body.color ?? '#56a276'),
      order: db.categories.length,
      sentenceCount: 0,
    }
    db.categories.push(category)
    writeDb(db)
    return ok(category) as T
  }

  const categoryMatch = path.match(/^\/api\/v1\/categories\/([^/]+)$/)
  if (categoryMatch && method === 'DELETE') {
    const categoryId = categoryMatch[1]
    db.categories = db.categories.filter((category) => category.id !== categoryId)
    // 카테고리를 지워도 문장 자체는 보존하고 "미지정"으로 이동한다.
    db.sentences = db.sentences.map((sentence) =>
      sentence.categoryId === categoryId
        ? { ...sentence, categoryId: null, categoryName: undefined }
        : sentence,
    )
    writeDb(db)
    return ok({ deleted: true }) as T
  }

  // ── 저장·즐겨찾기·최근 사용 문장 ────────────────────────────────────────
  if (path.startsWith('/api/v1/sentences') && method === 'GET') {
    const url = new URL(path, 'http://mock.local')
    const type = url.searchParams.get('type')
    let result = [...db.sentences]
    if (type === 'favorite') result = result.filter((sentence) => sentence.favorite)
    if (type === 'recent') {
      // 실제 서버와 동일하게 사용 이력이 있는 문장만 최신 사용 순으로 정렬한다.
      result = result
        .filter((sentence) => sentence.lastUsedAt)
        .sort((a, b) => String(b.lastUsedAt).localeCompare(String(a.lastUsedAt)))
    }
    return ok(result) as T
  }

  if (path === '/api/v1/sentences' && method === 'POST') {
    const category = db.categories.find((item) => item.id === body.categoryId)
    const sentence: Sentence = {
      id: id(),
      content: String(body.content ?? ''),
      categoryId: category?.id ?? null,
      categoryName: category?.name,
      favorite: Boolean(body.favorite),
      source: 'manual',
      useCount: 0,
      lastUsedAt: null,
      createdAt: now(),
    }
    db.sentences.unshift(sentence)
    if (category) category.sentenceCount += 1
    writeDb(db)
    return ok(sentence) as T
  }

  const favoriteMatch = path.match(/^\/api\/v1\/sentences\/([^/]+)\/favorite$/)
  if (favoriteMatch && method === 'PATCH') {
    const sentence = db.sentences.find((item) => item.id === favoriteMatch[1])
    if (!sentence) fail(404, '문장을 찾을 수 없습니다.')
    sentence.favorite = Boolean(body.favorite)
    writeDb(db)
    return ok(sentence) as T
  }

  const useMatch = path.match(/^\/api\/v1\/sentences\/([^/]+)\/use$/)
  if (useMatch && method === 'POST') {
    const sentence = db.sentences.find((item) => item.id === useMatch[1])
    if (!sentence) fail(404, '문장을 찾을 수 없습니다.')
    // TTS 재생/의사소통 완료 시점에 호출되어 추천 데이터의 근거가 된다.
    sentence.useCount += 1
    sentence.lastUsedAt = now()
    writeDb(db)
    return ok(sentence) as T
  }

  const sentenceMatch = path.match(/^\/api\/v1\/sentences\/([^/]+)$/)
  if (sentenceMatch && method === 'DELETE') {
    db.sentences = db.sentences.filter((sentence) => sentence.id !== sentenceMatch[1])
    writeDb(db)
    return ok({ deleted: true }) as T
  }

  // ── 루틴 및 AI 추천 ────────────────────────────────────────────────────
  if (path === '/api/v1/recommendations/routine' && method === 'GET') {
    const recommendations: RoutineRecommendation[] = [
      {
        id: 'routine-morning',
        title: '아침 준비',
        description: '등교나 외출 전에 자주 사용하는 문장이에요.',
        timeLabel: '오전 7:00–10:00',
        sentences: db.sentences.slice(0, 3).map((sentence) => ({ ...sentence, source: 'routine' })),
      },
      {
        id: 'routine-meal',
        title: '식사 시간',
        description: '식사 중 필요한 표현을 모았어요.',
        timeLabel: '오전 11:30–오후 1:30',
        sentences: [
          {
            ...db.sentences[1]!,
            id: 'routine-water',
            content: '물을 조금 더 주세요',
            source: 'routine',
          },
          {
            ...db.sentences[2]!,
            id: 'routine-finished',
            content: '잘 먹었습니다',
            source: 'routine',
          },
        ],
      },
    ]
    return ok(recommendations) as T
  }

  if (path === '/api/v1/recommendations/ai' && method === 'POST') {
    // Mock에서는 규칙 기반 문장을 반환하고 실서비스에서는 Spring Boot가 AI를 호출한다.
    const request = body as unknown as AiRecommendationRequest
    const prefix = request.tone === '정중하게' ? '혹시 가능하시다면' : ''
    return ok([
      `${prefix} ${request.context}에 대해 이야기하고 싶어요`.trim(),
      `${request.context} 상황에서 도움이 필요해요`,
      `${request.context}에 대해 조금 더 설명해 주세요`,
    ]) as T
  }

  if (path === '/api/v1/recommendations/transform' && method === 'POST') {
    const request = body as unknown as TransformRequest
    const suffix: Record<TransformRequest['tone'], string> = {
      친근하게: ' 😊',
      정중하게: ' 부탁드립니다.',
      간단하게: '',
    }
    const transformed =
      request.tone === '간단하게'
        ? request.sentence.replace(/해 주실 수 있을까요\??/g, '해 주세요')
        : `${request.sentence.replace(/[.!]$/, '')}${suffix[request.tone]}`
    return ok({ sentence: transformed }) as T
  }

  // 정의되지 않은 요청을 조용히 성공시키지 않아 API 계약 누락을 빠르게 찾게 한다.
  fail(404, `Mock API에 정의되지 않은 요청입니다: ${method} ${path}`, 'MOCK_ROUTE_NOT_FOUND')
}
