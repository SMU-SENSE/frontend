'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { useToast } from '../../../components/ui/ToastProvider'

export default function FindPasswordPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')

  return (
    <AuthLayout>
      <div className="auth-heading auth-heading--center">
        <h1>비밀번호 찾기</h1>
        <p>가입한 이메일로 재설정 링크를 보내드릴게요.</p>
      </div>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!email.trim()) return
          showToast('비밀번호 재설정 메일을 보냈어요.')
          router.push(`/password/reset?email=${encodeURIComponent(email)}`)
        }}
      >
        <TextField
          label="이메일"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="example@email.com"
        />
        <Button type="submit" fullWidth size="lg" disabled={!email.trim()}>
          재설정 링크 보내기
        </Button>
      </form>
    </AuthLayout>
  )
}
