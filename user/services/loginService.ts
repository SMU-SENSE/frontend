// 사용자용 QR 스캔 및 6자리 코드로 기기를 AAC 사용자와 페어링

import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/constants/apiEndpoint';

export interface DeviceClaimResponse {
  aacUserId: number;
  deviceToken?: string;
  status: string;
}

export const deviceService = {
  // QR 코드 토큰으로 기기 등록
  claimByQr: async (
    qrToken: string
  ): Promise<DeviceClaimResponse> => {
    const res = await apiClient.post<DeviceClaimResponse>(
      API_ENDPOINTS.DEVICE_PAIRINGS.CLAIM_QR,
      { token: qrToken }
    );

    return res.data;
  },

  // 6자리 코드로 기기 등록
  claimByCode: async (
    code: string
  ): Promise<DeviceClaimResponse> => {
    const res = await apiClient.post<DeviceClaimResponse>(
      API_ENDPOINTS.DEVICE_PAIRINGS.CLAIM_CODE,
      { code }
    );

    return res.data;
  },
};