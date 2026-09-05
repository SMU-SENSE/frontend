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

const gridLabel: Record<string, string> = {
  GRID_2X2: '크게 (2×2)',
  GRID_3X3: '보통 (3×3)',
  GRID_4X4: '작게 (4×4)',
  '2x2': '크게 (2×2)',
  '3x3': '보통 (3×3)',
  '4x4': '작게 (4×4)',
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
      router.replace('/users/setup/profile')
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
  const relation = summary
    ? summary.relationshipType === 'OTHER'
      ? summary.relationshipDetail || '기타'
      : relationshipLabel[summary.relationshipType]
    : draft.relation ?? '-'
  const gridKey = summary?.gridSize ?? draft.gridSize ?? '3x3'
  const grid = gridLabel[gridKey] ?? '보통 (3×3)'
  const voice = summary
    ? summary.voiceType === 'CHILD_FEMALE'
      ? '여성 아동'
      : '남성 아동'
    : draft.voiceType === 'female-child'
      ? '여성 아동'
      : '남성 아동'
  const rate = summary?.speechRate ?? draft.speechRate ?? 1
  const initial = name.trim().slice(0, 1) || '사'

  const rows = [
    { label: '이름', value: name, href: '/users/setup/profile' },
    { label: '목소리', value: `${voice} · ${rate.toFixed(1)}×`, href: '/users/setup/voice' },
    { label: '화면 격자', value: grid, href: '/users/setup/grid' },
    { label: '나와의 관계', value: relation, href: '/users/setup/profile' },
  ]

  return (
    <OnboardingLayout step={4} title="가입정보 확인" subtitle="설정한 내용을 확인한 뒤 시작해요">
      <div className="confirm-profile">
        <div className="confirm-avatar" aria-hidden="true">{initial}</div>
        <strong>{name}</strong>
      </div>

      <div className="confirm-box">
        {rows.map((row) => (
          <button key={row.label} type="button" className="confirm-row" onClick={() => router.push(row.href)}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
            <span className="confirm-row__chevron" aria-hidden="true">›</span>
          </button>
        ))}
      </div>

      <Button fullWidth size="lg" disabled={loading} loading={submitting} onClick={start}>
        {loading ? '정보 확인 중' : '시작하기'}
      </Button>
    </OnboardingLayout>
  )
}
