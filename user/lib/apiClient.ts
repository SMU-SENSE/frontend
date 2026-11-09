import axios, { type InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 보호자 로그인 세션 쿠키
});

/* ───────────── CSRF 토큰 ─────────────
 * 백엔드(Spring Security)는 POST/PATCH/PUT/DELETE 에 CSRF 토큰을 요구함.
 * GET /api/v1/auth/csrf 로 { headerName, token } 을 받아서 헤더에 붙임.
 * (쿠키 값을 그대로 쓰면 Spring 6 기본 설정에선 403 이 나서 응답 값을 씀)
 *
 * /device/**, /device-pairings/claim/** 는 백엔드에서 CSRF 를 안 봄.
 * ------------------------------------ */

const CSRF_URL = '/api/v1/auth/csrf';
const SAFE_METHODS = ['get', 'head', 'options'];
const CSRF_EXEMPT = ['/api/v1/device/', '/api/v1/device-pairings/claim/'];

let csrfPromise: Promise<{ headerName: string; token: string } | null> | null =
  null;

const loadCsrf = () => {
  if (!csrfPromise) {
    csrfPromise = apiClient
      .get(CSRF_URL)
      .then((res) => res.data?.data ?? null)
      .catch(() => {
        csrfPromise = null; // 실패하면 다음 요청 때 다시 시도
        return null;
      });
  }
  return csrfPromise;
};

/** 로그인/로그아웃 뒤에는 토큰이 바뀌므로 지워서 다시 받게 함 */
export const resetCsrfToken = () => {
  csrfPromise = null;
};

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? 'get').toLowerCase();
  const url = config.url ?? '';

  if (SAFE_METHODS.includes(method)) return config;
  if (CSRF_EXEMPT.some((prefix) => url.startsWith(prefix))) return config;

  const csrf = await loadCsrf();
  if (csrf?.headerName && csrf?.token) {
    config.headers.set(csrf.headerName, csrf.token);
  }
  return config;
});

// 403 이 나면 토큰이 만료됐을 수 있으니 한 번만 새로 받아서 재시도
apiClient.interceptors.response.use(undefined, async (error) => {
  const config = error?.config;
  if (error?.response?.status === 403 && config && !config._csrfRetried) {
    config._csrfRetried = true;
    resetCsrfToken();
    return apiClient(config);
  }
  return Promise.reject(error);
});