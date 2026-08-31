'use client';

import Link from 'next/link';
import { CircleAlert } from 'lucide-react';

export default function NotFound() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="error">
      <div className="error-icon-box" style={{ backgroundColor: '#FF0000' }}>
        <CircleAlert size={32} />
      </div>

      <h2 className="error-title">
        잠시 후 다시 시도해주세요
      </h2>
      
      <p className="error-desc">
        요청을 처리하지 못했어요
      </p>

      <button onClick={handleRetry} className='error-button'>
        다시시도
      </button>

      <Link href="/main" className="error2-button">
        홈으로
      </Link>
    </div>
  );
}