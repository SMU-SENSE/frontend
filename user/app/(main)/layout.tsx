'use client';

import Link from "next/link";
import { Home, Settings, Sparkles, 
  Utensils, User, Smile, Building, Hand, Clock, PersonStanding } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import MoveButton from '../components/MoveButton'
import AISentence from '../components/AISentence'
import SoundButton from '../components/SoundButton'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [leftbar] = useState([
    {name: '음식', href: '/food-word', icon: Utensils},
    {name: '감정', href: '/emotion-word', icon: Smile},
    {name: '사람', href: '/person-word', icon: User},
    {name: '장소', href: '/place-word', icon: Building},
    {name: '인사/사회어', href: '/hello-word', icon: Hand},
    {name: '시간', href: '/time-word', icon: Clock},
    {name: '신체', href: '/body-word', icon: PersonStanding},
  ])

  const [Bottom] = useState([
    { text: "네", label: "네" },
    { text: "아니요", label: "아니요" },
    { text: "배고파요", label: "배고파요" }
  ])

  const pathname = usePathname();

  return (
    <>
      <header className="home-header">
        <img src='/logo.svg' alt="말모아로고" className="logo" />
        
        <Link href="/main" className="header-design" 
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
        <div className="content-cover">
          <div className="main">
            <aside className="leftbar">
              <Link href="/main" className="leftbar-design"
               style={{
                  backgroundColor: pathname === '/main' ? '#E6F8F1' : '#F0F0F4',
                  color: pathname === '/main' ? '#149E69' : '#9C9BA8'
                }}>
               <Sparkles size={32} /> 추천
              </Link>
              {leftbar.map((item) => (
                <MoveButton key={item.name} text={item.name} icon={item.icon} href={item.href}/>
              ))}
            </aside>
            <main className="main-content">
              {children}
            </main>
          </div> 
          <aside className="rightbar">
            <AISentence />
          </aside>
        </div>
      )}

      {pathname !== '/setting' && (
        <div className="bottom">
          {Bottom.map((item) => (
            <SoundButton key={item.text} text={item.text} variant="bottom" />
          ))}
        </div>
      )}
    </>
  );
}