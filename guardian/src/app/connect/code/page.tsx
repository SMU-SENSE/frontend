'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { RefreshCw, Smartphone, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { aacUserApi } from '../../../api/aacUsers'
import { guardianLiveApi, type PairingResponse } from '../../../api/guardianLive'
import { ConnectionShell } from '../../../components/connect/ConnectionShell'
import { ErrorState, PageLoader } from '../../../components/ui/AsyncState'
import { useToast } from '../../../components/ui/ToastProvider'

export default function InviteCodeConnectionPage() {
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
  const devices = useQuery({
    queryKey: ['paired-devices', user?.id],
    queryFn: () => guardianLiveApi.devices(user!.id),
    enabled: Boolean(user),
    refetchInterval: 5000,
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
      showToast('새 초대 코드를 발급했습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const revoke = useMutation({
    mutationFn: (deviceId: number) => guardianLiveApi.revokeDevice(user!.id, deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paired-devices', user?.id] })
      showToast('기기 연결을 해제했습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  const time = useMemo(() => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [seconds])

  if (users.isLoading || pairing.isLoading) return <PageLoader label="실제 연결 코드를 발급하는 중입니다." />
  const error = users.error ?? pairing.error
  if (error) return <ErrorState message={error.message} onRetry={() => { users.refetch(); pairing.refetch() }} />
  if (!user || !pairing.data) return <ErrorState message="연결할 AAC 사용자가 없습니다." onRetry={() => users.refetch()} />

  const expired = seconds <= 0
  const code = pairing.data.inviteCode

  return (
    <ConnectionShell title="초대 코드" subtitle="사용자 기기에 코드를 알려주세요">
      <div className="connection-card connection-card--code">
        <div className={`invite-code ${expired ? 'invite-code--expired' : ''}`} aria-label={`초대 코드 ${code}`}>
          {code.split('').map((digit, index) => <span key={`${digit}-${index}`}>{digit}</span>)}
          {expired ? (
            <div className="connection-expired connection-expired--code">
              <strong>만료되었습니다</strong>
              <button type="button" disabled={refresh.isPending} onClick={() => refresh.mutate()}>새 코드 발급</button>
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

      <Link className="connection-switch" href="/connect/qr">QR로 연결</Link>

      <section className="connection-devices">
        <h2>연결된 사용자 기기</h2>
        {devices.isLoading ? <p>기기 목록을 확인하는 중입니다.</p> : devices.data?.length ? devices.data.map((device) => (
          <article key={device.id}>
            <Smartphone size={20} />
            <div><strong>{device.deviceName || '사용자 기기'}</strong><small>{device.deviceType} · {device.status}{device.lastSeenAt ? ` · 최근 연결 ${new Date(device.lastSeenAt).toLocaleString('ko-KR')}` : ''}</small></div>
            <button type="button" aria-label="기기 연결 해제" disabled={revoke.isPending} onClick={() => window.confirm('이 사용자 기기의 연결을 해제할까요?') && revoke.mutate(device.id)}><Trash2 size={18} /></button>
          </article>
        )) : <p>아직 연결된 기기가 없습니다. 위 코드를 사용자 앱에 입력해 주세요.</p>}
      </section>
    </ConnectionShell>
  )
}
