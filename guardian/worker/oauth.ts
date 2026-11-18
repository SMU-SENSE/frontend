import type { Hono } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import {
  accountResponse, assertCsrf, baseUrl, clearCookie, cookieValue, FLOW_COOKIE,
  getSession, HttpError, jsonBody, ok, randomToken, requireSession,
  secureCookie, SESSION_COOKIE, SESSION_DURATION, sha256, pkceChallenge,
  type AccountRow, type Env,
} from './common'

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))
const kakaoJwks = createRemoteJWKSet(new URL('https://kauth.kakao.com/.well-known/jwks.json'))

type Provider = 'google' | 'kakao'
type OAuthFlow = {
  flow_hash: string
  provider: Provider
  nonce: string
  code_verifier: string | null
  expires_at: number
}

function providerConfig(env: Env, provider: Provider) {
  if (provider === 'google') {
    return {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token',
      scope: 'openid email profile',
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      jwks: googleJwks,
    }
  }
  return {
    clientId: env.KAKAO_REST_API_KEY,
    clientSecret: env.KAKAO_CLIENT_SECRET,
    authorize: 'https://kauth.kakao.com/oauth/authorize',
    token: 'https://kauth.kakao.com/oauth/token',
    scope: 'openid',
    issuer: 'https://kauth.kakao.com',
    jwks: kakaoJwks,
  }
}

function validProvider(value: string): Provider {
  if (value === 'google' || value === 'kakao') return value
  throw new HttpError(404, '지원하지 않는 로그인 방식입니다.', 'NOT_FOUND')
}

