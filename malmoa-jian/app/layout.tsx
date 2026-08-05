'use client'

import "./globals.css";
import Link from "next/link";
import { Home, Settings, Sparkles, Hospital, School, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Noto_Sans_KR } from 'next/font/google'
import { useState } from 'react'
import Button from "./components/button";

const notoSans = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700'], 
})

export default function Header({children,}: Readonly<{children: React.ReactNode;}>) {

  const [sidebar, setSidebar] = useState([
    {name: '집', href: '/home-word', icon: Home},
    {name: '학교', href: '/school-word', icon: School},
    {name: '병원', href: '/hospital-word', icon: Hospital},
  ])

  const [button, setButton] = useState([
    { text: "네", label: "네" },
    { text: "아니요", label: "아니요" },
    { text: "도와주세요", label: "도와주세요" }
  ])

  const pathname = usePathname();
  
  const addSidebar = () => {
    const newName = prompt("추가할 카테고리 이름을 입력하세요:");
    if (!newName) return;
    
    const newItem = {
      name: newName,
      href: `/${encodeURIComponent(newName)}`, 
      icon: Plus
    };

    setSidebar([...sidebar, newItem]);
  };

  const addButton = () => {
      const newButton = prompt("추가할 버튼 이름을 입력하세요:");
      if (!newButton) return;
      
      const newItem = {
        name: newButton,
        href: `/${encodeURIComponent(newButton)}`, 
        icon: Plus
      };

      setSidebar([...sidebar, newItem]);
    };

  return (
    <html lang="ko">
      <body className={`${notoSans.className} container`}>

        {/*헤더*/}
        <header className="home-header">
          <img src="/logo.svg" alt="Logo" className="logo" />
          <Link href="/" className="header-design" 
          style={{ backgroundColor: pathname !== '/setting' ? '#E6F8F1' : 'transparent',
                color: pathname !== '/setting' ? '#149E69' : '#9C9BA8'}}>
            <Home size={33} /> 홈
          </Link>
          <Link href="/setting" className="header-design"
          style={{ backgroundColor: pathname === '/setting' ? '#E6F8F1' : 'transparent',
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
              
              {/*그 외*/}
              {sidebar.map((item) => (
                <Link
                  key={item.href}  
                  href={item.href}
                  className="leftbar-design"
                  style={{
                      backgroundColor: pathname === item.href ? '#E6F8F1' : '#F0F0F4',
                      color: pathname === item.href ? '#149E69' : '#9C9BA8'
                    }}
                >
                  <item.icon size={32} /> {item.name}
                </Link>
              ))}

              {/*추가*/}
              <button
                  onClick={addSidebar}
                  className="leftbar-design"
                  >
                  <Plus size={32} /> 
              </button>
            </aside>
          )}

          {/*메인*/}
          <main className="main-content">
            {children}
          </main>
        </div> 
        
        {/*하단바*/}
        {pathname !== '/setting' && (
          <div className="button">
            {button.map((item) => (
              <Button key={item.text} text={item.text} label={item.label} />
            ))}
          </div>
        )}

      </body>
    </html>
  )}