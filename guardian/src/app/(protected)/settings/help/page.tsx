'use client'

import { ChevronLeft, Mail, ShieldCheck, Smartphone, Wrench } from 'lucide-react'
import Link from 'next/link'
import { apiConfig } from '../../../../api/client'

const faqs = [
  ['보호자 편집 모드는 무엇인가요?', '사용자 AAC 판을 보호자 화면에서 그대로 보면서 카드 텍스트·이미지·즐겨찾기·카테고리를 관리하는 기능입니다.'],
  ['사용자 화면에 설정은 언제 반영되나요?', apiConfig.useMockApi ? '시연 모드에서는 변경 사항이 이 브라우저에만 저장되며 실제 사용자 기기와 공유되지 않습니다.' : '서버에 저장된 설정은 연결된 사용자 기기로 공유됩니다. 사용자 기기의 연결 상태에 따라 반영이 지연될 수 있습니다.'],
  ['위치 알림은 어떻게 사용하나요?', apiConfig.useMockApi ? '시연 모드에서는 실제 사용자 위치와 안심존 알림을 수신하지 않습니다.' : '보호자와 사용자 기기를 연결하고 사용자 기기의 위치 공유 및 알림 권한을 허용한 후 장소와 안심존을 설정해 주세요.'],
]

export default function HelpPage() {
  return (
    <main className="gp-subpage gp-help-page">
      <header className="gp-page__title">
        <Link className="gp-back" href="/settings" aria-label="환경 설정으로 돌아가기"><ChevronLeft size={30} /></Link>
        <h1>도움말 · 버전 정보</h1>
      </header>

      <section className="gp-help-hero">
        <div className="gp-help-logo">Mal<span>Moa</span></div>
        <strong>보호자용 웹앱</strong>
        <p>사용자 AAC 설정·편집·안전 확인을 한 곳에서 관리합니다.</p>
        <em>Frontend v0.2.0 · Guardian handoff 2026-09-16</em>
      </section>

      <div className="gp-help-grid">
        <section>
          <h2>자주 묻는 질문</h2>
          {faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
        </section>
        <section>
          <h2>앱 지원</h2>
          <div className="gp-support-row"><Smartphone /><div><strong>PWA / 모바일 사용</strong><small>Safari·Chrome 홈 화면 설치 지원</small></div></div>
          <div className="gp-support-row"><ShieldCheck /><div><strong>개인정보와 연결</strong><small>계정 세션과 연결된 사용자 범위에서 데이터를 관리합니다.</small></div></div>
          <div className="gp-support-row"><Wrench /><div><strong>문제 해결</strong><small>네트워크 오류 화면에서 다시 시도하거나 앱을 새로 열어 주세요.</small></div></div>
          <a className="gp-support-contact" href="mailto:support@malmoa.app"><Mail size={18} /> support@malmoa.app</a>
        </section>
      </div>
    </main>
  )
}
