'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const VALID_CODE = '1234'; // 설정할 초대 코드

    if (code === VALID_CODE) {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/main'); // 성공 시 main 화면으로 이동
    } else {
      alert('코드가 올바르지 않습니다. 다시 확인해주세요.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#ffffff',
      padding: '20px',
      textAlign: 'center'
    }}>
      {/* 로고 이미지 */}
      <img src='/logo.svg' alt="말모아로고" style={{ width: '80px', height: '80px', marginBottom: '24px' }} />
      
      {/* 타이틀 및 서브 텍스트 */}
      <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>
        말모아에 오신 것을 환영해요
      </h1>
      <p style={{ color: '#7a7a8c', fontSize: '15px', marginBottom: '40px' }}>
        보호자와 연결하면 바로 대화를 시작할 수 있어요
      </p>

      {!showInput ? (
        /* 초기 버튼 영역 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '360px' }}>
          <button 
            onClick={() => setShowInput(true)}
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#149E69',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(20, 158, 105, 0.2)'
            }}
          >
            초대 코드로 연결
          </button>
          
          <button 
            onClick={() => alert('QR 스캔 기능은 준비 중입니다.')}
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              color: '#1a1a2e',
              fontWeight: 'bold',
              fontSize: '16px',
              border: '1px solid #dcdce6',
              cursor: 'pointer'
            }}
          >
            QR로 스캔
          </button>
        </div>
      ) : (
        /* '초대 코드로 연결' 클릭 시 나타나는 입력 폼 */
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '360px' }}>
          <input 
            type="password" 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            placeholder="초대 코드를 입력하세요 (예: 1234)"
            autoFocus
            style={{
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #149E69',
              fontSize: '16px',
              textAlign: 'center',
              outline: 'none',
              backgroundColor: '#f9fbfb'
            }}
          />
          <button 
            type="submit"
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#149E69',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            입장하기
          </button>
          <button 
            type="button"
            onClick={() => setShowInput(false)}
            style={{
              padding: '10px',
              backgroundColor: 'transparent',
              color: '#7a7a8c',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            돌아가기
          </button>
        </form>
      )}

      {/* 하단 안내 문구 */}
      <p style={{ color: '#9c9ba8', fontSize: '13px', marginTop: '60px' }}>
        보호자 앱에서 초대 코드나 QR을 받아 주세요
      </p>
    </div>
  );
}