'use client'

import { useRouter } from 'next/navigation'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Button } from '../../../components/ui/Button'

export default function VerifiedPage() {
  const router = useRouter()

  return (
    <AuthLayout showBack={false}>
      <div className="verified-block verified-block--figma">
        <h1>이메일 인증이 완료됐어요</h1>
        <Button fullWidth size="lg" onClick={() => router.push('/signup/terms')}>
          다음으로
        </Button>
      </div>
    </AuthLayout>
  )
}
