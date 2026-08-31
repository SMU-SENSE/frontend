'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function CodeInput() {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) value = value[value.length - 1];
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConnect = () => {
    const fullCode = code.join('');

    if (fullCode.length < 6) {
      alert('6자리 코드를 모두 입력해주세요.');
      return;
    }

    // 백엔드 연동 전이므로 6자리가 채워지면 무조건 성공 처리
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

      <h1 className='code-title'>
        코드 입력
      </h1>
      <p className='code-sub'>
        보호자가 알려준 6자리 코드를 입력하세요
      </p>

      {/* 입력 */}
      <div className='code-button'>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className='code-input'
          />
        ))}
      </div>

      {/* 연결하기 버튼 */}
      <button 
        onClick={handleConnect}
        className='code-main'
      >
        연결하기
      </button>

      {/* 하단 QR로 스캔 전환 링크 */}
      <button 
        onClick={() => router.push('/QR')}
        className='code-QR'
      >
        QR로 스캔
      </button>
    </div>
  );
}