'use client'

import { Mail, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authApi } from '../../api/auth'
import { apiConfig } from '../../api/client'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/ToastProvider'

export default function AuthLandingPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const openPrototypeOnly = (feature: string, mockPath?: string) => {
    if (apiConfig.useMockApi && mockPath) {
      router.push(mockPath)
      return
    }
    showToast(`${feature}은 아직 백엔드 API가 없어서 Google 로그인부터 실제 연결했어요.`)
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
        <p>로그인 또는 가입할 방법을 선택해 주세요</p>
      </div>

      <div className="auth-actions auth-actions--figma">
        <Button
          fullWidth
          size="lg"
          leftIcon={<Mail size={18} />}
          onClick={() => openPrototypeOnly('이메일 로그인', '/login')}
        >
          이메일로 계속
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="kakao"
          leftIcon={<MessageCircle size={18} />}
          onClick={() => openPrototypeOnly('카카오 로그인')}
        >
          카카오로 계속
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="outline"
          leftIcon={<span className="google-mark">G</span>}
          onClick={handleGoogle}
        >
          구글로 계속
        </Button>
      </div>

      {!apiConfig.useMockApi ? (
        <p className="auth-backend-note">현재 실제 백엔드 연결은 Google 로그인 기준으로 동작합니다.</p>
      ) : null}
    </AuthLayout>
  )
}
