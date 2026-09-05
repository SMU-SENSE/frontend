'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { aacUserApi } from '../../../api/aacUsers'
import { apiConfig } from '../../../api/client'
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/ToastProvider'
import { loadOnboardingDraft, saveOnboardingDraft, type GridSize } from '../../../lib/onboardingDraft'
import type { BackendGridSize } from '../../../types/models'

const options: Array<{ value: GridSize; label: string; count: number }> = [
  { value: '2x2', label: '크게', count: 4 },
  { value: '3x3', label: '보통', count: 9 },
  { value: '4x4', label: '작게', count: 16 },
]

const toBackendGrid: Record<GridSize, BackendGridSize> = {
  '2x2': 'GRID_2X2',
  '3x3': 'GRID_3X3',
  '4x4': 'GRID_4X4',
}

export default function GridOnboardingPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [grid, setGrid] = useState<GridSize>('3x3')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setGrid(loadOnboardingDraft().gridSize ?? '3x3')
  }, [])

  const submit = async () => {
    if (submitting) return
    saveOnboardingDraft({ gridSize: grid })

    if (apiConfig.useMockApi) {
      router.push('/onboarding/voice')
      return
    }

    const { userId } = loadOnboardingDraft()
    if (!userId) {
      showToast('사용자 프로필 정보가 없어요. 프로필부터 다시 입력해 주세요.', 'error')
      router.replace('/onboarding/profile')
      return
    }

    setSubmitting(true)
    try {
      await aacUserApi.updateGrid(userId, toBackendGrid[grid])
      router.push('/onboarding/voice')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '격자 설정을 저장하지 못했어요.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <OnboardingLayout step={2} title="화면 격자" subtitle="버튼이 클수록 누르기 쉬워요">
      <div className="grid-choice-list">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={grid === option.value ? 'grid-choice grid-choice--active' : 'grid-choice'}
            onClick={() => setGrid(option.value)}
          >
            <div className={`grid-preview grid-preview--${option.value.replace('x', '-')}`}>
              {Array.from({ length: option.count }).map((_, index) => <span key={index} />)}
            </div>
            <strong>{option.label}</strong>
          </button>
        ))}
      </div>
      <Button fullWidth size="lg" loading={submitting} onClick={submit}>
        다음
      </Button>
    </OnboardingLayout>
  )
}
