//카드 tts, 이미지, 스타일 지정

'use client';

import { useState, useRef, useEffect } from 'react';

interface cardStyleProps {
  text: string;
  imageUrl?: string;
  variant?: 'bottom' | 'home';
  style?: React.CSSProperties;
  color?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export default function SoundButton({
  text,
  imageUrl,
  variant = 'home',
  style,
  onClick,
}: cardStyleProps) {
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (variant !== 'home' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      window.speechSynthesis.speak(utterance);
    }

    setIsActive(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsActive(false);
    }, 500);

    if (onClick) {
      onClick();
    }
  };

  const getDesignStyle = () => {
    switch (variant) {
      case 'bottom':
        return 'bottom-design';
      case 'home':
      default:
        return 'home-design';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        transition-all duration-150 ease-in-out
        ${getDesignStyle()} 
      `}
      style={{
        backgroundColor: isActive
          ? '#FFF8DC'
          : variant === 'home'
            ? '#D9D9D9'
            : '#F0F0F4',
        transform: isActive ? 'scale(0.95)' : 'scale(1)',
        border: isActive ? '4px solid #FFD050' : 'none',
        ...style,
      }}
    >
      {imageUrl && variant === 'home' && (
        <img src={imageUrl} alt={text} className="image" />
      )}
      <span className="font-bold">{text}</span>
    </button>
  );
}