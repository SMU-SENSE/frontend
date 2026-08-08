'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout'
import { Button } from '../../../components/ui/Button'
import { apiConfig } from '../../../api/client'
import { loadOnboardingDraft, type GuardianOnboardingDraft } from '../../../lib/onboardingDraft'
import { useAuthStore } from '../../../stores/authStore'

export default function ConfirmOnboardingPage() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const [draft, setDraft] = useState<GuardianOnboardingDraft>({})

  useEffect(() => {
    setDraft(loadOnboardingDraft())
  }, [])

  const initial = draft.userName?.trim().slice(0, 1) || '사'
  const voiceLabel = draft.voiceType === 'female-child' ? '여성 아동' : '남성 아동'

  const start = () => {
    if (apiConfig.useMockApi) {
      setSession({
        accessToken: 'mock-onboarding-token',
        user: {
          id: 'guardian-onboarding-demo',
          email: draft.guardianEmail ?? 'demo@malmoa.app',
          nickname: draft.guardianName ?? '보호자',
          name: draft.guardianName ?? '보호자',
          joinedAt: new Date().toISOString(),
        },
      })
      router.replace('/')
      return
    }
    router.replace('/login')
  }

  return (
    <OnboardingLayout step={4} title="가입정보 확인" subtitle="입력하신 정보를 확인해 주세요">
      <div className="confirm-profile">
        <div className="confirm-avatar">{initial}</div>
        <strong>{draft.userName || '사용자'}</strong>
      </div>
      <div className="confirm-box">
        <div><span>이름</span><strong>{draft.userName || '-'}</strong></div>
        <div><span>생년월일</span><strong>{draft.birthDate || '-'}</strong></div>
        <div><span>관계</span><strong>{draft.relation || '-'}</strong></div>
        <div><span>긴급 연락처</span><strong>{draft.emergencyPhone || '-'}</strong></div>
      </div>
      <div className="confirm-box">
        <div><span>화면 격자</span><strong>{draft.gridSize ?? '3x3'}</strong></div>
        <div><span>TTS 음성</span><strong>{voiceLabel} ({(draft.speechRate ?? 1).toFixed(1)}x)</strong></div>
      </div>
      <Button fullWidth size="lg" onClick={start}>
        시작하기
      </Button>
    </OnboardingLayout>
  )
}
