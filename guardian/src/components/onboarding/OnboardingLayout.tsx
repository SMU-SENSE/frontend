'use client'

import { ArrowLeft, MessageCircleMore } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

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
      <header className="onboarding-header">
        <button type="button" className="onboarding-back" onClick={() => router.back()}>
          <ArrowLeft size={18} />
          뒤로가기
        </button>
        <div className="onboarding-brand">
          <MessageCircleMore size={20} />
          <span>말모아</span>
        </div>
      </header>

      <section className="onboarding-card">
        <div className="step-dots" aria-label={`${step} / 4 단계`}>
          {[1, 2, 3, 4].map((item) => (
            <span key={item} className={item <= step ? 'step-dot step-dot--active' : 'step-dot'} />
          ))}
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
