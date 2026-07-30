import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Bot,
  Clock3,
  Heart,
  MessageSquareText,
  Play,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { recommendationsApi } from '../../api/recommendations'
import { categoriesApi, sentencesApi } from '../../api/sentences'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/ToastProvider'
import { useAuthStore } from '../../stores/authStore'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.session?.user)
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  // 대시보드는 여러 사용자 데이터의 요약 화면이므로 쿼리를 독립적으로 캐시한다.
  const categories = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const favorites = useQuery({
    queryKey: ['sentences', 'favorite'],
    queryFn: () => sentencesApi.list('favorite'),
  })
  const recent = useQuery({
    queryKey: ['sentences', 'recent'],
    queryFn: () => sentencesApi.list('recent'),
  })
  const routines = useQuery({
    queryKey: ['recommendations', 'routine'],
    queryFn: recommendationsApi.getRoutine,
    staleTime: 5 * 60 * 1000,
  })

  const markUsed = useMutation({
    mutationFn: sentencesApi.markUsed,
    onSuccess: () => {
      // prefix 키를 무효화하면 전체/즐겨찾기/최근 목록이 함께 최신화된다.
      queryClient.invalidateQueries({ queryKey: ['sentences'] })
      showToast('최근 사용 문장에 기록했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const isLoading =
    categories.isLoading || favorites.isLoading || recent.isLoading || routines.isLoading
  const error = categories.error ?? favorites.error ?? recent.error ?? routines.error

  if (isLoading) return <PageLoader label="사용자 데이터를 불러오는 중입니다." />
  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => {
          categories.refetch()
          favorites.refetch()
          recent.refetch()
          routines.refetch()
        }}
      />
    )
  }

  const favoriteItems = favorites.data ?? []
  const recentItems = recent.data ?? []
  const routine = routines.data?.[0]

  return (
    <div className="page">
      <PageHeader
        title={`${user?.nickname ?? '사용자'}님, 안녕하세요`}
        description="자주 사용하는 문장과 오늘의 추천을 한눈에 확인하세요."
      />

      <section className="metric-grid" aria-label="사용 현황">
        <Card className="metric-card">
          <span className="metric-card__icon metric-card__icon--green">
            <MessageSquareText size={21} />
          </span>
          <div>
            <span>내 카테고리</span>
            <strong>{categories.data?.length ?? 0}</strong>
          </div>
        </Card>
        <Card className="metric-card">
          <span className="metric-card__icon metric-card__icon--pink">
            <Heart size={21} />
          </span>
          <div>
            <span>즐겨찾기</span>
            <strong>{favoriteItems.length}</strong>
          </div>
        </Card>
        <Card className="metric-card">
          <span className="metric-card__icon metric-card__icon--purple">
            <Clock3 size={21} />
          </span>
          <div>
            <span>최근 사용</span>
            <strong>{recentItems.length}</strong>
          </div>
        </Card>
      </section>

      <div className="dashboard-grid">
        <Card className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>자주 쓰는 문장</h2>
              <p>즐겨찾기한 문장을 빠르게 기록할 수 있어요.</p>
            </div>
            <Link to="/sentences?tab=favorite">
              전체 보기 <ArrowRight size={16} />
            </Link>
          </div>
          <div className="quick-sentence-list">
            {favoriteItems.slice(0, 4).map((sentence) => (
              <button
                type="button"
                key={sentence.id}
                onClick={() => markUsed.mutate(sentence.id)}
                disabled={markUsed.isPending}
              >
                <span>{sentence.content}</span>
                <Play size={17} aria-label="사용 기록" />
              </button>
            ))}
          </div>
        </Card>

        <Card className="dashboard-section recommendation-preview">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <Sparkles size={14} /> 오늘의 루틴
              </span>
              <h2>{routine?.title ?? '추천 준비 중'}</h2>
              <p>{routine?.description}</p>
            </div>
          </div>
          <div className="recommendation-chips">
            {routine?.sentences.slice(0, 3).map((sentence) => (
              <span key={sentence.id}>{sentence.content}</span>
            ))}
          </div>
          <Link className="card-link" to="/recommendations/routine">
            루틴 추천 열기 <ArrowRight size={16} />
          </Link>
        </Card>
      </div>

      <section className="feature-banner">
        <span className="feature-banner__icon">
          <Bot size={28} />
        </span>
        <div>
          <span className="eyebrow">AI recommendation</span>
          <h2>상황에 맞는 문장이 떠오르지 않나요?</h2>
          <p>상황과 말투를 선택하면 자연스러운 표현을 추천해 드려요.</p>
        </div>
        <Link to="/recommendations/ai">
          AI 문장 추천 <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  )
}
