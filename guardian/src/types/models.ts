export type Id = string

/** 로그인 이후 모든 사용자 화면에서 공통으로 사용하는 최소 프로필 정보 */
export interface User {
  id: Id
  email: string
  nickname: string
  name?: string
  profileImageUrl?: string
  joinedAt: string
}

export interface AuthSession {
  accessToken: string
  refreshToken?: string
  user: User
}

/** 사용자마다 직접 만들 수 있는 문장 분류. order는 드래그 정렬 확장을 고려한 값이다. */
export interface Category {
  id: Id
  name: string
  color: string
  order: number
  sentenceCount: number
}

export type SentenceSource = 'manual' | 'routine' | 'ai'

/** 저장 문장, 추천 문장, 최근 사용 문장을 한 구조로 표시하기 위한 공통 모델 */
export interface Sentence {
  id: Id
  content: string
  categoryId: Id | null
  categoryName?: string
  favorite: boolean
  source: SentenceSource
  useCount: number
  lastUsedAt: string | null
  createdAt: string
}

/**
 * 양지안 담당 AAC 화면에서도 사용하는 사용자 환경 설정.
 * 화면별 로컬 값으로 복제하지 않고 이 모델을 공통 계약으로 사용한다.
 */
export interface UserPreferences {
  gridColumns: 3 | 4 | 5
  scanSpeedMs: 800 | 1200 | 1800 | 2400
  voiceId: string
  voiceRate: number
  voicePitch: number
  autoSpeak: boolean
}

export type Tone = '기본' | '친근하게' | '정중하게' | '간단하게'

/** 시간대와 사용 기록을 기반으로 서버가 구성한 추천 묶음 */
export interface RoutineRecommendation {
  id: Id
  title: string
  description: string
  timeLabel: string
  sentences: Sentence[]
}

export interface AiRecommendationRequest {
  context: string
  tone: Tone
  keywords?: string[]
}

export interface TransformRequest {
  sentence: string
  tone: Exclude<Tone, '기본'>
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ApiErrorBody {
  code?: string
  message?: string
  fieldErrors?: Record<string, string>
}
