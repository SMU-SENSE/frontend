import type { D1Database } from '@cloudflare/workers-types'
import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

export interface Env {
  DB: D1Database
  ASSETS: { fetch(request: Request): Promise<Response> }
  PUBLIC_BASE_URL?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  KAKAO_REST_API_KEY?: string
  KAKAO_CLIENT_SECRET?: string
}
export interface AccountRow {
  id: number
  email: string
  name: string
  profile_image_url: string | null
  account_type: string | null
  onboarding_completed: number
  status: string
}
export interface SessionRow {
  account_id: number
  csrf_token: string
  expires_at: number
}
export type AppContext = Context<{ Bindings: Env }>
export const SESSION_COOKIE = '__Host-malmoa_session'
export const FLOW_COOKIE = '__Host-malmoa_oauth_flow'
export const SESSION_DURATION = 60 * 60 * 24 * 7

export function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(data, b => b.toString(16).padStart(2, '0')).join('')
}
export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}
export async function pkceChallenge(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  const bytes = new Uint8Array(digest)
  let str = ''
  for (const byte of bytes) str += String.fromCharCode(byte)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
export function secureCookie(c: AppContext, key: string, value: string, maxAge: number) {
  setCookie(c, key, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge,
  })
}
export function clearCookie(c: AppContext, key: string) {
  deleteCookie(c, key, { path: '/', secure: true })
}
export function cookieValue(c: AppContext, key: string) {
  return getCookie(c, key) ?? ''
}
export function baseUrl(c: AppContext) {
  const configured = c.env.PUBLIC_BASE_URL?.trim().replace(/\/$/, '')
  if (!configured || !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(configured)) {
    throw new HttpError(503, 'PUBLIC_BASE_URL을 HTTPS 주소로 설정해야 해요.', 'SERVER_NOT_CONFIGURED')
  }
  return configured
}
export class HttpError extends Error {
  constructor(public status: number, message: string, public code = 'API_ERROR') {
    super(message)
  }
}
export function ok(c: AppContext, data: unknown, status: 200 | 201 = 200) {
  return c.json({ success: true, data, message: null }, status)
}
export function error(c: AppContext, status: number, message: string, code: string) {
  return c.json({ success: false, code, message }, status as 400)
}
export async function jsonBody<T = Record<string, unknown>>(c: AppContext): Promise<T> {
  try {
    return await c.req.json<T>()
  } catch {
    throw new HttpError(400, '올바른 JSON 요청이 아니에요.', 'INVALID_JSON')
  }
}
export async function getSession(c: AppContext) {
  const token = cookieValue(c, SESSION_COOKIE)
  if (!token) return null
  const hash = await sha256(token)
  return c.env.DB.prepare(
    'SELECT s.account_id, s.csrf_token, s.expires_at, a.id, a.email, a.name, a.profile_image_url, a.account_type, a.onboarding_completed, a.status FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>? AND a.status=?',
  ).bind(hash, Date.now(), 'ACTIVE').first<SessionRow & AccountRow>()
}
export async function requireSession(c: AppContext) {
  const row = await getSession(c)
  if (!row) throw new HttpError(401, '로그인이 필요합니다.', 'UNAUTHORIZED')
  return row
}
export function accountResponse(a: AccountRow) {
  return {
    accountId: a.id,
    email: a.email,
    name: a.name,
    profileImageUrl: a.profile_image_url,
    accountType: a.account_type,
    onboardingCompleted: !!a.onboarding_completed,
    status: a.status,
  }
}
export async function assertCsrf(c: AppContext, session: SessionRow) {
  const header = c.req.header('X-CSRF-TOKEN')
  if (!header || header.length !== session.csrf_token.length) {
    throw new HttpError(403, 'CSRF 토큰이 유효하지 않아요.', 'CSRF_INVALID')
  }
  let unequal = 0
  for (let i = 0; i < header.length; i++) unequal |= header.charCodeAt(i) ^ session.csrf_token.charCodeAt(i)
  if (unequal !== 0) throw new HttpError(403, 'CSRF 토큰이 유효하지 않아요.', 'CSRF_INVALID')
  const origin = c.req.header('Origin')
  if (origin && origin !== new URL(c.req.url).origin) {
    throw new HttpError(403, '허용되지 않은 요청 출처입니다.', 'ORIGIN_MISMATCH')
  }
}
export async function userOwned(c: AppContext, userId: number, accountId: number) {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new HttpError(400, '사용자 번호가 올바르지 않아요.')
  const user = await c.env.DB.prepare('SELECT * FROM aac_users WHERE id=? AND owner_account_id=?')
    .bind(userId, accountId).first<Record<string, unknown>>()
  if (!user) throw new HttpError(404, '사용자를 찾을 수 없어요.', 'NOT_FOUND')
  return user
}
export function userResponse(u: Record<string, unknown>) {
  return {
    id: u.id,
    name: u.name,
    mode: u.mode,
    gridSize: u.grid_size,
    active: !!u.active,
    birthDate: u.birth_date,
    emergencyContact: u.emergency_contact,
    notes: u.notes,
    profileImageUrl: u.profile_image_url,
    voiceType: u.voice_type,
    speechRate: u.speech_rate,
    setupStep: u.setup_step,
    sentenceLevel: u.sentence_level,
    maxRecommendedSentenceWords: u.max_recommended_sentence_words,
    easyWordsPreferred: !!u.easy_words_preferred,
    abstractExpressionsRestricted: !!u.abstract_expressions_restricted,
    complexGrammarRestricted: !!u.complex_grammar_restricted,
    conciseDirectPreferred: !!u.concise_direct_preferred,
    status: u.status,
    boardVersion: u.board_version,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  }
}
