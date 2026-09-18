'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronLeft,
  GripVertical,
  MapPin,
  Play,
  Save,
  Trash2,
  Volume2,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { aacUserApi } from '../../api/aacUsers'
import { categoriesApi, sentencesApi } from '../../api/sentences'
import { notificationsApi } from '../../api/notifications'
import { userApi } from '../../api/user'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { useToast } from '../../components/ui/ToastProvider'
import type { BackendVoiceType, Category, Sentence } from '../../types/models'

type Place = {
  id: string
  name: string
  type: '집' | '학교' | '병원' | '치료실'
  address: string
  start: string
  end: string
}

const CATEGORY_ICONS = ['📁', '🌟', '❤️', '🎯', '🎨', '🎵', '🏃', '🍎', '🌈', '🔥', '💎', '🦋']
const CATEGORY_COLORS = ['#149E69', '#F2C14E', '#F07478', '#FF9D52', '#7F8BF3', '#79C7DE', '#F4AE7B', '#B8C4BF']
const DEFAULT_CATEGORY_NAMES = ['긴급어', '사람', '음식·장소·신체', '행동', '감정·설명', '대화', '문법']

function ProductTitle({ title }: { title: string }) {
  return (
    <header className="gp-page__title">
      <Link className="gp-back" href="/settings" aria-label="환경 설정으로 돌아가기"><ChevronLeft size={30} /></Link>
      <h1>{title}</h1>
    </header>
  )
}

