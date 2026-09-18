'use client'

import { useEffect } from 'react'

export function PwaRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 설치 실패가 보호자 핵심 기능을 막지 않도록 조용히 폴백한다.
    })
  }, [])
  return null
}
