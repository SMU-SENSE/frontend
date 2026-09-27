import type { BackendVoiceType } from '../types/models'

type VoiceProfile = {
  pitch: number
  rateScale: number
  gender: 'female' | 'male'
  variant: 'child' | 'adult'
}

const PROFILES: Record<BackendVoiceType, VoiceProfile> = {
  CHILD_FEMALE: { pitch: 1.65, rateScale: 1.03, gender: 'female', variant: 'child' },
  CHILD_MALE: { pitch: 1.28, rateScale: 1, gender: 'male', variant: 'child' },
  ADULT_FEMALE: { pitch: 1.02, rateScale: 0.98, gender: 'female', variant: 'adult' },
  ADULT_MALE: { pitch: 0.72, rateScale: 0.95, gender: 'male', variant: 'adult' },
}

let speechGeneration = 0

const clampRate = (value: number) =>
  Number.isFinite(value) ? Math.max(0.7, Math.min(1.3, value)) : 1

const femalePattern = /female|여성|sun\s?hi|heami|yuna|sora|seoyeon|jiwoo|jimin/i
const malePattern = /male|남성|in\s?joon|minsu|hyunsu/i
const naturalPattern = /natural|online|neural/i

function koreanVoices(synthesis: SpeechSynthesis) {
  return synthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('ko'))
}

function genderMatches(voice: SpeechSynthesisVoice, gender: VoiceProfile['gender']) {
  if (gender === 'female') return femalePattern.test(voice.name)
  return malePattern.test(voice.name) && !femalePattern.test(voice.name)
}

function chooseVoice(
  voices: SpeechSynthesisVoice[],
  profile: VoiceProfile,
): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined

  const genderVoices = voices.filter((voice) => genderMatches(voice, profile.gender))
  const candidates = genderVoices.length ? genderVoices : voices

  // Prefer higher quality online/natural voices when the browser exposes them.
  const ordered = [...candidates].sort((a, b) => {
    const quality = Number(naturalPattern.test(b.name)) - Number(naturalPattern.test(a.name))
    if (quality) return quality
    return Number(b.localService) - Number(a.localService)
  })

  // If more than one voice exists for the requested gender, use a different
  // base voice for child/adult profiles instead of always collapsing to index 0.
  if (ordered.length > 1 && profile.variant === 'adult') return ordered[1]
  return ordered[0]
}

/**
 * Speak Korean using the browser/OS Web Speech voices.
 *
 * The available base voices are controlled by the user's browser and OS.
 * When only one Korean base voice exists, the four product choices still use
 * clearly separated pitch profiles. A short restart delay after cancel() avoids
 * Chromium/SAPI reusing the previous utterance settings when voice/rate changes
 * are previewed repeatedly.
 */
export function speakKorean(text: string, voiceType: BackendVoiceType, speechRate: number): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false

  const synthesis = window.speechSynthesis
  const profile = PROFILES[voiceType] ?? PROFILES.CHILD_MALE
  const configuredRate = clampRate(speechRate)
  const utterance = new SpeechSynthesisUtterance(text)

  utterance.lang = 'ko-KR'
  // Keep the user-selected speed as the primary factor. The small profile
  // scale only helps distinguish child/adult timbre when one base voice exists.
  utterance.rate = Math.max(0.6, Math.min(1.5, configuredRate * profile.rateScale))
  utterance.pitch = profile.pitch

  const selectedVoice = chooseVoice(koreanVoices(synthesis), profile)
  if (selectedVoice) utterance.voice = selectedVoice

  const generation = ++speechGeneration
  synthesis.cancel()

  // Some Chromium + Windows SAPI combinations need a short turn after cancel()
  // before changed rate/pitch/voice values are honored reliably.
  window.setTimeout(() => {
    if (generation !== speechGeneration) return
    synthesis.resume()
    synthesis.speak(utterance)
  }, 40)

  return true
}