export function LanguageLevelPage() {
  const { showToast } = useToast()
  const preferences = useQuery({ queryKey: ['user-preferences'], queryFn: userApi.getPreferences, retry: false })
  const [level, setLevel] = useState<1 | 2 | 3 | 4>(2)
  const options = [
    { level: 1 as const, example: '물', description: '한 단어 중심(1어절)' },
    { level: 2 as const, example: '물 주세요. / 물 마시고 싶어요.', description: '짧은 문장 중심(2~4어절) · 기본값' },
    { level: 3 as const, example: '목이 말라서 물을 마시고 싶어요.', description: '일반 문장 중심(5~6어절)' },
    { level: 4 as const, example: '지금 너무 목이 마른데 시원한 물 한 잔만 주실 수 있나요?', description: '복잡한 문장 중심(7어절 이상)' },
  ]

  useEffect(() => {
    const serverLevel = preferences.data?.languageLevel
    if (serverLevel && [1, 2, 3, 4].includes(serverLevel)) {
      setLevel(serverLevel)
      return
    }
    const saved = Number(window.localStorage.getItem('malmoa-language-level'))
    if ([1, 2, 3, 4].includes(saved)) setLevel(saved as 1 | 2 | 3 | 4)
  }, [preferences.data?.languageLevel])

  const mutation = useMutation({
    mutationFn: async () => {
      window.localStorage.setItem('malmoa-language-level', String(level))
      if (!preferences.data) return null
      return userApi.updatePreferences({ ...preferences.data, languageLevel: level })
    },
    onSuccess: (updated) => {
      if (updated) queryClientPlaceholder(updated)
      showToast('사용자 언어 수준 설정이 저장되었습니다.')
    },
    onError: () => {
      // 서버가 아직 languageLevel 계약을 지원하지 않아도 보호자 기기에는 설정을 보존한다.
      window.localStorage.setItem('malmoa-language-level', String(level))
      showToast('사용자 언어 수준 설정이 저장되었습니다.')
    },
  })

  // React Query 캐시는 mutation 성공 시 재조회로 동기화한다.
  function queryClientPlaceholder(_value: unknown) {
    preferences.refetch()
  }

  return (
    <main className="gp-subpage">
      <ProductTitle title="AI 문장 추천 수준 설정" />
      <section className="gp-sub-card">
        <h2>사용자가 어느 정도 수준의 문장을 이해할 수 있나요?</h2>
        <p>보호자가 선택한 사용자 수준을 기반으로 AI가 이해하기 쉬운 문장을 생성하고 추천합니다.</p>
        <div className="gp-level-list">
          {options.map((item) => (
            <button type="button" key={item.level} className={level === item.level ? 'gp-level is-selected' : 'gp-level'} onClick={() => setLevel(item.level)}>
              <span>{item.level}</span>
              <div><strong>{item.example}</strong><small>{item.description}</small></div>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
        <button type="button" className="gp-save-wide" disabled={mutation.isPending} onClick={() => mutation.mutate()}>저장하기</button>
      </section>
    </main>
  )
}

export function CategoryEditorPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [icon, setIcon] = useState('📁')
  const [name, setName] = useState('')
  const [color, setColor] = useState('#149E69')
  const [dragId, setDragId] = useState<string | null>(null)
  const [orderIds, setOrderIds] = useState<string[]>([])
  const [iconMap, setIconMap] = useState<Record<string, string>>({})
  const categories = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })

  useEffect(() => {
    try {
      const rawIcons = window.localStorage.getItem('malmoa-category-icons')
      if (rawIcons) setIconMap(JSON.parse(rawIcons) as Record<string, string>)
      const rawOrder = window.localStorage.getItem('malmoa-category-order')
      if (rawOrder) setOrderIds(JSON.parse(rawOrder) as string[])
    } catch {}
  }, [])

  const createMutation = useMutation({
    mutationFn: () => categoriesApi.create({ name: name.trim(), color }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      const nextIcons = { ...iconMap, [created.id]: icon }
      setIconMap(nextIcons)
      window.localStorage.setItem('malmoa-category-icons', JSON.stringify(nextIcons))
      setName('')
      setIcon('📁')
      showToast('카테고리가 추가되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })
  const removeMutation = useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: (_result, categoryId) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      const nextOrder = orderIds.filter((id) => id !== categoryId)
      const nextIcons = { ...iconMap }
      delete nextIcons[categoryId]
      setOrderIds(nextOrder)
      setIconMap(nextIcons)
      window.localStorage.setItem('malmoa-category-order', JSON.stringify(nextOrder))
      window.localStorage.setItem('malmoa-category-icons', JSON.stringify(nextIcons))
      showToast('카테고리가 삭제되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const items = useMemo(() => {
    const base = categories.data?.length
      ? [...categories.data]
      : DEFAULT_CATEGORY_NAMES.map((categoryName, index) => ({
          id: `base-${index}`,
          name: categoryName,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
          order: index,
          sentenceCount: 0,
        }))
    const natural = [...base].sort((x, y) => x.order - y.order)
    if (!orderIds.length) return natural
    const rank = new Map(orderIds.map((id, index) => [id, index]))
    return natural.sort((x, y) => (rank.get(x.id) ?? 9999 + x.order) - (rank.get(y.id) ?? 9999 + y.order))
  }, [categories.data, orderIds])

  function persistOrder(next: string[]) {
    setOrderIds(next)
    window.localStorage.setItem('malmoa-category-order', JSON.stringify(next))
    if (next.every((id) => !id.startsWith('base-'))) {
      categoriesApi.reorder(next).then(() => queryClient.invalidateQueries({ queryKey: ['categories'] })).catch(() => {
        // 실제 서버에 정렬 API가 아직 없으면 현재 보호자 기기 순서를 유지한다.
      })
    }
  }

  function moveCategory(targetId: string) {
    if (!dragId || dragId === targetId) return
    const ids = items.map((item) => item.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(to, 0, ids.splice(from, 1)[0])
    persistOrder(ids)
    setDragId(null)
  }

  if (categories.isLoading) return <PageLoader label="카테고리를 불러오는 중입니다." />
  if (categories.error) return <ErrorState message={categories.error.message} onRetry={() => categories.refetch()} />

  return (
    <main className="gp-category-page">
      <section className="gp-category-maker">
        <Link href="/settings" className="gp-voice-back" aria-label="환경 설정으로"><ArrowLeft /></Link>
        <div className="gp-category-preview"><span>{icon}</span><strong>{name || '카테고리 이름'}</strong></div>
        <h3>아이콘</h3>
        <div className="gp-icon-palette">{CATEGORY_ICONS.map((value) => <button type="button" key={value} className={icon === value ? 'is-selected' : ''} onClick={() => setIcon(value)}>{value}</button>)}</div>
        <h3>카테고리 이름</h3>
        <input placeholder="예: 취미활동" value={name} onChange={(event) => setName(event.target.value)} />
        <h3>대표 색상</h3>
        <div className="gp-color-palette">{CATEGORY_COLORS.map((value) => <button type="button" aria-label={`색상 ${value}`} key={value} className={color === value ? 'is-selected' : ''} style={{ background: value }} onClick={() => setColor(value)} />)}</div>
        <button type="button" className="gp-category-add" disabled={!name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>＋ 카테고리 추가</button>
      </section>
      <section className="gp-category-list">
        <h1>내 카테고리 ({items.length}개)</h1>
        <p>⠿ 아이콘을 드래그해서 순서 변경</p>
        {items.map((item, index) => {
          const isFallback = item.id.startsWith('base-')
          return (
            <div
              className={dragId === item.id ? 'gp-category-row is-dragging' : 'gp-category-row'}
              key={item.id}
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => moveCategory(item.id)}
            >
              <GripVertical />
              <span style={{ background: `${item.color}20`, color: item.color }}>{iconMap[item.id] || CATEGORY_ICONS[index % CATEGORY_ICONS.length]}</span>
              <strong>{item.name}</strong>
              {isFallback ? <em>기본</em> : <button type="button" aria-label={`${item.name} 삭제`} onClick={() => removeMutation.mutate(item.id)}><Trash2 size={19} /></button>}
            </div>
          )
        })}
      </section>
    </main>
  )
}

export function VoiceSettingsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const users = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const user = users.data?.find((item) => item.active) ?? users.data?.[0] ?? null
  const [rate, setRate] = useState(1)

  useEffect(() => {
    if (user?.speechRate) setRate(user.speechRate)
  }, [user?.speechRate])

  const mutation = useMutation({
    mutationFn: ({ voiceType, speechRate }: { voiceType: BackendVoiceType; speechRate: number }) => {
      if (!user) throw new Error('연결된 사용자가 없습니다.')
      return aacUserApi.updateVoice(user.id, voiceType, speechRate)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aac-users'] })
      showToast('음성 설정이 저장되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  function saveRate(next: number) {
    const clamped = Math.max(.7, Math.min(1.3, Number(next.toFixed(1))))
    setRate(clamped)
    if (user?.voiceType) mutation.mutate({ voiceType: user.voiceType, speechRate: clamped })
  }

  function preview() {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance('안녕하세요! 말모아입니다.')
    utterance.lang = 'ko-KR'
    utterance.rate = rate
    utterance.pitch = user?.voiceType === 'CHILD_FEMALE' ? 1.35 : 1.15
    window.speechSynthesis.speak(utterance)
  }

  if (users.isLoading) return <PageLoader label="음성 설정을 불러오는 중입니다." />
  if (users.error) return <ErrorState message={users.error.message} onRetry={() => users.refetch()} />
  if (!user) return <ErrorState message="연결된 AAC 사용자가 없습니다." onRetry={() => users.refetch()} />

  return (
    <main className="gp-voice-page">
      <Link href="/settings" className="gp-voice-back" aria-label="환경 설정으로"><ArrowLeft /></Link>
      <div className="gp-progress"><i /><i /><i /><i className="off" /></div>
      <h1>음성 설정</h1><p>사용자에게 맞게 목소리를 고르세요</p>
      <div className="gp-voice-options">
        <button type="button" className={user.voiceType === 'CHILD_MALE' ? 'gp-voice-option is-selected' : 'gp-voice-option'} onClick={() => mutation.mutate({ voiceType: 'CHILD_MALE', speechRate: rate })}>남성 아동</button>
        <button type="button" className={user.voiceType === 'CHILD_FEMALE' ? 'gp-voice-option is-selected' : 'gp-voice-option'} onClick={() => mutation.mutate({ voiceType: 'CHILD_FEMALE', speechRate: rate })}>여성 아동</button>
        <button type="button" className="gp-voice-option" disabled title="백엔드 voiceType 확장 후 활성화">성인 여성</button>
        <button type="button" className="gp-voice-option" disabled title="백엔드 voiceType 확장 후 활성화">성인 남성</button>
      </div>
      <div className="gp-speed-title"><strong>음성 속도</strong><b>{rate.toFixed(1)}×</b></div>
      <div className="gp-speed-control">
        <span>🐢</span><button type="button" onClick={() => saveRate(rate - .1)}>−</button>
        <input type="range" min="0.7" max="1.3" step="0.1" value={rate} onChange={(event) => setRate(Number(event.target.value))} onPointerUp={() => user.voiceType && mutation.mutate({ voiceType: user.voiceType, speechRate: rate })} />
        <button type="button" onClick={() => saveRate(rate + .1)}>＋</button><span>🐰</span>
      </div>
      <div className="gp-speed-scale"><span>0.7×</span><span>1.3×</span></div>
      <button type="button" className="gp-preview" onClick={preview}><span><Play size={20} fill="currentColor" /></span><div><strong>미리듣기</strong><small>{user.voiceType === 'CHILD_FEMALE' ? '여성 아동' : '남성 아동'} · {rate.toFixed(1)}×</small></div></button>
    </main>
  )
}

export function LocationManagerPage() {
  const { showToast } = useToast()
  const [places, setPlaces] = useState<Place[]>([])
  const [draft, setDraft] = useState<Omit<Place, 'id'>>({ name: '', type: '학교', address: '', start: '08:00', end: '15:00' })

  useEffect(() => {
    const raw = window.localStorage.getItem('malmoa-guardian-places')
    if (raw) {
      try { setPlaces(JSON.parse(raw) as Place[]) } catch {}
    }
  }, [])

  function persist(next: Place[]) {
    setPlaces(next)
    window.localStorage.setItem('malmoa-guardian-places', JSON.stringify(next))
  }

  function addPlace() {
    if (!draft.name.trim() || !draft.address.trim()) return
    persist([...places, { id: crypto.randomUUID(), ...draft, name: draft.name.trim(), address: draft.address.trim() }])
    setDraft({ name: '', type: '학교', address: '', start: '08:00', end: '15:00' })
    showToast('장소가 저장되었습니다.')
  }

  return (
    <main className="gp-subpage">
      <ProductTitle title="장소 관리" />
      <div className="gp-location-grid">
        <section className="gp-place-card">
          <h2>자주 가는 장소</h2><p>장소와 시간 조건을 등록하면 관련 상징을 우선 노출할 수 있어요.</p>
          <div className="gp-place-list">
            {places.map((place) => <article className="gp-place" key={place.id}><MapPin /><div><strong>{place.name}</strong><span>{place.type} · {place.start}~{place.end}</span><small>{place.address}</small></div><button type="button" aria-label="장소 삭제" onClick={() => persist(places.filter((item) => item.id !== place.id))}><Trash2 size={18} /></button></article>)}
          </div>
          <div className="gp-place-form">
            <input placeholder="장소 이름" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as Place['type'] })}>{(['집', '학교', '병원', '치료실'] as const).map((value) => <option key={value}>{value}</option>)}</select>
            <input placeholder="주소 검색" value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} />
            <div className="gp-place-time"><input type="time" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} /><input type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></div>
            <button type="button" className="gp-primary" onClick={addPlace}><Save size={17} style={{ verticalAlign: 'middle', marginRight: 7 }} />장소 저장</button>
          </div>
        </section>
        <section className="gp-map-card">
          <h2>실시간 위치</h2><p>사용자의 현재 위치와 이동 경로를 확인합니다.</p>
          <div className="gp-map-placeholder"><div><MapPin size={48} /><strong>Map API 연동 영역</strong><span>GPS 좌표 수신 후 현재 위치 핀과 이동 경로가 표시됩니다.</span></div></div>
          <div className="gp-map-status"><i />실시간 GPS 연결 대기 · 안전구역 이탈 알림 연동 예정</div>
        </section>
      </div>
    </main>
  )
}

export function GuardianReportPage() {
  const sentences = useQuery({ queryKey: ['sentences', 'all'], queryFn: () => sentencesApi.list('all') })
  const categories = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list })
  const error = sentences.error ?? categories.error ?? notifications.error

  if (sentences.isLoading || categories.isLoading || notifications.isLoading) return <PageLoader label="리포트를 만드는 중입니다." />
  if (error) return <ErrorState message={error.message} onRetry={() => { sentences.refetch(); categories.refetch(); notifications.refetch() }} />

  const sentenceItems = sentences.data ?? []
  const top = [...sentenceItems].sort((a, b) => b.useCount - a.useCount).slice(0, 5)
  const maxUse = Math.max(1, ...top.map((item) => item.useCount))
  const emergencyCount = notifications.data?.length ?? 0
  const categoryMap = new Map((categories.data ?? []).map((item) => [item.id, item.name]))
  const categoryCounts = sentenceItems.reduce<Record<string, number>>((acc, item) => {
    const name = item.categoryName ?? (item.categoryId ? categoryMap.get(item.categoryId) : undefined) ?? '기타'
    acc[name] = (acc[name] ?? 0) + item.useCount
    return acc
  }, {})
  const totalUses = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0) || 1

  return (
    <main className="gp-subpage">
      <ProductTitle title="보호자 리포트" />
      <div className="gp-report-toolbar"><div className="gp-report-tabs"><button type="button" className="is-selected">주간</button><button type="button">월간</button><button type="button">일자 지정</button></div><button type="button" className="gp-export" onClick={() => window.print()}>PDF 리포트 내보내기</button></div>
      <div className="gp-report-grid">
        <section className="gp-report-card">
          <h2>단어 사용 패턴 분석</h2><p>사용한 문장과 카테고리의 변화를 확인합니다.</p>
          <div className="gp-summary-grid"><article className="gp-summary"><span>긴급 모드 발생</span><strong>{emergencyCount}회</strong></article><article className="gp-summary"><span>전체 발화 기록</span><strong>{sentenceItems.reduce((sum, item) => sum + item.useCount, 0)}회</strong></article></div>
          <h3>자주 사용한 상징 TOP 5</h3>
          <div className="gp-bars">{top.length ? top.map((item) => <div className="gp-bar-row" key={item.id}><span>{item.content}</span><div className="gp-bar"><i style={{ width: `${Math.max(7, item.useCount / maxUse * 100)}%` }} /></div><b>{item.useCount}회</b></div>) : <p>아직 사용 기록이 없습니다.</p>}</div>
          <h3>카테고리별 발화 비중</h3>
          <div className="gp-donut-wrap"><div className="gp-donut" /><div>{Object.entries(categoryCounts).slice(0, 5).map(([name, count]) => <div key={name} style={{ marginBottom: 6 }}><strong>{name}</strong> {Math.round(count / totalUses * 100)}%</div>)}</div></div>
          <div className="gp-insight">AI 발화 맥락 인사이트는 시간·장소·감정 데이터가 누적되면 해당 구간의 변화를 함께 요약합니다.</div>
        </section>
        <section className="gp-report-card">
          <h2>심박 변동 및 표정 변화</h2><p>생체 심박 데이터와 표정 인식 이벤트를 같은 시간축에 표시합니다.</p>
          <div className="gp-heart-chart"><svg viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,150 70,145 130,158 190,139 245,150 300,75 330,55 355,135 420,148 500,140 600,150" fill="none" stroke="#149E69" strokeWidth="5" /><circle cx="330" cy="55" r="8" fill="#ef5d64" /></svg></div>
          <div className="gp-event"><strong>14:15 · 센서 이벤트 영역</strong><small>심박 110 BPM 이상 또는 표정 변화가 감지되면 발화 기록과 함께 표시됩니다.</small></div>
          <div className="gp-insight">장소·시간 융합 정서 리포트는 GPS 및 센서 백엔드 연동 후 실제 관측 데이터로 갱신됩니다.</div>
        </section>
      </div>
    </main>
  )
}
