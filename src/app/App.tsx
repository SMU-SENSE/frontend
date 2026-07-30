import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { GlobalErrorBoundary } from '../components/GlobalErrorBoundary'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { PageLoader } from '../components/ui/AsyncState'
import { ToastProvider } from '../components/ui/ToastProvider'

// 화면 단위 코드 분할로 첫 진입 시 필요한 번들만 내려받는다.
const AuthLandingPage = lazy(() => import('../pages/auth/AuthLandingPage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const SignupPage = lazy(() => import('../pages/auth/SignupPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'))
const SentencesPage = lazy(() => import('../pages/sentences/SentencesPage'))
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'))
const RoutineRecommendationsPage = lazy(
  () => import('../pages/recommendations/RoutineRecommendationsPage'),
)
const AiRecommendationsPage = lazy(
  () => import('../pages/recommendations/AiRecommendationsPage'),
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 짧은 화면 이동마다 같은 사용자 데이터를 재요청하지 않도록 1분간 신선하게 본다.
      staleTime: 60_000,
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status
        // 인증/검증 오류 같은 4xx는 반복 요청해도 해결되지 않으므로 재시도하지 않는다.
        if (status && status >= 400 && status < 500) return false
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

export default function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/welcome" element={<AuthLandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* 로그인 이후 화면은 AppShell을 공유하고 ProtectedRoute에서 세션을 검사한다. */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/sentences" element={<SentencesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/recommendations/routine"
                  element={<RoutineRecommendationsPage />}
                />
                <Route path="/recommendations/ai" element={<AiRecommendationsPage />} />
              </Route>
              <Route path="*" element={<AuthLandingPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  )
}
