'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { useToast } from '../../../components/ui/ToastProvider'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const valid = password.length >= 8 && password === confirm

  return (
    <AuthLayout>
      <div className="auth-heading auth-heading--center">
        <h1>비밀번호 재설정</h1>
        <p>새 비밀번호를 입력해 주세요.</p>
      </div>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!valid) return
          showToast('비밀번호가 변경되었습니다.')
          router.replace('/login')
        }}
      >
        <TextField label="새 비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextField label="새 비밀번호 확인" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" fullWidth size="lg" disabled={!valid}>
          비밀번호 변경
        </Button>
      </form>
    </AuthLayout>
  )
}
