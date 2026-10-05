'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookmarkPlus, Clock3, Sparkles } from 'lucide-react'
import { aacUserApi } from '../../api/aacUsers'
import { guardianLiveApi } from '../../api/guardianLive'
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/ToastProvider'

function daysLabel(days: string[]) {
  if (days.length >= 7) return '매일'
  const labels: Record<string, string> = {
    MONDAY: '월',
    TUESDAY: '화',
    WEDNESDAY: '수',
    THURSDAY: '목',
    FRIDAY: '금',
    SATURDAY: '토',
    SUNDAY: '일',
  }
  return days.map((day) => labels[day] ?? day).join('·')
}

export default function RoutineRecommendationsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const usersQuery = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const activeUser = usersQuery.data?.find((item) => item.active) ?? usersQuery.data?.[0] ?? null
  const routineQuery = useQuery({
    queryKey: ['guardian-routines', activeUser?.id],
    queryFn: () => guardianLiveApi.routines(activeUser!.id),
    enabled: Boolean(activeUser),
    staleTime: 60 * 1000,
  })
  const boardQuery = useQuery({
    queryKey: ['guardian-board', activeUser?.id],
    queryFn: () => guardianLiveApi.board(activeUser!.id),
    enabled: Boolean(activeUser),
  })

  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeUser) throw new Error('연결된 AAC 사용자가 없습니다.')
      const board = boardQuery.data ?? await guardianLiveApi.board(activeUser.id)
      let category = board.categories.find((item) => item.name === '루틴') ?? board.categories[0]

      if (!category) {
        category = await guardianLiveApi.createCategory(activeUser.id, {
          name: '루틴',
          color: '#A9DDBB',
          displayOrder: 0,
        })
      }

      const displayOrder = Math.max(-1, ...board.cards.map((item) => item.displayOrder)) + 1
      return guardianLiveApi.createCard(activeUser.id, {
        categoryId: category.id,
        text: content,
        ttsText: content,
        displayOrder,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-board', activeUser?.id] })
      showToast('루틴 문장을 AAC 카드로 저장했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  if (usersQuery.isLoading || (activeUser && (routineQuery.isLoading || boardQuery.isLoading))) {
    return <PageLoader label="서버의 루틴을 불러오는 중입니다." />
  }

  const error = usersQuery.error ?? routineQuery.error ?? boardQuery.error
  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => {
          usersQuery.refetch()
          routineQuery.refetch()
          boardQuery.refetch()
        }}
      />
    )
  }

  if (!activeUser) {
    return (
      <div className="page">
        <PageHeader title="루틴 기반 문장 추천" description="등록된 루틴의 문장을 AAC 카드로 활용할 수 있어요." />
        <EmptyState title="등록된 AAC 사용자가 없어요" description="사용자를 먼저 등록해 주세요." />
      </div>
    )
  }

  const routines = routineQuery.data ?? []

  return (
    <div className="page">
      <PageHeader
        title="루틴 기반 문장 추천"
        description="백엔드에 저장된 실제 루틴의 시간과 문장을 불러와 AAC 카드로 활용해요."
      />

      {routines.length === 0 ? (
        <EmptyState
          title="등록된 루틴이 없어요"
          description="환경 설정의 루틴 스케줄러에서 먼저 루틴을 추가해 주세요."
        />
      ) : (
        <div className="recommendation-grid">
          {routines.map((routine) => (
            <Card className="routine-card" key={routine.id}>
              <div className="routine-card__heading">
                <span><Sparkles size={19} /></span>
                <div>
                  <h2>{routine.title}</h2>
                  <p>{routine.message}</p>
                </div>
              </div>
              <div className="routine-card__time">
                <Clock3 size={15} /> {routine.timeOfDay.slice(0, 5)} · {daysLabel(routine.daysOfWeek)}
                {!routine.enabled ? ' · 사용 안 함' : ''}
              </div>
              <ul>
                <li>
                  <span>{routine.message}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<BookmarkPlus size={15} />}
                    onClick={() => saveMutation.mutate(routine.message)}
                    loading={
                      saveMutation.isPending &&
                      saveMutation.variables === routine.message
                    }
                  >
                    AAC 카드로 저장
                  </Button>
                </li>
              </ul>
            </Card>
          ))}
        </div>
      )}

      <p className="privacy-note">
        이 화면은 별도의 가짜 추천 API를 사용하지 않고, 서버에 실제 저장된 사용자 루틴을 표시합니다.
      </p>
    </div>
  )
}
