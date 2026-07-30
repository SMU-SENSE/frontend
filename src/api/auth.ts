import type { AuthSession } from '../types/models'
import type { LoginForm, SignupForm } from '../lib/validators'
import { apiRequest } from './client'

/**
 * 인증 화면과 Spring Boot 엔드포인트 사이의 유일한 연결 지점.
 * 백엔드 경로/응답이 바뀌면 페이지 대신 이 파일만 수정한다.
 */
export const authApi = {
  login: (input: LoginForm) =>
    apiRequest<AuthSession>('/api/v1/auth/login', {
      method: 'POST',
      body: input,
      skipAuth: true,
    }),
  signup: ({ email, password }: SignupForm) =>
    apiRequest<{ email: string }>('/api/v1/auth/signup', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    }),
  getOAuthUrl: (provider: 'kakao' | 'google') =>
    // 프론트에 OAuth 비밀키를 두지 않고 백엔드가 만든 인가 URL만 전달받는다.
    apiRequest<{ redirectUrl: string }>(`/api/v1/auth/oauth/${provider}`, {
      skipAuth: true,
    }),
}
