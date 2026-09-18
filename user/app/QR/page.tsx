'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useState } from "react";

export default function QRScanPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    let isScannerRunning = false;

    // 카메라 시작 함수
    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // 후면 카메라 우선 사용
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // QR 인식 성공 시
            if (isScannerRunning) {
              isScannerRunning = false;
              html5QrCode.stop().then(() => {
                setScanResult(decodedText);
                
                // 유효한 QR 검증 (필요에 따라 조건 수정)
                const VALID_QR_CODE = "my-secret-key-123";

                if (decodedText === VALID_QR_CODE || decodedText) { // 실제 서비스에 맞게 조건 조정
                  alert("인증되었습니다! 앱으로 이동합니다.");
                  localStorage.setItem('isLoggedIn', 'true');
                  router.push("/home"); // 또는 /main
                } else {
                  alert("유효하지 않은 QR 코드입니다.");
                  window.location.reload(); // 재시도용 새로고침 또는 스캐너 재시작
                }
              }).catch((err) => console.error("스캐너 중지 실패:", err));
            }
          },
          (errorMessage) => {
            // 스캔 중 실패는 빈번하게 일어나므로 콘솔에 도배되지 않도록 비워둡니다.
          }
        );
        isScannerRunning = true;
      } catch (err) {
        console.error("카메라를 시작할 수 없습니다.", err);
      }
    };

    startScanner();

    // 컴포넌트 언마운트 시 카메라 정리
    return () => {
      if (isScannerRunning) {
        html5QrCode.stop().catch((error) => {
          console.error("스캐너 정리 중 오류 발생:", error);
        });
      }
    };
  }, [router]);

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
        title="클릭하면 스캔 성공으로 처리됩니다"
        className='QR-scan'
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {/* 실제 카메라 화면이 그려질 영역 */}
        <div id="qr-reader" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />

        {/* 네 모서리 초점 가이드라인 (카메라 위에 얹혀지도록 z-index 설정) */}
        <div style={{ position: 'absolute', top: '24px', left: '24px', width: '24px', height: '24px', borderTop: '3px solid #149E69', borderLeft: '3px solid #149E69', zIndex: 2 }} />
        <div style={{ position: 'absolute', top: '24px', right: '24px', width: '24px', height: '24px', borderTop: '3px solid #149E69', borderRight: '3px solid #149E69', zIndex: 2 }} />
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', width: '24px', height: '24px', borderBottom: '3px solid #149E69', borderLeft: '3px solid #149E69', zIndex: 2 }} />
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '24px', height: '24px', borderBottom: '3px solid #149E69', borderRight: '3px solid #149E69', zIndex: 2 }} />

        {/* 안내 문구 */}
        <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500', position: 'absolute', bottom: '12px', zIndex: 2, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
          QR을 네모 안에 맞춰 주세요
        </span>
      </div>

      {scanResult && (
        <p className="mt-4 text-green-600 font-semibold">
          스캔된 데이터: {scanResult}
        </p>
      )}

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