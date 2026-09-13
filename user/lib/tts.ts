export interface TtsOptions {
  rate?: number;   // 발화 속도 (0.7 ~ 1.3)
  pitch?: number;  // 음 높낮이
  voiceType?: 'BOY' | 'GIRL' | string;
}

let lastSpokenText = '';
let lastOptions: TtsOptions | undefined;

export const tts = {
  // 텍스트 발화
  speak: (text: string, options?: TtsOptions): void => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('이 브라우저는 음성 합성을 지원하지 않습니다.');
      return;
    }

    // 직전 음성 즉시 중단
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;

    // 한국어 음성 매핑
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find((v) => v.lang.includes('ko'));
    if (koVoice) {
      utterance.voice = koVoice;
    }

    // 다시 듣기용 캐싱
    lastSpokenText = text;
    lastOptions = options;

    window.speechSynthesis.speak(utterance);
  },

  // 발화 중지
  stop: (): void => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
  },

  // 직전 문장 다시 듣기
  replay: (): void => {
    if (lastSpokenText) {
      tts.speak(lastSpokenText, lastOptions);
    }
  },
};