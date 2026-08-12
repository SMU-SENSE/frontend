'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { authApi } from '../../../api/auth'
import { apiConfig } from '../../../api/client'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/ToastProvider'

export default function TermsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [service, setService] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const all = service && privacy

  const submit = async () => {
    if (!all || submitting) return

    if (apiConfig.useMockApi) {
      router.push('/onboarding/profile')
      return
    }

    setSubmitting(true)
    try {
      await authApi.completeOnboarding({
        accountType: 'GUARDIAN',
        termsOfServiceAgreed: service,
        privacyPolicyAgreed: privacy,
        marketingAgreed: false,
        phoneNumber: null,
      })
      router.push('/onboarding/profile')
    } catch (error) {
      const status = (error as { status?: number }).status
      if (status === 409) {
        router.push('/onboarding/profile')
        return
      }
      showToast(error instanceof Error ? error.message : '약관 동의를 저장하지 못했어요.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-heading auth-heading--center">
        <h1>약관에 동의해 주세요</h1>
      </div>
      <div className="terms-list">
        <label className="terms-row terms-row--all">
          <input
            type="checkbox"
            checked={all}
            onChange={(event) => {
              setService(event.target.checked)
              setPrivacy(event.target.checked)
            }}
          />
          <strong>전체 동의</strong>
        </label>
        <div className="terms-row">
          <label>
            <input type="checkbox" checked={service} onChange={(event) => setService(event.target.checked)} />
            <span>서비스 이용약관 동의 (필수)</span>
          </label>
          <Link href="/signup/terms/service" aria-label="서비스 이용약관 보기"><ChevronRight size={18} /></Link>
        </div>
        <div className="terms-row">
          <label>
            <input type="checkbox" checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} />
            <span>개인정보 처리방침 동의 (필수)</span>
          </label>
          <Link href="/signup/terms/privacy" aria-label="개인정보 처리방침 보기"><ChevronRight size={18} /></Link>
        </div>
      </div>
      <Button fullWidth size="lg" disabled={!all} loading={submitting} onClick={submit}>
        다음으로
      </Button>
    </AuthLayout>
  )
}
