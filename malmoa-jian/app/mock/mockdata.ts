export interface Item {
  id: number;
  name: string;
  category: string;
  imageUrl?: string;
}

export const MockWord: Item[] = [
  //추천
  { id: 1, name: '좋아요', category: 'recommend' },
  { id: 2, name: '사과', category: 'recommend' },
  { id: 3, name: '햄버거', category: 'recommend' },

  //음식
  { id: 4, name: '사과', category: 'food' },
  { id: 5, name: '바나나', category: 'food' },
  { id: 6, name: '햄버거', category: 'food' },
  
  //감정
  { id: 7, name: '좋아요', category: 'emotion' },
  { id: 8, name: '싫어요', category: 'emotion' },
  { id: 9, name: '행복해요', category: 'emotion' },

  //사람
  { id: 10, name: '엄마', category: 'person' },
  { id: 11, name: '아빠', category: 'person' },
  { id: 12, name: '언니', category: 'person' },

  //장소
  { id: 13, name: '학교', category: 'place' },
  { id: 14, name: '집', category: 'place' },
  { id: 15, name: '화장실', category: 'place' },

  //인사/사회어
  { id: 16, name: '안녕하세요', category: 'hello' },
  { id: 17, name: '반가워요', category: 'hello' },
  { id: 18, name: '감사합니다', category: 'hello' },

  //시간
  { id: 19, name: '집 갈 시간', category: 'time' },
  { id: 20, name: '잠 잘 시간', category: 'time' },
  { id: 21, name: '등교시간', category: 'time' },

  //신체
  { id: 22, name: '얼굴', category: 'body' },
  { id: 23, name: '배', category: 'body' },
  { id: 24, name: '다리', category: 'body' },
];