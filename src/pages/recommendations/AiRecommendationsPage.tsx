import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bot, BookmarkPlus, RefreshCw, Sparkles, WandSparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { recommendationsApi } from '../../api/recommendations'
import { sentencesApi } from '../../api/sentences'
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

  const recommendMutation = useMutation({
    mutationFn: recommendationsApi.recommend,
    onSuccess: setRecommendations,
    onError: (error) => showToast(error.message, 'error'),
  })
  const transformMutation = useMutation({
    mutationFn: recommendationsApi.transform,
    onSuccess: (result) => setTransformed(result.sentence),
    onError: (error) => showToast(error.message, 'error'),
  })
  const saveMutation = useMutation({
    // AI 결과를 자동 저장하지 않아 잘못된 추천이 사용자 데이터에 섞이지 않게 한다.
    mutationFn: (content: string) =>
      sentencesApi.create({ content, categoryId: null, favorite: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentences'] })
      showToast('내 문장에 저장했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const handleRecommend = (event: FormEvent) => {
    event.preventDefault()
    if (!context.trim()) return
    recommendMutation.mutate({ context: context.trim(), tone })
  }

  const handleTransform = (event: FormEvent) => {
    event.preventDefault()
    // 말투 변환에서는 의미 없는 기본 톤 요청을 보내지 않는다.
    if (!sentence.trim() || tone === '기본') return
    transformMutation.mutate({
      sentence: sentence.trim(),
      tone,
    })
  }

  return (
    <div className="page page--narrow">
      <PageHeader
        title="AI 문장 도우미"
        description="상황에 맞는 문장을 추천받거나 내가 쓴 문장의 말투를 자연스럽게 바꿔보세요."
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
                ? '필요한 상황을 짧게 설명해 주세요.'
                : '의미는 유지하면서 선택한 말투로 바꿔드려요.'}
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
            <button type="button" onClick={() => recommendMutation.mutate({ context, tone })}>
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
                >
                  저장
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
          >
            내 문장에 저장
          </Button>
        </Card>
      ) : null}

      <p className="privacy-note">
        민감한 개인정보는 입력하지 마세요. AI 추천 결과는 사용자가 확인한 뒤 저장하도록
        구성했습니다.
      </p>
    </div>
  )
}
