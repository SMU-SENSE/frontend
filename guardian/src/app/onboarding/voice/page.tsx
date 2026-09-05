'use client'

import { Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { aacUserApi } from '../../../api/aacUsers'
import { apiConfig } from '../../../api/client'
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/ToastProvider'
import { loadOnboardingDraft, saveOnboardingDraft, type VoiceType } from '../../../lib/onboardingDraft'
import type { BackendVoiceType } from '../../../types/models'

function FigmaTurtleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.2 13.7c.45-3.75 3.35-6.45 7.15-6.45 3.55 0 6.25 2.3 6.85 5.75H5.2v.7Z"
        fill="currentColor"
      />
      <circle cx="20.25" cy="13.1" r="2.05" fill="currentColor" />
      <path d="M5.15 13.2 2.9 12.25l.55 2.45 1.9-.55-.2-.95Z" fill="currentColor" />
      <rect x="7.1" y="15.1" width="2.7" height="2.25" rx="1.05" fill="currentColor" />
      <rect x="14.4" y="15.1" width="2.7" height="2.25" rx="1.05" fill="currentColor" />
      <path d="M8.25 10.9h8.45M10.05 8.75v4.15M14.4 8.55v4.35" stroke="white" strokeWidth="1.1" strokeLinecap="round" opacity=".9" />
      <circle cx="20.85" cy="12.65" r=".35" fill="white" />
    </svg>
  )
}

function FigmaRabbitIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15.25 8.9c-.75-1.95-.7-5.65.15-7.05.3-.5.95-.45 1.2.1.7 1.55.55 4.75-.2 7.05l-1.15-.1Z"
        fill="currentColor"
      />
      <path
        d="M17.05 9.35c.15-2.1 1.35-5.25 2.55-6.35.45-.4 1.05-.15 1.05.45.05 1.75-1.35 4.65-2.55 6.35l-1.05-.45Z"
        fill="currentColor"
      />
      <circle cx="16.4" cy="11.15" r="3.25" fill="currentColor" />
      <ellipse cx="12.25" cy="16.45" rx="5.1" ry="4.15" fill="currentColor" />
      <circle cx="7.1" cy="15.35" r="1.9" fill="currentColor" />
      <ellipse cx="15.95" cy="20" rx="3.6" ry="1.35" fill="currentColor" />
      <circle cx="17.25" cy="10.55" r=".42" fill="white" />
      <path d="m19.2 12.25 1.55.5-1.55.55" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const toBackendVoice: Record<VoiceType, BackendVoiceType> = {
  'male-child': 'CHILD_MALE',
  'female-child': 'CHILD_FEMALE',
}

const voiceLabel: Record<VoiceType, string> = {
  'male-child': '남성 아동',
  'female-child': '여성 아동',
}

export default function VoiceOnboardingPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [voiceType, setVoiceType] = useState<VoiceType>('male-child')
  const [rate, setRate] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const draft = loadOnboardingDraft()
    setVoiceType(draft.voiceType ?? 'male-child')
    setRate(draft.speechRate ?? 1)
  }, [])

  const preview = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance('안녕하세요. 말모아입니다.')
    utterance.lang = 'ko-KR'
    utterance.rate = rate
    utterance.pitch = voiceType === 'female-child' ? 1.2 : 1
    window.speechSynthesis.speak(utterance)
  }

  const saveAndContinue = async (nextVoiceType: VoiceType, nextRate: number) => {
    if (submitting) return
    saveOnboardingDraft({ voiceType: nextVoiceType, speechRate: nextRate })

    if (apiConfig.useMockApi) {
      router.push('/users/setup/confirm')
      return
    }

    const { userId } = loadOnboardingDraft()
    if (!userId) {
      showToast('사용자 정보가 없어요. 프로필부터 다시 입력해 주세요.', 'error')
      router.replace('/users/setup/profile')
      return
    }

    setSubmitting(true)
    try {
      await aacUserApi.updateVoice(userId, toBackendVoice[nextVoiceType], nextRate)
      router.push('/users/setup/confirm')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '음성 설정을 저장하지 못했어요.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const submit = () => saveAndContinue(voiceType, rate)

  const changeRate = (delta: number) => {
    setRate((current) => Math.min(1.3, Math.max(0.7, Number((current + delta).toFixed(1)))))
  }

  const skip = () => {
    setVoiceType('male-child')
    setRate(1)
    void saveAndContinue('male-child', 1)
  }

  const progress = Math.round(((rate - 0.7) / 0.6) * 100)

  return (
    <OnboardingLayout step={3} title="음성 설정" subtitle="사용자에게 맞게 목소리를 고르세요">
      <div className="voice-form">
        <div className="voice-choice-row">
          <button
            type="button"
            className={voiceType === 'male-child' ? 'voice-choice voice-choice--active' : 'voice-choice'}
            onClick={() => setVoiceType('male-child')}
          >
            남성 아동
          </button>
          <button
            type="button"
            className={voiceType === 'female-child' ? 'voice-choice voice-choice--active' : 'voice-choice'}
            onClick={() => setVoiceType('female-child')}
          >
            여성 아동
          </button>
        </div>

        <div className="speed-control">
          <div className="speed-label">
            <span>음성 속도</span>
            <strong>{rate.toFixed(1)}×</strong>
          </div>
          <div className="speed-range-row">
            <span className="speed-animal speed-animal--slow" aria-hidden="true"><FigmaTurtleIcon /></span>
            <button type="button" className="speed-step" onClick={() => changeRate(-0.1)} aria-label="음성 속도 낮추기">
              −
            </button>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.1"
              value={rate}
              style={{
                background: `linear-gradient(to right, var(--figma-green) 0%, var(--figma-green) ${progress}%, var(--figma-gray-200) ${progress}%, var(--figma-gray-200) 100%)`,
              }}
              onChange={(event) => setRate(Number(event.target.value))}
            />
            <button type="button" className="speed-step" onClick={() => changeRate(0.1)} aria-label="음성 속도 높이기">
              +
            </button>
            <span className="speed-animal speed-animal--fast" aria-hidden="true"><FigmaRabbitIcon /></span>
          </div>
          <div className="speed-scale">
            <span>0.7×</span>
            <span>1.3×</span>
          </div>
        </div>

        <button type="button" className="voice-preview" onClick={preview}>
          <Play size={18} fill="currentColor" />
          <div>
            <strong>미리듣기</strong>
            <span>{voiceLabel[voiceType]} · {rate.toFixed(1)}×</span>
          </div>
        </button>
      </div>

      <Button fullWidth size="lg" loading={submitting} onClick={submit}>
        다음
      </Button>
      <button type="button" className="onboarding-later" disabled={submitting} onClick={skip}>
        나중에 설정하기
      </button>
    </OnboardingLayout>
  )
}
