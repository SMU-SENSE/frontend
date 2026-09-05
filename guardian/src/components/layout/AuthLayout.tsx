'use client'

import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export function AuthLayout({
  children,
  showBack = true,
  wide = false,
}: {
  children: ReactNode
  showBack?: boolean
  wide?: boolean
}) {
  const router = useRouter()

  return (
    <main className="auth-layout">
      {showBack ? (
        <button
          className="back-button"
          type="button"
          onClick={() => router.back()}
          aria-label="이전 화면으로 돌아가기"
        >
          <span className="back-button__icon" aria-hidden="true">
            <ArrowLeft size={20} strokeWidth={2.2} />
          </span>
          <span>뒤로가기</span>
        </button>
      ) : null}
      <section className={`auth-panel ${wide ? 'auth-panel--wide' : ''}`}>{children}</section>
    </main>
  )
}
