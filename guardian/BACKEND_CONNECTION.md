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
