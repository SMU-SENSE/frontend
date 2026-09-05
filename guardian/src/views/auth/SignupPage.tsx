'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '../../api/auth'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useToast } from '../../components/ui/ToastProvider'
import { signupSchema, type SignupForm } from '../../lib/validators'
import { saveOnboardingDraft } from '../../lib/onboardingDraft'

function looksLikeValidPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value) && !/(.)\1\1/.test(value)
}

export default function SignupPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', passwordConfirm: '' },
  })

  const email = watch('email')
  const password = watch('password')
  const passwordConfirm = watch('passwordConfirm')
  const formReady = Boolean(
    name.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
      looksLikeValidPassword(password) &&
      passwordConfirm === password,
  )

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {
      saveOnboardingDraft({ guardianName: name.trim(), guardianEmail: email.trim() })
      showToast('인증 메일을 보냈어요.')
      router.push('/signup/verify')
    },
    onError: (error) => setError('root', { message: error.message }),
  })

  const submit = (values: SignupForm) => {
    setNameTouched(true)
    if (!name.trim()) return
    signupMutation.mutate(values)
  }

  return (
    <AuthLayout>
      <div className="auth-heading auth-heading--center">
        <h1>회원가입</h1>
      </div>
      <form className="auth-form" onSubmit={handleSubmit(submit)}>
        {errors.root?.message ? (
          <div className="form-alert" role="alert">
            {errors.root.message}
          </div>
        ) : null}
        <TextField
          label="이름"
          type="text"
          placeholder="이름을 입력해 주세요"
          value={name}
          onBlur={() => setNameTouched(true)}
          onChange={(event) => setName(event.target.value)}
          error={nameTouched && !name.trim() ? '이름을 입력해 주세요.' : undefined}
        />
        <TextField
          label="이메일"
          type="email"
          placeholder="example@email.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
          autoComplete="new-password"
          error={errors.password?.message}
          hint={
            <span className="password-hint password-hint--figma">
              <Info size={16} />
              <span>
                <strong>8자리 이상의 영문, 숫자, 특수문자 조합을 입력하세요.</strong>
                <small>(3자 이상의 연속된 동일 문자, 숫자로는 설정 불가합니다.)</small>
              </span>
            </span>
          }
          {...register('password')}
        />
        <TextField
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          autoComplete="new-password"
          error={errors.passwordConfirm?.message}
          {...register('passwordConfirm')}
        />
        <Button type="submit" fullWidth size="lg" disabled={!formReady} loading={signupMutation.isPending}>
          인증 메일 보내기
        </Button>
      </form>
      <div className="auth-helper">
        <span>이미 계정이 있나요?</span>
        <Link href="/login">로그인</Link>
      </div>
    </AuthLayout>
  )
}
