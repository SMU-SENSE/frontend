'use client'

import { Play, Rabbit, Turtle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { aacUserApi } from '../../../api/aacUsers'
import { apiConfig } from '../../../api/client'
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/ToastProvider'
import { loadOnboardingDraft, saveOnboardingDraft, type VoiceType } from '../../../lib/onboardingDraft'
import type { BackendVoiceType } from '../../../types/models'

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
            <span className="speed-animal speed-animal--slow" aria-hidden="true"><Turtle size={18} strokeWidth={2} /></span>
            <button type="button" className="speed-step" onClick={() => changeRate(-0.1)} aria-label="음성 속도 낮추기">
              −
            </button>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.1"
              value={rate}
              onChange={(event) => setRate(Number(event.target.value))}
            />
            <button type="button" className="speed-step" onClick={() => changeRate(0.1)} aria-label="음성 속도 높이기">
              +
            </button>
            <span className="speed-animal speed-animal--fast" aria-hidden="true"><Rabbit size={18} strokeWidth={2} /></span>
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
