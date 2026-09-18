'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { tts } from '@/lib/tts';
import { storage } from '@/lib/storage';
import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/constants/apiEndpoint';
import styles from './AISentence.module.css';

/* 상징은 최대 8개까지 고를 수 있음 */
export const MAX_SELECT_WORDS = 8;

/** 팝업에 보여줄 추천 문장 개수 */
const SUGGESTION_COUNT = 3;

/** .env.local 에 NEXT_PUBLIC_USE_MOCK=true 면 진짜 AI 대신 mock 을 씀 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export interface SelectedSymbol {
  id?: string | number;
  label: string;
  imageUrl?: string;
  /** 카테고리 색. 카드 테두리에 쓰임 */
  color?: string;
}

/** 문자열 배열도 그대로 받을 수 있게 함 */
export type SelectWordItem = string | SelectedSymbol;

/* ───────────── 고른 단어 공유하기 (Context) ─────────────
 *
 * layout.tsx 는 <main>{children}</main> 으로 페이지를 그려서
 * GridBox 에 props 를 직접 넘겨줄 수가 없음.
 * 그래서 "공용 보관함"을 만들어서 어느 컴포넌트에서든 꺼내 쓰게 함.
 * ------------------------------------------------------ */

interface WordsContextValue {
  /** 고른 단어들. 하나가 { label, color, imageUrl } 모양 */
  words: SelectedSymbol[];
  /** 글자만 뽑아놓은 것. 비교할 때 편하라고 같이 줌 */
  labels: string[];
  addWord: (item: SelectWordItem) => void;
  toggleWord: (item: SelectWordItem) => void;
  removeWordAt: (index: number) => void;
  removeLastWord: () => void;
  clearWords: () => void;
  isFull: boolean;
}

const WordsContext = createContext<WordsContextValue | null>(null);

/** 문자열로 들어와도 { label } 모양으로 맞춰줌 */
const toSymbol = (item: SelectWordItem): SelectedSymbol =>
  typeof item === 'string' ? { label: item } : item;

