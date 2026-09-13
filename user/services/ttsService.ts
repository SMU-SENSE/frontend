//상징 3개 조합 기반 AI 문장 생성 요청, TTS 실제 발화/상징 선택 로그 기록, 긴급 모드 전송 서비스

import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/constants/apiEndpoint';

export interface SentenceGenerationResponse {
  candidates: string[];
}

export interface UsageLogPayload {
  symbolId?: number;
  action: 'SELECT' | 'CANCEL' | 'SPEAK';
  spokenText?: string;
  metadata?: Record<string, any>;
}

export const sentenceAndLogService = {
  // 상징 조합을 통한 AI 문장 생성 요청
  generateSentences: async (
    aacUserId: number,
    symbolIds: number[],
    tone: 'POLITE' | 'INFORMAL' = 'POLITE'
  ): Promise<string[]> => {
    const res = await apiClient.post<SentenceGenerationResponse>(
      API_ENDPOINTS.AAC_USERS.GENERATE_SENTENCE(aacUserId),
      { symbolIds, tone }
    );
    return res.data.candidates;
  },

  // 상징 선택, 취소, 실제 발화 로그 전송
  logUsage: async (aacUserId: number, payload: UsageLogPayload): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AAC_USERS.USAGE_LOGS(aacUserId), payload);
  },

  // 긴급 상황 발생 전송
  triggerEmergency: async (aacUserId: number, reasonText: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AAC_USERS.EMERGENCY_TRIGGER(aacUserId), {
      emergencyType: 'COMMUNICATION',
      message: reasonText,
      timestamp: new Date().toISOString(),
    });
  },
};