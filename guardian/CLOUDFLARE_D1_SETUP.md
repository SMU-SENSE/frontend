# 말모아 독립 Cloudflare Workers + D1 실험 서버

## 무엇을 복제했나

- 원본: `SMU-SENSE/frontend`의 `feature/dongseok` 브랜치, `guardian/` 디렉터리.
- 원본 Next.js 42개 페이지의 컴포넌트와 CSS를 그대로 사용한다.
- 원본 API 주소를 새 Worker와 동일한 도메인의 상대경로(`/api/v1/*`)로 바꿔서 iPhone Safari와 Chrome에서도 세션 쿠키가 **제3자 쿠키**가 되지 않도록 했다.
- 백엔드는 새 Cloudflare Worker(Hono)로 재구현했고, 새 D1 데이터베이스를 바인딩했다.
- 기존 Railway/PostgreSQL, Vercel 배포, 기존 서비스 이용자 데이터는 **건드리지 않는다**. 새 계정과 데이터로 시작한다.

## 새 서버 주소

`https://malmoa-mobile-independent.kds10111.workers.dev`

현재 계정에 Worker 코드 및 정적 페이지를 배포해야 실제 접속할 수 있다. `PUBLIC_BASE_URL` 값은 `cloudflare.config.ts`에 위 주소로 설정했다.

## 배포

```bash
cd guardian
npm ci
npm run build:edge
npx cf auth login
npx cf deploy --prebuilt
```

`cf auth login`은 터미널에 표시된 최신 코드와 웹페이지 코드가 일치해야 한다. 인증 코드는 몇 분 후 만료되므로 이전 URL/코드를 재사용하지 않는다. 이미 계정과 새 D1을 연결했으면 이 단계를 재차 실행할 필요는 없다.

D1 스키마는 `migrations/0001_malmoa_d1.sql`, `migrations/0002_device_media.sql`이며 새 D1 `malmoa-mobile-independent`에 이미 적용했다. 다른 D1에 적용하지 말 것.

## Google OAuth 설정 (사용자가 관리)

1. Google Cloud Console → API 및 서비스 → 사용자 인증 정보 → **OAuth 2.0 클라이언트 ID**.
2. 애플리케이션 유형을 **웹 애플리케이션**으로 선택하고, 승인된 JavaScript 원본에 다음 주소를 입력:
   `https://malmoa-mobile-independent.kds10111.workers.dev`
3. 승인된 리디렉션 URI에 **정확히** 다음을 입력:
   `https://malmoa-mobile-independent.kds10111.workers.dev/login/oauth2/code/google`
4. OAuth 동의 화면에서 `openid`, `email`, `profile` 범위를 활성화하고, 테스트 상태라면 테스트 계정을 등록한다.
5. Cloudflare Dashboard → Workers & Pages → `malmoa-mobile-independent` → Settings → Variables and Secrets:
   - `GOOGLE_CLIENT_ID` → Client ID
   - `GOOGLE_CLIENT_SECRET` → Client Secret (**Secret**으로 저장)

## Kakao OAuth 설정 (사용자가 관리)

1. Kakao Developers → 내 애플리케이션에서 카카오 로그인과 **OpenID Connect**를 활성화한다.
2. Redirect URI에 정확히 다음을 등록:
   `https://malmoa-mobile-independent.kds10111.workers.dev/login/oauth2/code/kakao`
3. 동의항목에서 필요한 닉네임·이메일을 설정한다. 테스트/운영 설정에 따라 앱 접근 권한을 확인한다.
4. Cloudflare Dashboard의 Variables and Secrets에 다음을 추가:
   - `KAKAO_REST_API_KEY` → **REST API 키** (JavaScript 키 아님)
   - `KAKAO_CLIENT_SECRET` → Client Secret을 켰을 때만 추가 (Secret 저장)

코드나 GitHub에 Client Secret을 올리지 않는다. Cloudflare에 이미 설정한 비밀값은 수정/삭제 없이 배포한다.

## 동작 방식과 테스트

1. 새 주소의 `/welcome`에서 Google 또는 Kakao 버튼 클릭.
2. 소셜 로그인 → **같은 Worker 도메인** `/login/oauth2/code/<provider>`로 콜백.
3. D1에 로그인 계정/세션을 만들고 HTTP-only, Secure, SameSite=Lax `__Host-malmoa_session` 쿠키 발급.
4. `/oauth/callback?login=success`에서 `/api/v1/auth/me` 호출.
5. 사용자 온보딩 후 AAC 사용자 추가 및 초대 코드 발급·기기 연결 테스트.

배포 후 확인할 기본 엔드포인트:

- `GET /api/v1/health`: 서버 상태.
- `GET /api/v1/auth/provider-status`: Google/Kakao 키의 **등록 유무만** 확인.
- `GET /api/v1/auth/me`: 로그인 전 401, 정상 로그인 후 계정 반환.

## 기존 백엔드와의 차이 (중요)

이 환경은 **독립 실험 서버**이며, UI 디자인은 그대로지만 기존 Spring Boot의 모든 비즈니스 기능을 1:1 이식한 최종 버전은 아니다. 현재는 소셜 로그인/가입/온보딩, 카드·분류 관리, 기기 초대 코드와 QR 연결, 일부 위치/센서 기록, 간단한 루틴·장소·알림·통계를 지원한다.

- 초대 코드는 D1에 저장되므로 외부 네트워크와 다른 장소의 기기도 연결 요청을 보낼 수 있다.
- 실시간 이벤트 전송은 부분 지원이며 SSE는 아직 실제 변경 사항을 실시간으로 방송하지 않는다.
- OpenAI 등 AI 제공자 연동은 없고, 추천 기능은 입력 텍스트를 반환하는 임시 동작이다.
- 보고서 PDF, 푸시 알림, 음성인식(STT), 사용 중인 기존 계정/데이터 자동 이관은 구현하지 않았다.
- 이미지 파일은 D1에 900KB 이하 PNG/JPEG/WebP만 저장한다.
- 보호가 필요한 실제 사용자의 긴급 알림·위치 추적 서비스로 운영하기 전에 반드시 전체 기능/보안/장애대응 검증을 거쳐야 한다.

## 문제 확인

휴대폰에서 `로그인 정보를 확인하는 중입니다` 후 `로그인이 필요합니다`가 뜬다면 이 서버에서는 `GET /api/v1/auth/me`의 HTTP 상태, 쿠키 저장 유무, OAuth 리디렉션 URL, `/api/v1/auth/provider-status`를 먼저 확인한다. 기존과 달리 브라우저↔Worker 사이에서 사이트를 가로지르는 쿠키가 없어야 한다.
