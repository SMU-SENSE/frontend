/* ───────────── 태블릿 보드 (기기 토큰으로 불러오기) ─────────────
 * 코드/QR 로 기기를 연결하면 기기 토큰(accessToken)을 받음.
 * 그 토큰으로 GET /api/v1/device/board 를 부르면
 * 격자 크기 + 카테고리 + 카드를 한 번에 받을 수 있음.
 * (보호자 로그인 쿠키가 필요 없음 → 태블릿에서 바로 동작)
 *
 * 화면 코드(GridBox)는 원래 /symbols, /categories 모양을 쓰므로
 * 여기서 그 모양으로 바꿔서 넘겨줌.
 * ------------------------------------------------------------ */

import { apiClient } from '@/lib/apiClient';
import { storage } from '@/lib/storage';

const DEVICE_BOARD_URL = '/api/v1/device/board';
const DEVICE_CARD_USAGE_URL = '/api/v1/device/card-usage';

/* 백엔드 응답 타입 (BoardDtos, feature/sangbeom-google-login 기준) */

export interface BoardCategory {
  id: number;
  name: string;
  color: string | null;
  displayOrder: number;
}

export interface BoardCard {
  id: number;
  categoryId: number;
  text: string;
  displayText: string | null;
  imageUrl: string | null;
  ttsText: string | null;
  emergency: boolean;
  favorite: boolean;
  important: boolean;
  systemCard: boolean;
  displayOrder: number;
}

export interface DeviceBoard {
  aacUserId: number;
  version: number;
  gridSize: string | null; // 'GRID_3X3' 등
  status: string | null;
  categories: BoardCategory[];
  cards: BoardCard[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

/** 기기 연결(코드 입력)을 했는지 */
export const hasDeviceToken = (): boolean => Boolean(storage.getDeviceToken());

const authHeader = () => ({ Authorization: `Bearer ${storage.getDeviceToken() ?? ''}` });

/* 같은 화면에서 메뉴(layout)와 카드(GridBox)가 동시에 보드를 부르므로
 * 잠깐 동안은 한 번 받은 결과를 같이 씀 */
const CACHE_MS = 5_000;
let cached: { at: number; promise: Promise<DeviceBoard> } | null = null;

export const boardService = {
  getBoard: (options?: { force?: boolean }): Promise<DeviceBoard> => {
    const now = Date.now();
    if (!options?.force && cached && now - cached.at < CACHE_MS) {
      return cached.promise;
    }

    const promise = apiClient
      .get<ApiResponse<DeviceBoard>>(DEVICE_BOARD_URL, { headers: authHeader() })
      .then((res) => res.data.data);

    // 실패한 결과는 캐시에 남기지 않음
    promise.catch(() => {
      if (cached?.promise === promise) cached = null;
    });

    cached = { at: now, promise };
    return promise;
  },

  /** 카드를 말했을 때 사용 기록 남기기 (실패해도 화면엔 영향 없음) */
  logCardUsage: async (cardId: number, spokenText?: string): Promise<void> => {
    await apiClient.post(
      DEVICE_CARD_USAGE_URL,
      { cardId, action: 'SPEAK', spokenText },
      { headers: authHeader() }
    );
  },
};

/* ───────────── 화면용 모양으로 바꾸기 ───────────── */

/** 보호자가 정한 카테고리 이름 → 프론트 메뉴 주소(key)
 *  이미 있는 메뉴(음식, 사람 …)는 그 주소를 그대로 쓰고,
 *  보호자가 새로 만든 카테고리는 cat-번호 로 주소를 만듦 */
const NAME_TO_KEY: Record<string, string> = {
  긴급어: 'red',
  사람: 'person',
  음식: 'food',
  장소: 'time',
  신체: 'body',
  행동: 'action',
  감정: 'emotion',
  설명: 'description',
  대화: 'conversation',
  '인사·사회어': 'conversation',
  문법: 'grammar',
  어미: 'grammar',
  시간: 'clock',
};

export const boardCategoryKey = (category: BoardCategory): string =>
  NAME_TO_KEY[category.name?.trim()] ?? `cat-${category.id}`;

/** 메뉴용 카테고리 (GridBox 의 toCategoryInfo 가 읽는 모양) */
export const toMenuCategories = (board: DeviceBoard) =>
  [...(board.categories ?? [])]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((category) => ({
      key: boardCategoryKey(category),
      name: category.name,
      color: category.color ?? undefined,
      displayOrder: category.displayOrder,
    }));

/** 카드용 목록 (GridBox 가 /symbols 응답처럼 읽는 모양) */
export const toSymbolItems = (board: DeviceBoard) => {
  const categoryById = new Map(
    (board.categories ?? []).map((category) => [category.id, category])
  );

  return [...(board.cards ?? [])]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((card) => {
      const category = categoryById.get(card.categoryId);
      return {
        id: card.id,
        name: card.displayText ?? card.text,
        imageUrl: card.imageUrl,
        ttsText: card.ttsText,
        category: category ? boardCategoryKey(category) : '', // 프론트 메뉴 key
        categoryName: category?.name ?? '',
        color: category?.color ?? undefined, // 보호자가 정한 카테고리 색
        emergency: card.emergency,
        favorite: card.favorite,
        active: true,
      };
    });
};