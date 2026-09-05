'use client'

import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ConnectionShell } from '../../../components/connect/ConnectionShell'

const START_SECONDS = 590

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default function InviteCodeConnectionPage() {
  const [seconds, setSeconds] = useState(START_SECONDS)
  const [code, setCode] = useState('482917')
  const expired = seconds <= 0

  useEffect(() => {
    if (expired) return
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [expired])

  const time = useMemo(() => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [seconds])

  const refresh = () => {
    setCode(makeCode())
    setSeconds(START_SECONDS)
  }

  return (
    <ConnectionShell title="초대 코드" subtitle="사용자 기기에 코드를 알려주세요">
      <div className="connection-card connection-card--code">
        <div className={`invite-code ${expired ? 'invite-code--expired' : ''}`} aria-label={`초대 코드 ${code}`}>
          {code.split('').map((digit, index) => <span key={`${digit}-${index}`}>{digit}</span>)}
          {expired ? (
            <div className="connection-expired connection-expired--code">
              <strong>만료되었습니다</strong>
              <button type="button" onClick={refresh}>새 코드 발급</button>
            </div>
          ) : null}
        </div>
        {!expired ? (
          <div className="connection-timer">
            <span>남은 시간 {time}</span>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={refresh}><RefreshCw size={16} /> 새로고침</button>
          </div>
        ) : null}
      </div>

      <Link className="connection-switch" href="/connect/qr">QR로 연결</Link>
    </ConnectionShell>
  )
}
