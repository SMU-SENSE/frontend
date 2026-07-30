import type {
  AiRecommendationRequest,
  RoutineRecommendation,
  TransformRequest,
} from '../types/models'
import { apiRequest } from './client'

/** 추천 결과는 자동 저장하지 않고 사용자가 확인 후 sentencesApi로 저장한다. */
export const recommendationsApi = {
  getRoutine: () =>
    apiRequest<RoutineRecommendation[]>('/api/v1/recommendations/routine'),
  recommend: (input: AiRecommendationRequest) =>
    apiRequest<string[]>('/api/v1/recommendations/ai', {
      method: 'POST',
      body: input,
    }),
  transform: (input: TransformRequest) =>
    apiRequest<{ sentence: string }>('/api/v1/recommendations/transform', {
      method: 'POST',
      body: input,
    }),
}
