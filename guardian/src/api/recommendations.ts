import type {
  AiRecommendationRequest,
  RoutineRecommendation,
  TransformRequest,
} from '../types/models'
import { apiConfig, apiRequest } from './client'

export interface PersonalizedVocabularyItem {
  cardId: number
  displayText: string
  ttsText: string
  priority: string
  important: boolean
  favorite: boolean
  usageCount: number
  lastUsedAt: string | null
}

export interface PersonalizedAacContext {
  aacUserId: number
  age: number | null
  profileNotes: string | null
  communicationPreferences: {
    sentenceLevel: number
    maxRecommendedSentenceWords: number
    easyWordsPreferred: boolean
    abstractExpressionsRestricted: boolean
    complexGrammarRestricted: boolean
    conciseDirectPreferred: boolean
  }
  prioritizedVocabulary: PersonalizedVocabularyItem[]
  recentExpressions: string[]
  currentSituation: string | null
}

export interface AiSentenceResponse {
  sentence: string
}

function toneSituation(context: string, tone?: string) {
  const trimmed = context.trim()
  if (!tone || tone === '기본') return trimmed
  return `${trimmed}\n표현 톤 요청: ${tone}`
}

/**
 * 실제 Spring 백엔드는 AAC 사용자별 개인화 AI API를 사용한다.
 * Mock 모드에서는 기존 시연용 추천 API를 유지한다.
 */
export const recommendationsApi = {
  context: (userId: number, currentSituation?: string) => {
    const query = currentSituation?.trim()
      ? `?currentSituation=${encodeURIComponent(currentSituation.trim())}`
      : ''
    return apiRequest<PersonalizedAacContext>(
      `/api/v1/me/aac-users/${userId}/ai/context${query}`,
    )
  },

  async recommend(userId: number, input: AiRecommendationRequest): Promise<AiSentenceResponse> {
    if (apiConfig.useMockApi) {
      const results = await apiRequest<string[]>('/api/v1/recommendations/ai', {
        method: 'POST',
        body: input,
      })
      return { sentence: results[0] ?? '' }
    }

    return apiRequest<AiSentenceResponse>(
      `/api/v1/me/aac-users/${userId}/ai/recommendations`,
      {
        method: 'POST',
        body: { currentSituation: toneSituation(input.context, input.tone) },
      },
    )
  },

  async transform(userId: number, input: TransformRequest): Promise<AiSentenceResponse> {
    if (apiConfig.useMockApi) {
      return apiRequest<AiSentenceResponse>('/api/v1/recommendations/transform', {
        method: 'POST',
        body: input,
      })
    }

    // 현재 백엔드에는 별도 transform 엔드포인트가 없다.
    // 개인화 단일 문장 추천 계약 안에서 원문의 의미와 말투 요구를 currentSituation으로 전달한다.
    return apiRequest<AiSentenceResponse>(
      `/api/v1/me/aac-users/${userId}/ai/recommendations`,
      {
        method: 'POST',
        body: {
          currentSituation:
            `사용자가 이미 말하고 싶은 문장은 "${input.sentence.trim()}"입니다. ` +
            `의미를 바꾸지 말고 ${input.tone} 말투의 AAC 한 문장으로 표현해 주세요.`,
        },
      },
    )
  },

  // 브라우저 Mock 시연 호환용. 실제 루틴 화면은 guardianLiveApi.routines를 사용한다.
  getRoutine: () =>
    apiRequest<RoutineRecommendation[]>('/api/v1/recommendations/routine'),
}
