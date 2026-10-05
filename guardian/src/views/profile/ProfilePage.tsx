'use client'

import { useQuery } from '@tanstack/react-query'
import { Mail, ShieldCheck, UserRound } from 'lucide-react'
import { authApi } from '../../api/auth'
import { ErrorState, PageLoader } from '../../components/ui/AsyncState'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'

export default function ProfilePage() {
  const accountQuery = useQuery({ queryKey: ['auth', 'me'], queryFn: authApi.me })

  if (accountQuery.isLoading) return <PageLoader />
  if (accountQuery.error) {
    return <ErrorState message={accountQuery.error.message} onRetry={() => accountQuery.refetch()} />
  }

  const account = accountQuery.data
  if (!account) return null

  const displayName = account.name?.trim() || account.email.split('@')[0] || '보호자'

  return (
    <div className="page page--narrow">
      <PageHeader
        title="내 프로필"
        description="현재 로그인된 보호자 계정 정보를 Spring 백엔드에서 확인합니다."
      />

      <Card className="profile-summary">
        {account.profileImageUrl ? (
          <img className="avatar avatar--large" src={account.profileImageUrl} alt="" />
        ) : (
          <div className="avatar avatar--large">{displayName.slice(0, 1)}</div>
        )}
        <div>
          <h2>{displayName}</h2>
          <p>Google 계정과 연결된 말모아 보호자 계정입니다.</p>
        </div>
      </Card>

      <Card>
        <div className="profile-form">
          <div className="profile-meta">
            <div>
              <Mail size={18} />
              <span>이메일</span>
              <strong>{account.email}</strong>
            </div>
            <div>
              <UserRound size={18} />
              <span>이름</span>
              <strong>{account.name || 'Google 계정 이름 미제공'}</strong>
            </div>
            <div>
              <ShieldCheck size={18} />
              <span>계정 유형</span>
              <strong>{account.accountType ?? '설정 전'}</strong>
            </div>
            <div>
              <ShieldCheck size={18} />
              <span>계정 상태</span>
              <strong>{account.status}</strong>
            </div>
          </div>
          <p className="privacy-note">
            현재 백엔드는 보호자 계정의 이름·닉네임 수정 API를 제공하지 않아 이 화면은 서버 정보 조회만 지원합니다.
          </p>
        </div>
      </Card>
    </div>
  )
}
