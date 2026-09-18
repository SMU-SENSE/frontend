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

const FIGMA_TURTLE_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAIAAAAGHlpnAAACTUlEQVR42o1Uz2sTURD+Jq6vSdmkTQJGjSVKTZFqCr20FmkVEYme1N6E/gu91ZtnwYM38SLUi/WgQvFg6kGQRMEgTQqphzRB2pS4bUoTqGvaxuyOh03SzW4izuExzMz3ve/9mCFdZ4ABaq4wORa/szkAbpZ2xJApBZvPAKT2/S1mj5OJqJGSbPqJAAYrv8orSn5bLQMY9AdPyf7z/iDABOI2aSzZzs8pJf8qtbSxlReixylcv/dVTasD8Mi+6dFodGjcRMAAka7rLVVEmF9+H0t/OHNiYPj0OSFJRmF2q/BDWTeIbo1GA7IvWchUD/evh8eiQ+Ok6w1GtVb9vJ6ZTywI0XNz5IrlVtKFXLG0aY5Uy3921qr3Zm409omtJV8kFgxf07SaVhfHJDOgrtUtpDvZaj5WWb78zajjgNvXymla/Us2NTwQDri9ANTDg3xpc3tXsVCEJvpCE30e2UvNr4XXq5/eJBfxHyaEs1Y7MJyHt2eP7gJASsk9i7/cUyv/wHtk75O7D3K7RQBhf9AtetsoADz9+jb+Pd4NfyEUmZu6L4tec9DytbCysdo46slBABW1vKdWhHAC6Je9dy5elYXLwttSwcaSKGQ+5pJnfcHpS9fk467Zxcel8k8z4PnMI7ehghlEhgpTOxEmQ5HJ0EiDlDEVHnuXXuqXfS7hUsrFSCjiFi4jZeBbKjq2Wcfet48COMAMEDPbetnSnV3Hh8OIEFmnQOO0pmnCzGCwEWRu7krmR21TyAwiMo2GrjPNYcW3uMmun5v5o15n5r8pcBF5EKI9LQAAAABJRU5ErkJggg=='
const FIGMA_RABBIT_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAZCAIAAABRt/K6AAADdUlEQVR42nVUb2hbVRT/nVA05b2+9+qwzdq1oZ1RV+dCleH+uIIyikNwQhuZ7INanYK6Mv02/WjLkE1RYxGR9YO1IFVRa51/FmQ2OBxaJG8lftjW9KW1zTJpk/ja1EDv8cPNe3nJ8H643HvO+Z1z7u+ce0gIBhggVBYD8EiklgnEtSr45N2LtqzsN5O/VoMxPX3ZvDwHUG0kIVgIZmZ5EILvDj0T2NIXfe9LIZgFC8GpVEb1PxrY0nfhQkJULxmfmcsOxz6ObZZKHwwfHYlOAsxgIgwPjR/u7X66f98nYzEnBZkF+WoeH4+bfY/c1xVqXVzIWlYWIGaYiVRvzz0PdHecm7qE6uWrfg/S6eyOUIuu+rc2G2bimhQmZ1NtAaMr1FrIr+Vya44tufyxwznS81lNvRVAa6Axl1sHIAFdoRZd9QPI523XGECdU5j/Xfm8fZOM3DL7UAEzAE1XCva/AAp2MRhsAhAMNgNYzKxKI11XvV7q3CITCMCucMdfyysAljI5o1GR2m1tTQvLKwW7qOmKYShu8YmozuVfZhHe1fnFeExrqLfXNo5EhqVhobB2Pv7ntoCx894OMDuMEzOTEFVvTyTmDuwdVBX/U317u+5s0VQ/gOSV5fPx5O/m/AsvPnb6zLFyutKHg2dmpNPZQ70nH9q9/cTAQb2hvoa0sxPxUyPfTX0/3NMTlggQquI/f+zt4o3Vt16PJK8uJa8s9x+6v1x/53p2Ij42OXPxUtRhgX2eD4dPx386MXAQwDujsdHPLrp+Ryd+GYp+C+DZJw5slkqmec1bf1kJtqwsgLatjQBOn4x4Mz/zWiT/T1Ged9wRsOaz6IG3/wGQLGze3gCgN9TrDfXFv1du/JYoFWwpkYjFTM4wFDdl2f8MsGEo+x7c+e5ozA1rpxZWZ8z1pYwr+TGeXC+JcLjT7eA677T58KNX9u8Z1FS/ZOH23WH9ru23aKrL4hvRqcFX+9uDTZVOrvDPDCLTnDsSGQrcpgxE9u/p7tRUf8HeSF5d+vzczFc//HHqzedeOv64d/6Q2BQg8mTBlnV9+ufZkfe/Ts6mpJWmK08effjl44fb25upbFzea/qvZpDCsq7rumIYalnFXOk9huwf4fmPdNPw9fiVnV8VgnwVMLsuyDNRWDIDMIgAKu8OyueYugqvF3gycoesd6f/AGYxo/kGuyZYAAAAAElFTkSuQmCC'

function FigmaTurtleIcon() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        width: 20,
        height: 20,
        backgroundImage: `url("${FIGMA_TURTLE_ICON}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '22px 20px',
      }}
    />
  )
}

function FigmaRabbitIcon() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        width: 20,
        height: 20,
        backgroundImage: `url("${FIGMA_RABBIT_ICON}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '17px 20px',
      }}
    />
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
