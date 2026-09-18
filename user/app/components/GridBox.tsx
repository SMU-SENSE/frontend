'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';
import {
  Sparkles,
  Clock,
  Star,
  Siren,
  User,
  Utensils,
  Building,
  PersonStanding,
  UserRoundArrowLeft,
  Heart,
  Plus,
  MessageCircle,
  Languages,
  Shapes,
} from 'lucide-react';
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

/* ───────────── 카테고리 목록 (한 곳에서 관리) ─────────────
 * key   : 데이터의 category 값 (mockdata / 백엔드와 같아야 함)
 * name  : 화면에 보이는 이름
 * href  : 주소
 * color : 카드 색
 * icon  : 왼쪽 메뉴 아이콘 (lucide-react)
 *
 * layout.tsx 의 왼쪽 메뉴도 이 목록을 가져다 씀.
 * 카테고리를 추가할 땐 여기 한 줄만 넣으면 메뉴와 색이 같이 따라옴.
 * 나중에 GET /api/v1/categories 로 바꿀 자리이기도 함.
 * ------------------------------------------------------ */

export interface CategoryInfo {
  key: string;
  name: string;
  href: string;
  color: string;
  icon: ElementType;
}

/** 목록에 없는 카테고리가 생겼을 때 쓸 기본 아이콘 */
const DEFAULT_ICON: ElementType = Shapes;

/* 보호자 앱에서 아이콘을 고르면 서버는 "Utensils" 같은 이름(문자열)을 보냄.
 * 그림 자체는 보낼 수 없으므로, 이름 → 실제 아이콘으로 바꿔주는 표가 필요함.
 * 보호자 앱에서 고를 수 있는 아이콘을 여기에 등록해두면 됨. */
const ICON_BY_NAME: Record<string, ElementType> = {
  Sparkles,
  Clock,
  Star,
  Siren,
  User,
  Utensils,
  Building,
  PersonStanding,
  UserRoundArrowLeft,
  Heart,
  Plus,
  MessageCircle,
  Languages,
  Shapes,
};

/** "utensils", "UTENSILS" 처럼 와도 찾게 해줌 */
const findIcon = (name: unknown): ElementType | null => {
  if (typeof name !== 'string' || !name) return null;

  if (ICON_BY_NAME[name]) return ICON_BY_NAME[name];

  const lower = name.toLowerCase();
  const matched = Object.keys(ICON_BY_NAME).find(
    (key) => key.toLowerCase() === lower
  );

  return matched ? ICON_BY_NAME[matched] : null;
};

export const CATEGORIES: CategoryInfo[] = [
  { key: 'recommend',    name: '추천',        href: '/home',           color: '#E6F7F1', icon: Sparkles },
  { key: 'recent',       name: '최근',        href: '/recent',         color: '#F0F0F4', icon: Clock },
  { key: 'favorite',     name: '즐겨찾기',     href: '/favorite',       color: '#FFFBEC', icon: Star },
  { key: 'red',          name: '긴급어',      href: '/red',             color: '#FFF0F0', icon: Siren },
  { key: 'person',       name: '사람',        href: '/person',          color: '#FFF5EE', icon: User },
  { key: 'food',         name: '음식',        href: '/food',           color: '#FFFBEC', icon: Utensils },
  { key: 'time',         name: '장소',        href: '/time',           color: '#FFFBEC', icon: Building },
  { key: 'body',         name: '신체',        href: '/body',           color: '#FFFBEC', icon: PersonStanding },
  { key: 'action',       name: '행동',        href: '/action',         color: '#EDFBF5', icon: UserRoundArrowLeft },
  { key: 'emotion',      name: '감정',        href: '/emotion',        color: '#EDF8FD', icon: Heart },
  { key: 'description',  name: '설명',        href: '/description',    color: '#EDF8FD', icon: Plus },
  { key: 'conversation', name: '대화',        href: '/conversation',   color: '#F0F1FF', icon: MessageCircle },
  { key: 'grammar',      name: '문법',        href: '/grammar',        color: '#F5F6F5', icon: Languages },
];

/** key 로 카테고리를 빠르게 찾기 위한 표 */
const CATEGORY_BY_KEY: Record<string, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map((item) => [item.key, item])
);

/** 주소(/food)로 카테고리를 찾기 위한 표 */
const CATEGORY_BY_HREF: Record<string, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map((item) => [item.href, item])
);

