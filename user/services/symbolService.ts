import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/constants/apiEndpoint';

export interface Category {
  id: number;
  name: string;
  displayOrder: number;
}

export interface SymbolCard {
  id: number;
  name: string;
  imageUrl: string;
  isEmergency?: boolean;
  isQuick?: boolean;
  categoryId?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export const symbolService = {
  // 카테고리 목록
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>(
      API_ENDPOINTS.CATEGORIES.BASE
    );

    return res.data.data;
  },

  // 전체 상징 목록
  getSymbols: async (): Promise<SymbolCard[]> => {
    const res = await apiClient.get<ApiResponse<SymbolCard[]>>(
      API_ENDPOINTS.SYMBOLS.BASE
    );

    return res.data.data;
  },

  // 특정 상징
  getSymbolById: async (
    symbolId: number
  ): Promise<SymbolCard> => {
    const res = await apiClient.get<ApiResponse<SymbolCard>>(
      API_ENDPOINTS.SYMBOLS.BY_ID(symbolId)
    );

    return res.data.data;
  },

  // 즐겨찾기
  getFavorites: async (
    aacUserId: number
  ): Promise<SymbolCard[]> => {
    const res = await apiClient.get<ApiResponse<SymbolCard[]>>(
      API_ENDPOINTS.AAC_USERS.FAVORITES(aacUserId)
    );

    return res.data.data;
  },
};