'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Button } from '../../../components/ui/Button'

export default function TermsPage() {
  const router = useRouter()
  const [service, setService] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const all = service && privacy

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
      <Button fullWidth size="lg" disabled={!all} onClick={() => router.push('/onboarding/profile')}>
        다음으로
      </Button>
    </AuthLayout>
  )
}
