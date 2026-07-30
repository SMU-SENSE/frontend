import { ArrowLeft, MessageCircleMore } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export function AuthLayout({
  children,
  showBack = true,
  wide = false,
}: {
  children: ReactNode
  showBack?: boolean
  wide?: boolean
}) {
  const navigate = useNavigate()

  return (
    <main className="auth-layout">
      <div className="auth-layout__brand" aria-label="말모아">
        <MessageCircleMore size={25} />
        <span>말모아</span>
      </div>
      <section className={`auth-panel ${wide ? 'auth-panel--wide' : ''}`}>
        {showBack ? (
          <button
            className="back-button"
            type="button"
            onClick={() => navigate(-1)}
            aria-label="이전 화면으로 돌아가기"
          >
            <ArrowLeft size={20} />
            <span>뒤로가기</span>
          </button>
        ) : null}
        {children}
      </section>
    </main>
  )
}
