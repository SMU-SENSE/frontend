'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
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
import { guardianLiveApi, type LivePlace } from '../../api/guardianLive'
import { apiConfig } from '../../api/client'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { useToast } from '../../components/ui/ToastProvider'
import type { BackendVoiceType } from '../../types/models'

type Place = {
  id: string
  name: string
  type: '집' | '학교' | '병원' | '치료실'
  address: string
  start: string
  end: string
  latitude?: number
  longitude?: number
  radius?: number
}

const CATEGORY_ICONS = ['📁', '🌟', '❤️', '🎯', '🎨', '🎵', '🏃', '🍎', '🌈', '🔥', '💎', '🦋']
const CATEGORY_COLORS = ['#149E69', '#F2C14E', '#FF9D52', '#F07478', '#7F8BF3', '#79C7DE', '#F4AE7B', '#B8C4BF']
const DEFAULT_CATEGORY_NAMES = ['긴급어', '사람', '음식·장소·신체', '행동', '감정·설명', '대화', '문법']
const DEFAULT_CATEGORY_ICONS: Record<string, string> = { 긴급어: '🆘', 사람: '👩', '음식·장소·신체': '🍱', 행동: '🙌', '감정·설명': '😊', 대화: '💬', 문법: '🔗' }

function ProductTitle({ title }: { title: string }) {
  return (
    <header className="gp-page__title">
      <Link className="gp-back" href="/settings" aria-label="환경 설정으로 돌아가기"><ChevronLeft size={30} /></Link>
      <h1>{title}</h1>
    </header>
  )
}

