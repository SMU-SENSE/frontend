'use client'

{/* 사용자가 추가한 페이지 */}

import { useParams } from 'next/navigation'
import SoundButton from '../components/SoundButton'

export default function DynamicWordPage() {
  const params = useParams();
  const word = params.word; 
  return (
      <div>
        <div className="grid">
          {/* 집에 관련된 단어 버튼들 */}
          <SoundButton text="방" variant="main" />
          <SoundButton text="침대" variant="main" />
          <SoundButton text="냉장고" variant="main" />
        </div>
      </div>
    );
}