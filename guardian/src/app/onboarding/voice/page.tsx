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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.2 13.3c0-3.6 2.7-6.2 6.4-6.2 3.4 0 5.9 2.2 6.3 5.3"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 13.2h11.4c.8 0 1.4.6 1.4 1.4 0 .9-.7 1.6-1.6 1.6H7.1c-1.1 0-1.9-.8-1.9-1.8 0-.5.4-1 .9-1.2Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 9.1v6.6M13.7 8.4v7.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20.1" cy="13.3" r="1.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.8 13.6 3 12.7M8.2 16.3l-.8 2M15.3 16.3l.8 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function FigmaRabbitIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.4 8.9c1.1-1.7 1.2-4.6.4-6.1-.4-.7-1.2-.6-1.5.1-.6 1.5-.7 4.1-.1 5.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.1 9.5c1.7-1.1 2.9-3.8 2.7-5.5-.1-.8-.9-1.1-1.4-.5-1 1.2-1.9 3.6-1.8 5.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.9 13.2c0 2.2-1.7 4-4 4-2.2 0-4-1.8-4-4s1.8-4 4-4c2.3 0 4 1.8 4 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M10.7 15.7c-2.5.5-4.2 2.2-4.2 4.1h9.9c0-1.4-.6-2.5-1.8-3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18.8" cy="16.5" r="1.7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12.7 12.4h.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8.6 20h-2M15.4 20h2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
