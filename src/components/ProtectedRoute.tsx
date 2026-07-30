import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    // 로그인 완료 후 원래 요청한 화면으로 돌아가기 위해 현재 경로를 state에 보관한다.
    return <Navigate to="/welcome" replace state={{ from: location.pathname }} />
  }

  return children
}
