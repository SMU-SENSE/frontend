/* ───────────── API 별 목 스위치 ─────────────
 * .env.local 에서 목으로 돌릴 API 를 쉼표로 적음.
 *
 *   NEXT_PUBLIC_MOCK_APIS=all                         → 전부 목
 *   NEXT_PUBLIC_MOCK_APIS=symbols,categories          → 이 둘만 목
 *   (안 적거나 비우면)                                 → 전부 실제 API
 *
 * 예전 설정 NEXT_PUBLIC_USE_MOCK=true 도 그대로 동작함 (= all).
 *
 * 에러 화면 테스트용 (백엔드 없이 실패 상황 흉내):
 *   NEXT_PUBLIC_MOCK_ERROR=401       → 로그인 필요
 *   NEXT_PUBLIC_MOCK_ERROR=500       → 서버 에러
 *   NEXT_PUBLIC_MOCK_ERROR=network   → 서버 연결 안 됨
 *
 * .env 를 바꾼 뒤에는 개발 서버를 재시작해야 반영됨.
 * ------------------------------------------- */

export type MockApi =
  | 'categories'
  | 'symbols'
  | 'gridSetting'
  | 'usageLog'
  | 'aiSentence';

const MOCK_APIS: string[] = (process.env.NEXT_PUBLIC_MOCK_APIS ?? '')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

const LEGACY_ALL = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

/** 이 API 를 목으로 돌릴지 */
export const isMock = (api: MockApi): boolean =>
  LEGACY_ALL || MOCK_APIS.includes('all') || MOCK_APIS.includes(api);

const MOCK_ERROR = (process.env.NEXT_PUBLIC_MOCK_ERROR ?? '').trim();

/** axios 가 던지는 에러와 같은 모양으로 만듦 (화면 코드가 똑같이 처리하게) */
const makeAxiosLikeError = (kind: string) => {
  if (kind === 'network') {
    return Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      code: 'ERR_NETWORK',
    });
  }

  const status = Number(kind) || 500;
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: {
      status,
      data: {
        success: false,
        data: null,
        message: status === 401 ? '로그인이 필요합니다.' : '서버 오류가 발생했습니다.',
      },
    },
  });
};

/** 목 응답. 진짜 요청처럼 살짝 기다렸다가 돌려주고, MOCK_ERROR 면 실패시킴 */
export const mockResponse = async <T>(data: T, delayMs = 150): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  if (MOCK_ERROR) throw makeAxiosLikeError(MOCK_ERROR);
  return data;
};