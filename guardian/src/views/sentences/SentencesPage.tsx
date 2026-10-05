'use client'

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
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { aacUserApi } from '../../api/aacUsers'
import { apiConfig } from '../../api/client'
import { guardianLiveApi, type LiveId } from '../../api/guardianLive'
import { recommendationsApi } from '../../api/recommendations'
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/ToastProvider'
import { speakKorean } from '../../lib/koreanSpeech'

type SentenceListType = 'all' | 'favorite' | 'recent'

const tabs: Array<{ value: SentenceListType; label: string }> = [
  { value: 'all', label: '전체 문장' },
  { value: 'favorite', label: '즐겨찾기' },
  { value: 'recent', label: '최근 사용' },
]

function liveId(value: string): LiveId {
  return /^\d+$/.test(value) ? Number(value) : value
}

export default function SentencesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const tab = (searchParams?.get('tab') as SentenceListType | null) ?? 'all'
  const [keyword, setKeyword] = useState('')
  const [sentenceInput, setSentenceInput] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryColor, setCategoryColor] = useState('#56a276')
  const [showAddSentence, setShowAddSentence] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const usersQuery = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const activeUser = usersQuery.data?.find((item) => item.active) ?? usersQuery.data?.[0] ?? null
  const boardQuery = useQuery({
    queryKey: ['guardian-board', activeUser?.id],
    queryFn: () => guardianLiveApi.board(activeUser!.id),
    enabled: Boolean(activeUser),
  })
  const contextQuery = useQuery({
    queryKey: ['aac-ai-context', activeUser?.id],
    queryFn: () => recommendationsApi.context(activeUser!.id),
    enabled: Boolean(activeUser) && !apiConfig.useMockApi,
    staleTime: 30 * 1000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['guardian-board', activeUser?.id] })
    queryClient.invalidateQueries({ queryKey: ['aac-ai-context', activeUser?.id] })
  }

  const createCategory = useMutation({
    mutationFn: (input: { name: string; color: string }) => {
      if (!activeUser) throw new Error('연결된 AAC 사용자가 없습니다.')
      const nextOrder = Math.max(
        -1,
        ...(boardQuery.data?.categories ?? []).map((item) => item.displayOrder),
      ) + 1
      return guardianLiveApi.createCategory(activeUser.id, {
        ...input,
        displayOrder: nextOrder,
      })
    },
    onSuccess: (category) => {
      invalidate()
      setCategoryId(String(category.id))
      setCategoryName('')
      setShowAddCategory(false)
      showToast('카테고리를 만들었어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const createSentence = useMutation({
    mutationFn: async ({ content, selectedCategoryId }: { content: string; selectedCategoryId: string }) => {
      if (!activeUser) throw new Error('연결된 AAC 사용자가 없습니다.')
      const board = boardQuery.data ?? await guardianLiveApi.board(activeUser.id)
      let selected = selectedCategoryId
        ? board.categories.find((item) => String(item.id) === selectedCategoryId)
        : board.categories[0]

      if (!selected) {
        selected = await guardianLiveApi.createCategory(activeUser.id, {
          name: '내 문장',
          color: '#56A276',
          displayOrder: 0,
        })
      }

      const displayOrder = Math.max(-1, ...board.cards.map((item) => item.displayOrder)) + 1
      return guardianLiveApi.createCard(activeUser.id, {
        categoryId: selected.id,
        text: content,
        ttsText: content,
        displayOrder,
      })
    },
    onSuccess: () => {
      invalidate()
      setSentenceInput('')
      setShowAddSentence(false)
      showToast('AAC 카드에 문장을 저장했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const favoriteMutation = useMutation({
    mutationFn: ({ id, favorite }: { id: LiveId; favorite: boolean }) => {
      if (!activeUser) throw new Error('연결된 AAC 사용자가 없습니다.')
      return guardianLiveApi.setFavorite(activeUser.id, id, favorite)
    },
    onSuccess: invalidate,
    onError: (error) => showToast(error.message, 'error'),
  })

  const deleteSentence = useMutation({
    mutationFn: (id: LiveId) => {
      if (!activeUser) throw new Error('연결된 AAC 사용자가 없습니다.')
      return guardianLiveApi.deleteCard(activeUser.id, id)
    },
    onSuccess: () => {
      invalidate()
      showToast('문장을 삭제했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const categories = boardQuery.data?.categories ?? []
  const cards = boardQuery.data?.cards ?? []
  const usageByCard = useMemo(
    () =>
      new Map(
        (contextQuery.data?.prioritizedVocabulary ?? []).map((item) => [
          String(item.cardId),
          item,
        ]),
      ),
    [contextQuery.data],
  )

  const sentenceItems = useMemo(
    () =>
      cards.map((card) => {
        const usage = usageByCard.get(String(card.id))
        const category = categories.find((item) => String(item.id) === String(card.categoryId))
        return {
          id: String(card.id),
          content: card.text,
          categoryId: String(card.categoryId),
          categoryName: category?.name ?? '미지정',
          favorite: card.favorite,
          useCount: usage?.usageCount ?? 0,
          lastUsedAt: usage?.lastUsedAt ?? null,
        }
      }),
    [cards, categories, usageByCard],
  )

  const filtered = useMemo(() => {
    const byTab = tab === 'favorite'
      ? sentenceItems.filter((item) => item.favorite)
      : tab === 'recent'
        ? sentenceItems
            .filter((item) => item.lastUsedAt)
            .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
        : sentenceItems

    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return byTab
    return byTab.filter((sentence) => sentence.content.toLowerCase().includes(normalized))
  }, [keyword, sentenceItems, tab])

  const handleSentenceSubmit = (event: FormEvent) => {
    event.preventDefault()
    const content = sentenceInput.trim()
    if (!content) return
    createSentence.mutate({ content, selectedCategoryId: categoryId })
  }

  const handleCategorySubmit = (event: FormEvent) => {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return
    createCategory.mutate({ name, color: categoryColor })
  }

  const speak = (content: string) => {
    if (!activeUser) return
    if (!speakKorean(content, activeUser.voiceType ?? 'CHILD_MALE', activeUser.speechRate ?? 1)) {
      showToast('이 기기에서는 음성 출력을 지원하지 않습니다.', 'error')
    }
  }

  if (usersQuery.isLoading || (activeUser && boardQuery.isLoading)) return <PageLoader />
  const error = usersQuery.error ?? boardQuery.error
  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => {
          usersQuery.refetch()
          boardQuery.refetch()
          contextQuery.refetch()
        }}
      />
    )
  }

  if (!activeUser) {
    return (
      <div className="page">
        <PageHeader title="내 문장" description="사용자별 AAC 카드와 실제 서버 데이터를 관리합니다." />
        <EmptyState title="등록된 AAC 사용자가 없어요" description="AAC 사용자를 먼저 등록해 주세요." />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        title="내 문장"
        description="현재 AAC 보드의 카드를 서버에서 불러와 카테고리별로 관리해요."
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
                maxLength={80}
              />
            </label>
            <label>
              카테고리
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">첫 번째 카테고리 사용</option>
                {categories.map((category) => (
                  <option value={String(category.id)} key={category.id}>
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
        {categories.map((category) => {
          const count = cards.filter((card) => String(card.categoryId) === String(category.id)).length
          return (
            <div className="category-pill" key={category.id}>
              <span style={{ backgroundColor: category.color }} aria-hidden />
              <strong>{category.name}</strong>
              <small>{count}</small>
            </div>
          )
        })}
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
                  router.replace(item.value === 'all' ? pathname : `${pathname}?tab=${item.value}`)
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

        {tab === 'recent' && contextQuery.error ? (
          <p className="privacy-note">최근 사용 기록을 불러오지 못해 현재 보드 데이터만 표시하고 있어요.</p>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState
            title={keyword ? '검색 결과가 없어요' : tab === 'recent' ? '최근 사용 기록이 없어요' : '저장된 문장이 없어요'}
            description={keyword ? '다른 검색어를 입력해 보세요.' : tab === 'recent' ? '사용자 기기에서 카드를 사용하면 서버 기록이 여기에 반영됩니다.' : '자주 쓰는 문장을 추가해 보세요.'}
            action={
              !keyword && tab !== 'recent' ? (
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
                      id: liveId(sentence.id),
                      favorite: !sentence.favorite,
                    })
                  }
                >
                  <Heart size={19} fill={sentence.favorite ? 'currentColor' : 'none'} />
                </button>
                <div className="sentence-list__content">
                  <strong>{sentence.content}</strong>
                  <span>
                    {sentence.categoryName} · 서버 사용 {sentence.useCount}회
                    {sentence.lastUsedAt ? ` · 최근 ${new Date(sentence.lastUsedAt).toLocaleDateString('ko-KR')}` : ''}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Play size={15} />}
                  onClick={() => speak(sentence.content)}
                >
                  미리듣기
                </Button>
                <button
                  className="icon-button icon-button--danger"
                  type="button"
                  aria-label={`${sentence.content} 삭제`}
                  onClick={() => {
                    if (window.confirm('이 문장을 삭제할까요?')) {
                      deleteSentence.mutate(liveId(sentence.id))
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

      <p className="privacy-note">
        최근 사용 횟수와 시각은 사용자 기기에서 서버로 전송된 실제 카드 사용 기록을 기준으로 표시합니다.
      </p>
    </div>
  )
}
