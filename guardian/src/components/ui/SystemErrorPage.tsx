'use client'

import { AlertCircle, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../stores/authStore'

type ErrorVariant = 'temporary' | 'network' | 'not-found'

const copy: Record<ErrorVariant, { title: string; description: string }> = {
  temporary: {
    title: '잠시 후 다시 시도해 주세요',
    description: '요청을 처리하지 못했어요.',
  },
  network: {
    title: '인터넷 연결을 확인해 주세요',
    description: '네트워크에 연결되지 않았어요.',
  },
  'not-found': {
    title: '페이지를 찾을 수 없어요',
    description: '주소가 바뀌었거나 삭제되었을 수 있어요.',
  },
}

export function SystemErrorPage({ variant }: { variant: ErrorVariant }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const content = copy[variant]

  const goHome = () => {
    router.replace(isAuthenticated ? '/' : '/welcome')
  }

  const retry = () => {
    const retryUrl = sessionStorage.getItem('malmoa-error-retry-url')
    if (retryUrl) {
      sessionStorage.removeItem('malmoa-error-retry-url')
      window.location.assign(retryUrl)
      return
    }

    if (window.history.length > 1) {
      router.back()
      return
    }

    window.location.reload()
  }

  return (
    <main className="system-error-page" role={variant === 'not-found' ? undefined : 'alert'}>
      <section className="system-error-card">
        <div
          className={`system-error-icon ${variant === 'network' ? 'system-error-icon--network' : ''} ${variant === 'not-found' ? 'system-error-icon--404' : ''}`}
          aria-hidden="true"
        >
          {variant === 'temporary' ? <AlertCircle size={42} strokeWidth={2} /> : null}
          {variant === 'network' ? <WifiOff size={40} strokeWidth={2} /> : null}
          {variant === 'not-found' ? <span>404</span> : null}
        </div>

        <h1>{content.title}</h1>
        <p>{content.description}</p>

        <div className="system-error-actions">
          {variant !== 'not-found' ? (
            <button type="button" className="system-error-action system-error-action--primary" onClick={retry}>
              다시 시도
            </button>
          ) : null}
          <button
            type="button"
            className={`system-error-action ${variant === 'not-found' ? 'system-error-action--primary' : 'system-error-action--secondary'}`}
            onClick={goHome}
          >
            홈으로
          </button>
        </div>
      </section>
    </main>
  )
}
