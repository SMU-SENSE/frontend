'use client'

import { Mail, MessageCircle, MoveRight } from 'lucide-react'
import Link from 'next/link'
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
        // 외부 OAuth 페이지로 이동하지 않고 현재 Mock 테스트 흐름을 유지한다.
        showToast('Mock 모드에서는 이메일 로그인으로 기능을 확인해 주세요.')
        return
      }
      window.location.assign(redirectUrl)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '소셜 로그인을 시작하지 못했어요.', 'error')
    }
  }

  return (
    <AuthLayout showBack={false}>
      <div className="auth-heading">
        <span className="eyebrow">AAC communication</span>
        <h1>말모아에 오신 것을 환영해요</h1>
        <p>로그인 또는 가입 방법을 선택해 주세요.</p>
      </div>

      <div className="auth-actions">
        <Button
          fullWidth
          size="lg"
          leftIcon={<Mail size={19} />}
          onClick={() => router.push('/login')}
        >
          이메일로 계속
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="kakao"
          leftIcon={<MessageCircle size={19} />}
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

      <div className="auth-helper">
        <span>아직 계정이 없나요?</span>
        <Link href="/signup">
          회원가입 <MoveRight size={15} />
        </Link>
      </div>

      {apiConfig.useMockApi ? (
        <div className="demo-account">
          <strong>바로 확인할 수 있는 데모 계정</strong>
          <span>demo@malmoa.app / Malmoa!123</span>
        </div>
      ) : null}
    </AuthLayout>
  )
}
