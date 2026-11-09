/* ───────────── API 에러를 화면용으로 바꾸기 ─────────────
 * axios 에러(또는 mockSwitch 가 흉내 낸 에러)를 받아서
 * 어떤 종류인지와 보여줄 문구를 정리해줌.
 * ------------------------------------------------------ */

export type ApiErrorKind = 'auth' | 'network' | 'server';

export interface ApiErrorInfo {
  kind: ApiErrorKind;
  status?: number;
  message: string;
}

export const toApiError = (error: unknown): ApiErrorInfo => {
  const err = error as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: { message?: string | null } };
  };
  const status = err?.response?.status;

  // 401: 로그인 안 됨 / 403: 이 사용자에 대한 권한 없음
  if (status === 401 || status === 403) {
    return {
      kind: 'auth',
      status,
      message:
        status === 401
          ? '보호자 연결(로그인)이 필요해요.'
          : '이 사용자 정보를 볼 권한이 없어요.',
    };
  }

  // 응답 자체가 없음: 서버가 꺼져 있거나 주소(NEXT_PUBLIC_API_BASE_URL)가 틀림
  if (!err?.response) {
    return {
      kind: 'network',
      message: '서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요.',
    };
  }

  return {
    kind: 'server',
    status,
    message:
      err.response.data?.message ||
      `데이터를 불러오지 못했어요. (오류 ${status ?? ''})`.trim(),
  };
};