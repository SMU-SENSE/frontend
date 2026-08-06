import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { words } = await req.json();

    if (!words || words.length === 0) {
      return NextResponse.json({ error: '단어가 없습니다.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const prompt = `다음 단어들을 조합해서, 의사소통 장애가 있는 사람이 일상생활에서 자연스럽게 쓸 수 있는 하나의 완성된 한국어 문장으로 만들어줘. 결과 문장만 딱 말해줘: ${words.join(', ')}`;

    // 최신 Gemini 모델(gemini-3.6-flash) 적용
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey, // 최신 인증 헤더 방식
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.candidates || data.candidates.length === 0) {
      console.error('Gemini API 응답 오류:', data);
      return NextResponse.json({ error: data.error?.message || 'AI 응답을 받아오지 못했습니다.' }, { status: 500 });
    }

    const aiSentence = data.candidates[0].content.parts[0].text.trim();

    return NextResponse.json({ sentence: aiSentence });

  } catch (error) {
    console.error('서버 에러 발생:', error);
    return NextResponse.json({ error: 'AI 문장 생성 실패' }, { status: 500 });
  }
}