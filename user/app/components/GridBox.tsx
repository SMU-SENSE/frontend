'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { symbolService, SymbolCard } from '@/services/symbolService';
import { MockWord } from '../mock/mockdata';
import { apiClient } from '@/lib/apiClient';
import { storage } from '@/lib/storage';
import { API_ENDPOINTS } from '@/constants/apiEndpoint';
import { useWords, type SelectedSymbol } from './AISentence'; // 고른 단어 공용 보관함
import styles from './GridBox.module.css';

/* ───────────── 격자 설정 (보호자 앱에서 정함) ───────────── */

export type GridSize = 2 | 3 | 4;

const GRID_SIZES: GridSize[] = [2, 3, 4];
const DEFAULT_GRID_SIZE: GridSize = 4;
const CACHE_KEY = 'aac.gridSize';
const POLL_MS = 30_000;

/** .env.local 에 NEXT_PUBLIC_USE_MOCK=true 면 API 대신 캐시값 사용 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

/** 2, 3, 4 중 하나면 그 값을, 아니면 null */
const toGridSize = (value: unknown): GridSize | null => {
  const num = Number(value);
  return GRID_SIZES.includes(num as GridSize) ? (num as GridSize) : null;
};

/** 지금 태블릿이 어느 사용자 것인지 */
const getAacUserId = (): number => {
  const storedId = storage.getAacUserId();
  const parsed = storedId ? Number(storedId) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

/** 카테고리별 색.
 *  한글 이름, 영어 키, 라우트 경로(/food-word) 어느 쪽으로 와도 찾게 해둠 */
const CATEGORY_COLORS: Record<string, string> = {
  음식: '#F3CC6B',
  food: '#F3CC6B',

  감정: '#7ECFE6',
  emotion: '#7ECFE6',

  사람: '#F9BE93',
  person: '#F9BE93',

  장소: '#A9C7F0',
  place: '#A9C7F0',

  '인사/사회어': '#9EE3C0',
  인사: '#9EE3C0',
  hello: '#9EE3C0',
  social: '#9EE3C0',

  시간: '#C9B7F0',
  time: '#C9B7F0',

  신체: '#F5AEC8',
  body: '#F5AEC8',

  행동: '#9EE3C0',
  action: '#9EE3C0',

  문법: '#B4C4B8',
  grammar: '#B4C4B8',

  대화: '#8F89F2',
  talk: '#8F89F2',

  설명: '#C9B7F0',
  description: '#C9B7F0',

  긴급어: '#F3A0A0',
  emergency: '#F3A0A0',

  추천: '#7ECFE6',
  recommend: '#7ECFE6',

  최근: '#CBD3DE',
  recent: '#CBD3DE',

  즐겨찾기: '#F3CC6B',
  favorite: '#F3CC6B',
};

/** 목록에 없는 카테고리일 때 쓸 색들 */
const FALLBACK_PALETTE = [
  '#7ECFE6',
  '#F3CC6B',
  '#9EE3C0',
  '#8F89F2',
  '#F9BE93',
  '#F3A0A0',
  '#A9C7F0',
  '#C9B7F0',
];

/* ───────────── 서버/목 데이터에서 값 꺼내기 ─────────────
 * 백엔드 필드 이름이 확정 전이라, 흔히 쓰는 이름을 전부 확인함.
 * ------------------------------------------------------ */

/** 카드에 보여줄 단어 */
const getWordText = (item: any): string =>
  item?.name ??
  item?.symbolName ??
  item?.text ??
  item?.word ??
  item?.label ??
  item?.title ??
  item?.symbol ??
  '';

/** 이 상징이 속한 카테고리 이름 */
const getCategoryName = (item: any): string =>
  item?.category ??
  item?.categoryName ??
  item?.category_name ??
  item?.categoryTitle ??
  item?.group ??
  '';

/** 카드 그림 주소 */
const getImageUrl = (item: any): string | undefined =>
  item?.imageUrl ?? item?.image ?? item?.imgUrl ?? item?.icon ?? undefined;

/** '/food-word', 'FOOD', ' 음식 ' 같은 값을 비교하기 좋게 다듬음 */
const normalize = (value: string): string =>
  value.trim().toLowerCase().replace(/^\//, '').replace(/-word$/, '');

/** 이름이 같으면 항상 같은 색이 나오도록 글자를 숫자로 바꿈 */
const hashToIndex = (value: string): number => {
  let sum = 0;
  for (let i = 0; i < value.length; i += 1) {
    sum += value.charCodeAt(i);
  }
  return sum % FALLBACK_PALETTE.length;
};

/** 카드 색: 서버가 준 색 → 카테고리 색 → 이름 기준 색 */
const getColor = (item: any): string => {
  // 1) 서버가 직접 색을 내려줬으면 그대로
  if (item?.color) return item.color;

  const raw = getCategoryName(item);
  if (!raw) return FALLBACK_PALETTE[0];

  // 2) 이름 그대로 찾기
  if (CATEGORY_COLORS[raw]) return CATEGORY_COLORS[raw];

  // 3) 다듬어서 다시 찾기 ('/food-word' → 'food')
  const key = normalize(raw);
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];

  // 4) 그래도 없으면 이름을 숫자로 바꿔서 색을 정함.
  //    순서가 아니라 이름 기준이라, 같은 카테고리는 항상 같은 색이 됨.
  return FALLBACK_PALETTE[hashToIndex(key)];
};

/* ───────────── 카드 한 장 (이 파일 안에서만 씀) ───────────── */

interface CardProps {
  text: string;
  imageUrl?: string;
  color?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function Card({
  text,
  imageUrl,
  color,
  selected = false,
  disabled = false,
  onClick,
}: CardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      style={
        color ? ({ '--card-color': color } as React.CSSProperties) : undefined
      }
    >
      <span className={styles.imgBox}>
        {imageUrl ? <img src={imageUrl} alt="" /> : '×'}
      </span>
      <span className={styles.cardText}>{text}</span>
    </button>
  );
}

/* ───────────── 화면 아래 자주 쓰는 말 버튼 ─────────────
 * layout.tsx 에서 이렇게 가져다 쓰면 됨:
 * import GridBox, { SoundButton } from '../components/GridBox';
 * ------------------------------------------------------ */

export function SoundButton({
  text,
  onClick,
}: {
  text: string;
  variant?: string; // 기존 코드 호환용. 지금은 안 씀
  onClick?: () => void;
}) {
  const shared = useWords();
  const handleClick = onClick ?? (() => shared.toggleWord(text));

  return (
    <button type="button" onClick={handleClick} className={styles.bottom}>
      {text}
    </button>
  );
}

/* ───────────── 이 컴포넌트가 밖에서 받는 값 ───────────── */

interface GridBoxProps {
  /** 지금 보고 있는 카테고리 이름 */
  categoryName: string;
  /** 직접 넘기고 싶을 때만. 안 넘기면 공용 보관함을 씀 */
  onSelectWord?: (word: SelectedSymbol) => void;
  selectedWords?: string[];
  isSelectionFull?: boolean;
  maxSelectCount?: number;
  /** 보호자 설정을 무시하고 격자를 직접 지정하고 싶을 때 */
  gridSize?: GridSize;
}

/* ───────────── 컴포넌트 본체 ───────────── */

export default function GridBox({
  categoryName,
  onSelectWord,
  selectedWords,
  isSelectionFull,
  maxSelectCount = 8,
  gridSize: gridSizeProp,
}: GridBoxProps) {
  const [symbols, setSymbols] = useState<SymbolCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [gridSizeFromServer, setGridSizeFromServer] =
    useState<GridSize>(DEFAULT_GRID_SIZE);

  // layout 에서 props 를 못 받으므로 공용 보관함에서 꺼내 씀
  const shared = useWords();
  // 고른 단어의 "글자만" 모은 목록. 카드가 선택됐는지 비교할 때 씀
  const pickedWords = selectedWords ?? shared.labels;
  const selectionFull = isSelectionFull ?? shared.isFull;
  const handleSelect = onSelectWord ?? shared.toggleWord;

  const gridSize = gridSizeProp ?? gridSizeFromServer;

  /* 격자 설정 불러오기 ------------------------------------ */
  const fetchGridSetting = useCallback(async () => {
    // 저장해둔 값을 먼저 써서 화면이 깜빡이지 않게 함
    const cached = toGridSize(window.localStorage.getItem(CACHE_KEY));
    if (cached) setGridSizeFromServer(cached);

    if (USE_MOCK) return;

    try {
      const res = await apiClient.get(
        API_ENDPOINTS.ONBOARDING.GRID(getAacUserId())
      );

      // 응답 모양이 뭐든 gridSize 만 꺼냄
      const source = (res as any)?.data ?? (res as any)?.result ?? res;
      const next =
        toGridSize(source?.gridSize) ??
        toGridSize(source?.grid_size) ??
        toGridSize(source?.size);

      if (next) {
        setGridSizeFromServer(next);
        window.localStorage.setItem(CACHE_KEY, String(next));
      }
    } catch (error) {
      // 실패해도 캐시값으로 계속 동작
      console.warn('격자 설정 불러오기 실패:', error);
    }
  }, []);

  // 보호자가 바꾼 값을 따라감
  useEffect(() => {
    void fetchGridSetting();

    const timer = window.setInterval(fetchGridSetting, POLL_MS);

    const handleVisible = () => {
      if (document.visibilityState === 'visible') void fetchGridSetting();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CACHE_KEY) return;
      const next = toGridSize(event.newValue);
      if (next) setGridSizeFromServer(next);
    };

    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', fetchGridSetting);
    window.addEventListener('storage', handleStorage);

    // 화면이 사라질 때 등록한 것들을 치움
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', fetchGridSetting);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchGridSetting]);

  /* 상징 목록 불러오기 ------------------------------------ */
  useEffect(() => {
    const loadMock = () => {
      if (Array.isArray(MockWord)) {
        setSymbols(MockWord as any);
      } else if (
        (MockWord as any)?.data &&
        Array.isArray((MockWord as any).data)
      ) {
        setSymbols((MockWord as any).data);
      } else {
        setSymbols([]);
      }
    };

    const fetchSymbols = async () => {
      if (USE_MOCK) {
        loadMock();
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const res = await symbolService.getSymbols();

        // 응답 구조 방어 처리
        if (Array.isArray(res)) {
          setSymbols(res);
        } else if (res && Array.isArray((res as any).data)) {
          setSymbols((res as any).data);
        } else if (res && Array.isArray((res as any).result)) {
          setSymbols((res as any).result);
        } else {
          setSymbols([]);
        }

        setErrorMsg('');
      } catch (error: any) {
        console.error('API 호출 중 에러 발생:', error);
        setErrorMsg(error?.message || '데이터를 불러오지 못했습니다.');
        loadMock(); // API 가 아직 안 열렸어도 화면은 보이게
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSymbols();
  }, []);

  /* 화면에 그릴 목록 계산 --------------------------------- */
  const symbolList = useMemo(() => {
    const filtered = symbols.filter(
      (item: any) => getCategoryName(item) === categoryName
    );

    // 카테고리 이름이 안 맞아서 하나도 안 걸리면 전체를 보여줌.
    // (백엔드 필드가 확정되기 전까지 화면이 비지 않게 하는 안전장치)
    return filtered.length > 0 ? filtered : symbols;
  }, [symbols, categoryName]);

  // 한 페이지에 들어가는 카드 수 = 격자 크기의 제곱
  const perPage = gridSize * gridSize;
  const totalPage = Math.max(1, Math.ceil(symbolList.length / perPage));
  const safePage = Math.min(page, totalPage - 1);
  const pageItems = symbolList.slice(
    safePage * perPage,
    safePage * perPage + perPage
  );

  // 카테고리나 격자 크기가 바뀌면 1페이지로
  useEffect(() => {
    setPage(0);
  }, [categoryName, gridSize]);

  /* 화면 그리기 ------------------------------------------- */

  if (isLoading) {
    return <p className={styles.empty}>불러오는 중...</p>;
  }

  return (
    <div
      className={styles.wrap}
      style={{ '--cols': gridSize } as React.CSSProperties}
    >
      {selectionFull && (
        <p className={styles.notice} role="status">
          <span aria-hidden="true">⚠️</span>
          상징은 최대 {maxSelectCount}개까지 선택할 수 있어요
        </p>
      )}

      {symbolList.length === 0 ? (
        <p className={styles.empty}>
          표시할 카드가 없습니다 (카테고리: {categoryName})
        </p>
      ) : (
        <div className={styles.grid}>
          {pageItems.map((item: any, index: number) => {
            const wordText = getWordText(item);
            const color = getColor(item);
            const isSelected = pickedWords.includes(wordText);

            return (
              <Card
                key={item.id ?? item.symbolId ?? `${wordText}-${index}`}
                text={wordText}
                imageUrl={getImageUrl(item)}
                color={color}
                selected={isSelected}
                disabled={selectionFull && !isSelected}
                // 글자만 보내지 않고 색과 그림까지 같이 보냄.
                // 그래야 오른쪽 패널에서도 카테고리 색으로 보임.
                onClick={() =>
                  handleSelect({
                    id: item.id ?? item.symbolId,
                    label: wordText,
                    color,
                    imageUrl: getImageUrl(item),
                  })
                }
              />
            );
          })}
        </div>
      )}

      {totalPage > 1 && (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={safePage === 0}
          >
            이전
          </button>

          <span className={styles.pageInfo}>
            {safePage + 1} / {totalPage}
          </span>

          <button
            type="button"
            className={styles.pageButton}
            onClick={() => setPage((prev) => Math.min(totalPage - 1, prev + 1))}
            disabled={safePage >= totalPage - 1}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}