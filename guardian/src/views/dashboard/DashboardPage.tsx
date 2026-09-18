'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Folder,
  ImagePlus,
  Plus,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { aacUserApi } from '../../api/aacUsers'
import { notificationsApi } from '../../api/notifications'
import { categoriesApi, sentencesApi } from '../../api/sentences'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { useToast } from '../../components/ui/ToastProvider'
import type { Sentence } from '../../types/models'

type CardCustomization = { text?: string; imageUrl?: string }

const CARD_CUSTOM_KEY = 'malmoa-guardian-card-customizations'
const ONBOARDING_KEY = 'malmoa-guardian-onboarding-completed'
const CARD_COLORS = ['#F4C8A8', '#A9DDBB', '#B9D2F3', '#E3C4EF', '#F6D991', '#BFD5C8', '#F2B8BE']
const CARD_EMOJI = ['💬', '👤', '🍚', '🏠', '🙌', '😊', '🔗']

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const categories = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const sentences = useQuery({ queryKey: ['sentences', 'all'], queryFn: () => sentencesApi.list('all') })
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list })
  const aacUsers = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const [categoryId, setCategoryId] = useState<string>('all')
  const [editMode, setEditMode] = useState(false)
  const [editing, setEditing] = useState<Sentence | null>(null)
  const [newCardOpen, setNewCardOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [customizations, setCustomizations] = useState<Record<string, CardCustomization>>({})
  const [onboardingStep, setOnboardingStep] = useState(0)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CARD_CUSTOM_KEY)
      if (saved) setCustomizations(JSON.parse(saved) as Record<string, CardCustomization>)
    } catch {}
    if (window.localStorage.getItem(ONBOARDING_KEY) !== '1') setOnboardingStep(1)
  }, [])

  const favoriteMutation = useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) => sentencesApi.setFavorite(id, favorite),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sentences'] }),
    onError: (error) => showToast(error.message, 'error'),
  })
  const removeMutation = useMutation({
    mutationFn: sentencesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentences'] })
      setEditing(null)
      setSelectedId(null)
      showToast('상징 카드가 삭제되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { content?: string; imageUrl?: string | null } }) =>
      sentencesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentences'] })
      setEditing(null)
      showToast('상징 카드가 저장되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const isLoading = categories.isLoading || sentences.isLoading || notifications.isLoading || aacUsers.isLoading
  const error = categories.error ?? sentences.error ?? notifications.error ?? aacUsers.error
  if (isLoading) return <PageLoader label="AAC 판을 불러오는 중입니다." />
  if (error) return <ErrorState message={error.message} onRetry={() => { categories.refetch(); sentences.refetch(); notifications.refetch(); aacUsers.refetch() }} />

  const sentenceItems = sentences.data ?? []
  const categoryItems = [...(categories.data ?? [])].sort((a, b) => a.order - b.order)
  const activeUser = aacUsers.data?.find((item) => item.active) ?? aacUsers.data?.[0]
  const columns = activeUser?.gridSize === 'GRID_2X2' ? 2 : activeUser?.gridSize === 'GRID_3X3' ? 3 : 4
  const visible = categoryId === 'all'
    ? sentenceItems
    : categoryId === 'favorite'
      ? sentenceItems.filter((item) => item.favorite)
      : sentenceItems.filter((item) => item.categoryId === categoryId)
  const hasEmergency = (notifications.data ?? []).some((item) => !item.read)

  function beginPress(sentence: Sentence) {
    pressTimer.current = setTimeout(() => setEditing(sentence), 1000)
  }
  function endPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressTimer.current = null
  }
  function persistCustomization(id: string, next: CardCustomization) {
    const updated = { ...customizations, [id]: next }
    setCustomizations(updated)
    window.localStorage.setItem(CARD_CUSTOM_KEY, JSON.stringify(updated))
  }
  function closeOnboarding() {
    window.localStorage.setItem(ONBOARDING_KEY, '1')
    setOnboardingStep(0)
  }

  return (
    <main className="gp-home">
      <header className="gp-home__header">
        <Link href="/" className="gp-wordmark">Mal<span>Moa</span></Link>
        <div className="gp-home__actions">
          <Link href="/settings" className="gp-head-btn"><Settings size={18} /> 설정</Link>
          <button type="button" className={editMode ? 'gp-edit-toggle is-on' : 'gp-edit-toggle'} onClick={() => setEditMode((value) => !value)}><SlidersHorizontal size={18} /> 보호자 편집 모드 <b>{editMode ? 'ON' : 'OFF'}</b></button>
          <span className={hasEmergency ? 'gp-status is-alert' : 'gp-status'}><i />{hasEmergency ? '긴급' : '안정'}</span>
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
          <button type="button" className={categoryId === 'all' ? 'is-active' : ''} onClick={() => setCategoryId('all')}><span>⌂</span><b>전체</b></button>
          <button type="button" className={categoryId === 'favorite' ? 'is-active' : ''} onClick={() => setCategoryId('favorite')}><span>★</span><b>즐겨찾기</b></button>
          {categoryItems.map((category, index) => <button type="button" key={category.id} className={categoryId === category.id ? 'is-active' : ''} onClick={() => setCategoryId(category.id)}><span>{CARD_EMOJI[index % CARD_EMOJI.length]}</span><b>{category.name}</b></button>)}
        </aside>

        <section className="gp-board" aria-label="사용자 AAC 라이브 판">
          <div className="gp-board-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(130px, 1fr))` }}>
            {visible.length === 0 ? <div className="gp-empty">이 카테고리에 표시할 카드가 아직 없어요.</div> : visible.map((sentence, index) => {
              const customized = customizations[sentence.id]
              const selected = selectedId === sentence.id
              const displayText = customized?.text || sentence.content
              const displayImage = customized?.imageUrl || sentence.imageUrl || ''
              return (
                <button
                  type="button"
                  key={sentence.id}
                  className="gp-symbol"
                  style={{ '--card-color': CARD_COLORS[index % CARD_COLORS.length], outline: selected ? '3px solid #149E69' : undefined } as React.CSSProperties}
                  onClick={() => editMode && setSelectedId((current) => current === sentence.id ? null : sentence.id)}
                  onPointerDown={() => beginPress(sentence)}
                  onPointerUp={endPress}
                  onPointerLeave={endPress}
                  onContextMenu={(event) => { event.preventDefault(); setEditing(sentence) }}
                >
                  <span
                    role="button"
                    tabIndex={0}
                    className={sentence.favorite ? 'gp-star is-on' : 'gp-star'}
                    aria-label={sentence.favorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                    onClick={(event) => { event.stopPropagation(); favoriteMutation.mutate({ id: sentence.id, favorite: !sentence.favorite }) }}
                    onKeyDown={(event) => { if (event.key === 'Enter') favoriteMutation.mutate({ id: sentence.id, favorite: !sentence.favorite }) }}
                  >{sentence.favorite ? '★' : '☆'}</span>
                  {displayImage ? <img src={displayImage} alt="" className="gp-symbol__visual" style={{ objectFit: 'cover' }} /> : <span className="gp-symbol__visual">{CARD_EMOJI[index % CARD_EMOJI.length]}</span>}
                  <strong>{displayText}</strong>
                </button>
              )
            })}
          </div>
        </section>
      </div>

      {editing ? <CardEditor sentence={editing} customization={customizations[editing.id]} onClose={() => setEditing(null)} onSave={(next) => {
        persistCustomization(editing.id, next)
        updateMutation.mutate({
          id: editing.id,
          input: {
            content: next.text?.trim() || editing.content,
            imageUrl: next.imageUrl ?? editing.imageUrl ?? null,
          },
        })
      }} onFavorite={() => favoriteMutation.mutate({ id: editing.id, favorite: !editing.favorite })} onDelete={() => { if (window.confirm('상징 카드를 삭제하시겠습니까?')) removeMutation.mutate(editing.id) }} /> : null}
      {newCardOpen ? <NewCardModal categories={categoryItems} onClose={() => setNewCardOpen(false)} /> : null}
      {onboardingStep ? <Onboarding step={onboardingStep} onNext={() => onboardingStep === 1 ? setOnboardingStep(2) : closeOnboarding()} onSkip={closeOnboarding} /> : null}
    </main>
  )
}

function CardEditor({ sentence, customization, onClose, onSave, onFavorite, onDelete }: { sentence: Sentence; customization?: CardCustomization; onClose: () => void; onSave: (next: CardCustomization) => void; onFavorite: () => void; onDelete: () => void }) {
  const [text, setText] = useState(customization?.text ?? sentence.content)
  const [imageUrl, setImageUrl] = useState(customization?.imageUrl ?? sentence.imageUrl ?? '')
  function loadImage(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === 'string') setImageUrl(reader.result) }
    reader.readAsDataURL(file)
  }
  return (
    <div className="gp-edit-modal-backdrop">
      <section className="gp-edit-modal" role="dialog" aria-modal="true">
        <button type="button" className="gp-modal-x" onClick={onClose}><X /></button>
        <h2>상징 카드 편집</h2>
        <label>카드 텍스트<input value={text} onChange={(event) => setText(event.target.value)} /></label>
        <label>이미지 변경
          {imageUrl ? <img src={imageUrl} alt="선택한 상징 미리보기" className="gp-card-image-preview" /> : null}
          <span className="gp-head-btn" style={{ justifyContent: 'center' }}><ImagePlus size={18} /> 이미지 선택<input hidden type="file" accept="image/*" onChange={(event) => loadImage(event.target.files?.[0])} /></span>
          {imageUrl ? <button type="button" className="gp-image-remove" onClick={() => setImageUrl('')}>이미지 제거</button> : null}
        </label>
        <button type="button" className="gp-head-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={onFavorite}><Star size={18} />{sentence.favorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}</button>
        <div className="gp-edit-modal__actions"><button type="button" className="danger" onClick={onDelete}><Trash2 size={17} /> 삭제</button><button type="button" className="primary" onClick={() => onSave({ text: text.trim() || sentence.content, imageUrl: imageUrl || undefined })}>저장</button></div>
      </section>
    </div>
  )
}

function NewCardModal({ categories, onClose }: { categories: Array<{ id: string; name: string }>; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const mutation = useMutation({
    mutationFn: () => sentencesApi.create({ content: content.trim(), categoryId: categoryId || null, favorite: false }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sentences'] }); showToast('새 카드가 추가되었습니다.'); onClose() },
    onError: (error) => showToast(error.message, 'error'),
  })
  return (
    <div className="gp-edit-modal-backdrop"><section className="gp-edit-modal" role="dialog" aria-modal="true"><button type="button" className="gp-modal-x" onClick={onClose}><X /></button><h2>신규 카드 추가</h2><label>카드 텍스트<input autoFocus placeholder="예: 물 주세요" value={content} onChange={(event) => setContent(event.target.value)} /></label><label>카테고리<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} style={{ height: 50, border: '1px solid #dedee5', borderRadius: 12, padding: '0 14px' }}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="gp-edit-modal__actions"><button type="button" onClick={onClose}>취소</button><button type="button" className="primary" disabled={!content.trim() || mutation.isPending} onClick={() => mutation.mutate()}>추가</button></div></section></div>
  )
}

function Onboarding({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  return (
    <div className="gp-onboarding-backdrop">
      <section className="gp-onboarding" role="dialog" aria-modal="true">
        <span className="gp-onboarding__step">{step} / 2</span>
        {step === 1 ? <><Sparkles size={46} /><h2>사용자 문장 이해 수준 설정</h2><p>사용자의 언어 발달 수준에 맞춰 AI 추천 문장 길이를 맞춤 설정하세요.</p><Link href="/settings/language">언어 수준 바로 설정하기</Link></> : <><SlidersHorizontal size={46} /><h2>보호자 편집 모드</h2><p>보호자 편집 모드 버튼을 켜거나 상징 카드를 꾹 누르면 글자 수정과 즐겨찾기 편집을 할 수 있어요.</p><div className="gp-longpress"><span>꾹</span><strong>상징 카드를 1초 이상 눌러보세요</strong></div></>}
        <div className="gp-onboarding__actions"><button type="button" onClick={onSkip}>건너뛰기</button><button type="button" onClick={onNext}>{step === 1 ? '다음' : '시작하기'}</button></div>
      </section>
    </div>
  )
}
