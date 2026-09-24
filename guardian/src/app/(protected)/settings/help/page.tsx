'use client'

import { ChevronLeft, Mail, ShieldCheck, Smartphone, Wrench } from 'lucide-react'
import Link from 'next/link'

const faqs = [
  ['보호자 편집 모드는 무엇인가요?', '사용자 AAC 판을 보호자 화면에서 그대로 보면서 카드 텍스트·이미지·즐겨찾기·카테고리를 관리하는 기능입니다.'],
  ['사용자 화면에 설정은 언제 반영되나요?', '백엔드와 연결된 격자·TTS·문장·카테고리는 저장 즉시 공유 데이터로 반영됩니다.'],
  ['위치 알림은 어떻게 사용하나요?', '장소 관리에서 위치 권한과 알림 권한을 허용하고 안심존 반경을 설정하면 현재 위치 상태를 확인할 수 있습니다.'],
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
