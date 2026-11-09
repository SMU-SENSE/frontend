/* ───────────── API 경로 (백엔드와 동일하게 맞춤) ─────────────
 * 기준: SMU-SENSE/backend  feature/sangbeom-google-login (2026-10-05)
 *
 * 인증 방식이 두 가지라 주의:
 *  - /api/v1/me/**, /api/v1/auth/**  → 보호자 구글 로그인 세션 쿠키 (withCredentials)
 *  - /api/v1/device/**               → 태블릿 기기 토큰 (Authorization 헤더)
 *
 * 기존 코드가 깨지지 않게 이미 쓰던 키 이름은 그대로 두고 경로만 고침.
 * ------------------------------------------------------------ */

export const API_ENDPOINTS = {
  // 인증 (보호자 세션)
  AUTH: {
    CSRF: '/api/v1/auth/csrf', // POST/PATCH/DELETE 전에 토큰 받기
    ME: '/api/v1/auth/me', // GET: 내 계정
    ONBOARDING: '/api/v1/auth/onboarding',
    LOGOUT: '/api/v1/auth/logout', // Spring Security 로그아웃
    WITHDRAW: '/api/v1/auth/me', // DELETE: 회원 탈퇴 (ME 와 같은 주소, 메서드만 다름)
  },

  // AAC 사용자 (보호자가 관리) — 백엔드는 /me/aac-users
  AAC_USERS: {
    BASE: '/api/v1/me/aac-users',

    BY_ID: (aacUserId: number) => `/api/v1/me/aac-users/${aacUserId}`,

    SETTINGS: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/settings`,

    FAVORITES: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/favorites`,

    FAVORITE_BY_SYMBOL: (aacUserId: number, symbolId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/favorites/${symbolId}`,

    RECENT_SYMBOLS: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/recent-symbols`,

    USAGE_LOGS: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/usage-logs`,

    GUARDIANS: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/guardians`,

    // 백엔드에 /profile 이 없음 → 사용자 상세(설정 포함)로 연결
    PROFILE: (aacUserId: number) => `/api/v1/me/aac-users/${aacUserId}`,

    COMMUNICATION_PROFILE: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/communication-profile`,

    SENTENCE_LEVEL: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/sentence-level`,

    STATUS: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/status`,

    // AI 문장 생성 → 백엔드는 ai/recommendations (요청: { currentSituation }, 응답: { sentence })
    GENERATE_SENTENCE: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/ai/recommendations`,

    AI_CONTEXT: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/ai/context`,

    // 긴급 알림 → 백엔드는 기기 토큰 API (/device/emergency, body: { message })
    // 기존 호출부 호환을 위해 인자는 받지만 경로에는 안 씀
    EMERGENCY_TRIGGER: (_aacUserId?: number) => '/api/v1/device/emergency',
  },

  // 카테고리
  CATEGORIES: {
    BASE: '/api/v1/categories',
  },

  // 상징
  SYMBOLS: {
    BASE: '/api/v1/symbols',

    BY_ID: (symbolId: number) => `/api/v1/symbols/${symbolId}`,
  },

  // 보호자가 편집하는 AAC 보드 (카테고리/카드)
  BOARD: {
    BASE: (aacUserId: number) => `/api/v1/me/aac-users/${aacUserId}/board`,

    EVENTS: (aacUserId: number) => `/api/v1/me/aac-users/${aacUserId}/events`, // SSE

    CATEGORIES: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/board/categories`,

    CATEGORY_BY_ID: (aacUserId: number, categoryId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/board/categories/${categoryId}`,

    CARDS: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/board/cards`,

    CARD_BY_ID: (aacUserId: number, cardId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/board/cards/${cardId}`,

    CARD_FAVORITE: (aacUserId: number, cardId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/board/cards/${cardId}/favorite`,
  },

  // 태블릿 기기 (Authorization: 기기 토큰)
  DEVICE: {
    HEARTBEAT: '/api/v1/device/heartbeat',
    BOARD: '/api/v1/device/board',
    CARD_USAGE: '/api/v1/device/card-usage',
    EVENTS: '/api/v1/device/events', // SSE
    EMERGENCY: '/api/v1/device/emergency',
    LOCATIONS: '/api/v1/device/locations',
    SENSOR_EVENTS: '/api/v1/device/sensor-events',
    EXPRESSION_EVENTS: '/api/v1/device/expression-events',
    STT_EVENTS: '/api/v1/device/stt-events',
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

  // 연결된 기기
  DEVICES: {
    BY_AAC_USER: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/devices`,

    BY_ID: (aacUserId: number, deviceId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/devices/${deviceId}`,
  },

  // 온보딩
  ONBOARDING: {
    GRID: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/onboarding/grid`, // PATCH 전용

    VOICE_SETTINGS: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/voice-settings`, // PATCH

    VOICE_PREVIEW: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/voice-preview`, // GET ?voiceType=

    SUMMARY: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/onboarding-summary`, // GET (격자 값 읽기는 여기)

    CONFIRM: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/onboarding/confirm`,
  },

  // 보호자
  GUARDIAN: {
    TUTORIAL: '/api/v1/me/tutorial',
    TUTORIAL_COMPLETE: '/api/v1/me/tutorial/complete',
    PUSH_SUBSCRIPTIONS: '/api/v1/me/push-subscriptions',

    ALERTS: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/alerts`, // ?from=&to=

    ALERT_ACK: (aacUserId: number, alertId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/alerts/${alertId}/acknowledge`,

    REPORT: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/report`, // ?from=&to=

    REPORT_PDF: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/report/pdf`,

    ROUTINES: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/routines`,

    PLACES: (aacUserId: number) => `/api/v1/me/aac-users/${aacUserId}/places`,

    LOCATIONS: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/locations`,

    LATEST_LOCATION: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/locations/latest`,

    MEDIA_IMAGES: (aacUserId: number) =>
      `/api/v1/me/aac-users/${aacUserId}/media/images`,
  },

  HEALTH: '/api/v1/health',
};