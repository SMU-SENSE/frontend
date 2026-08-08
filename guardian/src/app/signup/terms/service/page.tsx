import { AuthLayout } from '../../../../components/layout/AuthLayout'

export default function ServiceTermsPage() {
  return (
    <AuthLayout wide>
      <div className="policy-page">
        <h1>서비스 이용약관</h1>
        <p>현재는 Figma 화면 구현용 임시 약관입니다. 실제 약관 문구가 확정되면 이 영역에 연결하면 됩니다.</p>
        <h2>1. 서비스 목적</h2>
        <p>말모아는 AAC 사용자의 의사소통을 지원하고 보호자가 사용자 환경을 관리할 수 있도록 돕습니다.</p>
        <h2>2. 계정과 이용</h2>
        <p>보호자는 본인 계정과 연결된 사용자 정보를 안전하게 관리해야 합니다.</p>
      </div>
    </AuthLayout>
  )
}
