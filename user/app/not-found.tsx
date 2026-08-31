'use client';

import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="error">
      <div className="error-icon-box" style={{ backgroundColor: '#4B5563' }}>
        <HelpCircle size={32} />
      </div>

      <h2 className="error-title">
        페이지를 찾을 수 없어요
      </h2>
      
      <p className="error-desc">
        주소가 바뀌었거나 삭제되었을 수 있어요
      </p>

      <Link href="/main" className="error-button">
        홈으로
      </Link>
    </div>
  );
}