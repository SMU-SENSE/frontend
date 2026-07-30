import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Mail, UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { userApi } from '../../api/user'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { TextField } from '../../components/ui/TextField'
import { useToast } from '../../components/ui/ToastProvider'
import { useAuthStore } from '../../stores/authStore'

const profileSchema = z.object({
  nickname: z.string().trim().min(2, '닉네임은 2자 이상 입력해 주세요.').max(20),
  name: z.string().trim().max(30, '이름은 30자 이내로 입력해 주세요.'),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const updateUser = useAuthStore((state) => state.updateUser)
  const userQuery = useQuery({ queryKey: ['user', 'me'], queryFn: userApi.getMe })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nickname: '', name: '' },
  })

  useEffect(() => {
    // 비동기로 받은 서버 값을 폼 초기값에 반영한다.
    if (userQuery.data) {
      reset({
        nickname: userQuery.data.nickname,
        name: userQuery.data.name ?? '',
      })
    }
  }, [reset, userQuery.data])

  const mutation = useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: (user) => {
      // 서버 캐시와 헤더가 읽는 세션 요약을 동시에 갱신해 표시 불일치를 막는다.
      updateUser(user)
      queryClient.setQueryData(['user', 'me'], user)
      reset({ nickname: user.nickname, name: user.name ?? '' })
      showToast('프로필을 저장했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  if (userQuery.isLoading) return <PageLoader />
  if (userQuery.error) {
    return <ErrorState message={userQuery.error.message} onRetry={() => userQuery.refetch()} />
  }

  const user = userQuery.data
  if (!user) return null

  return (
    <div className="page page--narrow">
      <PageHeader title="내 프로필" description="사용자 계정 정보를 확인하고 수정할 수 있어요." />
      <Card className="profile-summary">
        <div className="avatar avatar--large">{user.nickname.slice(0, 1)}</div>
        <div>
          <h2>{user.nickname}</h2>
          <p>말모아와 함께한 정보를 안전하게 관리해요.</p>
        </div>
      </Card>

      <Card>
        <form className="profile-form" onSubmit={handleSubmit((value) => mutation.mutate(value))}>
          <div className="profile-meta">
            <div>
              <Mail size={18} />
              <span>이메일</span>
              <strong>{user.email}</strong>
            </div>
            <div>
              <CalendarDays size={18} />
              <span>가입일</span>
              <strong>{new Date(user.joinedAt).toLocaleDateString('ko-KR')}</strong>
            </div>
          </div>
          <TextField
            label="닉네임"
            placeholder="화면에 표시할 이름"
            leadingIcon={<UserRound size={17} />}
            error={errors.nickname?.message}
            {...register('nickname')}
          />
          <TextField
            label="이름"
            placeholder="선택 입력"
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                reset({ nickname: user.nickname, name: user.name ?? '' })
              }
              disabled={!isDirty || mutation.isPending}
            >
              취소
            </Button>
            <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
              변경사항 저장
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