export function LanguageLevelPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const users = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const user = users.data?.find((item) => item.active) ?? users.data?.[0] ?? null
  const [level, setLevel] = useState<1 | 2 | 3 | 4>(2)
  const options = [
    { level: 1 as const, example: '물', description: '한 단어 중심(1어절)' },
    { level: 2 as const, example: '물 주세요. / 물 마시고 싶어요.', description: '짧은 문장 중심(2~4어절) · 기본값' },
    { level: 3 as const, example: '목이 말라서 물을 마시고 싶어요.', description: '일반 문장 중심(5~6어절)' },
    { level: 4 as const, example: '지금 너무 목이 마른데 시원한 물 한 잔만 주실 수 있나요?', description: '복잡한 문장 중심(7어절 이상)' },
  ]

  useEffect(() => {
    if (user?.sentenceLevel) setLevel(user.sentenceLevel)
  }, [user?.sentenceLevel])

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('연결된 AAC 사용자가 없습니다.')
      return guardianLiveApi.sentenceLevel(user.id, level)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aac-users'] })
      queryClient.invalidateQueries({ queryKey: ['guardian-board', user?.id] })
      showToast('사용자 언어 수준 설정이 저장되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  if (users.isLoading) return <PageLoader label="사용자 설정을 불러오는 중입니다." />
  if (users.error) return <ErrorState message={users.error.message} onRetry={() => users.refetch()} />
  if (!user) return <ErrorState message="연결된 AAC 사용자가 없습니다." onRetry={() => users.refetch()} />

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
  const users = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const user = users.data?.find((item) => item.active) ?? users.data?.[0] ?? null
  const board = useQuery({
    queryKey: ['guardian-board', user?.id],
    queryFn: () => guardianLiveApi.board(user!.id),
    enabled: Boolean(user),
  })
  const [icon, setIcon] = useState('📁')
  const [name, setName] = useState('')
  const [color, setColor] = useState('#149E69')
  const [dragId, setDragId] = useState<string | null>(null)
  const [iconMap, setIconMap] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      const rawIcons = window.localStorage.getItem('malmoa-category-icons')
      if (rawIcons) setIconMap(JSON.parse(rawIcons) as Record<string, string>)
    } catch {}
  }, [])

  const items = useMemo(
    () => [...(board.data?.categories ?? [])]
      .sort((x, y) => x.displayOrder - y.displayOrder)
      .map((item) => ({ id: String(item.id), liveId: item.id, name: item.name, color: item.color, order: item.displayOrder })),
    [board.data?.categories],
  )

  const createMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('연결된 AAC 사용자가 없습니다.')
      return guardianLiveApi.createCategory(user.id, { name: name.trim(), color, displayOrder: items.length })
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['guardian-board', user?.id] })
      const createdId = String('id' in created ? created.id : '')
      if (createdId) {
        const nextIcons = { ...iconMap, [createdId]: icon }
        setIconMap(nextIcons)
        window.localStorage.setItem('malmoa-category-icons', JSON.stringify(nextIcons))
      }
      setName('')
      setIcon('📁')
      showToast('카테고리가 추가되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const removeMutation = useMutation({
    mutationFn: (categoryId: string) => guardianLiveApi.deleteCategory(user!.id, /^\d+$/.test(categoryId) ? Number(categoryId) : categoryId),
    onSuccess: (_result, categoryId) => {
      queryClient.invalidateQueries({ queryKey: ['guardian-board', user?.id] })
      const nextIcons = { ...iconMap }
      delete nextIcons[categoryId]
      setIconMap(nextIcons)
      window.localStorage.setItem('malmoa-category-icons', JSON.stringify(nextIcons))
      showToast('카테고리가 삭제되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  async function moveCategory(targetId: string) {
    if (!dragId || dragId === targetId || !user) return
    const next = [...items]
    const from = next.findIndex((item) => item.id === dragId)
    const to = next.findIndex((item) => item.id === targetId)
    if (from < 0 || to < 0) return
    next.splice(to, 0, next.splice(from, 1)[0])
    setDragId(null)
    try {
      await Promise.all(next.map((item, displayOrder) => guardianLiveApi.updateCategory(user.id, item.liveId, { displayOrder })))
      await queryClient.invalidateQueries({ queryKey: ['guardian-board', user.id] })
      showToast('카테고리 순서를 저장했습니다.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '카테고리 순서를 저장하지 못했습니다.', 'error')
    }
  }

  if (users.isLoading || (user && board.isLoading)) return <PageLoader label="카테고리를 불러오는 중입니다." />
  const error = users.error ?? board.error
  if (error) return <ErrorState message={error.message} onRetry={() => { users.refetch(); board.refetch() }} />
  if (!user || !board.data) return <ErrorState message="연결된 AAC 사용자가 없습니다." onRetry={() => users.refetch()} />

  return (
    <main className="gp-category-page">
      <section className="gp-category-maker">
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
          const isDefault = DEFAULT_CATEGORY_NAMES.includes(item.name)
          const categoryIcon = iconMap[item.id] || DEFAULT_CATEGORY_ICONS[item.name] || CATEGORY_ICONS[index % CATEGORY_ICONS.length]
          return (
            <div
              className={dragId === item.id ? 'gp-category-row is-dragging' : 'gp-category-row'}
              key={item.id}
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => void moveCategory(item.id)}
            >
              <GripVertical />
              <span style={{ background: `${item.color}20`, color: item.color }}>{categoryIcon}</span>
              <strong>{item.name}</strong>
              {isDefault
                ? <em>기본</em>
                : <button type="button" aria-label={`${item.name} 삭제`} onClick={() => removeMutation.mutate(item.id)}><Trash2 size={19} /></button>}
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
    onSuccess: (updated) => {
      queryClient.setQueryData(['aac-users'], (current: typeof users.data) =>
        current?.map((item) => (item.id === updated.id ? updated : item)),
      )
      showToast('음성 설정이 저장되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const voiceOptions: Array<{ value: BackendVoiceType; label: string }> = [
    { value: 'CHILD_MALE', label: '또래 남아 아동' },
    { value: 'CHILD_FEMALE', label: '또래 여아 아동' },
    { value: 'ADULT_FEMALE', label: '성인 여성' },
    { value: 'ADULT_MALE', label: '성인 남성' },
  ]

  function saveRate(next: number) {
    const clamped = Math.max(.7, Math.min(1.3, Number(next.toFixed(1))))
    setRate(clamped)
    if (user?.voiceType) mutation.mutate({ voiceType: user.voiceType, speechRate: clamped })
  }

  function preview() {
    if (!('speechSynthesis' in window)) {
      showToast('이 기기에서는 음성 미리듣기를 지원하지 않습니다.', 'error')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance('안녕하세요! 말모아입니다.')
    utterance.lang = 'ko-KR'
    utterance.rate = rate
    const type = user?.voiceType ?? 'CHILD_MALE'
    utterance.pitch = type === 'CHILD_FEMALE' ? 1.35 : type === 'CHILD_MALE' ? 1.15 : type === 'ADULT_FEMALE' ? 1.08 : .95
    const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('ko'))
    const preferred = voices.find((voice) => {
      const name = voice.name.toLowerCase()
      return type.includes('FEMALE') ? /female|여성|yuna|sora|sunhi/.test(name) : /male|남성|injoon|heami/.test(name)
    })
    if (preferred) utterance.voice = preferred
    window.speechSynthesis.speak(utterance)
  }

  if (users.isLoading) return <PageLoader label="음성 설정을 불러오는 중입니다." />
  if (users.error) return <ErrorState message={users.error.message} onRetry={() => users.refetch()} />
  if (!user) return <ErrorState message="연결된 AAC 사용자가 없습니다." onRetry={() => users.refetch()} />

  const currentVoice: BackendVoiceType = user.voiceType ?? 'CHILD_MALE'
  const currentLabel = voiceOptions.find((option) => option.value === currentVoice)?.label ?? '남성 아동'

  return (
    <main className="gp-voice-page">
      <div className="gp-progress"><i /><i /><i /><i className="off" /></div>
      <h1>음성 설정</h1><p>사용자에게 맞게 목소리를 고르세요</p>
      <div className="gp-voice-options">
        {voiceOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={currentVoice === option.value ? 'gp-voice-option is-selected' : 'gp-voice-option'}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ voiceType: option.value, speechRate: rate })}
          >{option.label}</button>
        ))}
      </div>
      <div className="gp-speed-title"><strong>음성 속도</strong><b>{rate.toFixed(1)}×</b></div>
      <div className="gp-speed-control">
        <span>🐢</span><button type="button" onClick={() => saveRate(rate - .1)}>−</button>
        <input type="range" min="0.7" max="1.3" step="0.1" value={rate} onChange={(event) => setRate(Number(event.target.value))} onPointerUp={() => mutation.mutate({ voiceType: currentVoice, speechRate: rate })} />
        <button type="button" onClick={() => saveRate(rate + .1)}>＋</button><span>🐰</span>
      </div>
      <div className="gp-speed-scale"><span>0.7×</span><span>1.3×</span></div>
      <button type="button" className="gp-preview" onClick={preview}><span><Play size={20} fill="currentColor" /></span><div><strong>미리듣기</strong><small>{currentLabel} · {rate.toFixed(1)}×</small></div></button>
    </main>
  )
}

