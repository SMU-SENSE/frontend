import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .min(1, '이메일을 입력해 주세요.')
  .email('올바른 이메일을 입력해 주세요.')

export const passwordSchema = z
  .string()
  .min(8, '8자리 이상의 영문, 숫자, 특수문자 조합으로 입력해 주세요.')
  .refine((value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value), {
    message: '8자리 이상의 영문, 숫자, 특수문자 조합으로 입력해 주세요.',
  })
  .refine((value) => !/(.)\1\1/.test(value), {
    message: '3자 이상 연속된 동일 문자·숫자는 사용할 수 없습니다.',
  })

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
})

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, '비밀번호를 다시 입력해 주세요.'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다.',
  })

export type LoginForm = z.infer<typeof loginSchema>
export type SignupForm = z.infer<typeof signupSchema>
