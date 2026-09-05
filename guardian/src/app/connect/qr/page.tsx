'use client'

import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ConnectionShell } from '../../../components/connect/ConnectionShell'

const START_SECONDS = 590

export default function QrConnectionPage() {
  const [seconds, setSeconds] = useState(START_SECONDS)
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

  const refresh = () => setSeconds(START_SECONDS)

  return (
    <ConnectionShell title="QR로 연결" subtitle="사용자 기기에서 스캔하면 바로 연결돼요">
      <div className="connection-card connection-card--qr">
        <p className="connection-card__instruction">사용자 기기에서 이 QR 코드를 스캔하세요</p>
        <div className={`qr-box ${expired ? 'qr-box--expired' : ''}`}>
          <div className="qr-placeholder" aria-label="사용자 기기 연결 QR 코드">QR CODE</div>
          {expired ? (
            <div className="connection-expired">
              <strong>만료되었습니다</strong>
              <button type="button" onClick={refresh}>새 QR 코드 발급</button>
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

      <Link className="connection-switch" href="/connect/code">초대 코드로 연결</Link>
    </ConnectionShell>
  )
}
