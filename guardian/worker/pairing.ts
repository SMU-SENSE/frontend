import type { Hono } from 'hono'
import {
  assertCsrf, HttpError, jsonBody, ok, randomToken, requireSession, sha256, userOwned, type AppContext, type Env,
} from './common'

const userPrefix = '/api/v1/me/aac-users/:userId'
const TTL = 10 * 60_000

function randomCode() {
  // Secure rejection sampling avoids modulo bias for the six-digit invite code.
  const limit = Math.floor(0x100000000 / 1000000) * 1000000
  let value: number
  do { value = crypto.getRandomValues(new Uint32Array(1))[0] } while (value >= limit)
  return String(value % 1000000).padStart(6, '0')
}
async function guarded(c: AppContext, mutation=false) {
  const session = await requireSession(c)
  if(mutation) await assertCsrf(c,session)
  const userId = Number(c.req.param('userId'))
  await userOwned(c,userId,session.account_id)
  return userId
}
async function issue(c: AppContext) {
  const userId = await guarded(c,true)
  await c.env.DB.prepare(
    `UPDATE device_pairings SET status='REVOKED' WHERE user_id=? AND status='ACTIVE'`,
  ).bind(userId).run()
  const token = randomToken()
  for(let attempt=0;attempt<8;attempt++){
    const code=randomCode()
    try{
      const expiry=Date.now()+TTL
      const result=await c.env.DB.prepare(
        'INSERT INTO device_pairings(user_id,code_hash,token_hash,expires_at) VALUES(?,?,?,?)',
      ).bind(userId,await sha256(code),await sha256(token),expiry).run()
      return ok(c,{
        pairingId:result.meta.last_row_id,
        qrPayload:`malmoa://pair?token=${encodeURIComponent(token)}`,
        inviteCode:code,
        expiresAt:new Date(expiry).toISOString(),
        remainingSeconds:Math.floor(TTL/1000),
      },201)
    }catch(e){
      if(!(e instanceof Error)||!/UNIQUE constraint failed/i.test(e.message))throw e
    }
  }
  throw new HttpError(503,'연결 코드를 만들지 못했어요. 다시 시도해 주세요.')
}
export function registerPairing(app:Hono<{Bindings:Env}>) {
  app.post(userPrefix+'/device-pairings',issue)
  app.post(userPrefix+'/device-pairings/refresh',issue)
  app.get(userPrefix+'/device-pairings/current',async c=>{
    const userId=await guarded(c)
    const row=await c.env.DB.prepare(
      `SELECT id,status,expires_at FROM device_pairings
       WHERE user_id=? ORDER BY id DESC LIMIT 1`,
    ).bind(userId).first<{id:number;status:string;expires_at:number}>()
    if(!row)throw new HttpError(404,'활성 기기 연결 세션이 없어요.','NOT_FOUND')
    if(row.status==='ACTIVE'&&row.expires_at<Date.now())
      throw new HttpError(410,'연결 코드가 만료되었어요.','PAIRING_EXPIRED')
    return ok(c,{
      pairingId:row.id,status:row.status,expiresAt:new Date(row.expires_at).toISOString(),
      remainingSeconds:Math.max(0,Math.floor((row.expires_at-Date.now())/1000)),
    })
  })
  app.get(userPrefix+'/devices',async c=>{
    const userId=await guarded(c)
    const rows=await c.env.DB.prepare(
      'SELECT id,device_id,device_name,device_type,status,paired_at,last_seen_at FROM devices WHERE user_id=? ORDER BY id',
    ).bind(userId).all<Record<string,unknown>>()
    return ok(c,rows.results.map(x=>({
      id:x.id,deviceId:x.device_id,deviceName:x.device_name,deviceType:x.device_type,
      status:x.status,pairedAt:x.paired_at,lastSeenAt:x.last_seen_at,
    })))
  })
  app.delete(userPrefix+'/devices/:deviceId',async c=>{
    const userId=await guarded(c,true)
    const res=await c.env.DB.prepare(
      `UPDATE devices SET status='REVOKED',access_token_hash=NULL WHERE id=? AND user_id=?`,
    ).bind(Number(c.req.param('deviceId')),userId).run()
    if(!res.meta.changes)throw new HttpError(404,'기기를 찾을 수 없어요.','NOT_FOUND')
    return c.body(null,204)
  })
  async function claim(c:AppContext,method:'code'|'token'){
    const request=await jsonBody<{code?:string;token?:string;deviceId:string;deviceName?:string;deviceType:string}>(c)
    const raw=method==='code'?request.code:request.token
    if(!raw||!request.deviceId||request.deviceId.length>100||!request.deviceType)
      throw new HttpError(400,'기기 정보와 연결 코드를 확인해 주세요.')
    if(method==='code'&&!/^\d{6}$/.test(raw))throw new HttpError(400,'코드는 숫자 6자리예요.')
    const ip=c.req.header('CF-Connecting-IP')??'unknown'
    const ipHash=await sha256(ip)
    const windowStart=Math.floor(Date.now()/TTL)*TTL
    await c.env.DB.prepare(
      `INSERT INTO pairing_attempts(ip_hash,window_start,attempts) VALUES(?,?,1)
       ON CONFLICT(ip_hash) DO UPDATE SET
       attempts=CASE WHEN pairing_attempts.window_start=? THEN pairing_attempts.attempts+1 ELSE 1 END,
       window_start=?`,
    ).bind(ipHash,windowStart,windowStart,windowStart).run()
    const attempts=await c.env.DB.prepare('SELECT attempts FROM pairing_attempts WHERE ip_hash=?')
      .bind(ipHash).first<{attempts:number}>()
    if((attempts?.attempts??0)>10)throw new HttpError(429,'잠시 후 다시 시도해 주세요.','TOO_MANY_ATTEMPTS')
    const hash=await sha256(raw)
    const pairing=await c.env.DB.prepare(
      `SELECT id,user_id,expires_at,status FROM device_pairings WHERE ${method==='code'?'code_hash':'token_hash'}=?`,
    ).bind(hash).first<{id:number;user_id:number;expires_at:number;status:string}>()
    if(!pairing)throw new HttpError(404,'초대 코드를 찾을 수 없어요.','NOT_FOUND')
    if(pairing.expires_at<Date.now())throw new HttpError(410,'초대 코드가 만료되었어요.','PAIRING_EXPIRED')
    if(pairing.status!=='ACTIVE')throw new HttpError(409,'이미 사용되었거나 취소된 초대 코드예요.','PAIRING_NOT_ACTIVE')
    const consumed=await c.env.DB.prepare(
      `UPDATE device_pairings SET status='USED' WHERE id=? AND status='ACTIVE' AND expires_at>? RETURNING id`,
    ).bind(pairing.id,Date.now()).first<{id:number}>()
    if(!consumed)throw new HttpError(409,'이미 사용된 초대 코드예요.','PAIRING_NOT_ACTIVE')
    const accessToken=randomToken()
    const tokenExpiry=Date.now()+30*24*60*60_000
    const tokenHash=await sha256(accessToken)
    await c.env.DB.prepare(
      `INSERT INTO devices(user_id,device_id,device_name,device_type,status,access_token_hash,access_token_expires_at)
       VALUES(?,?,?,?,'CONNECTED',?,?)
       ON CONFLICT(device_id) DO UPDATE SET
       user_id=excluded.user_id,device_name=excluded.device_name,
       device_type=excluded.device_type,status='CONNECTED',
       access_token_hash=excluded.access_token_hash,
       access_token_expires_at=excluded.access_token_expires_at,
       paired_at=datetime('now')`,
    ).bind(pairing.user_id,request.deviceId,request.deviceName??null,
      request.deviceType,tokenHash,tokenExpiry).run()
    return ok(c,{
      aacUserId:pairing.user_id,deviceId:request.deviceId,pairedAt:new Date().toISOString(),
      accessToken,accessTokenExpiresAt:new Date(tokenExpiry).toISOString(),
    })
  }
  app.post('/api/v1/device-pairings/claim/code',c=>claim(c,'code'))
  app.post('/api/v1/device-pairings/claim/qr',c=>claim(c,'token'))
}
