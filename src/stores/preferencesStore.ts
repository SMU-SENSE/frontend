import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserPreferences } from '../types/models'

interface PreferencesState extends UserPreferences {
  setPreferences: (preferences: UserPreferences) => void
  patchPreferences: (preferences: Partial<UserPreferences>) => void
  reset: () => void
}

export const defaultPreferences: UserPreferences = {
  gridColumns: 4,
  scanSpeedMs: 1200,
  voiceId: 'ko-KR-default',
  voiceRate: 1,
  voicePitch: 1,
  autoSpeak: true,
}

/**
 * 자동 스캔/TTS 화면이 서버 재요청 없이 즉시 설정을 읽을 수 있게 하는 클라이언트 캐시.
 * 설정 화면의 저장 성공 시 서버 응답으로 이 Store를 갱신한다.
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      setPreferences: (preferences) => set(preferences),
      patchPreferences: (preferences) => set(preferences),
      reset: () => set(defaultPreferences),
    }),
    {
      name: 'malmoa-preferences',
      // persist에 액션 함수가 섞이지 않도록 순수 설정 값만 남긴다.
      partialize: ({ setPreferences: _set, patchPreferences: _patch, reset: _reset, ...state }) =>
        state,
    },
  ),
)
