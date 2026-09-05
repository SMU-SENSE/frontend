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
  const [nameTouched, setNameTouched] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '', passwordConfirm: '' },
  })

  const email = watch('email')

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {
      saveOnboardingDraft({ guardianName: name.trim(), guardianEmail: email.trim() })
      showToast('인증 메일을 보냈어요.')
      router.push('/signup/verify')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('이미 가입') || message.includes('already') || message.includes('duplicate')) {
        setError('email', { message: '이미 가입된 이메일입니다.' })
        return
      }
      setError('root', { message: message || '회원가입 요청을 처리하지 못했어요.' })
    },
  })

  const submit = (values: SignupForm) => {
    if (!name.trim()) return
    signupMutation.mutate(values)
  }

  return (
    <AuthLayout>
      <div className="auth-heading auth-heading--center">
        <h1>회원가입</h1>
      </div>
      <form
        className="auth-form auth-form--signup"
        onSubmit={(event) => {
          setNameTouched(true)
          void handleSubmit(submit)(event)
        }}
      >
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
