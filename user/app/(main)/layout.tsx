'use client';

import Link from "next/link";
import { Home, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import MoveButton from '../components/MoveButton';
// WordsProvider: 고른 단어를 앱 전체가 같이 보게 해주는 보관함
// useCategories: 카테고리 목록 (이름, 주소, 색, 아이콘이 다 들어있음)
import AISentence, { WordsProvider } from '../components/AISentence';
import { useCategories, SoundButton } from '../components/GridBox';

/** 아래 자주 쓰는 말 */
const QUICK_WORDS = ['네', '아니요', '배고파요'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 백엔드에서 카테고리를 받아옴.
  // 응답 전 / 실패 시에는 GridBox 의 기본 목록이 그대로 나옴.
  const categories = useCategories();

  // 첫 번째(추천)는 홈이라 따로 그리고, 나머지는 MoveButton 으로 그림
  const [home, ...rest] = categories;

  // 목록이 비어 있을 때를 대비
  const homeHref = home?.href ?? '/home';
  const HomeIcon = home?.icon;

  return (
    // ★ 여기서 전체를 감싸야 안쪽 어디서든 고른 단어를 같이 볼 수 있음
    <WordsProvider>
      <header className="home-header">
        <img src='/logo.svg' alt="말모아로고" className="logo" />

        <Link
          href={homeHref}
          className="header-design"
          style={{
            backgroundColor: pathname !== '/setting' ? '#E6F8F1' : 'transparent',
            transform: pathname === '/setting' ? 'scale(0.95)' : 'scale(1)',
            color: pathname !== '/setting' ? '#149E69' : '#9C9BA8'
          }}
        >
          <Home size={33} /> 홈
        </Link>
      </header>

      <div className="content-cover">
        <div className="main">
          <aside className="leftbar">
            {/* 추천 = 홈 */}
            <Link
              href={homeHref}
              className="leftbar-design"
              data-active={pathname === homeHref ? 'true' : 'false'}
              style={{ '--cat-color': home?.color ?? '#E6F7F1' } as React.CSSProperties}
            >
              {HomeIcon && <HomeIcon size={28} />}
              <span>{home?.name ?? '추천'}</span>
            </Link>

            {/* 나머지 카테고리 — 아이콘까지 목록에서 그대로 가져옴 */}
            {rest.map((item) => (
              <MoveButton
                key={item.key}
                text={item.name}
                icon={item.icon}
                href={item.href}
                color={item.color}
              />
            ))}
          </aside>

          <main className="main-content">
            {children}
          </main>
        </div>

        <aside className="rightbar">
          {/* props 없이 둬도 보관함에서 알아서 가져옴 */}
          <AISentence />
        </aside>
      </div>

      <div className="bottom">
        {QUICK_WORDS.map((text) => (
          <SoundButton key={text} text={text} variant="bottom" />
        ))}
      </div>
    </WordsProvider>
  );
}