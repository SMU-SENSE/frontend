'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Folder,
  ImagePlus,
  Plus,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Volume2,
  WandSparkles,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { aacUserApi } from '../../api/aacUsers'
import { apiConfig } from '../../api/client'
import { guardianLiveApi, type LiveId } from '../../api/guardianLive'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { NotificationBell } from '../../components/notifications/NotificationBell'
import { useToast } from '../../components/ui/ToastProvider'
import type { Sentence } from '../../types/models'

type CardCustomization = { text?: string; imageUrl?: string }

const ONBOARDING_KEY = 'malmoa-guardian-onboarding-completed'
const CARD_COLORS = ['#F4C8A8', '#A9DDBB', '#B9D2F3', '#E3C4EF', '#F6D991', '#BFD5C8', '#F2B8BE']
const CARD_EMOJI = ['💬', '👤', '🍚', '🏠', '🙌', '😊', '🔗']

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const aacUsers = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const activeUser = aacUsers.data?.find((item) => item.active) ?? aacUsers.data?.[0] ?? null
  const board = useQuery({
    queryKey: ['guardian-board', activeUser?.id],
    queryFn: () => guardianLiveApi.board(activeUser!.id),
    enabled: Boolean(activeUser),
    refetchInterval: apiConfig.useMockApi ? false : 15000,
  })
  const [categoryId, setCategoryId] = useState<string>('all')
  const [editMode, setEditMode] = useState(false)
  const [editing, setEditing] = useState<Sentence | null>(null)
  const [newCardOpen, setNewCardOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [phraseIds, setPhraseIds] = useState<string[]>([])
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [onboardingStep, setOnboardingStep] = useState(0)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressTriggered = useRef(false)
  const pressStart = useRef<{ x: number; y: number } | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    if (window.localStorage.getItem(ONBOARDING_KEY) !== '1') setOnboardingStep(1)
  }, [])

  useEffect(() => {
    if (apiConfig.useMockApi || !activeUser) return
    const source = new EventSource(`${apiConfig.baseUrl}/api/v1/me/aac-users/${activeUser.id}/events`, { withCredentials: true })
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['guardian-board', activeUser.id] })
    ;['BOARD_UPDATED', 'SETTINGS_UPDATED', 'STATUS_UPDATED', 'CARD_USED', 'ROUTINE_TRIGGERED', 'ALERT'].forEach((eventName) => source.addEventListener(eventName, refresh))
    source.onerror = () => {
      // EventSource 자체가 자동 재연결하므로 화면을 오류 페이지로 보내지 않는다.
    }
    return () => source.close()
  }, [activeUser, queryClient])

  const favoriteMutation = useMutation({
    mutationFn: async ({ id, favorite }: { id: LiveId; favorite: boolean }) => { await guardianLiveApi.setFavorite(activeUser!.id, id, favorite) },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guardian-board', activeUser?.id] })
      setEditing((current) => current && String(current.id) === String(variables.id)
        ? { ...current, favorite: variables.favorite }
        : current)
    },
    onError: (error) => showToast(error.message, 'error'),
  })
  const removeMutation = useMutation({
    mutationFn: (id: LiveId) => guardianLiveApi.deleteCard(activeUser!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-board', activeUser?.id] })
      setEditing(null)
      setSelectedId(null)
      showToast('상징 카드가 삭제되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: LiveId; input: { content?: string; imageUrl?: string | null } }) =>
      guardianLiveApi.updateCard(activeUser!.id, id, { text: input.content, imageUrl: input.imageUrl }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guardian-board', activeUser?.id] })
      setEditing(null)
      showToast('상징 카드가 저장되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const reorderMutation = useMutation({
    mutationFn: async ({ fromId, toId }: { fromId: string; toId: string }) => {
      if (!activeUser || !board.data) throw new Error('연결된 사용자 판이 없습니다.')
      const cards = [...board.data.cards].sort((a, b) => a.displayOrder - b.displayOrder)
      const fromIndex = cards.findIndex((item) => String(item.id) === fromId)
      const toIndex = cards.findIndex((item) => String(item.id) === toId)
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return
      const [moved] = cards.splice(fromIndex, 1)
      cards.splice(toIndex, 0, moved)
      // Initial board orders may contain gaps or duplicate values. Normalize the
      // whole board, not only the moved range, so every card keeps its place.
      for (let index = 0; index < cards.length; index += 1) {
        if (cards[index].displayOrder !== index) {
          await guardianLiveApi.updateCard(activeUser.id, cards[index].id, { displayOrder: index })
        }
      }
    },
    onSuccess: () => showToast(apiConfig.useMockApi ? '시연용 카드 순서가 이 브라우저에 저장되었습니다.' : '카드 순서가 사용자 판에 저장되었습니다.'),
    onError: (error) => showToast(error.message, 'error'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['guardian-board', activeUser?.id] }),
  })

  const isLoading = aacUsers.isLoading || (Boolean(activeUser) && board.isLoading)
  const error = aacUsers.error ?? board.error
  if (isLoading) return <PageLoader label="AAC 판을 불러오는 중입니다." />
  if (error) return <ErrorState message={error.message} onRetry={() => { aacUsers.refetch(); board.refetch() }} />
  if (!activeUser || !board.data) return <ErrorState message="연결된 AAC 사용자가 없습니다." onRetry={() => aacUsers.refetch()} />

  const categoryItems = [...board.data.categories]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((item) => ({ id: String(item.id), name: item.name, color: item.color, order: item.displayOrder, sentenceCount: 0 }))
  const sentenceItems: Sentence[] = [...board.data.cards]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((item) => ({
      id: String(item.id),
      content: item.text,
      categoryId: String(item.categoryId),
      categoryName: board.data?.categories.find((category) => String(category.id) === String(item.categoryId))?.name,
      favorite: item.favorite,
      source: 'manual',
      useCount: 0,
      lastUsedAt: null,
      createdAt: '',
      imageUrl: item.imageUrl,
    }))
  const columns = board.data.gridSize === 'GRID_2X2' ? 2 : board.data.gridSize === 'GRID_3X3' ? 3 : 4
  const recommendedIds = [...new Set([...recentIds, ...sentenceItems.filter((item) => item.favorite).map((item) => item.id)])]
  const visible = categoryId === 'all'
    ? sentenceItems
    : categoryId === 'recommend'
      ? recommendedIds.map((id) => sentenceItems.find((item) => item.id === id)).filter((item): item is Sentence => Boolean(item))
    : categoryId === 'recent'
      ? recentIds.map((id) => sentenceItems.find((item) => item.id === id)).filter((item): item is Sentence => Boolean(item))
      : categoryId === 'favorite'
        ? sentenceItems.filter((item) => item.favorite)
        : sentenceItems.filter((item) => item.categoryId === categoryId)
  const phraseItems = phraseIds
    .map((id) => sentenceItems.find((item) => item.id === id))
    .filter((item): item is Sentence => Boolean(item))
  const hasEmergency = board.data.status === 'EMERGENCY'

  function beginPress(sentence: Sentence, x: number, y: number) {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressStart.current = { x, y }
    pressTriggered.current = false
    pressTimer.current = setTimeout(() => {
      pressTriggered.current = true
      setEditing(sentence)
    }, 1000)
  }
  function endPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressTimer.current = null
    pressStart.current = null
  }
  function movePress(x: number, y: number) {
    if (pressStart.current && Math.hypot(x - pressStart.current.x, y - pressStart.current.y) > 12) endPress()
  }
  function closeOnboarding() {
    window.localStorage.setItem(ONBOARDING_KEY, '1')
    setOnboardingStep(0)
  }

  function togglePhrase(id: string) {
    setPhraseIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= 8) {
        showToast('상징은 최대 8개까지 선택할 수 있어요.', 'error')
        return current
      }
      return [...current, id]
    })
    setRecentIds((current) => [id, ...current.filter((item) => item !== id)].slice(0, 12))
  }

  function speakText(text: string) {
    if (!text.trim()) return
    if (!('speechSynthesis' in window)) {
      showToast('이 기기에서는 음성 출력을 지원하지 않습니다.', 'error')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    utterance.rate = activeUser?.speechRate ?? 1
    window.speechSynthesis.speak(utterance)
  }

  function speakPhrase() {
    if (!phraseItems.length) return showToast('먼저 상징을 선택해 주세요.', 'error')
    speakText(phraseItems.map((item) => item.content).join(' '))
  }

  return (
    <main className="gp-home">
      <header className="gp-home__header">
        <Link href="/" className="gp-wordmark">Mal<span>Moa</span></Link>
        <div className="gp-home__actions">
          <NotificationBell />
          <Link href="/settings" className="gp-head-btn"><Settings size={18} /> 설정</Link>
          <button type="button" className={editMode ? 'gp-edit-toggle is-on' : 'gp-edit-toggle'} onClick={() => setEditMode((value) => !value)}><SlidersHorizontal size={18} /> 보호자 편집 모드 <b>{editMode ? 'ON' : 'OFF'}</b></button>
          <Link href="/connect" className={hasEmergency ? 'gp-status is-alert' : 'gp-status'} aria-label="사용자 연결 관리"><i />{hasEmergency ? '긴급' : '안정'}</Link>
        </div>
      </header>

      {editMode ? (
        <div className="gp-edit-toolbar">
          <button type="button" onClick={() => setNewCardOpen(true)}><Plus size={17} /> 신규 카드 추가</button>
          <button type="button" disabled={!selectedId} onClick={() => { const item = sentenceItems.find((sentence) => sentence.id === selectedId); if (item && window.confirm('상징 카드를 삭제하시겠습니까?')) removeMutation.mutate(item.id) }}><Trash2 size={17} /> 선택 카드 삭제</button>
          <Link href="/settings/categories"><Folder size={17} /> 카테고리 편집</Link>
          <button type="button" disabled={!selectedId} onClick={() => { const item = sentenceItems.find((sentence) => sentence.id === selectedId); if (item) favoriteMutation.mutate({ id: item.id, favorite: !item.favorite }) }}><Star size={17} /> 즐겨찾기 등록 및 해제</button>
        </div>
      ) : null}

      <div className="gp-live">
        <aside className="gp-categories" aria-label="AAC 카테고리">
          <button type="button" title="즐겨찾기와 이 화면에서 최근 선택한 상징을 보여줍니다" className={categoryId === 'recommend' || categoryId === 'all' ? 'is-active is-recommend' : 'is-recommend'} onClick={() => setCategoryId('recommend')}><span>✦</span><b>추천</b></button>
          <button type="button" title="이 화면에서 최근 선택한 상징" className={categoryId === 'recent' ? 'is-active' : ''} onClick={() => setCategoryId('recent')}><span>↺</span><b>최근</b></button>
          <button type="button" className={categoryId === 'favorite' ? 'is-active' : ''} onClick={() => setCategoryId('favorite')}><span>★</span><b>즐겨찾기</b></button>
          {categoryItems.map((category, index) => <button type="button" key={category.id} className={categoryId === category.id ? 'is-active' : ''} onClick={() => setCategoryId(category.id)}><span>{CARD_EMOJI[index % CARD_EMOJI.length]}</span><b>{category.name}</b></button>)}
        </aside>

        <section className="gp-board" aria-label="사용자 AAC 라이브 판">
          <div className={`gp-board-grid gp-board-grid--${columns}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {visible.length === 0 ? <div className="gp-empty">{categoryId === 'recommend' ? '즐겨찾기를 등록하거나 상징을 선택하면 이곳에 표시돼요.' : '이 카테고리에 표시할 카드가 아직 없어요.'}</div> : visible.map((sentence, index) => {
              const selected = selectedId === sentence.id
              const displayText = sentence.content
              const displayImage = sentence.imageUrl || ''
              return (
                <div
                  key={sentence.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${displayText} 상징`}
                  aria-pressed={editMode ? selected : phraseIds.includes(sentence.id)}
                  className="gp-symbol"
                  draggable={editMode && !reorderMutation.isPending}
                  style={{ '--card-color': CARD_COLORS[index % CARD_COLORS.length], outline: selected ? '3px solid #149E69' : undefined } as React.CSSProperties}
                  onClick={() => {
                    if (pressTriggered.current) {
                      pressTriggered.current = false
                      return
                    }
                    if (editMode) setSelectedId((current) => current === sentence.id ? null : sentence.id)
                    else togglePhrase(sentence.id)
                  }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return
                    if (event.key === 'F2') {
                      event.preventDefault()
                      setEditing(sentence)
                      return
                    }
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    if (editMode) setSelectedId((current) => current === sentence.id ? null : sentence.id)
                    else togglePhrase(sentence.id)
                  }}
                  onPointerDown={(event) => { if (event.button === 0 && !reorderMutation.isPending) beginPress(sentence, event.clientX, event.clientY) }}
                  onPointerMove={(event) => movePress(event.clientX, event.clientY)}
                  onPointerUp={endPress}
                  onPointerCancel={endPress}
                  onPointerLeave={endPress}
                  onContextMenu={(event) => { event.preventDefault(); endPress(); pressTriggered.current = true; setEditing(sentence) }}
                  onDragStart={(event) => { endPress(); setDragId(sentence.id); event.dataTransfer.setData('text/plain', sentence.id); event.dataTransfer.effectAllowed = 'move' }}
                  onDragOver={(event) => { if (editMode && !reorderMutation.isPending) event.preventDefault() }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const source = dragId || event.dataTransfer.getData('text/plain')
                    if (editMode && source && source !== sentence.id && !reorderMutation.isPending) reorderMutation.mutate({ fromId: source, toId: sentence.id })
                    setDragId(null)
                  }}
                  onDragEnd={() => setDragId(null)}
                >
                  <button
                    type="button"
                    className={sentence.favorite ? 'gp-star is-on' : 'gp-star'}
                    aria-label={sentence.favorite ? `${displayText} 즐겨찾기 해제` : `${displayText} 즐겨찾기 등록`}
                    disabled={favoriteMutation.isPending}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => { event.stopPropagation(); favoriteMutation.mutate({ id: sentence.id, favorite: !sentence.favorite }) }}
                  >{sentence.favorite ? '★' : '☆'}</button>
                  {displayImage ? <img src={displayImage.startsWith('/api/') ? `${apiConfig.baseUrl}${displayImage}` : displayImage} alt="" className="gp-symbol__visual" style={{ objectFit: 'cover' }} /> : <span className="gp-symbol__visual">{CARD_EMOJI[index % CARD_EMOJI.length]}</span>}
                  <strong>{displayText}</strong>
                </div>
              )
            })}
          </div>
        </section>

        <aside className="gp-composer" aria-label="문장 조합 영역">
          <div className="gp-composer__selection">
            {phraseItems.length === 0 ? (
              <div className="gp-composer__empty">상징을 골라 보세요</div>
            ) : (
              <div className="gp-composer__chips">
                {phraseItems.map((item) => (
                  <button type="button" key={item.id} onClick={() => togglePhrase(item.id)}>
                    <span>{item.imageUrl ? <img src={item.imageUrl.startsWith('/api/') ? `${apiConfig.baseUrl}${item.imageUrl}` : item.imageUrl} alt="" /> : '✦'}</span>
                    <strong>{item.content}</strong>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="gp-composer__actions">
            <button type="button" className="is-reset" onClick={() => setPhraseIds([])}><RotateCcw size={18} />초기화</button>
            <button type="button" className="is-ai" onClick={() => showToast(phraseItems.length ? 'AI 문장 변환은 아직 연결되지 않았어요.' : '먼저 상징을 선택해 주세요.', 'error')}><WandSparkles size={18} />AI 변환</button>
            <button type="button" className="is-speak" onClick={speakPhrase}><Volume2 size={18} />말하기</button>
          </div>
        </aside>
      </div>

      <div className="gp-quickbar" aria-label="빠른 대화">
        {['네', '아니요', '잠깐만요', '몰라요', '뭐예요'].map((text) => <button type="button" key={text} onClick={() => speakText(text)}>{text}</button>)}
      </div>

      {editing ? <CardEditor sentence={editing} saving={updateMutation.isPending} onClose={() => setEditing(null)} onUploadImage={(file) => guardianLiveApi.uploadImage(activeUser.id, file).then((result) => result.url)} onSave={(next) => {
        updateMutation.mutate({
          id: editing.id,
          input: {
            content: next.text?.trim() || editing.content,
            // The backend PATCH treats null as "unchanged"; an empty string clears the image.
            imageUrl: next.imageUrl === '' ? '' : next.imageUrl ?? editing.imageUrl ?? '',
          },
        })
      }} onFavorite={() => favoriteMutation.mutate({ id: editing.id, favorite: !editing.favorite })} onDelete={() => { if (window.confirm('상징 카드를 삭제하시겠습니까?')) removeMutation.mutate(editing.id) }} /> : null}
      {newCardOpen ? <NewCardModal userId={activeUser.id} categories={categoryItems} nextOrder={Math.max(-1, ...board.data.cards.map((item) => item.displayOrder)) + 1} onClose={() => setNewCardOpen(false)} /> : null}
      {onboardingStep ? <Onboarding step={onboardingStep} onNext={() => onboardingStep === 1 ? setOnboardingStep(2) : closeOnboarding()} onSkip={closeOnboarding} /> : null}
    </main>
  )
}

function CardEditor({ sentence, saving, onClose, onUploadImage, onSave, onFavorite, onDelete }: { sentence: Sentence; saving: boolean; onClose: () => void; onUploadImage: (file: File) => Promise<string>; onSave: (next: CardCustomization) => void; onFavorite: () => void; onDelete: () => void }) {
  const { showToast } = useToast()
  const [text, setText] = useState(sentence.content)
  const [imageUrl, setImageUrl] = useState(sentence.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  async function loadImage(file?: File) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      showToast('JPEG, PNG, WEBP 이미지를 5MB 이하로 선택해 주세요.', 'error')
      return
    }
    setUploading(true)
    try {
      setImageUrl(await onUploadImage(file))
    } catch (error) {
      showToast(error instanceof Error ? error.message : '이미지를 업로드하지 못했습니다.', 'error')
    } finally {
      setUploading(false)
    }
  }
  return (
    <div className="gp-edit-modal-backdrop">
      <section className="gp-edit-modal" role="dialog" aria-modal="true">
        <button type="button" className="gp-modal-x" onClick={onClose}><X /></button>
        <h2>상징 카드 편집</h2>
        <label>카드 텍스트<input maxLength={80} value={text} onChange={(event) => setText(event.target.value)} /></label>
        <label>이미지 변경
          {imageUrl ? <img src={imageUrl.startsWith('/api/') ? `${apiConfig.baseUrl}${imageUrl}` : imageUrl} alt="선택한 상징 미리보기" className="gp-card-image-preview" /> : null}
          <span className="gp-head-btn" style={{ justifyContent: 'center' }}><ImagePlus size={18} /> {uploading ? '업로드 중…' : '이미지 선택'}<input hidden disabled={uploading} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => loadImage(event.target.files?.[0])} /></span>
          {imageUrl ? <button type="button" className="gp-image-remove" onClick={() => setImageUrl('')}>이미지 제거</button> : null}
        </label>
        <button type="button" className="gp-head-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={onFavorite}><Star size={18} />{sentence.favorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}</button>
        <div className="gp-edit-modal__actions"><button type="button" className="danger" onClick={onDelete}><Trash2 size={17} /> 삭제</button><button type="button" className="primary" disabled={uploading || saving} onClick={() => onSave({ text: text.trim() || sentence.content, imageUrl })}>{saving ? '저장 중…' : '저장'}</button></div>
      </section>
    </div>
  )
}

function NewCardModal({ userId, categories, nextOrder, onClose }: { userId: number; categories: Array<{ id: string; name: string }>; nextOrder: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const mutation = useMutation({
    mutationFn: () => guardianLiveApi.createCard(userId, {
      categoryId: /^\d+$/.test(categoryId) ? Number(categoryId) : categoryId,
      text: content.trim(),
      imageUrl: imageUrl || null,
      displayOrder: nextOrder,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-board', userId] })
      showToast('새 카드가 추가되었습니다.')
      onClose()
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  async function uploadImage(file?: File) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      showToast('JPEG, PNG, WEBP 이미지를 5MB 이하로 선택해 주세요.', 'error')
      return
    }
    setUploading(true)
    try {
      const result = await guardianLiveApi.uploadImage(userId, file)
      setImageUrl(result.url)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '이미지를 업로드하지 못했습니다.', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="gp-edit-modal-backdrop">
      <section className="gp-edit-modal" role="dialog" aria-modal="true" aria-label="신규 카드 추가">
        <button type="button" className="gp-modal-x" onClick={onClose} aria-label="닫기"><X /></button>
        <h2>신규 카드 추가</h2>
        <label>카드 텍스트<input autoFocus maxLength={80} placeholder="예: 물 주세요" value={content} onChange={(event) => setContent(event.target.value)} /></label>
        <label>카테고리
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} style={{ height: 50, border: '1px solid #dedee5', borderRadius: 12, padding: '0 14px' }}>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>상징 이미지 (선택)
          {imageUrl ? <img src={imageUrl.startsWith('/api/') ? apiConfig.baseUrl + imageUrl : imageUrl} alt="새 카드 이미지 미리보기" className="gp-card-image-preview" /> : null}
          <span className="gp-head-btn" style={{ justifyContent: 'center' }}><ImagePlus size={18} />{uploading ? '업로드 중…' : '이미지 선택'}<input hidden type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || mutation.isPending} onChange={(event) => void uploadImage(event.target.files?.[0])} /></span>
          {imageUrl ? <button type="button" className="gp-image-remove" onClick={() => setImageUrl('')}>이미지 제거</button> : null}
        </label>
        <div className="gp-edit-modal__actions">
          <button type="button" onClick={onClose}>취소</button>
          <button type="button" className="primary" disabled={!content.trim() || !categoryId || uploading || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? '추가 중…' : '추가'}</button>
        </div>
      </section>
    </div>
  )
}

function Onboarding({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  return (
    <div className="gp-onboarding-backdrop">
      <section className="gp-onboarding" role="dialog" aria-modal="true">
        <span className="gp-onboarding__step">{step} / 2</span>
        {step === 1 ? <><Sparkles size={46} /><h2>사용자 문장 이해 수준 설정</h2><p>사용자의 언어 발달 수준에 맞춰 AI 추천 문장 길이를 맞춤 설정하세요.</p><Link href="/settings/language">언어 수준 바로 설정하기</Link></> : <><SlidersHorizontal size={46} /><h2>보호자 편집 모드</h2><p>보호자 편집 모드 버튼을 켜거나 상징 카드를 꾹 누르면 글자 수정과 즐겨찾기 편집을 할 수 있어요.</p><div className="gp-longpress"><span>꾹</span><strong>상징 카드를 1초 이상 눌러보세요</strong></div></>}
        <div className="gp-onboarding__actions"><button type="button" onClick={onSkip}>건너뛰기</button><button type="button" onClick={onNext}>다음</button></div>
      </section>
    </div>
  )
}
