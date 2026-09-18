'use client'

/* eslint-disable @next/next/no-img-element */
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
      router.replace('/users/new')
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
  const profileImage = summary?.profileImageUrl || draft.profileImageDataUrl || ''
  const birthDateRaw = summary?.birthDate ?? draft.birthDate ?? ''
  const birthDate = birthDateRaw ? birthDateRaw.replaceAll('-', '.') : '-'

  return (
    <OnboardingLayout
      step={4}
      title="가입정보 확인"
      subtitle="입력하신 정보를 확인해주세요. 수정이 필요한 경우 이전 단계로 돌아가 수정할 수 있어요."
    >
      <div className="confirm-reference">
        <section className="confirm-reference__section">
          <h2>사용자 정보</h2>
          <div className="confirm-reference__card confirm-reference__user">
            <div className={`confirm-reference__avatar ${profileImage ? 'has-image' : ''}`} aria-hidden="true">
              {profileImage ? <img src={profileImage} alt="" /> : initial}
            </div>
            <div className="confirm-reference__user-grid">
              <div><span>이름</span><strong>{name}</strong></div>
              <div><span>생년월일</span><strong>{birthDate}</strong></div>
              <div><span>관계</span><strong>{relation}</strong></div>
            </div>
          </div>
        </section>

        <section className="confirm-reference__section">
          <h2>설정 정보</h2>
          <div className="confirm-reference__card confirm-reference__settings">
            <div><span>화면 격자</span><strong>{grid.replace('크게 ', '').replace('보통 ', '').replace('작게 ', '')}</strong></div>
            <div><span>TTS 음성</span><strong>{voice} ({rate.toFixed(1)}×)</strong></div>
          </div>
        </section>
      </div>

      <Button fullWidth size="lg" disabled={loading} loading={submitting} onClick={start}>
        {loading ? '정보 확인 중' : '확인하고 홈으로 이동'}
      </Button>
    </OnboardingLayout>
  )
}
