export type Id = string

/** 로그인 이후 기존 보호자 화면에서 공통으로 사용하는 최소 계정 요약 */
export interface User {
  id: Id
  email: string
  nickname: string
  name?: string
  profileImageUrl?: string
  joinedAt: string
}

export interface AuthSession {
  /** Mock 모드 호환용. 실제 Spring 연결은 JSESSIONID 세션 쿠키를 사용한다. */
  accessToken?: string
  refreshToken?: string
  user: User
}

export type AccountType = 'GUARDIAN' | 'SUPPORTER' | 'AAC_USER'

export interface AccountResponse {
  accountId: number
  email: string
  name: string | null
  profileImageUrl: string | null
  accountType: AccountType | null
  onboardingCompleted: boolean
  status: string
}

export type RelationshipType = 'PARENT' | 'GRANDPARENT' | 'TEACHER' | 'OTHER'
export type BackendGridSize = 'GRID_2X2' | 'GRID_3X3' | 'GRID_4X4'
export type BackendVoiceType = 'CHILD_MALE' | 'CHILD_FEMALE' | 'ADULT_FEMALE' | 'ADULT_MALE'
export type AacUserSetupStep =
  | 'PROFILE_COMPLETED'
  | 'GRID_COMPLETED'
  | 'VOICE_COMPLETED'
  | 'CONFIRMED'

export interface CreateAacUserInput {
  name: string
  birthDate: string
  relationshipType: RelationshipType
  relationshipDetail?: string | null
  emergencyContact: string
  notes?: string | null
  profileImageUrl?: string | null
}

export interface AacUserResponse {
  id: number
  name: string
  mode: string
  gridSize: BackendGridSize
  active: boolean
  birthDate: string
  emergencyContact: string
  notes: string | null
  profileImageUrl: string | null
  voiceType: BackendVoiceType | null
  speechRate: number | null
  setupStep: AacUserSetupStep
  sentenceLevel?: 1 | 2 | 3 | 4
  status?: 'STABLE' | 'EMERGENCY'
  boardVersion?: number
  createdAt: string
  updatedAt: string
}

export interface OnboardingSummaryResponse {
  userId: number
  name: string
  profileImageUrl: string | null
  birthDate: string
  relationshipType: RelationshipType
  relationshipDetail: string | null
  emergencyContact: string
  notes: string | null
  gridSize: BackendGridSize
  voiceType: BackendVoiceType
  speechRate: number
  setupStep: AacUserSetupStep
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
  /** 보호자 카드 편집에서 사용하는 선택적 이미지. 백엔드가 지원하면 그대로 동기화한다. */
  imageUrl?: string | null
  /** 시연용 AAC 판의 저장된 카드 순서. 이전 데이터는 배열 순서로 보정한다. */
  displayOrder?: number
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
  /** 보호자 설계서 SCR-SET-002. 서버 계약 미지원 시 Mock/로컬 설정으로 유지한다. */
  languageLevel?: 1 | 2 | 3 | 4
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
  success?: boolean
  code?: string
  message?: string
  fieldErrors?: Record<string, string>
}
