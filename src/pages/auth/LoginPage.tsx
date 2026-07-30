import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useToast } from '../../components/ui/ToastProvider'
import { loginSchema, type LoginForm } from '../../lib/validators'
import { useAuthStore } from '../../stores/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const setSession = useAuthStore((state) => state.setSession)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      // 인증 성공 시 전역 세션을 먼저 저장한 뒤 보호된 원래 경로로 복귀한다.
      setSession(session)
      showToast('로그인되었습니다.')
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/', { replace: true })
    },
    onError: (error) => {
      // 서버 인증 오류는 특정 필드보다 폼 전체 오류로 보여주는 것이 자연스럽다.
      setError('root', { message: error.message })
    },
  })

  return (
    <AuthLayout>
      <div className="auth-heading">
        <h1>이메일 로그인</h1>
        <p>등록한 이메일과 비밀번호를 입력해 주세요.</p>
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
        <Button type="submit" fullWidth size="lg" loading={loginMutation.isPending}>
          로그인
        </Button>
      </form>
      <div className="auth-links">
        <Link to="/signup">회원가입</Link>
      </div>
    </AuthLayout>
  )
}
