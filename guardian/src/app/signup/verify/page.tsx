'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/ToastProvider'
import { loadOnboardingDraft } from '../../../lib/onboardingDraft'

export default function VerifyEmailPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('example@email.com')
  const [code, setCode] = useState('')
  const [seconds, setSeconds] = useState(600)

  useEffect(() => {
    setEmail(loadOnboardingDraft().guardianEmail ?? 'example@email.com')
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const time = useMemo(() => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [seconds])

  return (
    <AuthLayout>
      <div className="auth-heading auth-heading--center">
        <h1>이메일 인증</h1>
        <p>가입한 이메일로 보낸 인증번호 6자리를 입력해 주세요.</p>
      </div>
      <div className="verify-email-row">
        <div>
          <span className="form-label">이메일</span>
          <div className="readonly-field">{email}</div>
        </div>
        <button
          type="button"
          className="mini-outline-button"
          onClick={() => {
            setSeconds(600)
            showToast('인증 메일을 다시 보냈어요.')
          }}
        >
          인증 메일 재전송
        </button>
      </div>
      <div className="auth-form">
        <label className="code-field-wrap">
          <span className="form-label">인증번호</span>
          <input
            className="code-field"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6자리 숫자"
          />
          <span className="verify-timer">{time}</span>
        </label>
        <Button fullWidth size="lg" disabled={code.length !== 6} onClick={() => router.push('/signup/verified')}>
          인증번호 확인
        </Button>
      </div>
    </AuthLayout>
  )
}
