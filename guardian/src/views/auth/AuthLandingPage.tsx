'use client'

import { useRouter } from 'next/navigation'
import { authApi } from '../../api/auth'
import { apiConfig } from '../../api/client'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/ToastProvider'

function EmailIcon() {
  return (
    <svg className="social-icon" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2.5" y="4" width="15" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4.5 6 5.5 4.2L15.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg className="social-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.5c-4.1 0-7.4 2.6-7.4 5.8 0 2.1 1.4 4 3.5 5l-.8 2.7 3.1-2c.5.1 1 .1 1.6.1 4.1 0 7.4-2.6 7.4-5.8S14.1 3.5 10 3.5Z" fill="currentColor" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="social-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path fill="#4285F4" d="M18.6 10.2c0-.6-.1-1.2-.2-1.7H10v3.2h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.8 2.7-6.4Z" />
      <path fill="#34A853" d="M10 19c2.4 0 4.5-.8 5.9-2.2L13 14.5c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H2v2.3A9 9 0 0 0 10 19Z" />
      <path fill="#FBBC05" d="M5 11.7a5.4 5.4 0 0 1 0-3.4V6H2a9 9 0 0 0 0 8l3-2.3Z" />
      <path fill="#EA4335" d="M10 4.6c1.3 0 2.5.4 3.4 1.3L16 3.4A8.6 8.6 0 0 0 10 1a9 9 0 0 0-8 5l3 2.3c.7-2.1 2.7-3.7 5-3.7Z" />
    </svg>
  )
}

export default function AuthLandingPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const openPrototypeOnly = (feature: string, mockPath?: string) => {
    if (apiConfig.useMockApi && mockPath) {
      router.push(mockPath)
      return
    }
    showToast(`${feature}은 아직 백엔드 API가 연결되지 않았어요.`)
  }

  const handleGoogle = () => {
    if (apiConfig.useMockApi) {
      showToast('Mock 모드에서는 이메일 로그인으로 화면 흐름을 확인해 주세요.')
      return
    }
    window.location.assign(authApi.googleLoginUrl())
  }

  return (
    <AuthLayout showBack={false}>
      <div className="auth-heading auth-heading--center">
        <h1>말모아에 오신 것을 환영해요</h1>
        <p>로그인 또는 가입 방법을 선택해 주세요</p>
      </div>

      <div className="auth-actions auth-actions--figma">
        <Button fullWidth size="lg" leftIcon={<EmailIcon />} onClick={() => router.push('/login')}>
          이메일로 계속
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="kakao"
          leftIcon={<KakaoIcon />}
          onClick={() => openPrototypeOnly('카카오 로그인')}
        >
          카카오로 계속
        </Button>
        <Button fullWidth size="lg" variant="outline" leftIcon={<GoogleIcon />} onClick={handleGoogle}>
          구글로 계속
        </Button>
      </div>
    </AuthLayout>
  )
}