export function LocationManagerPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const users = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const user = users.data?.find((item) => item.active) ?? users.data?.[0] ?? null
  const [tracking, setTracking] = useState(true)
  const placesQuery = useQuery({
    queryKey: ['guardian-places', user?.id],
    queryFn: () => guardianLiveApi.places(user!.id),
    enabled: Boolean(user),
  })
  const latestQuery = useQuery({
    queryKey: ['guardian-location-latest', user?.id],
    queryFn: () => guardianLiveApi.latestLocation(user!.id),
    enabled: Boolean(user) && tracking,
    refetchInterval: tracking ? 5000 : false,
    retry: false,
  })
  const [draft, setDraft] = useState({ name: '', type: '학교' as Place['type'], address: '', start: '08:00', end: '15:00', radius: 500, latitude: undefined as number | undefined, longitude: undefined as number | undefined })
  const [geoError, setGeoError] = useState('')

  const placeTypeToBackend: Record<Place['type'], LivePlace['placeType']> = {
    '집': 'HOME',
    '학교': 'SCHOOL',
    '병원': 'HOSPITAL',
    '치료실': 'THERAPY',
  }
  const placeTypeToKorean: Record<string, Place['type']> = {
    HOME: '집',
    SCHOOL: '학교',
    HOSPITAL: '병원',
    THERAPY: '치료실',
    OTHER: '치료실',
  }

  const places: Place[] = (placesQuery.data ?? []).map((place) => ({
    id: String(place.id),
    name: place.name,
    type: placeTypeToKorean[place.placeType] ?? '치료실',
    address: place.address ?? '',
    start: String(place.activeFrom ?? '00:00').slice(0, 5),
    end: String(place.activeTo ?? '23:59').slice(0, 5),
    latitude: place.latitude,
    longitude: place.longitude,
    radius: place.radiusMeters,
  }))
  const position = latestQuery.data ? {
    latitude: latestQuery.data.latitude,
    longitude: latestQuery.data.longitude,
    accuracy: latestQuery.data.accuracyMeters ?? 0,
    updatedAt: new Date(latestQuery.data.recordedAt).getTime(),
  } : null
  const locationIsRecent = Boolean(position && Number.isFinite(position.updatedAt) && Date.now() - position.updatedAt < 5 * 60_000)

  function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
    const R = 6371000
    const toRad = (value: number) => value * Math.PI / 180
    const dLat = toRad(bLat - aLat)
    const dLng = toRad(bLng - aLng)
    const q = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(q))
  }

  // A safe zone only applies during its configured hours, including overnight spans.
  const nowTime = new Date().toTimeString().slice(0, 5)
  const isActiveNow = (place: Place) => {
    if (place.start === place.end) return true
    return place.start < place.end
      ? nowTime >= place.start && nowTime <= place.end
      : nowTime >= place.start || nowTime <= place.end
  }
  const activePlaces = places.filter(isActiveNow)
  const zoneStates = position ? activePlaces
    .filter((place) => typeof place.latitude === 'number' && typeof place.longitude === 'number')
    .map((place) => ({
      place,
      distance: distanceMeters(position.latitude, position.longitude, place.latitude!, place.longitude!),
    })) : []
  const inside = zoneStates.find(({ place, distance }) => distance <= (place.radius ?? 500))
  const nearest = [...zoneStates].sort((x, y) => x.distance - y.distance)[0]

  const createMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('연결된 AAC 사용자가 없습니다.')
      if (typeof draft.latitude !== 'number' || typeof draft.longitude !== 'number') throw new Error('장소 좌표를 먼저 지정해 주세요.')
      return guardianLiveApi.createPlace(user.id, {
        name: draft.name.trim(),
        placeType: placeTypeToBackend[draft.type],
        address: draft.address.trim(),
        latitude: draft.latitude,
        longitude: draft.longitude,
        radiusMeters: draft.radius,
        activeFrom: `${draft.start}:00`,
        activeTo: `${draft.end}:00`,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-places', user?.id] })
      setDraft({ name: '', type: '학교', address: '', start: '08:00', end: '15:00', radius: 500, latitude: undefined, longitude: undefined })
      showToast(apiConfig.useMockApi ? '시연용 장소가 이 브라우저에 저장되었습니다.' : '장소와 안심존 설정이 서버에 저장되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (placeId: string) => guardianLiveApi.deletePlace(user!.id, /^\d+$/.test(placeId) ? Number(placeId) : placeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-places', user?.id] })
      showToast('장소를 삭제했습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  function useCurrentLocation() {
    if (!navigator.geolocation) return showToast('이 기기에서는 위치 기능을 사용할 수 없습니다.', 'error')
    navigator.geolocation.getCurrentPosition(
      (value) => {
        setGeoError('')
        setDraft((current) => ({ ...current, latitude: value.coords.latitude, longitude: value.coords.longitude }))
        showToast('보호자 기기의 현재 위치를 장소 좌표로 지정했습니다.')
      },
      (error) => {
        setGeoError(error.message)
        showToast('현재 위치를 가져오지 못했습니다.', 'error')
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  async function allowNotifications() {
    if (!('Notification' in window)) return showToast('이 브라우저에서는 알림을 지원하지 않습니다.', 'error')
    const permission = await Notification.requestPermission()
    showToast(permission === 'granted' ? '브라우저 알림 권한을 허용했습니다. 실제 안심존 알림 수신에는 사용자 기기와 알림 연동이 필요합니다.' : '알림 권한이 허용되지 않았습니다.', permission === 'granted' ? 'success' : 'error')
  }

  if (users.isLoading || (user && placesQuery.isLoading)) return <PageLoader label="장소 설정을 불러오는 중입니다." />
  const error = users.error ?? placesQuery.error
  if (error) return <ErrorState message={error.message} onRetry={() => { users.refetch(); placesQuery.refetch() }} />
  if (!user) return <ErrorState message="연결된 AAC 사용자가 없습니다." onRetry={() => users.refetch()} />

  return (
    <main className="gp-subpage">
      <ProductTitle title="장소 관리" />
      <div className="gp-location-grid">
        <section className="gp-place-card">
          <h2>자주 가는 장소</h2><p>{apiConfig.useMockApi ? '시연용 장소는 이 브라우저에만 저장되며 실제 사용자 GPS와 연동되지 않습니다.' : '장소와 안심존을 서버에 저장하고 사용자 기기의 실제 위치와 비교합니다.'}</p>
          <div className="gp-place-list">
            {places.map((place) => {
              const state = zoneStates.find((item) => item.place.id === place.id)
              return <article className="gp-place" key={place.id}><MapPin /><div><strong>{place.name}</strong><span>{place.type} · {place.start}~{place.end} · 안심존 {place.radius ?? 500}m</span><small>{place.address || `위도 ${place.latitude?.toFixed(5)}, 경도 ${place.longitude?.toFixed(5)}`}{state ? ` · 현재 ${Math.round(state.distance)}m` : ''}</small></div><button type="button" aria-label="장소 삭제" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(place.id)}><Trash2 size={18} /></button></article>
            })}
          </div>
          <div className="gp-place-form">
            <input placeholder="장소 이름" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as Place['type'] })}>{(['집', '학교', '병원', '치료실'] as const).map((value) => <option key={value}>{value}</option>)}</select>
            <input placeholder="주소" value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} />
            <button type="button" className="gp-location-secondary" onClick={useCurrentLocation}><MapPin size={17} /> 이 장소의 현재 좌표 지정</button>
            {typeof draft.latitude === 'number' ? <small className="gp-coordinate-preview">좌표 {draft.latitude.toFixed(6)}, {draft.longitude?.toFixed(6)}</small> : null}
            <div className="gp-place-time"><input type="time" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} /><input type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></div>
            <label className="gp-radius-field"><span>안심존 반경</span><select value={draft.radius} onChange={(event) => setDraft({ ...draft, radius: Number(event.target.value) })}><option value={100}>100m</option><option value={300}>300m</option><option value={500}>500m</option><option value={1000}>1km</option></select></label>
            <button type="button" className="gp-primary" disabled={!draft.name.trim() || typeof draft.latitude !== 'number' || createMutation.isPending} onClick={() => createMutation.mutate()}><Save size={17} style={{ verticalAlign: 'middle', marginRight: 7 }} />장소 저장</button>
          </div>
        </section>
        <section className="gp-map-card">
          <h2>사용자 실시간 위치</h2><p>{apiConfig.useMockApi ? '시연 모드에서는 실제 사용자 위치를 수신하지 않습니다.' : '페어링된 사용자 기기가 서버로 전송한 최신 GPS 위치입니다.'}</p>
          <div className="gp-map-placeholder">
            <div className="gp-live-location">
              <MapPin size={48} />
              <strong>{position ? locationIsRecent && tracking ? '사용자 GPS 수신 중' : '마지막 사용자 GPS 위치' : '사용자 위치 대기 중'}</strong>
              {position ? <>
                <span>위도 {position.latitude.toFixed(6)}</span>
                <span>경도 {position.longitude.toFixed(6)}</span>
                <span>정확도 ±{Math.round(position.accuracy)}m</span>
                <span>{!locationIsRecent ? '마지막 수신 위치입니다. 현재 안심존 상태를 판단할 수 없습니다.' : inside ? `${inside.place.name} 안심존 안에 있습니다.` : nearest ? `가장 가까운 활성 장소: ${nearest.place.name} · ${Math.round(nearest.distance)}m` : places.length ? '현재 시간에 활성화된 안심존이 없습니다.' : '등록된 안심존이 없습니다.'}</span>
                <span>수신 {new Date(position.updatedAt).toLocaleString('ko-KR')}</span>
              </> : <span>{apiConfig.useMockApi ? '시연 모드 · 실제 위치 데이터 없음' : '사용자 PWA가 위치를 전송하면 자동으로 표시됩니다.'}</span>}
            </div>
          </div>
          {geoError ? <div className="gp-map-error">{geoError}</div> : null}
          {latestQuery.error && tracking ? <div className="gp-map-error">위치 정보를 가져오지 못했습니다. 사용자 기기의 위치 공유 상태와 네트워크를 확인해 주세요.</div> : null}
          <div className={tracking && locationIsRecent && inside ? 'gp-map-status is-safe' : 'gp-map-status'}><i />{!tracking ? '위치 자동 갱신 중지' : !position ? '사용자 GPS 수신 대기' : !locationIsRecent ? '최신 위치 수신 대기 · 마지막 위치 표시 중' : !places.length ? '위치 수신 중 · 등록된 안심존 없음' : !activePlaces.length ? '위치 수신 중 · 현재 활성 안심존 없음' : inside ? `${inside.place.name} 안심존 · 정상` : '사용자 GPS 수신 중 · 활성 안심존 밖'}</div>
          <div className="gp-location-actions">
            <button type="button" className={tracking ? 'gp-primary is-on' : 'gp-primary'} onClick={() => setTracking((value) => !value)}>{tracking ? '자동 갱신 중지' : '자동 갱신 시작'}</button>
            <button type="button" className="gp-location-secondary" onClick={allowNotifications}>안심존 알림 허용</button>
          </div>
        </section>
      </div>
    </main>
  )
}

