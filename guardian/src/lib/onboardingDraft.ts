import type { RelationshipType } from '../types/models'

export type GridSize = '2x2' | '3x3' | '4x4'
export type VoiceType = 'male-child' | 'female-child'

export interface GuardianOnboardingDraft {
  guardianName?: string
  guardianEmail?: string
  userId?: number
  userName?: string
  birthDate?: string
  relation?: string
  relationshipType?: RelationshipType
  relationshipDetail?: string
  emergencyPhone?: string
  notes?: string
  profileImageDataUrl?: string
  gridSize?: GridSize
  voiceType?: VoiceType
  speechRate?: number
}

const DRAFT_KEY = 'malmoa-guardian-onboarding-draft'

export function loadOnboardingDraft(): GuardianOnboardingDraft {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as GuardianOnboardingDraft) : {}
  } catch {
    return {}
  }
}

export function saveOnboardingDraft(patch: Partial<GuardianOnboardingDraft>) {
  if (typeof window === 'undefined') return
  const next = { ...loadOnboardingDraft(), ...patch }
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
}

export function clearOnboardingDraft() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(DRAFT_KEY)
}
