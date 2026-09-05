'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { useToast } from '../../../components/ui/ToastProvider'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function FindPasswordPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)

  const trimmedEmail = email.trim()
  const validEmail = emailPattern.test(trimmedEmail)
  const error = touched && !trimmedEmail
    ? '이메일을 입력해 주세요.'
    : touched && !validEmail
      ? '올바른 이메일을 입력해 주세요.'
      : undefined

  return (
    <AuthLayout>
      <div className="auth-heading auth-heading--center">
        <h1>비밀번호 찾기</h1>
        <p>가입한 이메일로 재설정 링크를 보내드려요</p>
      </div>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          setTouched(true)
          if (!validEmail) return
          showToast('비밀번호 재설정 메일을 보냈어요.')
          router.push(`/password/reset?email=${encodeURIComponent(trimmedEmail)}`)
        }}
      >
        <TextField
          label="이메일"
          type="email"
          value={email}
          onBlur={() => setTouched(true)}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="example@email.com"
          autoComplete="email"
          error={error}
        />
        <Button type="submit" fullWidth size="lg">
          인증 메일 보내기
        </Button>
      </form>

      <div className="auth-helper auth-helper--single-link">
        <Link href="/login">로그인으로 돌아가기</Link>
      </div>
    </AuthLayout>
  )
}
