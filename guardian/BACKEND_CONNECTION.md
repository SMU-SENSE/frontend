# Guardian frontend ↔ Spring backend

## Local run

Backend: `SMU-SENSE/backend` branch `feature/sangbeom-google-login`

Frontend env:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_USE_MOCK_API=false
```

## Connected flow

1. `GET /oauth2/authorization/google`
2. backend redirects to `/oauth/callback`
3. `GET /api/v1/auth/me`
4. `POST /api/v1/auth/onboarding`
5. `POST /api/v1/me/aac-users`
6. `PATCH /api/v1/me/aac-users/{userId}/onboarding/grid`
7. `PATCH /api/v1/me/aac-users/{userId}/voice-settings`
8. `GET /api/v1/me/aac-users/{userId}/onboarding-summary`
9. `POST /api/v1/me/aac-users/{userId}/onboarding/confirm`

The real backend uses the `JSESSIONID` session cookie and CSRF token. The shared API client sends `credentials: include` and automatically obtains/attaches the CSRF header for mutating requests.

Email/Kakao authentication screens are still prototype-only because the current backend branch implements Google OAuth.


## Deployed-environment API smoke checks (2026-11-11)

- Guardian frontend: `https://frontend-pied-five-90.vercel.app`
- Spring API origin reported by the team: `https://malmoa-backend-production.up.railway.app`
- Health response was observed as `success: true, data.status: "UP"`. This confirms server responsiveness only; it does **not** verify Google OAuth, DB writes, cookies, or end-to-end API operations.

Vercel Production environment:

```env
NEXT_PUBLIC_API_BASE_URL=https://malmoa-backend-production.up.railway.app
NEXT_PUBLIC_USE_MOCK_API=false
```

Spring deployment environment:

```env
FRONTEND_BASE_URL=https://frontend-pied-five-90.vercel.app
SESSION_COOKIE_SECURE=true
```

Never commit `GOOGLE_CLIENT_SECRET`, passwords, session cookies or access tokens.

### End-to-end verification matrix

The following calls are implemented in `guardian/src/api`; **success in the deployed environment must still be checked manually with an authenticated test account**.

| UI operation | Backend route | Expected outcome |
| --- | --- | --- |
| Google login and account | `/oauth2/authorization/google`, `GET /api/v1/auth/me` | After redirect, authenticated /me returns 200 |
| Guardian setup | `POST /api/v1/auth/onboarding` | Legal consent and guardian role persisted |
| AAC user setup | `POST /api/v1/me/aac-users`, grid/voice/confirm endpoints | Reload retains settings |
| Board management | `GET /api/v1/me/aac-users/{id}/board`; category/card CRUD, favorite | Data persists and boardVersion advances |
| Device connection | `POST /api/v1/me/aac-users/{id}/device-pairings`; GET current; GET devices | Claim from AAC device appears in guardian devices |
| Routine | `/api/v1/me/aac-users/{id}/routines` | Add, toggle and disable persist |
| Places and location | `/places`, `/locations/latest` | Places persist; GPS requires user device telemetry |
| Reports | `/report`, `/report/pdf` | Genuine usage data and PDF |
| Alerts | `/alerts`, `/alerts/{alertId}/acknowledge` | Real alerts can be acknowledged |
| Communication profile | `/communication-profile` | Preferences persist |
| Tutorial | `/api/v1/me/tutorial`, `/complete` | Completion persists |
| Personalized AI | `/ai/context`, `/ai/recommendations` | Context works; recommendations require a configured LLM provider |

### Backend dependencies / gaps (not solved in the guardian frontend)

1. **Session cookies across Vercel/Railway**: Spring currently has `server.servlet.session.cookie.same-site: lax`. Cross-site XHR credential delivery must be validated. Consider serving API and frontend from same-site custom subdomains, or a carefully audited `SameSite=None; Secure` deployment with CSRF/CORS protections and browser third-party cookie limitations.
2. **Google OAuth**: Configure valid `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and the Railway `/login/oauth2/code/google` redirect URI. A previously observed Google `401 invalid_client` needs independent confirmation of resolution.
3. **AI provider**: `AacSentenceRecommendationService` returns 503 if no implementation of `AacSentenceRecommendationProvider` is configured; frontend cannot fix server-side inference.
4. **AAC device client**: Jian's `user/` app still needs device token claim, `/api/v1/device/board`, `/card-usage`, and SSE wired to its screens. Guardian cards are not automatically validated against that app.
5. **Uploaded image authorization**: Guardian backend-upload URLs are normalized to the API origin for previews. Image GET currently requires guardian authentication; device-token access, durable storage, and cross-site cookie behavior need backend design/testing. The frontend path fix alone does not guarantee images display on AAC devices.
6. **Advanced routine planner**: Completion/postponement/decline/help events and school-holiday exceptions are beyond the current routine CRUD backend contract.

Do not claim full production integration until these end-to-end checks pass.
