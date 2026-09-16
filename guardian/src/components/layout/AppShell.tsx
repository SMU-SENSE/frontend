'use client'

import type { ReactNode } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="guardian-product-shell">
      <a className="skip-link" href="#main-content">본문 바로가기</a>
      <main className="guardian-product-main" id="main-content">{children}</main>
    </div>
  )
}
