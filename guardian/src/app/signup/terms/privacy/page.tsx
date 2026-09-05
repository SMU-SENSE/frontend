'use client'

import { useRouter } from 'next/navigation'
import { AuthLayout } from '../../../../components/layout/AuthLayout'
import { Button } from '../../../../components/ui/Button'

const PRIVACY_KEY = 'malmoa-terms-privacy'

export default function PrivacyTermsPage() {
  const router = useRouter()

  const agree = () => {
    sessionStorage.setItem(PRIVACY_KEY, 'true')
    router.push('/signup/terms')
  }

  return (
    <AuthLayout wide>
      <div className="policy-page policy-page--figma">
        <h1>개인정보 처리방침</h1>
        <div className="policy-card" tabIndex={0} aria-label="개인정보 처리방침 전문">
          <section>
            <h2>제1조 (개인정보의 처리 목적)</h2>
            <p>말모아(이하 &quot;회사&quot;)는 회원 가입 및 관리, 서비스 제공 및 개선, 고객 문의 대응을 위하여 개인정보를 처리합니다.</p>
          </section>
          <section>
            <h2>제2조 (처리하는 개인정보 항목)</h2>
            <p>1. 필수항목: 이메일, 이름(닉네임), 소셜 로그인 식별자</p>
            <p>2. 선택항목: 프로필 이미지 등</p>
          </section>
          <section>
            <h2>제3조 (개인정보의 보유 및 이용기간)</h2>
            <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 동의받은 기간 내에서 개인정보를 처리·보유합니다.</p>
          </section>
          <section>
            <h2>제4조 (개인정보의 제3자 제공)</h2>
            <p>회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 이용자가 사전에 동의한 경우 또는 법령에 의하여 허용된 경우에는 예외로 합니다.</p>
          </section>
          <section>
            <h2>제5조 (정보주체의 권리)</h2>
            <p>이용자는 개인정보 열람, 정정·삭제, 처리정지 요구 등 법령이 정한 권리를 행사할 수 있습니다.</p>
          </section>
        </div>
        <Button fullWidth size="lg" onClick={agree}>동의하기</Button>
      </div>
    </AuthLayout>
  )
}
