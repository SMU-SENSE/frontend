'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { accountToSession, authApi } from '../api/auth'
import { apiConfig } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import { PageLoader } from './ui/AsyncState'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const logout = useAuthStore((state) => state.logout)
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let cancelled = false

    const saveReturnPathAndGoToWelcome = () => {
      const current = `${window.location.pathname}${window.location.search}`
      sessionStorage.setItem('malmoa-login-return-to', current)
      router.replace('/welcome')
    }

    const verify = async () => {
      setChecking(true)
      setAuthorized(false)

      if (apiConfig.useMockApi) {
        if (useAuthStore.getState().isAuthenticated) {
          if (!cancelled) setAuthorized(true)
        } else {
          saveReturnPathAndGoToWelcome()
        }
        if (!cancelled) setChecking(false)
        return
      }

      try {
        const account = await authApi.me()
        if (cancelled) return

        setSession(accountToSession(account))

        // Google 로그인 세션은 유효하지만 보호자 최초 약관/역할 설정이 끝나지 않은 경우
        // 보호자 화면을 먼저 노출하지 않고 온보딩으로 돌려보낸다.
        if (!account.onboardingCompleted) {
          router.replace('/signup/terms')
          return
        }

        setAuthorized(true)
      } catch {
        if (cancelled) return
        logout()
        saveReturnPathAndGoToWelcome()
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [logout, router, setSession])

  if (checking || !authorized) {
    return <PageLoader label="로그인 상태를 확인하는 중입니다." />
  }

  return children
}
