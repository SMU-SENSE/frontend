'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

interface AddButtonProps {
  text?: string;
  variant?: 'bottom' | 'main' | 'leftbar';
  onClick?: () => void;
}

export default function AddButton({ text = '', variant = 'main', onClick }: AddButtonProps) {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), 500);

    if (onClick) {
      onClick();
    }
  };

  const getStyle = () => {
    switch (variant) {
      case 'bottom':
        return "bottom-design";
      case 'leftbar':
        return "leftbar-design";
      case 'main':
      default:
        return "main-design";
    }};

  return (
    <button
      onClick={handleClick}
      className={`
        transition-all duration-150 ease-in-out
        ${getStyle()} 
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
      {variant === 'bottom' && <Plus size={24}/>}
      {variant === 'leftbar' && <Plus size={24}/>}
      {variant === 'main' && <Plus size={24}/>}
    </button>
  );
  }