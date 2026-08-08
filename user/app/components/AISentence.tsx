'use client';

import { useState } from 'react';
import { useWordStore } from '../store/useword';

export default function AISentence() {
  const { selectWords, removeLastWord, clearWords } = useWordStore();
  
  const [makeSentence, setMakeSentence] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const MakeSentence = async () => {
    if (selectWords.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: selectWords }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '문장 생성 실패');
      setMakeSentence(data.sentence);
    } catch (error) {
      console.error('문장 생성 실패:', error);
      alert('AI 문장 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleReset = () => {
    clearWords();
    setMakeSentence('');
    handleStop();
  };

  return (
    <div>
      
      {/* 문장조합 박스  */}
      <div className="make">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-800">문장 조합 공간</h2>
          <button
            onClick={handleReset}
            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
          >
            🔄 새로고침
          </button>
        </div>

        <div className="min-h-[140px] p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col justify-between shadow-inner">
          <div className="flex flex-wrap items-center gap-2">
            {selectWords.length === 0 ? (
              <span className="text-gray-400 text-sm font-medium">단어를 골라보세요.</span>
            ) : (
              selectWords.map((word, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-sm shadow-sm"
                >
                  {word}
                </span>
              ))
            )}
          </div>

          {selectWords.length > 0 && (
            <div className="flex justify-end pt-2">
              <button
                onClick={removeLastWord}
                className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer"
              >
                마지막 단어 지우기
              </button>
            </div>
          )}
        </div>

        {/* AI 문장 출력 */}
        {makeSentence && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-emerald-700">✨ AI 완성 문장</span>
            <div className="text-base font-bold text-gray-800 text-center py-1">
              {makeSentence}
            </div>
            <div className="flex gap-2 pt-2 border-t border-emerald-200">
              <button
                onClick={() => handleSpeak(makeSentence)}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                🔊 읽어주기
              </button>
              <button
                onClick={handleStop}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ⏹️ 그만두기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI 생성 버튼 */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={MakeSentence}
          disabled={selectWords.length === 0 || isLoading}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-2xl transition shadow-sm cursor-pointer text-sm"
        >
          {isLoading ? 'AI가 문장을 만드는 중...' : '✨ AI 문장 생성하기'}
        </button>
      </div>

    </div>
  );
}