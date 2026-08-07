import type { User, UserPreferences } from '../types/models'
import { apiRequest } from './client'

/** 프로필과 AAC 사용 환경 설정을 사용자 단위로 읽고 저장하는 API */
export const userApi = {
  getMe: () => apiRequest<User>('/api/v1/users/me'),
  updateMe: (input: Pick<User, 'nickname' | 'name'>) =>
    apiRequest<User>('/api/v1/users/me', { method: 'PATCH', body: input }),
  getPreferences: () => apiRequest<UserPreferences>('/api/v1/users/me/preferences'),
  updatePreferences: (input: UserPreferences) =>
    apiRequest<UserPreferences>('/api/v1/users/me/preferences', {
      method: 'PATCH',
      body: input,
    }),
}
