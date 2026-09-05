'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

const stepRoutes: Record<1 | 2 | 3 | 4, string> = {
  1: '/users/new',
  2: '/users/setup/grid',
  3: '/users/setup/voice',
  4: '/users/setup/confirm',
}

export function OnboardingLayout({
  step,
  title,
  subtitle,
  children,
}: {
  step: 1 | 2 | 3 | 4
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const router = useRouter()

  return (
    <main className="onboarding-layout">
      <button type="button" className="onboarding-back" onClick={() => router.back()}>
        <span className="onboarding-back__icon" aria-hidden="true">
          <ArrowLeft size={20} strokeWidth={2.2} />
        </span>
        <span>뒤로가기</span>
      </button>

      <section className="onboarding-card">
        <div className="step-dots" aria-label={`${step} / 4 단계`}>
          {([1, 2, 3, 4] as const).map((item) => {
            const state = item < step ? 'complete' : item === step ? 'current' : 'upcoming'
            if (item < step) {
              return (
                <button
                  key={item}
                  type="button"
                  className={`step-dot step-dot--${state} step-dot--button`}
                  aria-label={`${item}단계로 돌아가기`}
                  onClick={() => router.push(stepRoutes[item])}
                />
              )
            }
            return <span key={item} className={`step-dot step-dot--${state}`} aria-hidden="true" />
          })}
        </div>
        <div className="onboarding-heading">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {children}
      </section>
    </main>
  )
}
