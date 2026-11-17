'use client';

import { useEffect, useRef, useState } from 'react';
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
  // 연결 실패 팝업 (null 이면 닫힘)
  const [popup, setPopup] = useState<{ title: string; detail: string } | null>(
    null
  );

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const popupButtonRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();

  /** 팝업 닫기: 입력칸을 비우고 첫 칸으로 커서를 옮겨서 바로 다시 입력하게 함 */
  const closePopup = () => {
    setPopup(null);
    setCode(Array(CODE_LENGTH).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  };

  // 팝업이 뜨면 확인 버튼에 포커스, Esc 로도 닫힘
  useEffect(() => {
    if (!popup) return;

    popupButtonRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        closePopup();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // closePopup 은 매번 새로 만들어지지만 하는 일은 같아서 popup 만 봄
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popup]);

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

      // 기기 토큰과 사용자 ID 는 deviceService 가 저장함.
      // 토큰이 안 왔으면 연결이 안 된 걸로 봄
      if (!response?.accessToken || !storage.getDeviceToken()) {
        throw new Error('기기 연결 정보를 받지 못했습니다. 다시 시도해 주세요.');
      }

      // 로그인 상태 저장
      localStorage.setItem('isLoggedIn', 'true');

      // 홈 화면으로 이동 (/main 페이지는 없음)
      router.push('/home');
    } catch (error: unknown) {
      // console.error 는 Next 개발 오류 창을 띄워서 warn 으로 둠
      console.warn('기기 연결 실패:', error);

      const err = error as {
        response?: { data?: { message?: string } };
      };

      if (!err?.response) {
        // 서버 응답 자체가 없음 → 코드를 다시 넣어도 소용없으니 문구를 다르게
        setPopup({
          title: '서버에 연결할 수 없어요',
          detail: '인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요.',
        });
      } else {
        // 코드가 틀렸거나 만료됨 → 다시 입력 안내
        setPopup({
          title: '다시 입력해주세요',
          detail:
            err.response.data?.message ||
            '인증번호가 일치하지 않거나 만료되었습니다.',
        });
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

      {/* 연결 실패 팝업 */}
      {popup && (
        <div style={popupStyles.backdrop} onClick={closePopup}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="code-popup-title"
            aria-describedby="code-popup-detail"
            style={popupStyles.box}
            // 팝업 안을 눌렀을 땐 닫히지 않게
            onClick={(event) => event.stopPropagation()}
          >
            <p id="code-popup-title" style={popupStyles.title}>
              {popup.title}
            </p>
            <p id="code-popup-detail" style={popupStyles.detail}>
              {popup.detail}
            </p>
            <button
              ref={popupButtonRef}
              type="button"
              onClick={closePopup}
              style={popupStyles.button}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* 팝업 모양 (이 화면에서만 쓰므로 여기 둠) */
const popupStyles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  box: {
    width: '100%',
    maxWidth: 360,
    padding: '28px 24px 20px',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
    textAlign: 'center',
  },
  title: {
    margin: 0,
    color: '#e53935', // 빨간색
    fontSize: 22,
    fontWeight: 700,
  },
  detail: {
    margin: '10px 0 20px',
    color: '#5f6470',
    fontSize: 15,
    lineHeight: 1.5,
  },
  button: {
    width: '100%',
    height: 48,
    border: 'none',
    borderRadius: 12,
    backgroundColor: '#149E69', // 이 화면 '연결하기' 버튼과 같은 색
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 700,
    cursor: 'pointer',
  },
};