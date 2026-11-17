// 사용자용 QR 스캔 및 6자리 코드로 기기를 AAC 사용자와 페어링

import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/constants/apiEndpoint';
import { storage } from '@/lib/storage';

/** 백엔드 DeviceClaimResponse */
export interface DeviceClaimResponse {
  aacUserId: number;
  deviceId: string;
  pairedAt: string;
  accessToken: string; // 이후 /api/v1/device/** 요청에 쓰는 기기 토큰
  accessTokenExpiresAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

/* ───────────── 기기 고유값 ─────────────
 * 백엔드는 연결할 때 deviceId(기기별 고유값)를 꼭 요구함.
 * 이 브라우저에서 처음 한 번 만들어 저장하고, 이후엔 계속 같은 값을 씀.
 * ------------------------------------ */
const DEVICE_ID_KEY = 'malmoa_device_id';

const getOrCreateDeviceId = (): string => {
  if (typeof window === 'undefined') return '';

  const saved = window.localStorage.getItem(DEVICE_ID_KEY);
  if (saved) return saved;

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
};

/** 백엔드가 코드/QR 과 함께 요구하는 기기 정보 */
const getDeviceInfo = () => ({
  deviceId: getOrCreateDeviceId(), // 필수
  deviceName: 'Malmoa Web', // 보호자 앱에 보일 이름
  deviceType: 'WEB', // TABLET | MOBILE | WEB | UNKNOWN 중 하나 (필수)
});

/** 연결 성공하면 토큰과 사용자 id 를 저장 */
const saveClaim = (claim: DeviceClaimResponse): DeviceClaimResponse => {
  if (claim?.accessToken) storage.setDeviceToken(claim.accessToken);
  if (claim?.aacUserId) storage.setAacUserId(claim.aacUserId);
  return claim;
};

export const deviceService = {
  // QR 코드 토큰으로 기기 등록
  claimByQr: async (qrToken: string): Promise<DeviceClaimResponse> => {
    const res = await apiClient.post<ApiResponse<DeviceClaimResponse>>(
      API_ENDPOINTS.DEVICE_PAIRINGS.CLAIM_QR,
      { token: qrToken, ...getDeviceInfo() }
    );
    return saveClaim(res.data.data);
  },

  // 6자리 코드로 기기 등록
  claimByCode: async (code: string): Promise<DeviceClaimResponse> => {
    const res = await apiClient.post<ApiResponse<DeviceClaimResponse>>(
      API_ENDPOINTS.DEVICE_PAIRINGS.CLAIM_CODE,
      { code, ...getDeviceInfo() }
    );
    return saveClaim(res.data.data);
  },
};