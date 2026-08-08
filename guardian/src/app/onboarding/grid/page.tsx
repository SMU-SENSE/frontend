'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout'
import { Button } from '../../../components/ui/Button'
import { loadOnboardingDraft, saveOnboardingDraft, type GridSize } from '../../../lib/onboardingDraft'

const options: Array<{ value: GridSize; label: string; count: number }> = [
  { value: '2x2', label: '크게', count: 4 },
  { value: '3x3', label: '보통', count: 9 },
  { value: '4x4', label: '작게', count: 16 },
]

export default function GridOnboardingPage() {
  const router = useRouter()
  const [grid, setGrid] = useState<GridSize>('3x3')

  useEffect(() => {
    setGrid(loadOnboardingDraft().gridSize ?? '3x3')
  }, [])

  return (
    <OnboardingLayout step={2} title="화면 격자" subtitle="사용자에게 편한 카드 크기를 선택해 주세요">
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
      <Button
        fullWidth
        size="lg"
        onClick={() => {
          saveOnboardingDraft({ gridSize: grid })
          router.push('/onboarding/voice')
        }}
      >
        다음
      </Button>
    </OnboardingLayout>
  )
}
