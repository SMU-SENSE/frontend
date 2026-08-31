'use client';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className='login'>
      <img src='/logo.svg' alt="말모아로고" className='login-logo' />
      
      <h1 className='login-welcome'>
        말모아에 오신 것을 환영해요
      </h1>
      <p className='login-connect'>
        보호자와 연결하면 바로 대화를 시작할 수 있어요
      </p>

      <div className='login-button'>
        <button 
          onClick={() => router.push('/code')}
          className='login-code'
        >
          초대 코드로 연결
        </button>
        
        <button 
          onClick={() => router.push('/QR')}
          className='login-QR'
        >
          QR로 스캔
        </button>
      </div>

      <p className='login-bottom'>
        보호자 앱에서 초대 코드나 QR을 받아 주세요
      </p>
    </div>
  );
}