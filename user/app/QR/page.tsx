'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function QRScanPage() {
  const router = useRouter();

  // QR 스캔 성공 시뮬레이션 함수 (추후 실제 카메라 라이브러리로 대체)
  const handleScanSuccess = () => {
    localStorage.setItem('isLoggedIn', 'true');
    router.push('/main'); // 성공 시 main 화면으로 이동
  };

  return (
    <div className='codeQR'>
      {/* 뒤로가기 버튼 */}
      <button 
        onClick={() => router.push('/')}
        className='back'
      >
        <ChevronLeft size={24} className='back-button'/>
        뒤로가기
      </button>

      {/* 타이틀 및 서브 텍스트 */}
      <h1 className='code-title'>
        QR 스캔
      </h1>
      <p className='code-sub'>
        보호자 화면에 표시된 QR 코드를 스캔하세요
      </p>

      {/* QR 스캔 뷰파인더 박스 */}
      <div 
        onClick={handleScanSuccess} // 박스를 누르면 스캔 성공으로 처리 (테스트용)
        title="클릭하면 스캔 성공으로 처리됩니다"
        className='QR-scan'
      >
        {/* 네 모서리 초점 가이드라인 */}
        <div style={{ position: 'absolute', top: '24px', left: '24px', width: '24px', height: '24px', borderTop: '3px solid #149E69', borderLeft: '3px solid #149E69' }} />
        <div style={{ position: 'absolute', top: '24px', right: '24px', width: '24px', height: '24px', borderTop: '3px solid #149E69', borderRight: '3px solid #149E69' }} />
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', width: '24px', height: '24px', borderBottom: '3px solid #149E69', borderLeft: '3px solid #149E69' }} />
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '24px', height: '24px', borderBottom: '3px solid #149E69', borderRight: '3px solid #149E69' }} />

        {/* 안내 문구 */}
        <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
          QR을 네모 안에 맞춰 주세요
        </span>
      </div>

      {/* 인식 안내 문구 */}
      <p className='QR-bottom'>
        인식되면 자동으로 연결됩니다
      </p>

      {/* 하단 초대 코드로 전환 링크 */}
      <button 
        onClick={() => router.push('/code')}
        className='code-QR'
      >
        초대 코드로 연결
      </button>
    </div>
  );
}