'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { aacUserApi } from '../../../api/aacUsers'
import { accountToSession, authApi } from '../../../api/auth'
import { PageLoader } from '../../../components/ui/AsyncState'
import { useToast } from '../../../components/ui/ToastProvider'
import { saveOnboardingDraft } from '../../../lib/onboardingDraft'
import { useAuthStore } from '../../../stores/authStore'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const setSession = useAuthStore((state) => state.setSession)

  useEffect(() => {
    let cancelled = false

    const finishLogin = async () => {
      const params = new URLSearchParams(window.location.search)
      if (params.get('login') !== 'success') {
        showToast('Google 로그인에 실패했어요. 다시 시도해 주세요.', 'error')
        router.replace('/welcome')
        return
      }

      try {
        const account = await authApi.me()
        if (cancelled) return
        setSession(accountToSession(account))

        if (!account.onboardingCompleted) {
          router.replace('/signup/terms')
          return
        }

        const users = await aacUserApi.list()
        if (cancelled) return
        const pending = users.find((user) => user.setupStep !== 'CONFIRMED')

        if (!users.length) {
          router.replace('/onboarding/profile')
          return
        }

        if (pending) {
          saveOnboardingDraft({
            userId: pending.id,
            userName: pending.name,
            birthDate: pending.birthDate,
            emergencyPhone: pending.emergencyContact,
            notes: pending.notes ?? '',
          })

          if (pending.setupStep === 'PROFILE_COMPLETED') router.replace('/onboarding/grid')
          else if (pending.setupStep === 'GRID_COMPLETED') router.replace('/onboarding/voice')
          else router.replace('/onboarding/confirm')
          return
        }

        router.replace('/')
      } catch (error) {
        if (cancelled) return
        showToast(error instanceof Error ? error.message : '로그인 상태를 확인하지 못했어요.', 'error')
        router.replace('/welcome')
      }
    }

    finishLogin()
    return () => {
      cancelled = true
    }
  }, [router, setSession, showToast])

  return <PageLoader label="Google 로그인 정보를 확인하는 중입니다." />
}
