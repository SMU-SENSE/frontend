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
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/Button'

// 동석 담당 사용자 데이터 화면만 등록한다.
// 양지안 담당 AAC 화면은 이후 같은 배열에 경로를 추가하면 사이드바에 연결된다.
const navigation = [
  { to: '/', label: '홈', icon: Home, end: true },
  { to: '/sentences', label: '문장 관리', icon: MessageSquareText },
  { to: '/recommendations/routine', label: '루틴 추천', icon: Sparkles },
  { to: '/recommendations/ai', label: 'AI 추천', icon: Bot },
  { to: '/settings', label: '사용 환경 설정', icon: Settings },
  { to: '/profile', label: '내 프로필', icon: UserRound },
]

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = useAuthStore((state) => state.session?.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    // 로컬 세션만 정리한다. 실서버 로그아웃 API가 생기면 호출 성공 후 이 로직을 실행한다.
    logout()
    navigate('/welcome', { replace: true })
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
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              <Icon size={19} aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <Button
          className="sidebar__logout"
          variant="ghost"
          leftIcon={<LogOut size={18} />}
          onClick={handleLogout}
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
        <Outlet />
      </main>
    </div>
  )
}
