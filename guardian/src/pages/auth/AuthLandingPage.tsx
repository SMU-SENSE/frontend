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

  const handleOAuth = async (provider: 'kakao' | 'google') => {
    try {
      const { redirectUrl } = await authApi.getOAuthUrl(provider)
      if (apiConfig.useMockApi) {
        showToast('Mock 모드에서는 이메일 로그인 흐름으로 확인해 주세요.')
        return
      }
      window.location.assign(redirectUrl)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '소셜 로그인을 시작하지 못했어요.', 'error')
    }
  }

  return (
    <AuthLayout showBack={false}>
      <div className="auth-heading auth-heading--center">
        <h1>말모아에 오신 것을 환영해요</h1>
        <p>로그인 또는 가입할 방법을 선택해 주세요</p>
      </div>

      <div className="auth-actions auth-actions--figma">
        <Button fullWidth size="lg" leftIcon={<Mail size={18} />} onClick={() => router.push('/login')}>
          이메일로 계속
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="kakao"
          leftIcon={<MessageCircle size={18} />}
          onClick={() => handleOAuth('kakao')}
        >
          카카오로 계속
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="outline"
          leftIcon={<span className="google-mark">G</span>}
          onClick={() => handleOAuth('google')}
        >
          구글로 계속
        </Button>
      </div>
    </AuthLayout>
  )
}
