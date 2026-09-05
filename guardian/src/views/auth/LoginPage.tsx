'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '../../api/auth'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useToast } from '../../components/ui/ToastProvider'
import { loginSchema, type LoginForm } from '../../lib/validators'
import { useAuthStore } from '../../stores/authStore'

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const setSession = useAuthStore((state) => state.setSession)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      setSession(session)
      showToast('로그인되었습니다.')
      const from = sessionStorage.getItem('malmoa-login-return-to')
      sessionStorage.removeItem('malmoa-login-return-to')
      router.replace(from ?? '/')
    },
    onError: () => {
      setError('root', { message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    },
  })

  return (
    <AuthLayout showBack={false}>
      <div className="auth-heading auth-heading--center">
        <h1>이메일 로그인</h1>
      </div>
      <form className="auth-form" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
        {errors.root?.message ? (
          <div className="form-alert" role="alert">
            {errors.root.message}
          </div>
        ) : null}
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" fullWidth size="lg" disabled={!isValid} loading={loginMutation.isPending}>
          로그인
        </Button>
      </form>
      <div className="auth-links auth-links--split">
        <Link href="/signup">회원가입</Link>
        <span aria-hidden="true">|</span>
        <Link href="/password/find">비밀번호 찾기</Link>
      </div>
    </AuthLayout>
  )
}
