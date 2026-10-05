'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, BookmarkPlus, RefreshCw, Sparkles, WandSparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { aacUserApi } from '../../api/aacUsers'
import { guardianLiveApi } from '../../api/guardianLive'
import { recommendationsApi } from '../../api/recommendations'
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/ToastProvider'
import type { Tone } from '../../types/models'

const tones: Tone[] = ['기본', '친근하게', '정중하게', '간단하게']

export default function AiRecommendationsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [mode, setMode] = useState<'recommend' | 'transform'>('recommend')
  const [context, setContext] = useState('')
  const [tone, setTone] = useState<Tone>('기본')
  const [sentence, setSentence] = useState('')
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [transformed, setTransformed] = useState('')

  const usersQuery = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const activeUser = usersQuery.data?.find((item) => item.active) ?? usersQuery.data?.[0] ?? null
  const boardQuery = useQuery({
    queryKey: ['guardian-board', activeUser?.id],
    queryFn: () => guardianLiveApi.board(activeUser!.id),
    enabled: Boolean(activeUser),
  })

  const recommendMutation = useMutation({
    mutationFn: ({ text, selectedTone }: { text: string; selectedTone: Tone }) =>
      recommendationsApi.recommend(activeUser!.id, { context: text, tone: selectedTone }),
    onSuccess: (result) => setRecommendations(result.sentence ? [result.sentence] : []),
    onError: (error) => showToast(error.message, 'error'),
  })

  const transformMutation = useMutation({
    mutationFn: ({ text, selectedTone }: { text: string; selectedTone: Exclude<Tone, '기본'> }) =>
      recommendationsApi.transform(activeUser!.id, {
        sentence: text,
        tone: selectedTone,
      }),
    onSuccess: (result) => setTransformed(result.sentence),
    onError: (error) => showToast(error.message, 'error'),
  })

  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeUser) throw new Error('연결된 AAC 사용자가 없습니다.')
      const board = boardQuery.data ?? await guardianLiveApi.board(activeUser.id)
      let category = board.categories.find((item) => item.name === 'AI 추천') ?? board.categories[0]

      if (!category) {
        category = await guardianLiveApi.createCategory(activeUser.id, {
          name: 'AI 추천',
          color: '#B9D2F3',
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
      showToast('AAC 카드에 저장했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const handleRecommend = (event: FormEvent) => {
    event.preventDefault()
    const text = context.trim()
    if (!text || !activeUser) return
    recommendMutation.mutate({ text, selectedTone: tone })
  }

  const handleTransform = (event: FormEvent) => {
    event.preventDefault()
    const text = sentence.trim()
    if (!text || tone === '기본' || !activeUser) return
    transformMutation.mutate({
      text,
      selectedTone: tone as Exclude<Tone, '기본'>,
    })
  }

  if (usersQuery.isLoading || (activeUser && boardQuery.isLoading)) {
    return <PageLoader label="AI 문장 도우미를 준비하는 중입니다." />
  }

  const queryError = usersQuery.error ?? boardQuery.error
  if (queryError) {
    return <ErrorState message={queryError.message} onRetry={() => {
      usersQuery.refetch()
      boardQuery.refetch()
    }} />
  }

  if (!activeUser) {
    return (
      <div className="page page--narrow">
        <PageHeader title="AI 문장 도우미" description="사용자별 개인화 정보를 바탕으로 문장을 추천합니다." />
        <EmptyState title="등록된 AAC 사용자가 없어요" description="AAC 사용자를 먼저 등록한 뒤 이용해 주세요." />
      </div>
    )
  }

  return (
    <div className="page page--narrow">
      <PageHeader
        title="AI 문장 도우미"
        description="등록된 AAC 사용자의 언어 수준과 카드 사용 정보를 바탕으로 한 문장을 추천받아요."
      />

      <div className="mode-switch" role="tablist" aria-label="AI 기능 선택">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'recommend'}
          className={mode === 'recommend' ? 'is-active' : ''}
          onClick={() => setMode('recommend')}
        >
          <Sparkles size={17} /> 문장 추천
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'transform'}
          className={mode === 'transform' ? 'is-active' : ''}
          onClick={() => setMode('transform')}
        >
          <WandSparkles size={17} /> 말투 변환
        </button>
      </div>

      <Card className="ai-panel">
        <div className="ai-panel__heading">
          <span><Bot size={24} /></span>
          <div>
            <h2>{mode === 'recommend' ? '어떤 상황인가요?' : '어떤 문장을 바꿀까요?'}</h2>
            <p>
              {mode === 'recommend'
                ? '상황을 설명하면 서버의 사용자별 개인화 컨텍스트를 함께 사용합니다.'
                : '현재 백엔드의 단일 AAC 문장 추천 API에 원문과 말투 조건을 함께 전달합니다.'}
            </p>
          </div>
        </div>

        <form onSubmit={mode === 'recommend' ? handleRecommend : handleTransform}>
          <label>
            {mode === 'recommend' ? '상황 설명' : '원본 문장'}
            <textarea
              value={mode === 'recommend' ? context : sentence}
              onChange={(event) =>
                mode === 'recommend'
                  ? setContext(event.target.value)
                  : setSentence(event.target.value)
              }
              placeholder={
                mode === 'recommend'
                  ? '예: 식당에서 메뉴를 주문하려고 해요'
                  : '예: 창문 좀 열어줄래'
              }
              maxLength={300}
            />
          </label>
          <fieldset>
            <legend>원하는 말투</legend>
            <div className="tone-options">
              {tones
                .filter((item) => mode === 'recommend' || item !== '기본')
                .map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={tone === item ? 'is-active' : ''}
                    onClick={() => setTone(item)}
                  >
                    {item}
                  </button>
                ))}
            </div>
          </fieldset>
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={recommendMutation.isPending || transformMutation.isPending}
            disabled={
              mode === 'recommend'
                ? !context.trim()
                : !sentence.trim() || tone === '기본'
            }
          >
            {mode === 'recommend' ? '문장 추천받기' : '말투 변환하기'}
          </Button>
        </form>
      </Card>

      {mode === 'recommend' && recommendations.length > 0 ? (
        <Card className="ai-results">
          <div className="section-heading">
            <div>
              <span className="eyebrow">추천 결과</span>
              <h2>이렇게 말해보세요</h2>
            </div>
            <button
              type="button"
              onClick={() => recommendMutation.mutate({ text: context.trim(), selectedTone: tone })}
            >
              <RefreshCw size={16} /> 다시 추천
            </button>
          </div>
          <ul>
            {recommendations.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<BookmarkPlus size={15} />}
                  onClick={() => saveMutation.mutate(item)}
                  loading={saveMutation.isPending && saveMutation.variables === item}
                >
                  AAC 카드로 저장
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {mode === 'transform' && transformed ? (
        <Card className="transform-result">
          <span className="eyebrow">변환 결과</span>
          <blockquote>{transformed}</blockquote>
          <Button
            variant="outline"
            leftIcon={<BookmarkPlus size={16} />}
            onClick={() => saveMutation.mutate(transformed)}
            loading={saveMutation.isPending && saveMutation.variables === transformed}
          >
            AAC 카드로 저장
          </Button>
        </Card>
      ) : null}

      <p className="privacy-note">
        실제 AI Provider가 백엔드에 설정되지 않은 환경에서는 서버가 503을 반환할 수 있습니다.
        추천 결과는 확인 후에만 AAC 카드로 저장됩니다.
      </p>
    </div>
  )
}
