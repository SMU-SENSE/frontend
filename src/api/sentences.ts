import type { Category, Sentence } from '../types/models'
import { apiRequest } from './client'

export type SentenceListType = 'all' | 'favorite' | 'recent'

/**
 * 문장 데이터는 여러 AAC 화면에서 공유되므로 React Query로 관리한다.
 * 생성·수정 후 호출부에서 ['sentences'] 쿼리를 무효화해 모든 화면을 동기화한다.
 */
export const sentencesApi = {
  list: (type: SentenceListType = 'all') =>
    apiRequest<Sentence[]>(`/api/v1/sentences?type=${type}`),
  create: (input: { content: string; categoryId: string | null; favorite?: boolean }) =>
    apiRequest<Sentence>('/api/v1/sentences', { method: 'POST', body: input }),
  remove: (sentenceId: string) =>
    apiRequest<{ deleted: boolean }>(`/api/v1/sentences/${sentenceId}`, { method: 'DELETE' }),
  setFavorite: (sentenceId: string, favorite: boolean) =>
    apiRequest<Sentence>(`/api/v1/sentences/${sentenceId}/favorite`, {
      method: 'PATCH',
      body: { favorite },
    }),
  markUsed: (sentenceId: string) =>
    apiRequest<Sentence>(`/api/v1/sentences/${sentenceId}/use`, { method: 'POST' }),
}

/** 카테고리는 사용자별 데이터이며 상징 격자 화면도 이 API를 그대로 사용할 수 있다. */
export const categoriesApi = {
  list: () => apiRequest<Category[]>('/api/v1/categories'),
  create: (input: { name: string; color: string }) =>
    apiRequest<Category>('/api/v1/categories', { method: 'POST', body: input }),
  remove: (categoryId: string) =>
    apiRequest<{ deleted: boolean }>(`/api/v1/categories/${categoryId}`, {
      method: 'DELETE',
    }),
}
