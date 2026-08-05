'use client'

import "./globals.css";
import Link from "next/link";
import { Home, Settings, Sparkles, Hospital, School, Plus, Star } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Noto_Sans_KR } from 'next/font/google'
import { useState } from 'react'
import SoundButton from './components/SoundButton'
import AddButton from './components/AddButton'
import MoveButton from './components/MoveButton'

const notoSans = Noto_Sans_KR({
  subsets: ['latin'], weight: ['400', '700'], 
})

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {

  {/* 데이터 베이스 연결 후 수정 */}
  const [leftbar, setLeftbar] = useState([
    {name: '집', href: '/home-word', icon: Home},
    {name: '학교', href: '/school-word', icon: School},
    {name: '병원', href: '/hospital-word', icon: Hospital},
  ])

  {/* 데이터 베이스 연결 후 수정 */}
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

        {/*헤더*/}
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

        {/*사이드바-왼쪽*/}
        <div className="sidebar">
          {pathname !== '/setting' && (
            <aside className="leftbar">
             
              {/*추천*/}
              <Link href="/" className="leftbar-design"
               style={{
                  backgroundColor: pathname === '/' ? '#E6F8F1' : '#F0F0F4',
                  color: pathname === '/' ? '#149E69' : '#9C9BA8'
                }}>
               <Sparkles size={32} /> 추천
              </Link>
              
              {/*추가, 그외*/}
              <div className= "leftbar">
              {leftbar.map((item) => (
              <MoveButton key={item.name} text={item.name} icon={item.icon} href={item.href}/>
              ))}
              <AddButton variant="leftbar" onClick={() => { AddLeftbar();}}
            />
          </div>
            </aside>
          )}

        {/*메인*/}
        <main className="main-content">
          {children}
        </main>
        </div> 
        
        {/*하단바*/}
        {pathname !== '/setting' && (
          <div className="bottom">
            {Bottom.map((item) => (
              <SoundButton key={item.text} text={item.text} variant="bottom" />
            ))}
            <AddButton 
            variant="bottom" 
            onClick={() => { AddBottom(); }} 
            />
          </div>
        )}
      </body>
    </html>
  )}