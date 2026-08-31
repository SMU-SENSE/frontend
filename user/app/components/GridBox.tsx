'use client'

import SoundButton from './SoundButton'
import { useWordStore } from '../wordstore/useword';
import { MockWord } from '../mock/mockdata';

interface GridBoxProps {
  categoryName: string; 
}

export default function GridBox({ categoryName }: GridBoxProps) {
  const { addWord } = useWordStore();
  const symbolList = MockWord.filter((item) => item.category === categoryName);

  return (
    <div>
      <div className="grid"> 
        {symbolList.map((item) => (
          <SoundButton
            key={item.id}
            text={item.name}
            onClick={() => {
              addWord(item.name);
            }}
          />
        ))}
      </div>

    </div>
  );
}