'use client'

import { Play, Volume2 } from 'lucide-react'
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

  const submit = async () => {
    if (submitting) return
    saveOnboardingDraft({ voiceType, speechRate: rate })

    if (apiConfig.useMockApi) {
      router.push('/onboarding/confirm')
      return
    }

    const { userId } = loadOnboardingDraft()
    if (!userId) {
      showToast('사용자 정보가 없어요. 프로필부터 다시 입력해 주세요.', 'error')
      router.replace('/onboarding/profile')
      return
    }

    setSubmitting(true)
    try {
      await aacUserApi.updateVoice(userId, toBackendVoice[voiceType], rate)
      router.push('/onboarding/confirm')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '음성 설정을 저장하지 못했어요.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <OnboardingLayout step={3} title="음성 설정" subtitle="사용자에게 가장 익숙한 음성을 고르고 속도를 조절해 주세요">
      <div className="voice-form">
        <div className="voice-choice-row">
          <button type="button" className={voiceType === 'male-child' ? 'voice-choice voice-choice--active' : 'voice-choice'} onClick={() => setVoiceType('male-child')}>
            <Volume2 size={18} /> 남성 아동
          </button>
          <button type="button" className={voiceType === 'female-child' ? 'voice-choice voice-choice--active' : 'voice-choice'} onClick={() => setVoiceType('female-child')}>
            <Volume2 size={18} /> 여성 아동
          </button>
        </div>
        <div className="speed-control">
          <div className="speed-label"><span>음성 속도</span><strong>{rate.toFixed(1)}x</strong></div>
          <input type="range" min="0.7" max="1.3" step="0.1" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
          <div className="speed-scale"><span>느리게</span><span>빠르게</span></div>
        </div>
        <button type="button" className="voice-preview" onClick={preview}>
          <Play size={18} />
          <div><strong>미리듣기</strong><span>안녕하세요. 말모아입니다.</span></div>
        </button>
      </div>
      <Button fullWidth size="lg" loading={submitting} onClick={submit}>
        다음
      </Button>
    </OnboardingLayout>
  )
}
