'use client'

import { useState } from 'react'

interface SoundButtonProps {
  text: string;
  imageUrl?: string;
  variant?: 'bottom' | 'main'; 
  style?: React.CSSProperties;
}

export default function SoundButton({ text, imageUrl, variant = 'main' }: SoundButtonProps) {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      window.speechSynthesis.speak(utterance);
    }
    
    setIsActive(true);
    setTimeout(() => { setIsActive(false); }, 500);
  };

  const getDesignStyle = () => {
    switch (variant) {
      case 'bottom':
        return "bottom-design";
      case 'main':
      default:
        return "main-design";
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
          : variant === 'main' 
            ? '#D9D9D9' 
            : '#F0F0F4',
        transform: isActive ? 'scale(0.95)' : 'scale(1)',
        border: isActive ? '4px solid #FFD050' : 'none',
      }}
    >
      {imageUrl && variant === 'main' && (
        <img src={imageUrl} alt={text} className="image" />
      )}
      <span className="font-bold">
        {text}
      </span>
    </button>
  );
}