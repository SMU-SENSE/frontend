'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { deviceService } from '@/services/loginService';
import { storage } from '@/lib/storage';

const CODE_LENGTH = 6;

export default function CodeInput() {
  const [code, setCode] = useState<string[]>(
    Array(CODE_LENGTH).fill('')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const fullCode = code.join('');
  const isCodeComplete = fullCode.length === CODE_LENGTH;

  const handleChange = (value: string, index: number) => {
    // 숫자만 허용
    if (!/^\d*$/.test(value)) {
      return;
    }

    // 한 칸에는 마지막 숫자 하나만 저장
    const cleanedValue = value.slice(-1);

    const newCode = [...code];
    newCode[index] = cleanedValue;

    setCode(newCode);
    setErrorMsg('');

    // 숫자를 입력하면 다음 칸으로 이동
    if (cleanedValue && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    // 현재 칸이 비어 있고 Backspace를 누르면 이전 칸으로 이동
    if (
      e.key === 'Backspace' &&
      !code[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConnect = async () => {
    // 6자리가 아니면 요청하지 않음
    if (!isCodeComplete) {
      setErrorMsg('6자리 코드를 모두 입력해 주세요.');
      return;
    }

    // 이미 요청 중이면 중복 요청 방지
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');

      // 백엔드 기기 페어링 API 호출
      const response = await deviceService.claimByCode(fullCode);

      // 백엔드에서 받은 사용자 ID 저장
      if (response?.aacUserId) {
        storage.setAacUserId(response.aacUserId);
      }

      // 로그인 상태 저장
      localStorage.setItem('isLoggedIn', 'true');

      // 메인 화면으로 이동
      router.push('/main');
    } catch (error: unknown) {
      console.error('기기 연결 실패:', error);

      // Error 객체인 경우 메시지 사용
      if (error instanceof Error) {
        setErrorMsg(
          error.message || '인증번호가 일치하지 않거나 만료되었습니다.'
        );
      } else {
        setErrorMsg('인증번호가 일치하지 않거나 만료되었습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='codeQR'>
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => router.push('/')}
        className='back'
        type='button'
      >
        <ChevronLeft size={24} className='back-button' />
        뒤로가기
      </button>

      <h1 className='code-title'>
        코드 입력
      </h1>

      <p className='code-sub'>
        보호자가 알려준 6자리 코드를 입력하세요
      </p>

      {/* 6자리 코드 입력 */}
      <div className='code-button'>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type='text'
            inputMode='numeric'
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className='code-input'
            aria-label={`${index + 1}번째 인증번호`}
            disabled={isLoading}
          />
        ))}
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <p className='code-error'>
          {errorMsg}
        </p>
      )}

      {/* 연결하기 버튼 */}
      <button
        onClick={handleConnect}
        className='code-main'
        type='button'
        disabled={!isCodeComplete || isLoading}
      >
        {isLoading ? '연결 확인 중...' : '연결하기'}
      </button>

      {/* 하단 QR로 스캔 전환 */}
      <button
        onClick={() => router.push('/QR')}
        className='code-QR'
        type='button'
        disabled={isLoading}
      >
        QR로 스캔
      </button>
    </div>
  );
}