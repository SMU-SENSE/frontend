'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/ToastProvider'
import { loadOnboardingDraft, saveOnboardingDraft } from '../../../lib/onboardingDraft'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function VerifyEmailPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('example@email.com')
  const [code, setCode] = useState('')
  const [seconds, setSeconds] = useState(600)
  const [sent, setSent] = useState(true)
  const [emailTouched, setEmailTouched] = useState(false)
  const [codeError, setCodeError] = useState('')

  useEffect(() => {
    setEmail(loadOnboardingDraft().guardianEmail ?? 'example@email.com')
  }, [])

  useEffect(() => {
    if (!sent || seconds <= 0) return
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [sent, seconds])

  const time = useMemo(() => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [seconds])

  const trimmedEmail = email.trim()
  const emailValid = emailPattern.test(trimmedEmail)
  const emailError = emailTouched && !trimmedEmail
    ? '이메일을 입력해 주세요.'
    : emailTouched && !emailValid
      ? '올바른 이메일을 입력해 주세요.'
      : ''

  const sendEmail = () => {
    setEmailTouched(true)
    if (!emailValid) return
    saveOnboardingDraft({ guardianEmail: trimmedEmail })
    setSeconds(600)
    setSent(true)
    setCode('')
    setCodeError('')
    showToast('인증 메일을 다시 전송했어요.')
  }

  const verify = () => {
    if (!sent) {
      setCodeError('인증 메일을 먼저 전송해 주세요.')
      return
    }
    if (seconds <= 0) {
      setCodeError('인증번호가 만료됐어요.')
      return
    }
    if (code.length !== 6) {
      setCodeError('인증번호가 올바르지 않습니다.')
      return
    }
    setCodeError('')
    router.push('/signup/verified')
  }

  return (
    <AuthLayout>
      <div className="auth-heading auth-heading--center">
        <h1>이메일 인증</h1>
        <p>인증 메일을 보낸 뒤, 받은 번호가 맞는지 확인해 주세요</p>
      </div>

      <div className="verify-email-row">
        <div className="verify-email-field">
          <label className="form-label" htmlFor="verify-email">이메일</label>
          <input
            id="verify-email"
            className={`verify-email-input ${emailError ? 'verify-email-input--error' : ''}`}
            type="email"
            value={email}
            onBlur={() => setEmailTouched(true)}
            onChange={(event) => {
              setEmail(event.target.value)
              setSent(false)
            }}
            placeholder="example@email.com"
            autoComplete="email"
            aria-invalid={Boolean(emailError)}
          />
          <span className="verify-email-help">메일이 없으면 스팸함을 확인하세요</span>
          {emailError ? <span className="verify-inline-error" role="alert">{emailError}</span> : null}
        </div>
        <button type="button" className="mini-outline-button" onClick={sendEmail}>
          인증 메일 보내기
        </button>
      </div>

      <div className="auth-form verify-code-form">
        <label className={`code-field-wrap ${codeError ? 'code-field-wrap--error' : ''}`}>
          <span className="form-label">인증번호</span>
          <input
            className="code-field"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              setCodeError('')
            }}
            placeholder="6자리 숫자"
            aria-describedby="verification-time"
            aria-invalid={Boolean(codeError)}
          />
        </label>
        <div className={`verify-meta ${codeError ? 'verify-meta--error' : ''}`} id="verification-time">
          {codeError ? null : <><span>남은 시간 {time}</span><span aria-hidden="true">·</span></>}
          <button type="button" onClick={sendEmail}>다시 보내기</button>
        </div>
        {codeError ? <span className="verify-inline-error" role="alert">{codeError}</span> : null}
        <Button fullWidth size="lg" onClick={verify}>
          인증번호 확인
        </Button>
      </div>
    </AuthLayout>
  )
}
