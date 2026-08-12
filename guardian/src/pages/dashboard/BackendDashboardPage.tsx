'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Grid3X3, Mic2, UserRound } from 'lucide-react'
import Link from 'next/link'
import { aacUserApi } from '../../api/aacUsers'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuthStore } from '../../stores/authStore'

const gridLabel = {
  GRID_2X2: '2×2',
  GRID_3X3: '3×3',
  GRID_4X4: '4×4',
} as const

export default function BackendDashboardPage() {
  const account = useAuthStore((state) => state.session?.user)
  const users = useQuery({ queryKey: ['aac-users'], queryFn: aacUserApi.list })

  if (users.isLoading) return <PageLoader label="AAC 사용자 정보를 불러오는 중입니다." />
  if (users.error) {
    return <ErrorState message={users.error.message} onRetry={() => users.refetch()} />
  }

  const items = users.data ?? []

  return (
    <div className="page">
      <PageHeader
        title={`${account?.nickname ?? '보호자'}님, 안녕하세요`}
        description="Spring Boot 백엔드와 연결된 AAC 사용자 정보를 확인할 수 있어요."
      />

      {items.length === 0 ? (
        <Card className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>등록된 AAC 사용자가 없어요</h2>
              <p>사용자 프로필부터 등록하면 격자와 TTS 설정까지 이어서 저장할 수 있어요.</p>
            </div>
          </div>
          <Link className="card-link" href="/onboarding/profile">
            사용자 등록 시작 <ArrowRight size={16} />
          </Link>
        </Card>
      ) : (
        <div className="dashboard-grid">
          {items.map((user) => (
            <Card className="dashboard-section" key={user.id}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow"><UserRound size={14} /> AAC 사용자</span>
                  <h2>{user.name}</h2>
                  <p>{user.birthDate}</p>
                </div>
              </div>
              <div className="profile-meta">
                <div>
                  <Grid3X3 size={18} />
                  <span>격자</span>
                  <strong>{gridLabel[user.gridSize]}</strong>
                </div>
                <div>
                  <Mic2 size={18} />
                  <span>음성</span>
                  <strong>{user.voiceType === 'CHILD_FEMALE' ? '여성 아동' : user.voiceType === 'CHILD_MALE' ? '남성 아동' : '미설정'}</strong>
                </div>
              </div>
              <p>설정 상태: {user.setupStep === 'CONFIRMED' ? '완료' : '설정 중'}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
