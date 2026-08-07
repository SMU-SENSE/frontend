import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthSession, User } from '../types/models'

interface AuthState {
  session: AuthSession | null
  isAuthenticated: boolean
  setSession: (session: AuthSession) => void
  updateUser: (user: User) => void
  logout: () => void
}

/**
 * 새로고침 후에도 로그인 상태가 유지되어야 하므로 세션만 localStorage에 저장한다.
 * 서버에서 자주 바뀌는 프로필 상세 데이터는 React Query가 담당한다.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      isAuthenticated: false,
      setSession: (session) => set({ session, isAuthenticated: true }),
      updateUser: (user) =>
        set((state) => ({
          session: state.session ? { ...state.session, user } : null,
        })),
      logout: () => set({ session: null, isAuthenticated: false }),
    }),
    {
      name: 'malmoa-auth',
      partialize: (state) => ({
        // 액션 함수는 직렬화하지 않고 인증에 필요한 값만 저장한다.
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
