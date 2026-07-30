# 말모아 프론트엔드

동석 담당 기능만 확인할 수 있도록 정리한 간소화 버전입니다.

## 포함 기능

- 로그인·회원가입·프로필
- 카테고리·저장 문장·즐겨찾기·최근 문장
- 격자 크기·스캔 속도·음성 설정
- 루틴 추천·AI 문장 추천·말투 변환
- Spring Boot API 전환 구조
- 로딩·오류·빈 상태 및 전역 사용자 상태

## 실행 방법

```bash
npm install
cp .env.example .env
npm run dev
```

기본값은 별도 서버 없이 실행되는 Mock API입니다.

- 이메일: `demo@malmoa.app`
- 비밀번호: `Malmoa!123`

## Spring Boot 연결

`.env`의 값만 변경하면 됩니다.

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCK_API=false
```
