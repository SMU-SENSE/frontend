'use client'

import { useState } from 'react'

interface speakProps {
  text: string;   
  label: string;
}

export default function speak({ text, label }: speakProps) {
  const [isActive, setIsActive] = useState(false);

  const speakText = (speakText: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speakText);
      utterance.lang = 'ko-KR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleClick = () => {
    speakText(text);
    setIsActive(true);
    setTimeout(() => { setIsActive(false);}, 300);
  };

  return (
    <button
        onClick={handleClick}
        className={`button-design ${isActive ? 'on' : 'off'}`}
    >
      {label}
    </button>
  );
}