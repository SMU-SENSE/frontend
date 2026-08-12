'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { accountToSession, authApi } from '../api/auth'
import { apiConfig } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import { PageLoader } from './ui/AsyncState'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setSession = useAuthStore((state) => state.setSession)
  const logout = useAuthStore((state) => state.logout)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    const verify = async () => {
      if (apiConfig.useMockApi) {
        if (!isAuthenticated) {
          const current = `${window.location.pathname}${window.location.search}`
          sessionStorage.setItem('malmoa-login-return-to', current)
          router.replace('/welcome')
        }
        if (!cancelled) setChecking(false)
        return
      }

      try {
        const account = await authApi.me()
        if (cancelled) return
        setSession(accountToSession(account))
      } catch {
        if (cancelled) return
        logout()
        const current = `${window.location.pathname}${window.location.search}`
        sessionStorage.setItem('malmoa-login-return-to', current)
        router.replace('/welcome')
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, logout, router, setSession])

  if (checking) return <PageLoader label="로그인 상태를 확인하는 중입니다." />
  if (!apiConfig.useMockApi && !useAuthStore.getState().isAuthenticated) return <PageLoader />
  if (apiConfig.useMockApi && !isAuthenticated) return <PageLoader />
  return children
}
