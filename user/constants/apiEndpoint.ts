export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    ME: '/api/v1/auth/me',
    ONBOARDING: '/api/v1/auth/onboarding',
    LOGOUT: '/api/v1/auth/logout',
  },

  // AAC 사용자
  AAC_USERS: {
    BASE: '/api/v1/aac-users',

    BY_ID: (aacUserId: number) =>
      `/api/v1/aac-users/${aacUserId}`,

    // GET 목록 / POST 추가
    FAVORITES: (aacUserId: number) =>
      `/api/v1/aac-users/${aacUserId}/favorites`,

    // DELETE 즐겨찾기 해제
    FAVORITE_BY_ID: (aacUserId: number, symbolId: number) =>
      `/api/v1/aac-users/${aacUserId}/favorites/${symbolId}`,

    RECENT_SYMBOLS: (aacUserId: number) =>
      `/api/v1/aac-users/${aacUserId}/recent-symbols`,

    FREQUENT_SYMBOLS: (aacUserId: number) =>
      `/api/v1/aac-users/${aacUserId}/frequent-symbols`,

    USAGE_LOGS: (aacUserId: number) =>
      `/api/v1/aac-users/${aacUserId}/usage-logs`,

    PROFILE: (aacUserId: number) =>
      `/api/v1/aac-users/${aacUserId}/profile`,

    // AI 문장 생성 — 경로는 백엔드 명세 확정되면 수정
    GENERATE_SENTENCE: (aacUserId: number) =>
      `/api/v1/aac-users/${aacUserId}/generate-sentence`,

    // 긴급 상황 알림 — 경로는 백엔드 명세 확정되면 수정
    EMERGENCY_TRIGGER: (aacUserId: number) =>
      `/api/v1/aac-users/${aacUserId}/emergency`,
  },

  // 카테고리
  CATEGORIES: {
    BASE: '/api/v1/categories',
  },

  // 상징
  SYMBOLS: {
    BASE: '/api/v1/symbols',

    BY_ID: (symbolId: number) =>
      `/api/v1/symbols/${symbolId}`,
  },

  // 기기 연결
  DEVICE_PAIRINGS: {
    CREATE: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/device-pairings`,

    REFRESH: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/device-pairings/refresh`,

    CURRENT: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/device-pairings/current`,

    CLAIM_QR: '/api/v1/device-pairings/claim/qr',

    CLAIM_CODE: '/api/v1/device-pairings/claim/code',
  },

  // 연결된 기기 조회
  DEVICES: {
    BY_AAC_USER: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/devices`,
  },

  // 온보딩
  ONBOARDING: {
    // PATCH 전용 (저장만 가능). 읽을 때는 SUMMARY 사용
    GRID: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/onboarding/grid`,

    // PATCH 전용
    VOICE_SETTINGS: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/voice-settings`,

    // GET — 격자, TTS 등 설정을 한 번에 읽을 수 있음
    SUMMARY: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/onboarding-summary`,

    CONFIRM: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/onboarding/confirm`,
  },

  HEALTH: '/api/v1/health',
};