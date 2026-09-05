'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { authApi } from '../../../api/auth'
import { apiConfig } from '../../../api/client'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/ToastProvider'

const SERVICE_KEY = 'malmoa-terms-service'
const PRIVACY_KEY = 'malmoa-terms-privacy'

export default function TermsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [service, setService] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const all = service && privacy

  useEffect(() => {
    setService(sessionStorage.getItem(SERVICE_KEY) === 'true')
    setPrivacy(sessionStorage.getItem(PRIVACY_KEY) === 'true')
  }, [])

  const setServiceAgreement = (value: boolean) => {
    setService(value)
    sessionStorage.setItem(SERVICE_KEY, String(value))
  }

  const setPrivacyAgreement = (value: boolean) => {
    setPrivacy(value)
    sessionStorage.setItem(PRIVACY_KEY, String(value))
  }

  const submit = async () => {
    if (!all || submitting) return

    const finish = () => {
      sessionStorage.removeItem(SERVICE_KEY)
      sessionStorage.removeItem(PRIVACY_KEY)
      router.push('/users/new')
    }

    if (apiConfig.useMockApi) {
      finish()
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
      finish()
    } catch (error) {
      const status = (error as { status?: number }).status
      if (status === 409) {
        finish()
        return
      }
      showToast(error instanceof Error ? error.message : '약관 동의를 저장하지 못했어요.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-heading auth-heading--center terms-heading">
        <h1>약관에 동의해주세요</h1>
      </div>

      <div className="terms-list terms-list--figma">
        <label className="terms-row terms-row--all">
          <strong>전체 동의</strong>
          <input
            type="checkbox"
            checked={all}
            onChange={(event) => {
              setServiceAgreement(event.target.checked)
              setPrivacyAgreement(event.target.checked)
            }}
          />
        </label>

        <div className="terms-row">
          <Link className="terms-row__label" href="/signup/terms/service">
            서비스 이용약관 동의 (필수)
          </Link>
          <div className="terms-row__actions">
            <input
              aria-label="서비스 이용약관 동의"
              type="checkbox"
              checked={service}
              onChange={(event) => setServiceAgreement(event.target.checked)}
            />
            <Link href="/signup/terms/service" aria-label="서비스 이용약관 보기">
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>

        <div className="terms-row">
          <Link className="terms-row__label" href="/signup/terms/privacy">
            개인정보 처리방침 동의 (필수)
          </Link>
          <div className="terms-row__actions">
            <input
              aria-label="개인정보 처리방침 동의"
              type="checkbox"
              checked={privacy}
              onChange={(event) => setPrivacyAgreement(event.target.checked)}
            />
            <Link href="/signup/terms/privacy" aria-label="개인정보 처리방침 보기">
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      <Button fullWidth size="lg" disabled={!all} loading={submitting} onClick={submit}>
        다음으로
      </Button>
    </AuthLayout>
  )
}
