import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .min(1, '이메일을 입력해 주세요.')
  .email('올바른 이메일 형식이 아닙니다.')

export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다.')
  .regex(/[A-Za-z]/, '영문을 한 글자 이상 포함해 주세요.')
  .regex(/[0-9]/, '숫자를 한 글자 이상 포함해 주세요.')
  .regex(/[^A-Za-z0-9]/, '특수문자를 한 글자 이상 포함해 주세요.')
  // 기획서의 "동일 문자 3회 연속 제한"을 정규식으로 검사한다.
  .refine((value) => !/(.)\1\1/.test(value), {
    message: '같은 문자를 3번 연속 사용할 수 없습니다.',
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
  // 개별 필드 검사 후 두 비밀번호의 관계를 검사해 오류를 확인 필드에 표시한다.
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다.',
  })

export type LoginForm = z.infer<typeof loginSchema>
export type SignupForm = z.infer<typeof signupSchema>
