'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { useAuthStore } from '../stores/authStore'
import { PageLoader } from './ui/AsyncState'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      const current = `${window.location.pathname}${window.location.search}`
      sessionStorage.setItem('malmoa-login-return-to', current)
      router.replace('/welcome')
    }
  }, [hydrated, isAuthenticated, router])

  if (!hydrated || !isAuthenticated) return <PageLoader />
  return children
}
