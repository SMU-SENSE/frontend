'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Hash, QrCode, Smartphone, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { aacUserApi } from '../../api/aacUsers'
import { guardianLiveApi } from '../../api/guardianLive'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { useToast } from '../../components/ui/ToastProvider'

export default function ConnectionManagementPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const users = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })
  const user = users.data?.find((item) => item.active) ?? users.data?.[0] ?? null
  const devices = useQuery({
    queryKey: ['paired-devices', user?.id],
    queryFn: () => guardianLiveApi.devices(user!.id),
    enabled: Boolean(user),
    refetchInterval: 5000,
  })
  const revoke = useMutation({
    mutationFn: (deviceId: number) => guardianLiveApi.revokeDevice(user!.id, deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paired-devices', user?.id] })
      showToast('사용자 기기 연결을 해제했습니다.')
    },
    onError: (error) => showToast(error.message, 'error'),
  })

  if (users.isLoading || (user && devices.isLoading)) return <PageLoader label="사용자 연결 정보를 불러오는 중입니다." />
  const error = users.error ?? devices.error
  if (error) return <ErrorState message={error.message} onRetry={() => { users.refetch(); devices.refetch() }} />
  if (!user) return <ErrorState message="연결할 AAC 사용자가 없습니다." onRetry={() => users.refetch()} />

  const connected = devices.data ?? []

  return (
    <main className="gp-connect-manager">
      <header className="gp-connect-manager__head">
        <Link href="/settings" aria-label="환경 설정으로 돌아가기"><ChevronLeft size={28} /></Link>
        <div>
          <h1>사용자 연결 관리</h1>
          <p>사용자 별도 로그인 없이 QR 또는 초대 코드로 연결합니다.</p>
        </div>
      </header>

      <section className="gp-connect-manager__methods" aria-label="사용자 기기 연결 방식">
        <Link href="/connect/qr" className="gp-connect-method">
          <span><QrCode size={34} /></span>
          <strong>QR 연결</strong>
          <small>사용자 선택 → QR 생성 → 사용자 기기에서 스캔</small>
          <b>QR 생성하기</b>
        </Link>
        <div className="gp-connect-or" aria-hidden="true">또는</div>
        <Link href="/connect/code" className="gp-connect-method">
          <span><Hash size={34} /></span>
          <strong>초대 코드</strong>
          <small>6자리 코드 생성 → 사용자 기기에서 입력</small>
          <b>초대 코드 생성하기</b>
        </Link>
      </section>

      <section className="gp-connect-manager__devices">
        <div className="gp-connect-manager__devices-head">
          <div>
            <h2>연결된 사용자 기기</h2>
            <p>{connected.length ? `${connected.length}대의 기기가 연결되어 있습니다.` : '아직 연결된 사용자 기기가 없습니다.'}</p>
          </div>
          <span className={connected.length ? 'is-connected' : ''}>{connected.length ? 'AAC 연결 완료' : '연결 대기'}</span>
        </div>

        {connected.length ? (
          <div className="gp-connect-device-list">
            {connected.map((device) => (
              <article key={device.id}>
                <span className="gp-connect-device-icon"><Smartphone size={25} /></span>
                <div>
                  <strong>{device.deviceName || '사용자 기기'}</strong>
                  <small>{device.deviceType} · {device.lastSeenAt ? `최근 접속 ${new Date(device.lastSeenAt).toLocaleString('ko-KR')}` : '접속 기록 없음'}</small>
                </div>
                <button type="button" aria-label="연결 해제" disabled={revoke.isPending} onClick={() => revoke.mutate(device.id)}><Trash2 size={18} /></button>
              </article>
            ))}
          </div>
        ) : (
          <div className="gp-connect-manager__empty">
            <Smartphone size={36} />
            <strong>사용자 폰에서 연결을 완료하면 여기에 표시돼요.</strong>
            <span>QR 스캔 또는 6자리 초대 코드 중 하나를 사용하세요.</span>
          </div>
        )}
      </section>
    </main>
  )
}
