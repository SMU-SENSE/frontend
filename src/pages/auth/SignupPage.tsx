import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useToast } from '../../components/ui/ToastProvider'
import { signupSchema, type SignupForm } from '../../lib/validators'

export default function SignupPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', passwordConfirm: '' },
  })

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {
      showToast('회원가입이 완료되었습니다. 로그인해 주세요.')
      navigate('/login', { replace: true })
    },
    onError: (error) => setError('root', { message: error.message }),
  })

  return (
    <AuthLayout>
      <div className="auth-heading">
        <h1>회원가입</h1>
        <p>말모아에서 사용할 계정을 만들어 주세요.</p>
      </div>
      <form
        className="auth-form"
        onSubmit={handleSubmit((values) => signupMutation.mutate(values))}
      >
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
          autoComplete="new-password"
          error={errors.password?.message}
          hint={
            <span className="password-hint">
              <Info size={15} />
              8자 이상, 영문·숫자·특수문자를 조합해 주세요.
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
          회원가입
        </Button>
      </form>
      <div className="auth-helper">
        <span>이미 계정이 있나요?</span>
        <Link to="/login">로그인</Link>
      </div>
    </AuthLayout>
  )
}