/** 화면 이름(음식)으로도 찾을 수 있게 */
const CATEGORY_BY_NAME: Record<string, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map((item) => [item.name, item])
);

/** 목록에 없는 카테고리일 때 쓸 색들 */
const FALLBACK_PALETTE = [
  '#EDF8FD',
  '#FFFBEC',
  '#EDFBF5',
  '#F0F1FF',
  '#FFF5EE',
  '#FFF0F0',
  '#EEF4FF',
  '#F7F1FF',
];

/** 이름이 같으면 항상 같은 색이 나오도록 글자를 숫자로 바꿈 */
const hashToIndex = (value: string): number => {
  let sum = 0;
  for (let i = 0; i < value.length; i += 1) {
    sum += value.charCodeAt(i);
  }
  return sum % FALLBACK_PALETTE.length;
};

/** '/food', 'FOOD', ' 음식 ' 같은 값을 비교하기 좋게 다듬음 */
const normalize = (value: string): string =>
  value.trim().toLowerCase().replace(/^\//, '').replace(/-word$/, '');

/* ───────────── 카테고리를 백엔드에서 받아오기 ─────────────
 * 서버 응답이 오기 전에는 위 CATEGORIES 를 쓰고,
 * 응답이 오면 그걸로 갈아끼움. 실패하면 위 목록 그대로 사용.
 *
 * 보호자 앱에서 카테고리를 추가하면 색과 아이콘도 같이 정하는데,
 * 색은 그대로 받아 쓰고 아이콘은 이름(문자열)을 받아서 표에서 찾음.
 * ------------------------------------------------------ */

/** 서버가 준 카테고리 한 개를 화면에서 쓰는 모양으로 바꿈 */
const toCategoryInfo = (item: any): CategoryInfo | null => {
  // 서버가 key 를 뭐라고 부를지 몰라서 흔한 이름을 모두 확인
  const key = item?.key ?? item?.code ?? item?.categoryKey ?? item?.slug ?? '';
  const name = item?.name ?? item?.title ?? item?.categoryName ?? key;

  if (!key) return null;

  // 이미 아는 카테고리면 주소와 색을 그대로 씀
  const known = CATEGORY_BY_KEY[key];

  return {
    key,
    name,
    // 보호자 앱에서 정한 색
    color:
      item?.color ??
      item?.colorCode ??
      item?.bgColor ??
      known?.color ??
      FALLBACK_PALETTE[hashToIndex(key)],
    // 서버가 주소를 줄 리는 없으니 규칙으로 만듦
    href: known?.href ?? `/${key}`,
    // 보호자 앱에서 고른 아이콘 이름을 실제 아이콘으로 바꿈
    icon:
      findIcon(item?.icon ?? item?.iconName ?? item?.iconKey) ??
      known?.icon ??
      DEFAULT_ICON,
  };
};

/**
 * 카테고리 목록을 돌려줌.
 * layout.tsx 의 왼쪽 메뉴와 GridBox 의 카드 색이 이걸 씀.
 */
export function useCategories(): CategoryInfo[] {
  const [categories, setCategories] = useState<CategoryInfo[]>(CATEGORIES);

  useEffect(() => {
    // 목 모드면 서버를 안 부르고 기본 목록 사용
    if (USE_MOCK) return;

    const fetchCategories = async () => {
      try {
        const res = await apiClient.get(API_ENDPOINTS.CATEGORIES.BASE);

        // 응답 구조 방어 처리
        const raw = Array.isArray(res)
          ? res
          : (res as any)?.data ?? (res as any)?.result ?? [];

        const list = (raw as any[])
          .map(toCategoryInfo)
          .filter((item): item is CategoryInfo => item !== null);

        // 빈 배열이 오면 기본 목록을 그대로 둠 (메뉴가 사라지지 않게)
        if (list.length > 0) setCategories(list);
      } catch (error) {
        console.warn('카테고리 불러오기 실패, 기본 목록 사용:', error);
      }
    };

    void fetchCategories();
  }, []);

  return categories;
}

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

/** 주소나 이름으로 들어와도 데이터의 category 값(key)으로 바꿔줌 */
const toCategoryKey = (value: string): string => {
  const found =
    CATEGORY_BY_KEY[value] ??
    CATEGORY_BY_NAME[value] ??
    CATEGORY_BY_HREF[value] ??
    CATEGORY_BY_KEY[normalize(value)];

  return found ? found.key : normalize(value);
};

/** 카드 색
 *  1) 상징 자체에 색이 있으면 그 색
 *  2) 카테고리 색 (보호자 앱에서 정한 색이 여기로 들어옴)
 *  3) 둘 다 없으면 이름 기준 색
 *
 *  colorByKey 는 지금 화면이 쓰는 카테고리 목록에서 만든 표라서,
 *  보호자 앱에서 색을 바꾸면 카드 색도 같이 바뀜.
 */
const getColor = (item: any, colorByKey: Record<string, string>): string => {
  if (item?.color) return item.color;

  const raw = getCategoryName(item);
  if (!raw) return FALLBACK_PALETTE[0];

  const key = toCategoryKey(raw);
  if (colorByKey[key]) return colorByKey[key];

  return FALLBACK_PALETTE[hashToIndex(key)];
};

/* ───────────── 색 계산 ─────────────
 * 연한 색(#FFFBEC)에서 같은 계열의 진한 색을 만들어냄.
 * CSS 의 hsl(from ...) 문법은 브라우저가 못 읽으면 흰색이 되어버려서
 * 여기서 직접 계산함.
 * ------------------------------------ */

/** '#FFFBEC' → { h: 44, s: 100, l: 96 } */
const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
  const clean = hex.replace('#', '').trim();

  // 3자리(#FFF)도 6자리로 늘려서 처리
  const full =
    clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;

  if (full.length !== 6) return null;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  if ([r, g, b].some((v) => Number.isNaN(v))) return null;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (diff !== 0) {
    s = diff / (1 - Math.abs(2 * l - 1));

    if (max === r) h = ((g - b) / diff) % 6;
    else if (max === g) h = (b - r) / diff + 2;
    else h = (r - g) / diff + 4;

    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: s * 100, l: l * 100 };
};

