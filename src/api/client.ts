import type { ApiErrorBody } from '../types/models'
import { mockRequest } from './mock'

// 실서버 주소와 Mock 사용 여부는 화면 코드가 아니라 환경변수 한 곳에서 전환한다.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
)
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false'

/**
 * 네트워크 오류와 Spring Boot 오류 응답을 화면에서 동일하게 처리하기 위한 표준 오류.
 * fieldErrors는 추후 서버의 필드별 검증 결과를 폼에 직접 연결할 때 사용한다.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = 'API_ERROR',
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  skipAuth?: boolean
}

// Zustand persist가 저장한 세션에서 토큰만 안전하게 꺼낸다.
// 저장 구조가 손상되어도 요청 자체가 중단되지 않도록 null로 복구한다.
function getAccessToken() {
  try {
    const raw = localStorage.getItem('malmoa-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { session?: { accessToken?: string } } }
    return parsed.state?.session?.accessToken ?? null
  } catch {
    return null
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? (options.body === undefined ? 'GET' : 'POST')

  // Mock과 실서버가 같은 API 함수/타입을 사용하므로 페이지는 전환 여부를 알 필요가 없다.
  if (USE_MOCK_API) {
    try {
      return await mockRequest<T>(path, { method, body: options.body })
    } catch (error) {
      const mockError = error as Error & { status?: number; code?: string }
      throw new ApiError(
        mockError.message || '요청을 처리하지 못했습니다.',
        mockError.status ?? 500,
        mockError.code,
      )
    }
  }

  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (options.body !== undefined) headers.set('Content-Type', 'application/json')

  const token = getAccessToken()
  // 회원가입·로그인처럼 인증 전 요청은 skipAuth로 Authorization 헤더를 생략한다.
  if (token && !options.skipAuth) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.', 0, 'NETWORK_ERROR')
  }

  if (!response.ok) {
    let errorBody: ApiErrorBody = {}
    try {
      errorBody = (await response.json()) as ApiErrorBody
    } catch {
      // JSON 오류 본문이 아닐 때 기본 메시지를 사용한다.
    }
    throw new ApiError(
      errorBody.message ?? '요청을 처리하지 못했습니다.',
      response.status,
      errorBody.code,
      errorBody.fieldErrors,
    )
  }

  // DELETE 등 본문이 없는 성공 응답도 제네릭 호출부에서 일관되게 처리한다.
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
  useMockApi: USE_MOCK_API,
}
