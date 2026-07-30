import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookmarkPlus,
  FolderPlus,
  Heart,
  MessageSquarePlus,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  categoriesApi,
  sentencesApi,
  type SentenceListType,
} from '../../api/sentences'
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/ToastProvider'

const tabs: Array<{ value: SentenceListType; label: string }> = [
  { value: 'all', label: '전체 문장' },
  { value: 'favorite', label: '즐겨찾기' },
  { value: 'recent', label: '최근 사용' },
]

export default function SentencesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as SentenceListType | null) ?? 'all'
  const [keyword, setKeyword] = useState('')
  const [sentenceInput, setSentenceInput] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryColor, setCategoryColor] = useState('#56a276')
  const [showAddSentence, setShowAddSentence] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const sentenceQuery = useQuery({
    queryKey: ['sentences', tab],
    queryFn: () => sentencesApi.list(tab),
  })
  const categoryQuery = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })

  // 문장 변경은 즐겨찾기·최근 목록과 카테고리 개수에 동시에 영향을 준다.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sentences'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  const createSentence = useMutation({
    mutationFn: sentencesApi.create,
    onSuccess: () => {
      invalidate()
      setSentenceInput('')
      setShowAddSentence(false)
      showToast('문장을 저장했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })
  const createCategory = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: (category) => {
      invalidate()
      setCategoryId(category.id)
      setCategoryName('')
      setShowAddCategory(false)
      showToast('카테고리를 만들었어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })
  const favoriteMutation = useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      sentencesApi.setFavorite(id, favorite),
    onSuccess: invalidate,
    onError: (error) => showToast(error.message, 'error'),
  })
  const useMutationRecord = useMutation({
    mutationFn: sentencesApi.markUsed,
    onSuccess: () => {
      invalidate()
      showToast('최근 사용 문장에 기록했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })
  const deleteSentence = useMutation({
    mutationFn: sentencesApi.remove,
    onSuccess: () => {
      invalidate()
      showToast('문장을 삭제했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const filtered = useMemo(() => {
    // 검색은 이미 가져온 현재 탭 데이터에서 즉시 처리해 불필요한 API 호출을 피한다.
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return sentenceQuery.data ?? []
    return (sentenceQuery.data ?? []).filter((sentence) =>
      sentence.content.toLowerCase().includes(normalized),
    )
  }, [keyword, sentenceQuery.data])

  const handleSentenceSubmit = (event: FormEvent) => {
    event.preventDefault()
    const content = sentenceInput.trim()
    // 공백만 있는 문장은 서버로 보내지 않는다.
    if (!content) return
    createSentence.mutate({ content, categoryId: categoryId || null })
  }

  const handleCategorySubmit = (event: FormEvent) => {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return
    createCategory.mutate({ name, color: categoryColor })
  }

  if (sentenceQuery.isLoading || categoryQuery.isLoading) return <PageLoader />
  const error = sentenceQuery.error ?? categoryQuery.error
  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => {
          sentenceQuery.refetch()
          categoryQuery.refetch()
        }}
      />
    )
  }

  return (
    <div className="page">
      <PageHeader
        title="내 문장"
        description="자주 쓰는 문장을 카테고리별로 저장하고 빠르게 찾을 수 있어요."
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<FolderPlus size={17} />}
              onClick={() => setShowAddCategory((value) => !value)}
            >
              카테고리 추가
            </Button>
            <Button
              leftIcon={<MessageSquarePlus size={17} />}
              onClick={() => setShowAddSentence((value) => !value)}
            >
              문장 추가
            </Button>
          </>
        }
      />

      {showAddCategory ? (
        <Card className="inline-editor">
          <form onSubmit={handleCategorySubmit}>
            <label>
              카테고리 이름
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="예: 학교"
                maxLength={20}
              />
            </label>
            <label>
              색상
              <input
                type="color"
                value={categoryColor}
                onChange={(event) => setCategoryColor(event.target.value)}
              />
            </label>
            <Button type="submit" loading={createCategory.isPending} disabled={!categoryName.trim()}>
              추가
            </Button>
          </form>
        </Card>
      ) : null}

      {showAddSentence ? (
        <Card className="inline-editor">
          <form onSubmit={handleSentenceSubmit}>
            <label className="inline-editor__grow">
              새 문장
              <input
                value={sentenceInput}
                onChange={(event) => setSentenceInput(event.target.value)}
                placeholder="저장할 문장을 입력해 주세요"
                maxLength={120}
              />
            </label>
            <label>
              카테고리
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">미지정</option>
                {categoryQuery.data?.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" loading={createSentence.isPending} disabled={!sentenceInput.trim()}>
              저장
            </Button>
          </form>
        </Card>
      ) : null}

      <section className="category-strip" aria-label="내 카테고리">
        {categoryQuery.data?.map((category) => (
          <div className="category-pill" key={category.id}>
            <span style={{ backgroundColor: category.color }} aria-hidden />
            <strong>{category.name}</strong>
            <small>{category.sentenceCount}</small>
          </div>
        ))}
        <button type="button" onClick={() => setShowAddCategory(true)}>
          <Plus size={16} /> 추가
        </button>
      </section>

      <Card className="sentence-manager">
        <div className="sentence-toolbar">
          <div className="tabs" role="tablist" aria-label="문장 필터">
            {tabs.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={tab === item.value}
                className={tab === item.value ? 'is-active' : ''}
                onClick={() =>
                  setSearchParams(item.value === 'all' ? {} : { tab: item.value })
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={17} aria-hidden />
            <span className="sr-only">문장 검색</span>
            <input
              type="search"
              placeholder="문장 검색"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={keyword ? '검색 결과가 없어요' : '저장된 문장이 없어요'}
            description={keyword ? '다른 검색어를 입력해 보세요.' : '자주 쓰는 문장을 추가해 보세요.'}
            action={
              !keyword ? (
                <Button leftIcon={<BookmarkPlus size={17} />} onClick={() => setShowAddSentence(true)}>
                  문장 추가
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="sentence-list">
            {filtered.map((sentence) => (
              <li key={sentence.id}>
                <button
                  className={`favorite-button ${sentence.favorite ? 'is-active' : ''}`}
                  type="button"
                  aria-label={sentence.favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  onClick={() =>
                    favoriteMutation.mutate({
                      id: sentence.id,
                      favorite: !sentence.favorite,
                    })
                  }
                >
                  <Heart size={19} fill={sentence.favorite ? 'currentColor' : 'none'} />
                </button>
                <div className="sentence-list__content">
                  <strong>{sentence.content}</strong>
                  <span>
                    {sentence.categoryName ?? '미지정'} · 사용 {sentence.useCount}회
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Play size={15} />}
                  onClick={() => useMutationRecord.mutate(sentence.id)}
                >
                  사용
                </Button>
                <button
                  className="icon-button icon-button--danger"
                  type="button"
                  aria-label={`${sentence.content} 삭제`}
                  onClick={() => {
                    if (window.confirm('이 문장을 삭제할까요?')) {
                      deleteSentence.mutate(sentence.id)
                    }
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
