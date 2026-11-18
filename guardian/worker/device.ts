import type { Hono } from 'hono'
import { HttpError, jsonBody, ok, sha256, type AppContext, type Env } from './common'

type Device = { id: number; device_id: string; user_id: number; device_name: string | null }

async function authorized(c: AppContext) {
  const token = c.req.header('Authorization')?.match(/^Bearer (\S+)$/i)?.[1]
  if (!token) throw new HttpError(401, '기기 인증이 필요합니다.', 'UNAUTHORIZED')
  const result = await c.env.DB.prepare(
    `SELECT id,device_id,user_id,device_name FROM devices
     WHERE access_token_hash=? AND access_token_expires_at>? AND status='CONNECTED'`,
  ).bind(await sha256(token), Date.now()).first<Device>()
  if (!result) throw new HttpError(401, '기기 연결이 만료되었거나 해제됐어요.', 'UNAUTHORIZED')
  return result
}

function boardResponse(u: Record<string, unknown>, categories: Record<string, unknown>[], cards: Record<string, unknown>[]) {
  return {
    aacUserId: u.id, version: u.board_version, gridSize: u.grid_size, status: u.status,
    categories: categories.map(x => ({
      id:x.id,name:x.name,color:x.color,displayOrder:x.display_order,
    })),
    cards: cards.map(x => ({
      id:x.id,categoryId:x.category_id,text:x.text,imageUrl:x.image_url,ttsText:x.tts_text,
      emergency:!!x.emergency,favorite:!!x.favorite,displayOrder:x.display_order,
    })),
  }
}

export function registerDevice(app: Hono<{Bindings: Env}>) {
  app.post('/api/v1/device/heartbeat', async c => {
    const d = await authorized(c)
    await c.env.DB.prepare("UPDATE devices SET last_seen_at=datetime('now') WHERE id=?").bind(d.id).run()
    return ok(c, {deviceId:d.device_id,aacUserId:d.user_id,lastSeenAt:new Date().toISOString()})
  })
  app.get('/api/v1/device/board', async c => {
    const d = await authorized(c)
    const [user, cats, cards] = await Promise.all([
      c.env.DB.prepare('SELECT * FROM aac_users WHERE id=?').bind(d.user_id).first<Record<string,unknown>>(),
      c.env.DB.prepare('SELECT * FROM board_categories WHERE user_id=? ORDER BY display_order,id').bind(d.user_id).all<Record<string,unknown>>(),
      c.env.DB.prepare('SELECT * FROM board_cards WHERE user_id=? ORDER BY display_order,id').bind(d.user_id).all<Record<string,unknown>>(),
    ])
    if (!user) throw new HttpError(404, '사용자를 찾을 수 없어요.')
    return ok(c, boardResponse(user,cats.results,cards.results))
  })
  app.post('/api/v1/device/card-usage', async c => {
    const d = await authorized(c)
    const input = await jsonBody<{cardId:number;action:string;spokenText?:string}>(c)
    if (!['SELECT','SPEAK','FAVORITE','EMERGENCY'].includes(input.action)) {
      throw new HttpError(400, '카드 동작이 올바르지 않아요.')
    }
    const card = await c.env.DB.prepare('SELECT id FROM board_cards WHERE id=? AND user_id=?')
      .bind(input.cardId,d.user_id).first<{id:number}>()
    if (!card) throw new HttpError(404, '카드를 찾을 수 없어요.')
    const saved = await c.env.DB.prepare(
      'INSERT INTO usage_logs(user_id,card_id,action,spoken_text) VALUES(?,?,?,?)',
    ).bind(d.user_id,card.id,input.action,input.spokenText?.slice(0,500)??null).run()
    return ok(c,{id:saved.meta.last_row_id})
  })
  app.post('/api/v1/device/locations', async c => {
    const d=await authorized(c)
    const input=await jsonBody<{latitude:number;longitude:number;accuracyMeters?:number|null}>(c)
    if(!Number.isFinite(input.latitude)||!Number.isFinite(input.longitude)||
      Math.abs(input.latitude)>90||Math.abs(input.longitude)>180) {
      throw new HttpError(400,'위도·경도 값이 올바르지 않아요.')
    }
    const r=await c.env.DB.prepare('INSERT INTO locations(user_id,latitude,longitude,accuracy_meters) VALUES(?,?,?,?)')
      .bind(d.user_id,input.latitude,input.longitude,input.accuracyMeters??null).run()
    return ok(c,{
      id:r.meta.last_row_id,latitude:input.latitude,longitude:input.longitude,
      accuracyMeters:input.accuracyMeters??null,recordedAt:new Date().toISOString(),outsidePlaceIds:[],
    })
  })
  app.post('/api/v1/device/emergency', async c => {
    const d=await authorized(c)
    const input=await jsonBody<{message?:string}>(c).catch(()=>({message:''}))
    const message=(input.message??'긴급 도움이 필요해요.').slice(0,250)
    await c.env.DB.prepare('INSERT INTO alerts(user_id,type,message) VALUES(?,?,?)')
      .bind(d.user_id,'EMERGENCY',message).run()
    await c.env.DB.prepare("UPDATE aac_users SET status='EMERGENCY' WHERE id=?").bind(d.user_id).run()
    return ok(c,{status:'EMERGENCY'})
  })
  app.post('/api/v1/device/sensor-events', async c => {
    const d=await authorized(c)
    const input=await jsonBody<{type?:string;value?:number;label?:string}>(c)
    if(!input.type||input.type.length>64||!Number.isFinite(input.value??0))
      throw new HttpError(400,'센서 정보를 확인해 주세요.')
    const r=await c.env.DB.prepare('INSERT INTO sensor_events(user_id,event_type,value,label) VALUES(?,?,?,?)')
      .bind(d.user_id,input.type,input.value??null,input.label?.slice(0,120)??null).run()
    return ok(c,{id:r.meta.last_row_id,type:input.type,value:input.value??null,label:input.label??null})
  })
  app.post('/api/v1/device/expression-events', async c => {
    const d=await authorized(c)
    const input=await jsonBody<{expression?:string;confidence?:number}>(c)
    if(!input.expression||!Number.isFinite(input.confidence??0))
      throw new HttpError(400,'표정 분석 값을 확인해 주세요.')
    const r=await c.env.DB.prepare('INSERT INTO sensor_events(user_id,event_type,value,label) VALUES(?,?,?,?)')
      .bind(d.user_id,'EXPRESSION',input.confidence??null,input.expression.slice(0,80)).run()
    return ok(c,{id:r.meta.last_row_id,type:'EXPRESSION',value:input.confidence??null,label:input.expression})
  })
  app.post('/api/v1/device/stt-events', async c => {
    await authorized(c)
    throw new HttpError(501,'음성 인식 분석은 아직 연결되지 않았어요.','NOT_IMPLEMENTED')
  })
  app.get('/api/v1/device/events', async c => {
    await authorized(c)
    return new Response(': heartbeat\n\n',{
      headers: {'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Accel-Buffering':'no'},
    })
  })
}
