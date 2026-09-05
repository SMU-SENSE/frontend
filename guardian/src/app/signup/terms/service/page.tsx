'use client'

import { useRouter } from 'next/navigation'
import { AuthLayout } from '../../../../components/layout/AuthLayout'
import { Button } from '../../../../components/ui/Button'

const SERVICE_KEY = 'malmoa-terms-service'

export default function ServiceTermsPage() {
  const router = useRouter()

  const agree = () => {
    sessionStorage.setItem(SERVICE_KEY, 'true')
    router.push('/signup/terms')
  }

  return (
    <AuthLayout wide>
      <div className="policy-page policy-page--figma">
        <h1>서비스 이용약관</h1>
        <div className="policy-card" tabIndex={0} aria-label="서비스 이용약관 전문">
          <section>
            <h2>제1조 (목적)</h2>
            <p>
              본 약관은 말모아(이하 &quot;회사&quot;)가 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리,
              의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>
          <section>
            <h2>제2조 (정의)</h2>
            <p>1. &quot;서비스&quot;란 회사가 제공하는 말모아 웹/앱 및 관련 제반 서비스를 의미합니다.</p>
            <p>2. &quot;회원&quot;이란 본 약관에 동의하고 서비스를 이용하는 자를 의미합니다.</p>
          </section>
          <section>
            <h2>제3조 (약관의 효력 및 변경)</h2>
            <p>1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</p>
            <p>2. 회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있습니다.</p>
          </section>
          <section>
            <h2>제4조 (서비스의 제공)</h2>
            <p>회사는 회원에게 콘텐츠 열람, 학습 기능, 맞춤형 추천 등 서비스를 제공합니다.</p>
          </section>
          <section>
            <h2>제5조 (회원의 의무)</h2>
            <p>회원은 관련 법령, 본 약관, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 합니다.</p>
          </section>
        </div>
        <Button fullWidth size="lg" onClick={agree}>동의하기</Button>
      </div>
    </AuthLayout>
  )
}
