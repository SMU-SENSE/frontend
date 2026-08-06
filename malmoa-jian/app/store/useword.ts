import { create } from 'zustand';
import { persist } from 'zustand/middleware';  

interface WordStore {
  selectWords: string[];
  addWord: (word: string) => void;
  removeLastWord: () => void;
  clearWords: () => void;
}

export const useWordStore = create<WordStore>()(
  persist(
    (set) => ({
      selectWords: [],
      addWord: (word) => set((state) => ({ selectWords: [...state.selectWords, word] })),
      removeLastWord: () => set((state) => ({ selectWords: state.selectWords.slice(0, -1) })),
      clearWords: () => set({ selectWords: [] }),
    }),
    { name: 'word-storage' }
  )
);