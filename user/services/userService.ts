//보호자가 설정해둔 AAC 화면 격자(2x2, 3x3, 4x4)와 TTS 음성 설정값을 조회

import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/constants/apiEndpoint';

export interface AacUserProfile {
  id: number;
  name: string;
  gridSize: '2x2' | '3x3' | '4x4';
  ttsVoice: 'BOY' | 'GIRL' | string;
  ttsRate: number; // 0.7 ~ 1.3
  ttsPitch: number;
  autoSpeak: boolean;
}

export const aacUserService = {
  // 사용자 프로필 및 환경설정 조회
  getProfile: async (aacUserId: number): Promise<AacUserProfile> => {
    const res = await apiClient.get<AacUserProfile>(
      API_ENDPOINTS.AAC_USERS.PROFILE(aacUserId)
    );
    return res.data;
  },
};