/** layout.tsx 에서 전체를 이걸로 감싸주면 됨 */
export function WordsProvider({ children }: { children: React.ReactNode }) {
  const [words, setWords] = useState<SelectedSymbol[]>([]);

  const addWord = useCallback((item: SelectWordItem) => {
    const symbol = toSymbol(item);
    setWords((prev) =>
      prev.length >= MAX_SELECT_WORDS ? prev : [...prev, symbol]
    );
  }, []);

  // 이미 있으면 빼고, 없으면 넣음 (글자로 비교)
  const toggleWord = useCallback((item: SelectWordItem) => {
    const symbol = toSymbol(item);

    setWords((prev) => {
      const exists = prev.some((word) => word.label === symbol.label);
      if (exists) return prev.filter((word) => word.label !== symbol.label);
      if (prev.length >= MAX_SELECT_WORDS) return prev;
      return [...prev, symbol];
    });
  }, []);

  const removeWordAt = useCallback((index: number) => {
    setWords((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeLastWord = useCallback(() => {
    setWords((prev) => prev.slice(0, -1));
  }, []);

  const clearWords = useCallback(() => setWords([]), []);

  const value = useMemo<WordsContextValue>(
    () => ({
      words,
      labels: words.map((word) => word.label),
      addWord,
      toggleWord,
      removeWordAt,
      removeLastWord,
      clearWords,
      isFull: words.length >= MAX_SELECT_WORDS,
    }),
    [words, addWord, toggleWord, removeWordAt, removeLastWord, clearWords]
  );

  return (
    <WordsContext.Provider value={value}>{children}</WordsContext.Provider>
  );
}

/** 어느 컴포넌트에서든 이걸 부르면 고른 단어를 쓸 수 있음 */
export function useWords(): WordsContextValue {
  const ctx = useContext(WordsContext);

  // Provider 로 감싸지 않았어도 앱이 죽지 않게 빈 값을 돌려줌
  if (!ctx) {
    return {
      words: [],
      labels: [],
      addWord: () => {},
      toggleWord: () => {},
      removeWordAt: () => {},
      removeLastWord: () => {},
      clearWords: () => {},
      isFull: false,
    };
  }

  return ctx;
}

/* ───────────── 임시 AI (백엔드 나오기 전까지) ───────────── */

/** 마지막 글자에 받침이 있는지 확인. 조사를 고르는 데 씀 */
const hasBatchim = (word: string): boolean => {
  const code = word.charCodeAt(word.length - 1);
  // 한글 음절(가~힣)이 아니면 받침 없는 걸로 침
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
};

/** '먹다' 처럼 사전형 동사인지 대충 판별 */
const isVerb = (word: string): boolean =>
  word.length > 1 && word.endsWith('다');

/**
 * 고른 단어로 추천 문장 3개를 만듦.
 * 진짜 AI가 아니라 규칙으로 만든 임시 버전.
 * 예) ['물'] → '물을 주세요.' / '물을 원해요.' / '물이 필요해요.'
 */
const makeMockSentences = (words: string[]): string[] => {
  if (words.length === 0) return [];

  const last = words[words.length - 1];
  const rest = words.slice(0, -1);

  // 마지막 단어를 뺀 나머지를 조사 붙여서 이어붙임
  const body = rest
    .map((word, index) =>
      index === 0 && rest.length > 1
        ? word + (hasBatchim(word) ? '은' : '는')
        : word + (hasBatchim(word) ? '을' : '를')
    )
    .join(' ');

  // 마지막이 동사면 어미를 바꿔서 세 가지를 만듦
  if (isVerb(last)) {
    const stem = last.slice(0, -1); // '다' 떼기
    return [
      `${body} ${stem}고 싶어요.`.trim(),
      `${body} ${stem}었어요.`.trim(),
      `${body} ${stem}지 않았어요.`.trim(),
    ];
  }

  // 마지막이 명사면 조사를 바꿔서 세 가지를 만듦
  const objectForm = last + (hasBatchim(last) ? '을' : '를');
  const subjectForm = last + (hasBatchim(last) ? '이' : '가');

  return [
    `${body} ${objectForm} 주세요.`.trim(),
    `${body} ${objectForm} 원해요.`.trim(),
    `${body} ${subjectForm} 필요해요.`.trim(),
  ];
};

/* ───────────── 컴포넌트 ───────────── */

interface AISentenceProps {
  selectWords?: SelectWordItem[];
  onRemoveWord?: (index: number) => void;
  onRemoveLastWord?: () => void;
  onClearWords?: () => void;
}

export default function AISentence({
  selectWords,
  onRemoveWord,
  onRemoveLastWord,
  onClearWords,
}: AISentenceProps) {
  // props 로 받은 게 있으면 그걸 쓰고, 없으면 공용 보관함에서 꺼냄
  const shared = useWords();

  const words = selectWords ?? shared.words;
  const handleRemoveWord = onRemoveWord ?? shared.removeWordAt;
  const handleRemoveLast = onRemoveLastWord ?? shared.removeLastWord;
  const handleClear = onClearWords ?? shared.clearWords;

  const [isOpen, setIsOpen] = useState<boolean>(false); // 팝업 열림 여부
  const [suggestions, setSuggestions] = useState<string[]>([]); // 추천 문장 3개
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // 문자열이든 객체든 { label } 모양으로 통일
  const symbols = useMemo<SelectedSymbol[]>(() => {
    if (!Array.isArray(words)) return [];

    return words
      .map((item) => (typeof item === 'string' ? { label: item } : item))
      .filter((item): item is SelectedSymbol => Boolean(item?.label))
      .slice(0, MAX_SELECT_WORDS);
  }, [words]);

  const labels = useMemo<string[]>(
    () => symbols.map((symbol) => symbol.label),
    [symbols]
  );

  // 고른 단어가 바뀌면 추천 문장은 지움
  const wordsKey = labels.join('\u0001');

  useEffect(() => {
    setSuggestions([]);
  }, [wordsKey]);

  // 화면 벗어날 때 음성 정리
  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, []);

  // 팝업이 열려 있을 때 ESC 로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const getAacUserId = (): number => {
    const storedId = storage.getAacUserId();
    const parsed = storedId ? Number(storedId) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  const hasWords = labels.length > 0;

  /* 추천 문장 만들기 -------------------------------------- */
  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    setSuggestions([]);

    try {
      // ── 임시 코드 ────────────────────────────────
      // 서버를 안 부르므로 기다림 없이 바로 만들어서 보여줌
      if (USE_MOCK) {
        setSuggestions(makeMockSentences(labels));
        return;
      }
      // ────────────────────────────────────────────

      // AI 문장 생성 API 를 붙일 때는 아래를 쓰면 됨.
      // services/ttsService.ts 의 sentenceAndLogService.generateSentences 와 같은 API.
      // 주의: 글자가 아니라 symbolIds(숫자 배열)를 보내야 함.
      // const res = await apiClient.post(
      //   API_ENDPOINTS.AAC_USERS.GENERATE_SENTENCE(getAacUserId()),
      //   { symbolIds, tone: 'POLITE' }
      // );
      // const source = (res as any)?.data ?? res;
      // setSuggestions(source?.candidates ?? []);

      setSuggestions(makeMockSentences(labels));
    } catch (error) {
      console.error('문장 추천 실패:', error);
      // 실패해도 최소한 단어는 이어붙여서 보여줌
      setSuggestions([labels.join(' ')]);
    } finally {
      setIsLoading(false);
    }
  }, [labels]);

  const handleOpen = (): void => {
    if (!hasWords) return;
    setIsOpen(true);
    void fetchSuggestions();
  };

  const handleClose = (): void => {
    setIsOpen(false);
  };

  /* 소리내기 ---------------------------------------------- */

  // 발화 로그는 실패해도 음성 출력에 영향 없음
  const sendUsageLog = async (text: string): Promise<void> => {
    if (USE_MOCK) return;

    try {
      await apiClient.post(API_ENDPOINTS.AAC_USERS.USAGE_LOGS(getAacUserId()), {
        sentence: text,
        words: labels,
        spokenAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('발화 로그 전송 실패 (음성은 정상 출력):', error);
    }
  };

  const handleStop = (): void => {
    tts.stop();
    setIsSpeaking(false);
  };

  /** 팝업 안에서 문장 하나를 읽어줌 */
  const handleSpeakSentence = (text: string): void => {
    if (!text) return;

    tts.stop();
    tts.speak(text);
    void sendUsageLog(text);
  };

  /** 아래쪽 '말하기' 버튼 — 고른 단어를 그대로 읽음 */
  const handleSpeakWords = (): void => {
    const text = labels.join(' ');
    if (!text) return;

    if (isSpeaking) {
      handleStop();
      return;
    }

    setIsSpeaking(true);
    tts.speak(text);
    void sendUsageLog(text);
  };

  const handleReset = (): void => {
    handleStop();
    handleClear();
    setSuggestions([]);
  };

  const handleCardClick = (index: number): void => {
    if (handleRemoveWord) {
      handleRemoveWord(index);
      return;
    }

    // 지우는 함수가 없으면 마지막 카드만 지울 수 있음
    if (index === labels.length - 1) handleRemoveLast();
  };

  return (
    <section className={styles.panel} aria-label="문장 만들기">
      {/* 고른 상징이 담기는 박스 */}
      <div className={styles.board}>
        {!hasWords ? (
          <p className={styles.placeholder}>상징을 골라 보세요</p>
        ) : (
          <ul className={styles.grid}>
            {symbols.map((symbol, index) => (
              <li key={`${symbol.id ?? symbol.label}-${index}`}>
                <button
                  type="button"
                  onClick={() => handleCardClick(index)}
                  className={styles.card}
                  style={
                    symbol.color
                      ? ({ '--card-color': symbol.color } as React.CSSProperties)
                      : undefined
                  }
                  aria-label={`${symbol.label} 빼기`}
                >
                  <span className={styles.thumb}>
                    {symbol.imageUrl ? (
                      <img src={symbol.imageUrl} alt="" />
                    ) : null}
                  </span>
                  <span className={styles.cardLabel}>{symbol.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 아래 버튼 3개 */}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasWords}
          className={`${styles.action} ${styles.actionReset}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
            <path
              d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          초기화
        </button>

        <button
          type="button"
          onClick={handleOpen}
          disabled={!hasWords}
          className={`${styles.action} ${styles.actionAI}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
            <path
              d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM18.5 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z"
              fill="currentColor"
            />
          </svg>
          문장 추천
        </button>

        <button
          type="button"
          onClick={handleSpeakWords}
          disabled={!hasWords}
          className={`${styles.action} ${styles.actionSpeak}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
            <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4v-5z" fill="currentColor" />
            {isSpeaking ? (
              <path
                d="M16 9l4 6M20 9l-4 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
          {isSpeaking ? '멈추기' : '말하기'}
        </button>
      </div>

      {/* ───────── AI 추천 문장 팝업 ───────── */}
      {isOpen && (
        // 어두운 배경. 이걸 누르면 닫힘
        <div className={styles.overlay} onClick={handleClose}>
          {/* 안쪽을 눌렀을 때는 닫히지 않게 클릭 전파를 막음 */}
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="AI 추천 문장"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>AI 추천 문장</h2>

              {/* 만드는 중에는 '다시 만들기'를 숨김 */}
              {!isLoading && (
                <button
                  type="button"
                  onClick={() => void fetchSuggestions()}
                  className={styles.retryButton}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className={styles.icon}
                  >
                    <path
                      d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  다시 만들기
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                className={styles.closeButton}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            {isLoading ? (
              <div className={styles.loading}>
                <span className={styles.spinner} aria-hidden="true" />
                <p className={styles.loadingText}>AI가 문장을 만들고 있어요...</p>
              </div>
            ) : (
              <ul className={styles.suggestionList}>
                {suggestions.map((sentence, index) => (
                  <li key={`${sentence}-${index}`} className={styles.suggestion}>
                    <span className={styles.suggestionNo}>{index + 1}</span>
                    <p className={styles.suggestionText}>{sentence}</p>

                    <button
                      type="button"
                      onClick={() => handleSpeakSentence(sentence)}
                      className={styles.speakButton}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className={styles.icon}
                      >
                        <path
                          d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4v-5z"
                          fill="currentColor"
                        />
                        <path
                          d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      말하기
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}