export function GuardianReportPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('week')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const { showToast } = useToast()
  const users = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const user = users.data?.find((item) => item.active) ?? users.data?.[0] ?? null

  const range = useMemo(() => {
    const now = new Date()
    if (period === 'custom' && startDate && endDate) {
      return {
        from: new Date(`${startDate}T00:00:00`).toISOString(),
        to: new Date(`${endDate}T23:59:59.999`).toISOString(),
      }
    }
    const from = new Date(now)
    from.setDate(from.getDate() - (period === 'month' ? 30 : 7))
    return { from: from.toISOString(), to: now.toISOString() }
  }, [endDate, period, startDate])

  const report = useQuery({
    queryKey: ['guardian-report', user?.id, range.from, range.to],
    queryFn: () => guardianLiveApi.report(user!.id, range.from, range.to),
    enabled: Boolean(user) && (period !== 'custom' || Boolean(startDate && endDate)),
  })

  const exportPdf = useMutation({
    mutationFn: () => guardianLiveApi.downloadReportPdf(user!.id, range.from, range.to),
    onError: (error) => showToast(error.message, 'error'),
  })

  if (users.isLoading || (user && report.isLoading)) return <PageLoader label="리포트를 만드는 중입니다." />
  const error = users.error ?? report.error
  if (error) return <ErrorState message={error.message} onRetry={() => { users.refetch(); report.refetch() }} />
  if (!user) return <ErrorState message="연결된 AAC 사용자가 없습니다." onRetry={() => users.refetch()} />

  const data = report.data
  const top = data?.topCards ?? []
  const maxUse = Math.max(1, ...top.map((item) => item.count))
  const categoryEntries = data?.categoryShares ?? []
  const colors = ['#149E69', '#F2C14E', '#75B7DF', '#E96B74', '#9F90DF']
  let cursor = 0
  const stops = categoryEntries.slice(0, 5).map((item, index) => {
    const start = cursor
    cursor += item.percent
    return `${colors[index]} ${start}% ${cursor}%`
  }).join(',')
  const donutStyle = { background: categoryEntries.length ? `conic-gradient(${stops})` : '#ECECF0' }
  const sensors = data?.sensors ?? []
  const heartRates = sensors.filter((item) => item.type === 'HEART_RATE' && typeof item.value === 'number')
  const insight = data?.insights?.length ? data.insights.join(' ') : '실제 사용 기록이 누적되면 발화·긴급·센서 변화를 분석해 표시합니다.'

  return (
    <main className="gp-subpage gp-report-page">
      <ProductTitle title="보호자 리포트" />
      <div className="gp-report-toolbar">
        <div className="gp-report-tabs">
          <button type="button" className={period === 'week' ? 'is-selected' : ''} onClick={() => setPeriod('week')}>주간</button>
          <button type="button" className={period === 'month' ? 'is-selected' : ''} onClick={() => setPeriod('month')}>월간</button>
          <button type="button" className={period === 'custom' ? 'is-selected' : ''} onClick={() => setPeriod('custom')}>일자 지정</button>
        </div>
        <button type="button" className="gp-export" disabled={!data || exportPdf.isPending} onClick={() => exportPdf.mutate()}>{exportPdf.isPending ? 'PDF 생성 중…' : 'PDF 리포트 내보내기'}</button>
      </div>
      {period === 'custom' ? <div className="gp-report-dates"><label>시작일<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><span>—</span><label>종료일<input type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div> : null}
      {!data ? <section className="gp-report-card"><p>조회 기간을 선택해 주세요.</p></section> : <div className="gp-report-grid">
        <section className="gp-report-card">
          <h2>단어 사용 패턴 분석</h2><p>서버에 기록된 실제 AAC 카드 사용 데이터를 분석합니다.</p>
          <div className="gp-summary-grid">
            <article className="gp-summary"><span>긴급 모드 발생</span><strong>{data.emergencyCount}회</strong></article>
            <article className="gp-summary"><span>전체 카드 사용</span><strong>{data.totalCardActions}회</strong></article>
          </div>
          <h3>자주 사용한 상징 TOP 5</h3>
          <div className="gp-bars">{top.length ? top.map((item) => <div className="gp-bar-row" key={String(item.id)}><span>{item.name}</span><div className="gp-bar"><i style={{ width: `${Math.max(7, item.count / maxUse * 100)}%` }} /></div><b>{item.count}회</b></div>) : <p>아직 사용 기록이 없습니다.</p>}</div>
          <h3>카테고리별 발화 비중</h3>
          <div className="gp-donut-wrap"><div className="gp-donut" style={donutStyle} /><div>{categoryEntries.slice(0, 5).map((item, index) => <div className="gp-donut-legend" key={String(item.id)}><i style={{ background: colors[index] }} /><strong>{item.name}</strong><span>{item.percent.toFixed(1)}%</span></div>)}</div></div>
          <div className="gp-insight"><strong>AI 발화 맥락 인사이트</strong><br />{insight}</div>
        </section>
        <section className="gp-report-card">
          <h2>심박 변동 및 표정 변화</h2><p>사용자 기기에서 서버로 전송된 센서 이벤트입니다.</p>
          <div className="gp-heart-chart">
            {heartRates.length ? <div className="gp-live-heart-list">{heartRates.slice(-8).map((item, index) => <span key={`${item.recordedAt}-${index}`}><b>{Math.round(item.value!)} BPM</b><small>{new Date(item.recordedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</small></span>)}</div> : <div className="gp-live-location"><strong>심박 데이터 없음</strong><span>센서 이벤트가 수신되면 이 영역에 표시됩니다.</span></div>}
          </div>
          <div className="gp-event"><strong>센서 이벤트 타임라인</strong><small>{sensors.length ? `선택 기간에 ${sensors.length}개의 센서 이벤트가 기록되었습니다.` : '아직 센서 이벤트가 없습니다.'}</small></div>
          <div className="gp-sensor-events">{sensors.slice(-8).reverse().map((item, index) => <article key={`${item.recordedAt}-${index}`}><strong>{item.type}</strong><span>{item.value ?? item.label ?? '-'}</span><time>{new Date(item.recordedAt).toLocaleString('ko-KR')}</time></article>)}</div>
        </section>
      </div>}
    </main>
  )
}

