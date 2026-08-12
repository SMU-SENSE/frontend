'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { aacUserApi } from '../../../api/aacUsers'
import { apiConfig } from '../../../api/client'
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/ToastProvider'
import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  type GuardianOnboardingDraft,
} from '../../../lib/onboardingDraft'
import { useAuthStore } from '../../../stores/authStore'
import type { OnboardingSummaryResponse, RelationshipType } from '../../../types/models'

const relationshipLabel: Record<RelationshipType, string> = {
  PARENT: '부모',
  GRANDPARENT: '조부모',
  TEACHER: '교사',
  OTHER: '기타',
}

export default function ConfirmOnboardingPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const setSession = useAuthStore((state) => state.setSession)
  const [draft, setDraft] = useState<GuardianOnboardingDraft>({})
  const [summary, setSummary] = useState<OnboardingSummaryResponse | null>(null)
  const [loading, setLoading] = useState(!apiConfig.useMockApi)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const saved = loadOnboardingDraft()
    setDraft(saved)

    if (apiConfig.useMockApi) return
    if (!saved.userId) {
      setLoading(false)
      router.replace('/onboarding/profile')
      return
    }

    aacUserApi
      .getOnboardingSummary(saved.userId)
      .then(setSummary)
      .catch((error) => {
        showToast(error instanceof Error ? error.message : '가입정보를 불러오지 못했어요.', 'error')
      })
      .finally(() => setLoading(false))
  }, [router, showToast])

  const start = async () => {
    if (submitting) return

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
      clearOnboardingDraft()
      router.replace('/')
      return
    }

    if (!draft.userId) return
    setSubmitting(true)
    try {
      await aacUserApi.confirmOnboarding(draft.userId)
      clearOnboardingDraft()
      router.replace('/')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '사용자 설정을 확정하지 못했어요.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const name = summary?.name ?? draft.userName ?? '사용자'
  const birthDate = summary?.birthDate ?? draft.birthDate ?? '-'
  const relation = summary
    ? summary.relationshipType === 'OTHER'
      ? summary.relationshipDetail || '기타'
      : relationshipLabel[summary.relationshipType]
    : draft.relation ?? '-'
  const emergencyContact = summary?.emergencyContact ?? draft.emergencyPhone ?? '-'
  const grid = summary?.gridSize
    ? summary.gridSize.replace('GRID_', '').replace('X', 'x')
    : draft.gridSize ?? '3x3'
  const voiceLabel = summary
    ? summary.voiceType === 'CHILD_FEMALE'
      ? '여성 아동'
      : '남성 아동'
    : draft.voiceType === 'female-child'
      ? '여성 아동'
      : '남성 아동'
  const rate = summary?.speechRate ?? draft.speechRate ?? 1
  const initial = name.trim().slice(0, 1) || '사'

  return (
    <OnboardingLayout step={4} title="가입정보 확인" subtitle="입력하신 정보를 확인해 주세요">
      <div className="confirm-profile">
        <div className="confirm-avatar">{initial}</div>
        <strong>{name}</strong>
      </div>
      <div className="confirm-box">
        <div><span>이름</span><strong>{name}</strong></div>
        <div><span>생년월일</span><strong>{birthDate}</strong></div>
        <div><span>관계</span><strong>{relation}</strong></div>
        <div><span>긴급 연락처</span><strong>{emergencyContact}</strong></div>
      </div>
      <div className="confirm-box">
        <div><span>화면 격자</span><strong>{grid}</strong></div>
        <div><span>TTS 음성</span><strong>{voiceLabel} ({rate.toFixed(1)}x)</strong></div>
      </div>
      <Button fullWidth size="lg" disabled={loading} loading={submitting} onClick={start}>
        {loading ? '정보 확인 중' : '시작하기'}
      </Button>
    </OnboardingLayout>
  )
}
