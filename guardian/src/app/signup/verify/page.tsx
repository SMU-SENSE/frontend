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

  const resend = () => {
    setSeconds(600)
    setCode('')
    showToast('인증 메일을 다시 전송했어요.')
  }

  return (
    <AuthLayout>
      <div className="auth-heading auth-heading--center">
        <h1>이메일 인증</h1>
        <p>인증 메일을 보낸 뒤, 받은 번호가 맞는지 확인해 주세요</p>
      </div>

      <div className="verify-email-row">
        <div className="verify-email-field">
          <span className="form-label">이메일</span>
          <div className="readonly-field">{email}</div>
          <span className="verify-email-help">메일이 없으면 스팸함을 확인하세요</span>
        </div>
        <button type="button" className="mini-outline-button" onClick={resend}>
          인증 메일 보내기
        </button>
      </div>

      <div className="auth-form verify-code-form">
        <label className="code-field-wrap">
          <span className="form-label">인증번호</span>
          <input
            className="code-field"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6자리 숫자"
            aria-describedby="verification-time"
          />
        </label>
        <div className="verify-meta" id="verification-time">
          <span>남은 시간 {time}</span>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={resend}>다시 보내기</button>
        </div>
        <Button
          fullWidth
          size="lg"
          disabled={code.length !== 6 || seconds === 0}
          onClick={() => {
            if (seconds === 0) {
              showToast('인증번호가 만료됐어요.', 'error')
              return
            }
            router.push('/signup/verified')
          }}
        >
          인증번호 확인
        </Button>
      </div>
    </AuthLayout>
  )
}
