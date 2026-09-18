'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

export function ConnectionShell({
  title,
  subtitle,
  children,
  backLabel = '뒤로가기',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  backLabel?: string
}) {
  const router = useRouter()

  return (
    <main className="connection-page">
      <section className="connection-content">
        <div className="connection-heading">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {children}
        <button type="button" className="connection-bottom-back" onClick={() => router.back()}>
          <ArrowLeft size={20} strokeWidth={2.2} />
          <span>{backLabel}</span>
        </button>
      </section>
    </main>
  )
}