export function registerOAuth(app: Hono<{ Bindings: Env }>) {
  app.get('/oauth2/authorization/:provider', async c => {
    const provider = validProvider(c.req.param('provider'))
    const cfg = providerConfig(c.env, provider)
    if (!cfg.clientId || (provider === 'google' && !cfg.clientSecret)) {
      throw new HttpError(503, `${provider} OAuth 설정이 아직 완료되지 않았어요.`, 'OAUTH_NOT_CONFIGURED')
    }
    const base = baseUrl(c)
    const redirectUri = `${base}/login/oauth2/code/${provider}`
    const state = randomToken()
    const nonce = randomToken()
    const verifier = provider === 'google' ? randomToken() : null
    await c.env.DB.prepare(
      'INSERT INTO oauth_flows(flow_hash, provider, nonce, code_verifier, expires_at) VALUES(?,?,?,?,?)',
    ).bind(await sha256(state), provider, nonce, verifier, Date.now() + 5 * 60_000).run()
    secureCookie(c, FLOW_COOKIE, state, 300)
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: cfg.clientId,
      redirect_uri: redirectUri,
      scope: cfg.scope,
      state,
      nonce,
    })
    if (verifier) {
      params.set('code_challenge', await pkceChallenge(verifier))
      params.set('code_challenge_method', 'S256')
    }
    return c.redirect(`${cfg.authorize}?${params.toString()}`, 302)
  })

  app.get('/login/oauth2/code/:provider', async c => {
    const provider = validProvider(c.req.param('provider'))
    const base = baseUrl(c)
    const uri = new URL(c.req.url)
    const code = uri.searchParams.get('code')
    const state = uri.searchParams.get('state')
    const flowCookie = cookieValue(c, FLOW_COOKIE)
    clearCookie(c, FLOW_COOKIE)
    if (!code || !state || !flowCookie || state !== flowCookie) {
      return c.redirect(`${base}/welcome?error=oauth_failed`, 302)
    }
    const flow = await c.env.DB.prepare('DELETE FROM oauth_flows WHERE flow_hash=? RETURNING *')
      .bind(await sha256(state)).first<OAuthFlow>()
    if (!flow || flow.provider !== provider || flow.expires_at < Date.now()) {
      return c.redirect(`${base}/welcome?error=oauth_failed`, 302)
    }
    const cfg = providerConfig(c.env, provider)
    if (!cfg.clientId) throw new HttpError(503, '소셜 로그인 설정이 필요해요.', 'OAUTH_NOT_CONFIGURED')
    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: cfg.clientId,
      redirect_uri: `${base}/login/oauth2/code/${provider}`,
    })
    if (cfg.clientSecret) form.set('client_secret', cfg.clientSecret)
    if (flow.code_verifier) form.set('code_verifier', flow.code_verifier)
    const tokenResponse = await fetch(cfg.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })
    if (!tokenResponse.ok) {
      console.error(JSON.stringify({ event: 'oauth_token_exchange_failed', provider, status: tokenResponse.status }))
      return c.redirect(`${base}/welcome?error=oauth_failed`, 302)
    }
    const tokens = (await tokenResponse.json()) as { id_token?: string }
    if (!tokens.id_token) {
      console.error(JSON.stringify({ event: 'missing_oidc_id_token', provider }))
      return c.redirect(`${base}/welcome?error=oauth_failed`, 302)
    }
    let claims
    try {
      const verified = await jwtVerify(tokens.id_token, cfg.jwks, {
        issuer: cfg.issuer,
        audience: cfg.clientId,
      })
      claims = verified.payload
      if (claims.nonce !== flow.nonce) throw new Error('OIDC nonce mismatch')
      if (provider === 'google' && claims.email_verified !== true) throw new Error('Unverified Google email')
    } catch {
      console.error(JSON.stringify({ event: 'oidc_identity_verification_failed', provider }))
      return c.redirect(`${base}/welcome?error=oauth_failed`, 302)
    }
    const subject = claims.sub
    if (!subject || subject.length > 255) throw new HttpError(401, '로그인 정보가 올바르지 않아요.')
    const email = typeof claims.email === 'string' && claims.email.length <= 190
      ? claims.email
      : `${provider}-${subject}@login.invalid`
    const name = typeof claims.name === 'string'
      ? claims.name.slice(0, 80)
      : typeof claims.nickname === 'string'
        ? claims.nickname.slice(0, 80)
        : provider === 'kakao' ? '카카오 사용자' : '구글 사용자'
    const picture = typeof claims.picture === 'string' ? claims.picture.slice(0, 500) : null
    const linked = await c.env.DB.prepare(
      'SELECT account_id FROM oauth_accounts WHERE provider=? AND provider_subject=?',
    ).bind(provider.toUpperCase(), subject).first<{ account_id: number }>()
    let accountId = linked?.account_id
    if (!accountId) {
      const created = await c.env.DB.prepare(
        'INSERT INTO accounts(email, name, profile_image_url) VALUES(?,?,?)',
      ).bind(email, name, picture).run()
      accountId = Number(created.meta.last_row_id)
      await c.env.DB.prepare(
        'INSERT INTO oauth_accounts(account_id, provider, provider_subject, provider_email) VALUES(?,?,?,?)',
      ).bind(accountId, provider.toUpperCase(), subject, email).run()
    } else {
      await c.env.DB.prepare(
        'UPDATE accounts SET name=?, profile_image_url=?, updated_at=datetime(\'now\') WHERE id=?',
      ).bind(name, picture, accountId).run()
    }
    const session = randomToken()
    await c.env.DB.prepare(
      'INSERT INTO sessions(token_hash, account_id, csrf_token, expires_at) VALUES(?,?,?,?)',
    ).bind(await sha256(session), accountId, randomToken(), Date.now() + SESSION_DURATION * 1000).run()
    secureCookie(c, SESSION_COOKIE, session, SESSION_DURATION)
    return c.redirect(`${base}/oauth/callback?login=success`, 302)
  })

  app.get('/api/v1/auth/provider-status', c => ok(c, {
    google: !!(c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET),
    kakao: !!c.env.KAKAO_REST_API_KEY,
    configuredBaseUrl: !!c.env.PUBLIC_BASE_URL,
  }))
  app.get('/api/v1/auth/csrf', async c => {
    const session = await requireSession(c)
    return ok(c, { headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: session.csrf_token })
  })
  app.get('/api/v1/auth/me', async c => ok(c, accountResponse(await requireSession(c))))
  app.post('/api/v1/auth/onboarding', async c => {
    const session = await requireSession(c)
    await assertCsrf(c, session)
    const input = await jsonBody<{ accountType?: string; phoneNumber?: string; marketingAgreed?: boolean }>(c)
    if (input.accountType !== 'GUARDIAN') throw new HttpError(400, '보호자 계정만 지원합니다.')
    await c.env.DB.prepare(
      'UPDATE accounts SET account_type=?, onboarding_completed=1, phone_number=?, marketing_agreed=?, updated_at=datetime(\'now\') WHERE id=?',
    ).bind('GUARDIAN', input.phoneNumber ?? null, input.marketingAgreed ? 1 : 0, session.account_id).run()
    const updated = await c.env.DB.prepare('SELECT * FROM accounts WHERE id=?')
      .bind(session.account_id).first<AccountRow>()
    return ok(c, accountResponse(updated!))
  })
  app.post('/api/v1/auth/logout', async c => {
    const session = await getSession(c)
    if (session) await assertCsrf(c, session)
    const token = cookieValue(c, SESSION_COOKIE)
    if (token) await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash=?')
      .bind(await sha256(token)).run()
    clearCookie(c, SESSION_COOKIE)
    return c.body(null, 204)
  })
  app.delete('/api/v1/auth/me', async c => {
    const session = await requireSession(c)
    await assertCsrf(c, session)
    await c.env.DB.prepare('DELETE FROM accounts WHERE id=?').bind(session.account_id).run()
    clearCookie(c, SESSION_COOKIE)
    return c.body(null, 204)
  })
}
