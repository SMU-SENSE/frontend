'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Info,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { aacUserApi } from '../../api/aacUsers'
import { authApi } from '../../api/auth'
import { guardianLiveApi, type LiveRoutine } from '../../api/guardianLive'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { useToast } from '../../components/ui/ToastProvider'
import { useAuthStore } from '../../stores/authStore'
import { usePreferencesStore } from '../../stores/preferencesStore'
import type { BackendGridSize, BackendVoiceType } from '../../types/models'

type Routine = {
  id: string | number
  time: string
  repeat: '매일' | '요일'
  sentence: string
  enabled: boolean
  days?: number[]
}

type RoutineDraft = {
  repeat: '매일' | '요일'
  ampm: '오전' | '오후'
  hour: number
  minute: number
  sentence: string
  days: number[]
}

export default function SettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const logoutStore = useAuthStore((state) => state.logout)
  const patchPreferences = usePreferencesStore((state) => state.patchPreferences)
  const [routineModalOpen, setRoutineModalOpen] = useState(false)

  const usersQuery = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const user = useMemo(
    () => usersQuery.data?.find((item) => item.active) ?? usersQuery.data?.[0] ?? null,
    [usersQuery.data],
  )
  const routinesQuery = useQuery({
    queryKey: ['guardian-routines', user?.id],
    queryFn: () => guardianLiveApi.routines(user!.id),
    enabled: Boolean(user),
  })

  const gridMutation = useMutation({
    mutationFn: ({ userId, gridSize }: { userId: number; gridSize: BackendGridSize }) =>
      aacUserApi.updateGrid(userId, gridSize),
    onSuccess: (updated) => {
      queryClient.setQueryData(['aac-users'], (current: typeof usersQuery.data) =>
        current?.map((item) => (item.id === updated.id ? updated : item)),
      )
      const columns = updated.gridSize === 'GRID_2X2' ? 2 : updated.gridSize === 'GRID_3X3' ? 3 : 4
      if (columns >= 3) patchPreferences({ gridColumns: columns as 3 | 4 })
      showToast('화면 격자 설정이 저장되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const voiceMutation = useMutation({
    mutationFn: ({ userId, voiceType, speechRate }: { userId: number; voiceType: BackendVoiceType; speechRate: number }) =>
      aacUserApi.updateVoice(userId, voiceType, speechRate),
    onSuccess: (updated) => {
      queryClient.setQueryData(['aac-users'], (current: typeof usersQuery.data) =>
        current?.map((item) => (item.id === updated.id ? updated : item)),
      )
      patchPreferences({ voiceRate: updated.speechRate ?? 1 })
      showToast('TTS 음성 설정이 저장되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const dayMap = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
  const routines: Routine[] = (routinesQuery.data ?? []).map((item) => ({
    id: item.id,
    time: item.timeOfDay.slice(0, 5),
    repeat: item.daysOfWeek.length >= 7 ? '매일' : '요일',
    sentence: item.message,
    enabled: item.enabled,
    days: item.daysOfWeek.map((day) => dayMap.indexOf(day)).filter((day) => day >= 0),
  }))

  const createRoutineMutation = useMutation({
    mutationFn: (routine: Routine) => guardianLiveApi.createRoutine(user!.id, {
      title: routine.sentence.length > 24 ? `${routine.sentence.slice(0, 24)}…` : routine.sentence,
      message: routine.sentence,
      timeOfDay: `${routine.time}:00`,
      daysOfWeek: routine.repeat === '매일' ? dayMap : (routine.days ?? [1,2,3,4,5]).map((day) => dayMap[day]),
      timezone: 'Asia/Seoul',
      enabled: routine.enabled,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-routines', user?.id] })
      setRoutineModalOpen(false)
      showToast('루틴이 추가되었습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const updateRoutineMutation = useMutation({
    mutationFn: ({ routine, enabled }: { routine: LiveRoutine; enabled: boolean }) => guardianLiveApi.updateRoutine(user!.id, routine.id, {
      title: routine.title,
      message: routine.message,
      timeOfDay: routine.timeOfDay,
      daysOfWeek: routine.daysOfWeek,
      timezone: routine.timezone,
      enabled,
      lastTriggeredDate: routine.lastTriggeredDate,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guardian-routines', user?.id] }),
    onError: (error) => showToast(error.message, 'error'),
  })

  const deleteRoutineMutation = useMutation({
    mutationFn: (routineId: string | number) => guardianLiveApi.deleteRoutine(user!.id, routineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-routines', user?.id] })
      showToast('루틴을 삭제했습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {
      // 세션 만료 상태여도 클라이언트 세션은 정리한다.
    } finally {
      logoutStore()
      router.replace('/welcome')
    }
  }

  async function handleWithdraw() {
    const confirmed = window.confirm('말모아 회원을 탈퇴하시겠습니까? 저장된 보호자 설정과 연결 정보가 삭제될 수 있습니다.')
    if (!confirmed) return
    const typed = window.prompt('계속하려면 “탈퇴”를 입력해 주세요.')
    if (typed !== '탈퇴') return
    try {
      await authApi.deleteAccount()
      Object.keys(window.localStorage).filter((key) => key.startsWith('malmoa-')).forEach((key) => window.localStorage.removeItem(key))
      logoutStore()
      router.replace('/welcome')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '회원 탈퇴를 처리하지 못했습니다.', 'error')
    }
  }

  if (usersQuery.isLoading || (user && routinesQuery.isLoading)) return <PageLoader label="사용자 설정을 불러오는 중입니다." />
  const settingsError = usersQuery.error ?? routinesQuery.error
  if (settingsError) return <ErrorState message={settingsError.message} onRetry={() => { usersQuery.refetch(); routinesQuery.refetch() }} />
  if (!user) return <ErrorState message="연결된 AAC 사용자가 없습니다." onRetry={() => usersQuery.refetch()} />

  return (
    <main className="gp-page">
      <header className="gp-page__title">
        <Link className="gp-back" href="/" aria-label="메인으로 돌아가기"><ChevronLeft size={30} /></Link>
        <h1>환경 설정</h1>
      </header>

      <div className="gp-settings-top">
        <section className="gp-card gp-setting-card">
          <h2>화면 격자 크기</h2>
          <p>소근육 조절 능력에 맞게 설정</p>
          <div className="gp-choice-row">
            {([
              ['GRID_2X2', '2×2'],
              ['GRID_3X3', '3×3'],
              ['GRID_4X4', '4×4'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={user.gridSize === value ? 'gp-choice is-selected' : 'gp-choice'}
                disabled={gridMutation.isPending}
                onClick={() => gridMutation.mutate({ userId: user.id, gridSize: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="gp-card gp-setting-card">
          <h2>TTS 음성</h2>
          <p>또래 집단과 어울리는 자연스러운 음성</p>
          <div className="gp-choice-row gp-choice-row--voice">
            <button
              type="button"
              className={user.voiceType === 'CHILD_MALE' ? 'gp-choice is-selected' : 'gp-choice'}
              disabled={voiceMutation.isPending}
              onClick={() => voiceMutation.mutate({ userId: user.id, voiceType: 'CHILD_MALE', speechRate: user.speechRate ?? 1 })}
            >또래 남아</button>
            <button
              type="button"
              className={user.voiceType === 'CHILD_FEMALE' ? 'gp-choice is-selected' : 'gp-choice'}
              disabled={voiceMutation.isPending}
              onClick={() => voiceMutation.mutate({ userId: user.id, voiceType: 'CHILD_FEMALE', speechRate: user.speechRate ?? 1 })}
            >또래 여아</button>
            <button
              type="button"
              className={user.voiceType === 'ADULT_FEMALE' ? 'gp-choice is-selected' : 'gp-choice'}
              disabled={voiceMutation.isPending}
              onClick={() => voiceMutation.mutate({ userId: user.id, voiceType: 'ADULT_FEMALE', speechRate: user.speechRate ?? 1 })}
            >성인 여성</button>
            <button
              type="button"
              className={user.voiceType === 'ADULT_MALE' ? 'gp-choice is-selected' : 'gp-choice'}
              disabled={voiceMutation.isPending}
              onClick={() => voiceMutation.mutate({ userId: user.id, voiceType: 'ADULT_MALE', speechRate: user.speechRate ?? 1 })}
            >성인 남성</button>
          </div>
        </section>
      </div>

      <section className="gp-card gp-routine-card">
        <div className="gp-routine-head">
          <div><h2>루틴 스케줄러</h2><p>지정 시간에 완성형 문장 자동 팝업</p></div>
          <button type="button" className="gp-add-button" onClick={() => setRoutineModalOpen(true)}><Plus size={19} /> 추가</button>
        </div>
        <div className="gp-routine-list">
          {routines.map((routine) => (
            <div className="gp-routine-row" key={routine.id}>
              <Clock3 className="gp-routine-clock" size={31} />
              <div className="gp-routine-copy">
                <strong>{routine.time}</strong><span className="gp-repeat">{routine.repeat === '요일' && routine.days?.length ? ['일','월','화','수','목','금','토'].filter((_, index) => routine.days?.includes(index)).join('·') : routine.repeat}</span>
                <p>{routine.sentence}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={routine.enabled}
                className={routine.enabled ? 'gp-switch is-on' : 'gp-switch'}
                onClick={() => { const source = routinesQuery.data?.find((item) => String(item.id) === String(routine.id)); if (source) updateRoutineMutation.mutate({ routine: source, enabled: !source.enabled }) }}
              ><i /></button>
              <button type="button" className="gp-trash" aria-label="루틴 삭제" onClick={() => deleteRoutineMutation.mutate(routine.id)}><Trash2 size={23} /></button>
            </div>
          ))}
        </div>
      </section>

      <div className="gp-lower-grid">
        <Link className="gp-card gp-shortcut" href="/settings/report">
          <span className="gp-shortcut__icon"><BarChart3 size={31} /></span>
          <div><strong>사용 기록 조회</strong><small>기간별 발화 기록 및 PDF 내보내기</small></div><ChevronRight size={28} />
        </Link>
        <Link className="gp-card gp-shortcut" href="/settings/help">
          <span className="gp-shortcut__icon is-yellow"><Info size={31} /></span>
          <div><strong>도움말 · 버전 정보</strong><small>FAQ · 고객센터 · 앱 지원 · v2.4.1</small></div><ChevronRight size={28} />
        </Link>
      </div>

      <section className="gp-card gp-account-card">
        <h2>계정</h2>
        <div className="gp-account-actions">
          <button type="button" onClick={() => void handleLogout()}><X size={23} style={{ verticalAlign: 'middle', marginRight: 10 }} />로그아웃</button>
          <button type="button" className="danger" onClick={() => void handleWithdraw()}><TriangleAlert size={23} style={{ verticalAlign: 'middle', marginRight: 10 }} />회원탈퇴</button>
        </div>
      </section>

      <nav className="gp-detail-settings" aria-label="세부 설정">
        <Link href="/settings/language"><span>🧠</span><div><strong>문장 이해 수준</strong><small>AI 추천 문장 길이 설정</small></div><ChevronRight size={22} /></Link>
        <Link href="/settings/categories"><span>🗂️</span><div><strong>카테고리 편집</strong><small>아이콘·색상·순서 관리</small></div><ChevronRight size={22} /></Link>
        <Link href="/settings/location"><span>📍</span><div><strong>장소 관리</strong><small>GPS·안심존·시간 조건</small></div><ChevronRight size={22} /></Link>
        <Link href="/connect"><span>🔗</span><div><strong>사용자 기기 연결</strong><small>QR·초대 코드·연결 기기 관리</small></div><ChevronRight size={22} /></Link>
        <Link href="/settings/voice"><span>🔊</span><div><strong>TTS 상세 설정</strong><small>음성 종류·속도·미리듣기</small></div><ChevronRight size={22} /></Link>
      </nav>

      <button type="button" className="gp-help" aria-label="도움말" onClick={() => window.alert('말모아 보호자 M+\n설정 · 카드 편집 · 사용자 연결 및 리포트 기능을 제공합니다.')}>?</button>
      {routineModalOpen ? <RoutineModal saving={createRoutineMutation.isPending} onClose={() => { if (!createRoutineMutation.isPending) setRoutineModalOpen(false) }} onSave={(routine) => createRoutineMutation.mutate(routine)} /> : null}
    </main>
  )
}

function RoutineModal({ saving, onClose, onSave }: { saving: boolean; onClose: () => void; onSave: (routine: Routine) => void }) {
  const [draft, setDraft] = useState<RoutineDraft>({ repeat: '매일', ampm: '오전', hour: 9, minute: 0, sentence: '', days: [1, 2, 3, 4, 5] })
  const canSave = draft.sentence.trim().length > 0 && draft.sentence.trim().length <= 300 && (draft.repeat === '매일' || draft.days.length > 0)

  function bump(field: 'hour' | 'minute', delta: number) {
    setDraft((current) => {
      if (field === 'hour') {
        const next = current.hour + delta
        return { ...current, hour: next > 12 ? 1 : next < 1 ? 12 : next }
      }
      return { ...current, minute: (current.minute + delta + 60) % 60 }
    })
  }

  function submit() {
    if (!canSave || saving) return
    let hour = draft.hour
    if (draft.ampm === '오후' && hour < 12) hour += 12
    if (draft.ampm === '오전' && hour === 12) hour = 0
    onSave({
      id: crypto.randomUUID(),
      time: `${String(hour).padStart(2, '0')}:${String(draft.minute).padStart(2, '0')}`,
      repeat: draft.repeat,
      sentence: draft.sentence.trim(),
      enabled: true,
      days: draft.repeat === '요일' ? draft.days : undefined,
    })
  }

  return (
    <div className="gp-modal-backdrop" role="presentation">
      <section className="gp-routine-modal" role="dialog" aria-modal="true" aria-labelledby="routine-title">
        <header className="gp-routine-modal__head">
          <span><Clock3 size={39} /></span><h2 id="routine-title">루틴 추가</h2>
          <button type="button" aria-label="닫기" onClick={onClose}><X size={38} /></button>
        </header>
        <div className="gp-routine-modal__body">
          <span className="gp-field-title">반복 주기</span>
          <div className="gp-repeat-row">
            <button type="button" className={draft.repeat === '매일' ? 'is-selected' : ''} onClick={() => setDraft({ ...draft, repeat: '매일' })}>매일</button>
            <button type="button" className={draft.repeat === '요일' ? 'is-selected' : ''} onClick={() => setDraft({ ...draft, repeat: '요일' })}>요일</button>
          </div>
          {draft.repeat === '요일' ? <><div className="gp-weekdays">{['일','월','화','수','목','금','토'].map((label, index) => <button key={label} type="button" className={draft.days.includes(index) ? 'is-selected' : ''} onClick={() => setDraft({ ...draft, days: draft.days.includes(index) ? draft.days.filter((day) => day !== index) : [...draft.days, index].sort() })}>{label}</button>)}</div>{draft.days.length === 0 ? <p role="alert">반복할 요일을 하나 이상 선택해 주세요.</p> : null}</> : null}
          <div className="gp-time-section">
            <span className="gp-field-title">시간</span>
            <div className="gp-time-picker">
              <div className="gp-ampm">
                <button type="button" className={draft.ampm === '오전' ? 'is-selected' : ''} onClick={() => setDraft({ ...draft, ampm: '오전' })}>오전</button>
                <button type="button" className={draft.ampm === '오후' ? 'is-selected' : ''} onClick={() => setDraft({ ...draft, ampm: '오후' })}>오후</button>
              </div>
              <TimeColumn label="시" value={draft.hour} onUp={() => bump('hour', 1)} onDown={() => bump('hour', -1)} />
              <b className="gp-colon">:</b>
              <TimeColumn label="분" value={draft.minute} onUp={() => bump('minute', 5)} onDown={() => bump('minute', -5)} />
            </div>
            <p className="gp-selected-time">선택된 시간: <b>{draft.ampm} {String(draft.hour).padStart(2, '0')}:{String(draft.minute).padStart(2, '0')}</b></p>
          </div>
          <div className="gp-sentence-field">
            <span className="gp-field-title">출력할 문장</span>
            <input autoFocus={false} maxLength={300} placeholder="예: 물과 약을 가져다주세요" value={draft.sentence} onChange={(event) => setDraft({ ...draft, sentence: event.target.value })} />
          </div>
        </div>
        <footer className="gp-routine-modal__foot">
          <button type="button" className="primary" disabled={!canSave || saving} onClick={submit}><Check size={26} style={{ verticalAlign: 'middle', marginRight: 10 }} />{saving ? '저장 중…' : '저장'}</button>
          <button type="button" onClick={onClose}>취소</button>
        </footer>
      </section>
    </div>
  )
}

function TimeColumn({ label, value, onUp, onDown }: { label: string; value: number; onUp: () => void; onDown: () => void }) {
  return (
    <div className="gp-time-column">
      <span>{label}</span>
      <button type="button" aria-label={`${label} 증가`} onClick={onUp}><ChevronUp /></button>
      <div className="gp-time-value">{String(value).padStart(2, '0')}</div>
      <button type="button" aria-label={`${label} 감소`} onClick={onDown}><ChevronDown /></button>
    </div>
  )
}
