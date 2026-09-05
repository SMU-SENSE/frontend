'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

export function ConnectionShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  const router = useRouter()

  return (
    <main className="connection-page">
      <button type="button" className="connection-back" onClick={() => router.back()}>
        <span className="connection-back__icon" aria-hidden="true">
          <ArrowLeft size={20} strokeWidth={2.2} />
        </span>
        <span>뒤로가기</span>
      </button>

      <section className="connection-content">
        <div className="connection-heading">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  )
}
