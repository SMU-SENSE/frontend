'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { aacUserApi } from '../../../api/aacUsers'
import { accountToSession, authApi } from '../../../api/auth'
import { PageLoader } from '../../../components/ui/AsyncState'
import { useToast } from '../../../components/ui/ToastProvider'
import {
  clearOnboardingDraft,
  saveOnboardingDraft,
  type GridSize,
  type VoiceType,
} from '../../../lib/onboardingDraft'
import { useAuthStore } from '../../../stores/authStore'
import type { BackendGridSize } from '../../../types/models'

const gridFromBackend: Record<BackendGridSize, GridSize> = {
  GRID_2X2: '2x2',
  GRID_3X3: '3x3',
  GRID_4X4: '4x4',
}

const voiceFromBackend = (voiceType: 'CHILD_MALE' | 'CHILD_FEMALE' | null): VoiceType =>
  voiceType === 'CHILD_FEMALE' ? 'female-child' : 'male-child'

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

        // 다른 사용자 온보딩 값이 남아 있으면 기존 userId가 재사용될 수 있으므로
        // 서버 상태를 기준으로 매 로그인마다 초안을 다시 구성한다.
        clearOnboardingDraft()

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
            gridSize: gridFromBackend[pending.gridSize],
            voiceType: voiceFromBackend(pending.voiceType),
            speechRate: pending.speechRate ?? 1,
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
