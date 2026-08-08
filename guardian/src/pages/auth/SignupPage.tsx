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

export default function SignupPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [name, setName] = useState('')
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

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {
      const email = watch('email')
      saveOnboardingDraft({ guardianName: name.trim(), guardianEmail: email })
      showToast('인증 메일을 보냈어요.')
      router.push('/signup/verify')
    },
    onError: (error) => setError('root', { message: error.message }),
  })

  const submit = (values: SignupForm) => {
    if (!name.trim()) {
      setError('root', { message: '이름을 입력해 주세요.' })
      return
    }
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
          onChange={(event) => setName(event.target.value)}
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
              <Info size={14} />
              8자 이상, 영문·숫자·특수문자를 포함해 주세요.
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
        <Button type="submit" fullWidth size="lg" loading={signupMutation.isPending}>
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
