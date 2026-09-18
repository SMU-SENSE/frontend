'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { aacUserApi } from '../../../api/aacUsers'
import { guardianLiveApi, type PairingResponse } from '../../../api/guardianLive'
import { ConnectionShell } from '../../../components/connect/ConnectionShell'
import { ErrorState, PageLoader } from '../../../components/ui/AsyncState'
import { useToast } from '../../../components/ui/ToastProvider'

export default function QrConnectionPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const users = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const user = users.data?.find((item) => item.active) ?? users.data?.[0] ?? null
  const pairing = useQuery({
    queryKey: ['device-pairing', user?.id],
    queryFn: () => guardianLiveApi.issuePairing(user!.id),
    enabled: Boolean(user),
    staleTime: Infinity,
  })
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const value = pairing.data
    if (!value) return
    const update = () => setSeconds(Math.max(0, Math.floor((new Date(value.expiresAt).getTime() - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [pairing.data])

  const refresh = useMutation({
    mutationFn: () => guardianLiveApi.refreshPairing(user!.id),
    onSuccess: (value) => {
      queryClient.setQueryData<PairingResponse>(['device-pairing', user?.id], value)
      showToast('새 QR 연결 정보를 발급했습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const time = useMemo(() => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [seconds])

  if (users.isLoading || pairing.isLoading) return <PageLoader label="실제 QR 연결 정보를 발급하는 중입니다." />
  const error = users.error ?? pairing.error
  if (error) return <ErrorState message={error.message} onRetry={() => { users.refetch(); pairing.refetch() }} />
  if (!user || !pairing.data) return <ErrorState message="연결할 AAC 사용자가 없습니다." onRetry={() => users.refetch()} />

  const expired = seconds <= 0
  const payload = pairing.data.qrPayload
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(payload)}`

  return (
    <ConnectionShell title="QR로 연결" subtitle="사용자 기기에서 스캔하면 바로 연결돼요">
      <div className="connection-card connection-card--qr">
        <p className="connection-card__instruction">사용자 기기에서 이 QR 코드를 스캔하세요</p>
        <div className={`qr-box ${expired ? 'qr-box--expired' : ''}`}>
          <img className="qr-real-image" src={qrImage} alt="사용자 기기 연결 QR 코드" />
          {expired ? (
            <div className="connection-expired">
              <strong>만료되었습니다</strong>
              <button type="button" disabled={refresh.isPending} onClick={() => refresh.mutate()}>새 QR 코드 발급</button>
            </div>
          ) : null}
        </div>
        {!expired ? (
          <div className="connection-timer">
            <span>남은 시간 {time}</span>
            <span aria-hidden="true">·</span>
            <button type="button" disabled={refresh.isPending} onClick={() => refresh.mutate()}><RefreshCw size={16} /> 새로고침</button>
          </div>
        ) : null}
      </div>

      <Link className="connection-switch" href="/connect/code">초대 코드로 연결</Link>
    </ConnectionShell>
  )
}
