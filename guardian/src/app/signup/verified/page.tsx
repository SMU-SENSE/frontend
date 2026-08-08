'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Button } from '../../../components/ui/Button'

export default function VerifiedPage() {
  const router = useRouter()
  return (
    <AuthLayout showBack={false}>
      <div className="verified-block">
        <CheckCircle2 size={44} />
        <h1>이메일 인증이 완료됐어요</h1>
        <Button fullWidth size="lg" onClick={() => router.push('/signup/terms')}>
          다음으로
        </Button>
      </div>
    </AuthLayout>
  )
}
