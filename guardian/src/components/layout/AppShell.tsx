'use client'

import {
  Bot,
  Home,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authApi } from '../../api/auth'
import { apiConfig } from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/Button'

type NavigationItem = {
  to: string
  label: string
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  end?: boolean
}

const backendNavigation: NavigationItem[] = [
  { to: '/', label: '홈', icon: Home, end: true },
]

const prototypeNavigation: NavigationItem[] = [
  ...backendNavigation,
  { to: '/sentences', label: '문장 관리', icon: MessageSquareText },
  { to: '/recommendations/routine', label: '루틴 추천', icon: Sparkles },
  { to: '/recommendations/ai', label: 'AI 추천', icon: Bot },
  { to: '/settings', label: '사용 환경 설정', icon: Settings },
  { to: '/profile', label: '내 프로필', icon: UserRound },
]

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const user = useAuthStore((state) => state.session?.user)
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()
  const pathname = usePathname()
  const navigation = apiConfig.useMockApi ? prototypeNavigation : backendNavigation

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      if (!apiConfig.useMockApi) await authApi.logout()
    } finally {
      logout()
      router.replace('/welcome')
      setLoggingOut(false)
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        본문 바로가기
      </a>
      <header className="mobile-header">
        <button
          type="button"
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <strong>말모아</strong>
      </header>
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <MessageSquareText size={26} />
          <span>말모아</span>
        </div>
        <div className="sidebar__profile">
          <div className="avatar" aria-hidden>
            {user?.nickname.slice(0, 1) ?? '말'}
          </div>
          <div>
            <strong>{user?.nickname ?? '사용자'}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
        <nav className="sidebar__nav" aria-label="주요 메뉴">
          {navigation.map(({ to, label, icon: Icon, end }) => {
            const isActive = end ? pathname === to : pathname.startsWith(to)
            return (
              <Link
                key={to}
                href={to}
                onClick={() => setMenuOpen(false)}
                className={isActive ? 'is-active' : undefined}
              >
                <Icon size={19} aria-hidden />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
        <Button
          className="sidebar__logout"
          variant="ghost"
          leftIcon={<LogOut size={18} />}
          onClick={handleLogout}
          loading={loggingOut}
        >
          로그아웃
        </Button>
      </aside>
      {menuOpen ? (
        <button
          className="sidebar-backdrop"
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="메뉴 닫기"
        />
      ) : null}
      <main className="app-main" id="main-content">
        {children}
      </main>
    </div>
  )
}
