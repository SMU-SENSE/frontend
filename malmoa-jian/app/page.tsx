'use client'

import SoundButton from './components/SoundButton'

export default function HomeWordPage() {
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