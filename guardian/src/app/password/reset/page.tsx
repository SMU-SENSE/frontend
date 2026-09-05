'use client'

import { Info } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { useToast } from '../../../components/ui/ToastProvider'

function isValidPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Za-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value) &&
    !/(.)\1\1/.test(value)
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)

  const passwordValid = isValidPassword(password)
  const matches = Boolean(confirm) && password === confirm
  const valid = passwordValid && matches

  const passwordError = passwordTouched && password && !passwordValid
    ? '8자리 이상의 영문, 숫자, 특수문자 조합으로 입력하세요.'
    : passwordTouched && !password
      ? '비밀번호를 입력해 주세요.'
      : undefined
  const confirmError = confirmTouched && !confirm
    ? '비밀번호를 입력해 주세요.'
    : confirmTouched && confirm !== password
      ? '비밀번호가 일치하지 않습니다.'
      : undefined

  return (
    <AuthLayout>
      <div className="auth-heading auth-heading--center">
        <h1>비밀번호 재설정</h1>
        <p>새 비밀번호를 입력해주세요</p>
      </div>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          setPasswordTouched(true)
          setConfirmTouched(true)
          if (!valid) return
          showToast('비밀번호가 변경되었습니다.')
          router.replace('/login')
        }}
      >
        <TextField
          label="새 비밀번호"
          type="password"
          value={password}
          onBlur={() => setPasswordTouched(true)}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호를 입력하세요"
          autoComplete="new-password"
          error={passwordError}
          hint={
            <span className="password-reset-hint">
              <Info size={18} aria-hidden />
              <span>
                <strong>8자리 이상의 영문, 숫자, 특수문자 조합을 입력하세요.</strong>
                <small>(3자 이상의 연속된 동일 문자, 숫자로 설정 불가합니다.)</small>
              </span>
            </span>
          }
        />

        <TextField
          label="새 비밀번호 확인"
          type="password"
          value={confirm}
          onBlur={() => setConfirmTouched(true)}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          autoComplete="new-password"
          error={confirmError}
        />

        <Button type="submit" fullWidth size="lg" disabled={!valid}>
          비밀번호 변경
        </Button>
      </form>

      <div className="auth-helper auth-helper--single-link">
        <Link href="/login">로그인으로 돌아가기</Link>
      </div>
    </AuthLayout>
  )
}
