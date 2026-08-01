'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Grid3X3, Play, RotateCcw, ScanLine, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { userApi } from '../../api/user'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/ToastProvider'
import {
  defaultPreferences,
  usePreferencesStore,
} from '../../stores/preferencesStore'
import type { UserPreferences } from '../../types/models'

interface VoiceOption {
  id: string
  label: string
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const setStoredPreferences = usePreferencesStore((state) => state.setPreferences)
  const [draft, setDraft] = useState<UserPreferences>(defaultPreferences)
  const [voices, setVoices] = useState<VoiceOption[]>([
    { id: 'ko-KR-default', label: '한국어 기본 음성' },
  ])
  const preferencesQuery = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: userApi.getPreferences,
  })

  useEffect(() => {
    if (preferencesQuery.data) {
      // 서버 응답을 편집용 draft와 다른 AAC 화면이 읽는 전역 Store에 동기화한다.
      setDraft(preferencesQuery.data)
      setStoredPreferences(preferencesQuery.data)
    }
  }, [preferencesQuery.data, setStoredPreferences])

  useEffect(() => {
    // 브라우저 TTS 음성 목록은 비동기로 준비될 수 있어 voiceschanged도 구독한다.
    if (!('speechSynthesis' in window)) return
    const loadVoices = () => {
      const browserVoices = window.speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.startsWith('ko'))
        .map((voice) => ({ id: voice.voiceURI, label: voice.name }))
      if (browserVoices.length > 0) {
        setVoices([{ id: 'ko-KR-default', label: '한국어 기본 음성' }, ...browserVoices])
      }
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [])

  const mutation = useMutation({
    mutationFn: userApi.updatePreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(['user', 'preferences'], preferences)
      setStoredPreferences(preferences)
      showToast('사용 환경 설정을 저장했어요.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const isDirty = useMemo(
    // 설정 구조가 단순한 값 객체이므로 직렬화 비교로 저장 버튼 활성화를 결정한다.
    () => JSON.stringify(draft) !== JSON.stringify(preferencesQuery.data),
    [draft, preferencesQuery.data],
  )

  const testVoice = () => {
    if (!('speechSynthesis' in window)) {
      showToast('현재 브라우저에서는 음성 미리듣기를 지원하지 않아요.', 'error')
      return
    }
    window.speechSynthesis.cancel()
    // 미리듣기는 서버에 저장하기 전 draft 값을 사용한다.
    const utterance = new SpeechSynthesisUtterance('안녕하세요. 말모아 음성 미리듣기입니다.')
    utterance.lang = 'ko-KR'
    utterance.rate = draft.voiceRate
    utterance.pitch = draft.voicePitch
    const selected = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.voiceURI === draft.voiceId)
    if (selected) utterance.voice = selected
    window.speechSynthesis.speak(utterance)
  }

  if (preferencesQuery.isLoading) return <PageLoader />
  if (preferencesQuery.error) {
    return (
      <ErrorState
        message={preferencesQuery.error.message}
        onRetry={() => preferencesQuery.refetch()}
      />
    )
  }

  return (
    <div className="page page--narrow">
      <PageHeader
        title="사용 환경 설정"
        description="격자, 자동 스캔, 음성 설정을 사용자에게 맞게 저장할 수 있어요."
      />

      <Card className="settings-section">
        <div className="settings-section__heading">
          <span><Grid3X3 size={20} /></span>
          <div>
            <h2>격자 크기</h2>
            <p>한 화면에 표시할 상징 수를 선택하세요.</p>
          </div>
        </div>
        <div className="segmented-options">
          {([3, 4, 5] as const).map((columns) => (
            <button
              type="button"
              key={columns}
              className={draft.gridColumns === columns ? 'is-active' : ''}
              onClick={() => setDraft((current) => ({ ...current, gridColumns: columns }))}
            >
              <span className={`mini-grid mini-grid--${columns}`} aria-hidden>
                {Array.from({ length: columns * 2 }).map((_, index) => (
                  <i key={index} />
                ))}
              </span>
              {columns}열
            </button>
          ))}
        </div>
      </Card>

      <Card className="settings-section">
        <div className="settings-section__heading">
          <span><ScanLine size={20} /></span>
          <div>
            <h2>자동 스캔 속도</h2>
            <p>포커스가 다음 항목으로 이동하는 간격이에요.</p>
          </div>
        </div>
        <div className="settings-control">
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            aria-label="자동 스캔 속도"
            value={([800, 1200, 1800, 2400] as const).indexOf(draft.scanSpeedMs)}
            onChange={(event) => {
              const value = ([800, 1200, 1800, 2400] as const)[Number(event.target.value)]
              if (value) setDraft((current) => ({ ...current, scanSpeedMs: value }))
            }}
          />
          <output>{(draft.scanSpeedMs / 1000).toFixed(1)}초</output>
        </div>
      </Card>

      <Card className="settings-section">
        <div className="settings-section__heading">
          <span><Volume2 size={20} /></span>
          <div>
            <h2>음성 설정</h2>
            <p>TTS에서 사용할 목소리와 말하기 방식을 설정하세요.</p>
          </div>
        </div>
        <div className="settings-grid">
          <label>
            음성
            <select
              value={draft.voiceId}
              onChange={(event) =>
                setDraft((current) => ({ ...current, voiceId: event.target.value }))
              }
            >
              {voices.map((voice) => (
                <option value={voice.id} key={voice.id}>
                  {voice.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            말하기 속도
            <input
              type="range"
              min="0.6"
              max="1.4"
              step="0.1"
              value={draft.voiceRate}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  voiceRate: Number(event.target.value),
                }))
              }
            />
            <output>{draft.voiceRate.toFixed(1)}배</output>
          </label>
          <label>
            음높이
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.1"
              value={draft.voicePitch}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  voicePitch: Number(event.target.value),
                }))
              }
            />
            <output>{draft.voicePitch.toFixed(1)}</output>
          </label>
          <label className="toggle-row">
            <span>
              <strong>문장 선택 후 자동 재생</strong>
              <small>선택을 완료하면 TTS를 바로 재생합니다.</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={draft.autoSpeak}
              onChange={(event) =>
                setDraft((current) => ({ ...current, autoSpeak: event.target.checked }))
              }
            />
          </label>
        </div>
        <Button variant="outline" leftIcon={<Play size={16} />} onClick={testVoice}>
          음성 미리듣기
        </Button>
      </Card>

      <div className="sticky-actions">
        <Button
          variant="outline"
          leftIcon={<RotateCcw size={16} />}
          disabled={!isDirty || mutation.isPending}
          onClick={() => setDraft(preferencesQuery.data ?? defaultPreferences)}
        >
          변경 취소
        </Button>
        <Button
          disabled={!isDirty}
          loading={mutation.isPending}
          onClick={() => mutation.mutate(draft)}
        >
          설정 저장
        </Button>
      </div>
    </div>
  )
}
