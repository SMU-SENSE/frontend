import type { AccountResponse, AuthSession } from '../types/models'
import type { LoginForm, SignupForm } from '../lib/validators'
import { apiConfig, apiRequest, resetCsrfToken } from './client'

export function accountToSession(account: AccountResponse): AuthSession {
  const fallbackName = account.email.split('@')[0] || '보호자'
  const displayName = account.name?.trim() || fallbackName

  return {
    user: {
      id: String(account.accountId),
      email: account.email,
      nickname: displayName,
      name: account.name ?? undefined,
      profileImageUrl: account.profileImageUrl ?? undefined,
      joinedAt: '',
    },
  }
}

function mockOnly<T>(action: () => Promise<T>, feature: string) {
  if (apiConfig.useMockApi) return action()
  return Promise.reject(new Error(`현재 백엔드는 ${feature}을 지원하지 않아요. Google 로그인을 이용해 주세요.`))
}

export const authApi = {
  /** Figma 이메일 인증 흐름을 확인하기 위한 Mock 전용 API */
  login: (input: LoginForm) =>
    mockOnly(
      () =>
        apiRequest<AuthSession>('/api/v1/auth/login', {
          method: 'POST',
          body: input,
        }),
      '이메일 로그인',
    ),

  /** Figma 이메일 회원가입 흐름을 확인하기 위한 Mock 전용 API */
  signup: ({ email, password }: SignupForm) =>
    mockOnly(
      () =>
        apiRequest<{ email: string }>('/api/v1/auth/signup', {
          method: 'POST',
          body: { email, password },
        }),
      '이메일 회원가입',
    ),

  googleLoginUrl: () => `${apiConfig.baseUrl}/oauth2/authorization/google`,

  me: () => apiRequest<AccountResponse>('/api/v1/auth/me'),

  completeOnboarding: (input: {
    accountType: 'GUARDIAN'
    termsOfServiceAgreed: boolean
    privacyPolicyAgreed: boolean
    marketingAgreed: boolean
    phoneNumber: string | null
  }) =>
    apiRequest<AccountResponse>('/api/v1/auth/onboarding', {
      method: 'POST',
      body: input,
    }),

  logout: async () => {
    await apiRequest<void>('/api/v1/auth/logout', { method: 'POST' })
    resetCsrfToken()
  },
}
