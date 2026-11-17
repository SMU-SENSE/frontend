# 말모아 프론트엔드

AAC(보완대체의사소통) 서비스의 프론트엔드 간소화 버전입니다. 기존 Vite 프로젝트를 **Next.js App Router + TypeScript** 구조로 전환했습니다.

## 공식 배포 주소

- 보호자 웹사이트: [https://frontend-aac-0051.vercel.app](https://frontend-aac-0051.vercel.app/welcome)
- Railway 백엔드 API: https://malmoa-backend-production.up.railway.app
- `frontend-*.vercel.app` 형태의 고유 배포 주소는 테스트 및 배포별 확인용으로 사용합니다.
- 백엔드의 `FRONTEND_BASE_URL` 및 `FRONTEND_ALLOWED_ORIGINS`는 위 공식 웹사이트 주소와 일치해야 합니다.

Vercel 프로덕션에는 `NEXT_PUBLIC_API_BASE_URL=https://malmoa-backend-production.up.railway.app` 및 `NEXT_PUBLIC_USE_MOCK_API=false`를 설정합니다. Railway와 Vercel 대시보드의 실제 환경변수는 GitHub 문서를 수정해도 자동으로 변경되지 않습니다.

## 기술 스택

- Next.js App Router
- React + TypeScript
- TanStack Query
- Zustand
- React Hook Form + Zod

## 포함 기능

- 로그인·회원가입·프로필
- 카테고리·저장 문장·즐겨찾기·최근 문장
- 격자 크기·스캔 속도·음성 설정
- 루틴 추천·AI 문장 추천·말투 변환
- Spring Boot API 전환 구조
- 로딩·오류·빈 상태 및 전역 사용자 상태

## 실행 방법

```bash
cd guardian
npm install
cp .env.example .env.local
npm run dev
```

기본 개발 주소는 `http://localhost:3000`입니다.

기본값은 별도 서버 없이 실행되는 Mock API입니다.

- 이메일: `demo@malmoa.app`
- 비밀번호: `Malmoa!123`

## Spring Boot 연결

`.env.local`을 아래처럼 변경합니다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_USE_MOCK_API=false
```

환경변수를 바꾼 뒤 개발 서버를 다시 실행해야 합니다.

## 주요 폴더

```text
src/app/          Next.js 라우트와 공통 레이아웃
src/pages/        실제 화면 컴포넌트
src/components/   공통 UI와 레이아웃
src/api/          Mock/Spring Boot API 연결
src/stores/       Zustand 전역 상태
src/styles/       전역 스타일
```
