import type { Hono } from 'hono'
import {
  assertCsrf, HttpError, jsonBody, ok, requireSession, userOwned, userResponse,
  type Env,
} from './common'

const root = '/api/v1/me/aac-users'
const toId = (value: string) => Number(value)

function summary(u: Record<string, unknown>) {
  return {
    userId: u.id,
    name: u.name,
    profileImageUrl: u.profile_image_url,
    birthDate: u.birth_date,
    relationshipType: u.relationship_type,
    relationshipDetail: u.relationship_detail,
    emergencyContact: u.emergency_contact,
    notes: u.notes,
    gridSize: u.grid_size,
    voiceType: u.voice_type,
    speechRate: u.speech_rate,
    setupStep: u.setup_step,
  }
}

export function registerUsers(app: Hono<{ Bindings: Env }>) {
  app.get(root, async c => {
    const session = await requireSession(c)
    const users = await c.env.DB.prepare(
      'SELECT * FROM aac_users WHERE owner_account_id=? ORDER BY id ASC',
    ).bind(session.account_id).all<Record<string, unknown>>()
    return ok(c, users.results.map(userResponse))
  })
  app.post(root, async c => {
    const session = await requireSession(c)
    await assertCsrf(c, session)
    const input = await jsonBody<{
      name: string; birthDate: string; emergencyContact: string; relationshipType: string
      relationshipDetail?: string; notes?: string; profileImageUrl?: string
      mode?: string; gridSize?: string
    }>(c)
    if (!input.name?.trim() || input.name.length > 50 || !input.birthDate ||
        !/^\d{4}-\d\d-\d\d$/.test(input.birthDate) || !input.emergencyContact?.trim() ||
        !input.relationshipType) {
      throw new HttpError(400, '이름·생년월일·관계·긴급 연락처를 확인해 주세요.', 'VALIDATION_FAILED')
    }
    const created = await c.env.DB.prepare(
      `INSERT INTO aac_users(owner_account_id,name,mode,grid_size,birth_date,
       emergency_contact,relationship_type,relationship_detail,notes,profile_image_url)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
    ).bind(session.account_id, input.name.trim(), input.mode ?? 'SIMPLE',
      input.gridSize ?? 'GRID_3X3', input.birthDate, input.emergencyContact.trim(),
      input.relationshipType, input.relationshipDetail ?? null, input.notes ?? '',
      input.profileImageUrl ?? null).run()
    const user = await c.env.DB.prepare('SELECT * FROM aac_users WHERE id=?')
      .bind(created.meta.last_row_id).first<Record<string, unknown>>()
    return ok(c, userResponse(user!), 201)
  })
  app.get(`${root}/:userId`, async c => {
    const session = await requireSession(c)
    return ok(c, userResponse(await userOwned(c, toId(c.req.param('userId')), session.account_id)))
  })
  app.patch(`${root}/:userId/settings`, async c => {
    const session = await requireSession(c)
    await assertCsrf(c, session)
    const userId = toId(c.req.param('userId'))
    const user = await userOwned(c, userId, session.account_id)
    const data = await jsonBody<{name?:string;notes?:string;emergencyContact?:string;profileImageUrl?:string}>(c)
    await c.env.DB.prepare(
      'UPDATE aac_users SET name=?,notes=?,emergency_contact=?,profile_image_url=?,updated_at=datetime(\'now\') WHERE id=?',
    ).bind(data.name ?? user.name, data.notes ?? user.notes, data.emergencyContact ?? user.emergency_contact,
      data.profileImageUrl ?? user.profile_image_url, userId).run()
    return ok(c, userResponse((await userOwned(c, userId, session.account_id))))
  })
  app.patch(`${root}/:userId/onboarding/grid`, async c => {
    const session = await requireSession(c)
    await assertCsrf(c, session)
    const userId = toId(c.req.param('userId'))
    await userOwned(c, userId, session.account_id)
    const {gridSize} = await jsonBody<{gridSize:string}>(c)
    if (!['GRID_2X2','GRID_3X3','GRID_4X4'].includes(gridSize)) throw new HttpError(400, '지원하지 않는 격자 크기입니다.')
    await c.env.DB.prepare(
      `UPDATE aac_users SET grid_size=?,setup_step='GRID_COMPLETED',
       board_version=board_version+1,updated_at=datetime('now') WHERE id=?`,
    ).bind(gridSize, userId).run()
    return ok(c, userResponse(await userOwned(c, userId, session.account_id)))
  })
  app.patch(`${root}/:userId/voice-settings`, async c => {
    const session = await requireSession(c)
    await assertCsrf(c, session)
    const userId = toId(c.req.param('userId'))
    await userOwned(c, userId, session.account_id)
    const {voiceType, speechRate} = await jsonBody<{voiceType:string; speechRate:number}>(c)
    if (!['CHILD_FEMALE','ADULT_FEMALE','CHILD_MALE','ADULT_MALE'].includes(voiceType) ||
      typeof speechRate !== 'number' || speechRate < 0.5 || speechRate > 2) {
      throw new HttpError(400, '음성 설정을 확인해 주세요.')
    }
    await c.env.DB.prepare(
      `UPDATE aac_users SET voice_type=?,speech_rate=?,setup_step='VOICE_COMPLETED',updated_at=datetime('now') WHERE id=?`,
    ).bind(voiceType, speechRate, userId).run()
    return ok(c, userResponse(await userOwned(c, userId, session.account_id)))
  })
  app.get(`${root}/:userId/onboarding-summary`, async c => {
    const session = await requireSession(c)
    return ok(c, summary(await userOwned(c, toId(c.req.param('userId')), session.account_id)))
  })
  app.post(`${root}/:userId/onboarding/confirm`, async c => {
    const session = await requireSession(c)
    await assertCsrf(c, session)
    const userId = toId(c.req.param('userId'))
    const user = await userOwned(c, userId, session.account_id)
    if (user.setup_step !== 'VOICE_COMPLETED' && user.setup_step !== 'CONFIRMED') {
      throw new HttpError(400, '프로필·격자·음성 설정을 먼저 완료해 주세요.')
    }
    await c.env.DB.prepare(`UPDATE aac_users SET setup_step='CONFIRMED' WHERE id=?`)
      .bind(userId).run()
    return ok(c, summary(await userOwned(c, userId, session.account_id)))
  })
  app.get('/api/v1/me/tutorial', async c => {
    const session = await requireSession(c)
    const row = await c.env.DB.prepare('SELECT * FROM tutorial_progress WHERE account_id=?')
      .bind(session.account_id).first<{completed:number;completed_at:string|null}>()
    return ok(c, { currentVersion: 1, completed: !!row?.completed, completedAt: row?.completed_at ?? null })
  })
  app.post('/api/v1/me/tutorial/complete', async c => {
    const session = await requireSession(c)
    await assertCsrf(c, session)
    await c.env.DB.prepare(
      `INSERT INTO tutorial_progress(account_id, completed, completed_at) VALUES(?,1,datetime('now'))
       ON CONFLICT(account_id) DO UPDATE SET completed=1, completed_at=datetime('now')`,
    ).bind(session.account_id).run()
    return ok(c, {currentVersion:1,completed:true,completedAt:new Date().toISOString()})
  })
}
