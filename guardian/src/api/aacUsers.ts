import type {
  AacUserResponse,
  BackendGridSize,
  BackendVoiceType,
  CreateAacUserInput,
  OnboardingSummaryResponse,
} from '../types/models'
import { apiRequest } from './client'

/** 보호자가 관리하는 AAC 사용자 초기 설정 API */
export const aacUserApi = {
  list: () => apiRequest<AacUserResponse[]>('/api/v1/me/aac-users'),

  create: (input: CreateAacUserInput) =>
    apiRequest<AacUserResponse>('/api/v1/me/aac-users', {
      method: 'POST',
      body: input,
    }),

  updateGrid: (userId: number, gridSize: BackendGridSize) =>
    apiRequest<AacUserResponse>(`/api/v1/me/aac-users/${userId}/onboarding/grid`, {
      method: 'PATCH',
      body: { gridSize },
    }),

  updateVoice: (userId: number, voiceType: BackendVoiceType, speechRate: number) =>
    apiRequest<AacUserResponse>(`/api/v1/me/aac-users/${userId}/voice-settings`, {
      method: 'PATCH',
      body: { voiceType, speechRate },
    }),

  getOnboardingSummary: (userId: number) =>
    apiRequest<OnboardingSummaryResponse>(
      `/api/v1/me/aac-users/${userId}/onboarding-summary`,
    ),

  confirmOnboarding: (userId: number) =>
    apiRequest<OnboardingSummaryResponse>(`/api/v1/me/aac-users/${userId}/onboarding/confirm`, {
      method: 'POST',
    }),
}
