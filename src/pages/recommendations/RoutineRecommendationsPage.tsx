'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookmarkPlus, Clock3, Sparkles } from 'lucide-react'
import { recommendationsApi } from '../../api/recommendations'
import { sentencesApi } from '../../api/sentences'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/ToastProvider'

export default function RoutineRecommendationsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const routineQuery = useQuery({
    queryKey: ['recommendations', 'routine'],
    queryFn: recommendationsApi.getRoutine,
    staleTime: 5 * 60 * 1000,
  })
  const saveMutation = useMutation({
    // 추천 문장은 사용자가 저장을 눌렀을 때만 일반 문장 데이터가 된다.
    mutationFn: (content: string) =>
      sentencesApi.create({ content, categoryId: null, favorite: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentences'] })
      showToast('내 문장에 저장했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  if (routineQuery.isLoading) return <PageLoader label="오늘의 루틴을 분석하는 중입니다." />
  if (routineQuery.error) {
    return (
      <ErrorState
        message={routineQuery.error.message}
        onRetry={() => routineQuery.refetch()}
      />
    )
  }

  return (
    <div className="page">
      <PageHeader
        title="루틴 기반 문장 추천"
        description="사용 시간과 최근 기록을 바탕으로 지금 필요할 가능성이 높은 문장을 보여드려요."
      />
      <div className="recommendation-grid">
        {routineQuery.data?.map((routine) => (
          <Card className="routine-card" key={routine.id}>
            <div className="routine-card__heading">
              <span><Sparkles size={19} /></span>
              <div>
                <h2>{routine.title}</h2>
                <p>{routine.description}</p>
              </div>
            </div>
            <div className="routine-card__time">
              <Clock3 size={15} /> {routine.timeLabel}
            </div>
            <ul>
              {routine.sentences.map((sentence) => (
                <li key={sentence.id}>
                  <span>{sentence.content}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<BookmarkPlus size={15} />}
                    onClick={() => saveMutation.mutate(sentence.content)}
                    loading={
                      saveMutation.isPending &&
                      saveMutation.variables === sentence.content
                    }
                  >
                    저장
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <p className="privacy-note">
        추천은 사용자의 저장 문장과 사용 시각만 활용하며, 실제 Spring Boot 연동 시 서버 정책에
        맞춰 추천 근거를 조정할 수 있습니다.
      </p>
    </div>
  )
}
