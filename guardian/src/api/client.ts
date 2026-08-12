import type { ApiErrorBody } from '../types/models'
import { mockRequest } from './mock'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
)
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true'

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
  /** GET 외에도 CSRF를 생략해야 하는 특별한 공개 엔드포인트에서만 사용 */
  skipCsrf?: boolean
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string | null
}

interface CsrfTokenResponse {
  headerName: string
  parameterName: string
  token: string
}

let csrfToken: CsrfTokenResponse | null = null

const isMutation = (method: string) => !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())

async function parseError(response: Response) {
  let errorBody: ApiErrorBody = {}
  try {
    errorBody = (await response.json()) as ApiErrorBody
  } catch {
    // JSON 본문이 아니면 기본 오류 메시지를 사용한다.
  }
  return new ApiError(
    errorBody.message ?? '요청을 처리하지 못했습니다.',
    response.status,
    errorBody.code,
    errorBody.fieldErrors,
  )
}

async function ensureCsrfToken(force = false) {
  if (csrfToken && !force) return csrfToken

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) throw await parseError(response)
  const payload = (await response.json()) as ApiEnvelope<CsrfTokenResponse>
  csrfToken = payload.data
  return csrfToken
}

async function requestReal<T>(path: string, options: RequestOptions, retryCsrf = true): Promise<T> {
  const method = options.method ?? (options.body === undefined ? 'GET' : 'POST')
  const { body, skipCsrf, ...fetchOptions } = options
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (body !== undefined) headers.set('Content-Type', 'application/json')

  if (isMutation(method) && !skipCsrf) {
    const token = await ensureCsrfToken()
    headers.set(token.headerName, token.token)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.', 0, 'NETWORK_ERROR')
  }

  if (!response.ok) {
    if (response.status === 403 && isMutation(method) && !skipCsrf && retryCsrf) {
      csrfToken = null
      await ensureCsrfToken(true)
      return requestReal<T>(path, options, false)
    }
    throw await parseError(response)
  }

  if (response.status === 204) return undefined as T

  const payload = (await response.json()) as T | ApiEnvelope<T>
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload
  ) {
    return (payload as ApiEnvelope<T>).data
  }
  return payload as T
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? (options.body === undefined ? 'GET' : 'POST')

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

  return requestReal<T>(path, options)
}

export function resetCsrfToken() {
  csrfToken = null
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
  useMockApi: USE_MOCK_API,
}