/** 원래 색을 더 선명하고 어둡게 만듦 */
const toStrongColor = (hex: string, saturate = 4, darken = 22): string => {
  const hsl = hexToHsl(hex);

  // 색을 못 읽으면 원래 색 그대로 (흰색으로 튀지 않게)
  if (!hsl) return hex;

  const s = Math.min(100, hsl.s * saturate);
  const l = Math.max(0, hsl.l - darken);

  return `hsl(${Math.round(hsl.h)} ${Math.round(s)}% ${Math.round(l)}%)`;
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
        color
          ? ({
              // 평소 색
              '--card-color': color,
              // 골랐을 때 색 — 미리 계산해서 넘김
              '--card-active': toStrongColor(color),
              '--card-active-border': toStrongColor(color, 4, 30),
            } as React.CSSProperties)
          : undefined
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
 * import { SoundButton } from '../components/GridBox';
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
  /** 지금 보고 있는 카테고리. 안 넘기면 주소(/food)로 알아냄 */
  categoryName?: string;
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
  categoryName: categoryNameProp,
  onSelectWord,
  selectedWords,
  isSelectionFull,
  maxSelectCount = 8,
  gridSize: gridSizeProp,
}: GridBoxProps) {
  // 주소로도 카테고리를 알아낼 수 있게 함 (/food → food)
  const pathname = usePathname();

  // props 로 받은 게 있으면 그걸, 없으면 주소로 판단
  const categoryName = toCategoryKey(categoryNameProp ?? pathname ?? '');

  // 카테고리 목록(보호자 앱에서 정한 색 포함)으로 색 표를 만듦
  const categories = useCategories();
  const colorByKey = useMemo(
    () => Object.fromEntries(categories.map((item) => [item.key, item.color])),
    [categories]
  );

  const [symbols, setSymbols] = useState<SymbolCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
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
      (item: any) => toCategoryKey(getCategoryName(item)) === categoryName
    );

    // 카테고리 이름이 안 맞아서 하나도 안 걸리면 전체를 보여줌.
    // (백엔드 필드가 확정되기 전까지 화면이 비지 않게 하는 안전장치)
    return filtered.length > 0 ? filtered : symbols;
  }, [symbols, categoryName]);

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
        // 카드가 많으면 페이지를 넘기지 않고 이 안에서 아래로 스크롤됨
        <div className={styles.grid}>
          {symbolList.map((item: any, index: number) => {
            const wordText = getWordText(item);
            const color = getColor(item, colorByKey);
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
    </div>
  );
}