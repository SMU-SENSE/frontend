'use client';

import "../globals.css";
import Link from "next/link";
import { Home, Settings, Sparkles, 
  Utensils, User, Smile, Building, Hand, Clock, PersonStanding,
  Star} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Noto_Sans_KR } from 'next/font/google'
import { useState } from 'react'
import SoundButton from '../components/SoundButton'
import MoveButton from '../components/MoveButton'
import AISentence from '../components/AISentence'

const notoSans = Noto_Sans_KR({
  subsets: ['latin'], weight: ['400', '700'], 
})

export default function RootLayout({children}: Readonly<{children: React.ReactNode;}>) {

  const [leftbar, setLeftbar] = useState([
    {name: '음식', href: '/food-word', icon: Utensils},
    {name: '감정', href: '/emotion-word', icon: Smile},
    {name: '사람', href: '/person-word', icon: User},
    {name: '장소', href: '/place-word', icon: Building},
    {name: '인사/사회어', href: '/hello-word', icon: Hand},
    {name: '시간', href: '/time-word', icon: Clock},
    {name: '신체', href: '/body-word', icon: PersonStanding},
  ])

  const [Bottom, setBottom] = useState([
    { text: "네", label: "네" },
    { text: "아니요", label: "아니요" },
    { text: "배고파요", label: "배고파요" }
  ])

  const pathname = usePathname();
  
  const AddLeftbar = () => {
    const userInput = prompt('추가할 이름을 입력하세요:');
    if (!userInput) return;
    const uniqueId = `item-${Date.now()}`;
    const newLeftbar = {
      name: userInput,          
      href: `/${uniqueId}-word`, 
      icon: Star
    };
    setLeftbar([...leftbar, newLeftbar]);
  };

  const AddBottom = () => {
    const userInput = prompt('추가할 이름을 입력하세요:');
    if (!userInput) return;
    const newBottom = {
      text: userInput,
      label : userInput
    };
    setBottom([...Bottom, newBottom]);
  };

  return (
    <html lang="ko">
      <body className={`${notoSans.className} container`}>

        {/* 헤더 */}
        <header className="home-header">
          <img src='../logo.svg' alt="말모아로고" className="logo" />
          <Link href="/" className="header-design" 
          style={{ backgroundColor: pathname !== '/setting' ? '#E6F8F1' : 'transparent',
                transform: pathname === '/setting' ? 'scale(0.95)' : 'scale(1)',
                color: pathname !== '/setting' ? '#149E69' : '#9C9BA8'}}>
            <Home size={33} /> 홈
          </Link>
          <Link href="/setting" className="header-design"
          style={{ backgroundColor: pathname === '/setting' ? '#E6F8F1' : 'transparent',
                transform: pathname === '/setting' ? 'scale(0.95)' : 'scale(1)',
                color: pathname === '/setting' ? '#149E69' : '#9C9BA8'}}>
            <Settings size={33} /> 설정
          </Link>
        </header>

        {pathname !== '/setting' && (
          /* 컨텐츠 영역 전체를 가로로 */
          <div className="content-cover">
            
            {/* 왼쪽 사이드바 + 메인 */}
            <div className="main">
              <aside className="leftbar">
                {/* 추천 */}
                <Link href="/" className="leftbar-design"
                 style={{
                    backgroundColor: pathname === '/' ? '#E6F8F1' : '#F0F0F4',
                    color: pathname === '/' ? '#149E69' : '#9C9BA8'
                  }}>
                 <Sparkles size={32} /> 추천
                </Link>
                
                {/* 메뉴 목록들 */}
                {leftbar.map((item) => (
                  <MoveButton key={item.name} text={item.name} icon={item.icon} href={item.href}/>
                ))}
              </aside>
            
              {/* 메인 */}
              <main className="main-content">
                {children}
              </main>
            </div> 

            {/* 사이드바 - 오른쪽 */}
            <aside className="rightbar">
              <AISentence />
            </aside>

          </div>
        )}

        {/* 하단바 */}
        {pathname !== '/setting' && (
          <div className="bottom">
            {Bottom.map((item) => (
              <SoundButton key={item.text} text={item.text} variant="bottom" />
            ))}
          </div>
        )}
      </body>
    </html>
  );
}