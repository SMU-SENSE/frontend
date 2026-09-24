import type { BackendVoiceType } from '../types/models'

/**
 * Web Speech voices are installed by the OS/browser. A Korean child voice may
 * not exist; in that case pitch is only a best-effort approximation.
 */
export function speakKorean(text: string, voiceType: BackendVoiceType, speechRate: number): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  const synthesis = window.speechSynthesis
  synthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  utterance.rate = Number.isFinite(speechRate) ? Math.max(0.7, Math.min(1.3, speechRate)) : 1
  utterance.pitch = voiceType === 'CHILD_FEMALE' ? 1.45
    : voiceType === 'CHILD_MALE' ? 1.18
    : voiceType === 'ADULT_FEMALE' ? 1.05 : 0.82

  const voices = synthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('ko'))
  const isFemale = (name: string) => /female|여성|yuna|sora|sunhi|heami/i.test(name)
  const isMale = (name: string) => !isFemale(name) && /male|남성|injoon/i.test(name)
  const requestedFemale = voiceType === 'CHILD_FEMALE' || voiceType === 'ADULT_FEMALE'
  const preferred = voices.find((voice) => requestedFemale ? isFemale(voice.name) : isMale(voice.name))
  // Prefer a known-gender voice; if unavailable, keep Korean pronunciation.
  if (preferred ?? voices[0]) utterance.voice = preferred ?? voices[0]
  synthesis.speak(utterance)
  return true
}
