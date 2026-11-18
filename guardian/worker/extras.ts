import type { Hono } from 'hono'
import {assertCsrf, HttpError, jsonBody, ok, requireSession, userOwned, type AppContext, type Env} from './common'

async function access(c:AppContext,mutate=false) {
  const session=await requireSession(c)
  if(mutate)await assertCsrf(c,session)
  const userId=Number(c.req.param('userId'))
  const user=await userOwned(c,userId,session.account_id)
  return {userId,user}
}
const root='/api/v1/me/aac-users/:userId'
const asRoutine=(r:any)=>({
  id:r.id,title:r.title,message:r.message,timeOfDay:r.time_of_day,
  daysOfWeek:JSON.parse(r.days_of_week??'[]'),timezone:r.timezone,enabled:!!r.enabled,
})
const asPlace=(r:any)=>({
  id:r.id,name:r.name,placeType:r.place_type,address:r.address,
  latitude:r.latitude,longitude:r.longitude,radiusMeters:r.radius_meters,
  activeFrom:r.active_from,activeTo:r.active_to,
})
export function registerExtras(app:Hono<{Bindings:Env}>) {
  app.get(root+'/routines',async c=>{
    const {userId}=await access(c)
    const r=await c.env.DB.prepare('SELECT * FROM routines WHERE user_id=? ORDER BY id')
      .bind(userId).all()
    return ok(c,r.results.map(asRoutine))
  })
  app.post(root+'/routines',async c=>{
    const {userId}=await access(c,true)
    const d=await jsonBody<any>(c)
    if(!d.title?.trim())throw new HttpError(400,'루틴 이름이 필요해요.')
    const r=await c.env.DB.prepare(
      'INSERT INTO routines(user_id,title,message,time_of_day,days_of_week,timezone,enabled) VALUES(?,?,?,?,?,?,?)',
    ).bind(userId,d.title,d.message??'',d.timeOfDay??'09:00',
      JSON.stringify(d.daysOfWeek??[]),d.timezone??'Asia/Seoul',d.enabled===false?0:1).run()
    const saved=await c.env.DB.prepare('SELECT * FROM routines WHERE id=?').bind(r.meta.last_row_id).first()
    return ok(c,asRoutine(saved),201)
  })
  app.put(root+'/routines/:routineId',async c=>{
    const {userId}=await access(c,true)
    const id=Number(c.req.param('routineId'))
    const d=await jsonBody<any>(c)
    const r=await c.env.DB.prepare(
      'UPDATE routines SET title=?,message=?,time_of_day=?,days_of_week=?,timezone=?,enabled=? WHERE id=? AND user_id=?',
    ).bind(d.title??'',d.message??'',d.timeOfDay??'09:00',
      JSON.stringify(d.daysOfWeek??[]),d.timezone??'Asia/Seoul',d.enabled===false?0:1,id,userId).run()
    if(!r.meta.changes)throw new HttpError(404,'루틴을 찾을 수 없어요.')
    return ok(c,asRoutine(await c.env.DB.prepare('SELECT * FROM routines WHERE id=?').bind(id).first()))
  })
  app.delete(root+'/routines/:routineId',async c=>{
    const {userId}=await access(c,true)
    await c.env.DB.prepare('DELETE FROM routines WHERE id=? AND user_id=?')
      .bind(Number(c.req.param('routineId')),userId).run()
    return c.body(null,204)
  })
  app.get(root+'/places',async c=>{
    const {userId}=await access(c)
    const r=await c.env.DB.prepare('SELECT * FROM places WHERE user_id=? ORDER BY id')
      .bind(userId).all()
    return ok(c,r.results.map(asPlace))
  })
  app.post(root+'/places',async c=>{
    const {userId}=await access(c,true)
    const d=await jsonBody<any>(c)
    if(!d.name?.trim())throw new HttpError(400,'장소 이름이 필요해요.')
    const r=await c.env.DB.prepare(
      `INSERT INTO places(user_id,name,place_type,address,latitude,longitude,radius_meters,active_from,active_to)
       VALUES(?,?,?,?,?,?,?,?,?)`,
    ).bind(userId,d.name,d.placeType??'OTHER',d.address??'',d.latitude??0,d.longitude??0,
      d.radiusMeters??100,d.activeFrom??'00:00',d.activeTo??'23:59').run()
    return ok(c,asPlace(await c.env.DB.prepare('SELECT * FROM places WHERE id=?').bind(r.meta.last_row_id).first()),201)
  })
  app.put(root+'/places/:placeId',async c=>{
    const {userId}=await access(c,true)
    const id=Number(c.req.param('placeId'))
    const d=await jsonBody<any>(c)
    const previous=await c.env.DB.prepare('SELECT * FROM places WHERE id=? AND user_id=?')
      .bind(id,userId).first<Record<string,unknown>>()
    if(!previous)throw new HttpError(404,'장소를 찾을 수 없어요.','NOT_FOUND')
    await c.env.DB.prepare(
      `UPDATE places SET name=?,place_type=?,address=?,latitude=?,longitude=?,radius_meters=?,
       active_from=?,active_to=? WHERE id=? AND user_id=?`,
    ).bind(d.name??previous.name,d.placeType??previous.place_type,d.address??previous.address,
      d.latitude??previous.latitude,d.longitude??previous.longitude,d.radiusMeters??previous.radius_meters,
      d.activeFrom??previous.active_from,d.activeTo??previous.active_to,id,userId).run()
    return ok(c,asPlace(await c.env.DB.prepare('SELECT * FROM places WHERE id=?').bind(id).first()))
  })
  app.delete(root+'/places/:placeId',async c=>{
    const {userId}=await access(c,true)
    await c.env.DB.prepare('DELETE FROM places WHERE id=? AND user_id=?')
      .bind(Number(c.req.param('placeId')),userId).run()
    return c.body(null,204)
  })
  app.get(root+'/locations/latest',async c=>{
    const {userId}=await access(c)
    const row=await c.env.DB.prepare('SELECT * FROM locations WHERE user_id=? ORDER BY id DESC LIMIT 1')
      .bind(userId).first<any>()
    if(!row)throw new HttpError(404,'아직 위치 기록이 없어요.','NOT_FOUND')
    return ok(c,{
      id:row.id,latitude:row.latitude,longitude:row.longitude,
      accuracyMeters:row.accuracy_meters,recordedAt:row.recorded_at,outsidePlaceIds:[],
    })
  })
  app.get(root+'/locations',async c=>{
    const {userId}=await access(c)
    const rows=await c.env.DB.prepare('SELECT * FROM locations WHERE user_id=? ORDER BY id DESC LIMIT 100')
      .bind(userId).all<any>()
    return ok(c,rows.results.map(row=>({
      id:row.id,latitude:row.latitude,longitude:row.longitude,
      accuracyMeters:row.accuracy_meters,recordedAt:row.recorded_at,outsidePlaceIds:[],
    })))
  })
  app.get(root+'/alerts',async c=>{
    const {userId}=await access(c)
    const rows=await c.env.DB.prepare('SELECT * FROM alerts WHERE user_id=? ORDER BY occurred_at DESC LIMIT 100')
      .bind(userId).all<any>()
    return ok(c,rows.results.map(a=>({
      id:a.id,type:a.type,title:a.type==='EMERGENCY'?'긴급 알림':'안내',
      message:a.message,occurredAt:a.occurred_at,acknowledgedAt:a.acknowledged? a.occurred_at:null,
    })))
  })
  app.post(root+'/alerts/:alertId/acknowledge',async c=>{
    const {userId}=await access(c,true)
    await c.env.DB.prepare('UPDATE alerts SET acknowledged=1 WHERE id=? AND user_id=?')
      .bind(Number(c.req.param('alertId')),userId).run()
    return ok(c,{acknowledged:true})
  })
  app.get(root+'/report',async c=>{
    const {userId}=await access(c)
    const rows=await c.env.DB.prepare('SELECT action,COUNT(*) AS count FROM usage_logs WHERE user_id=? GROUP BY action')
      .bind(userId).all<{action:string;count:number}>()
    const total=rows.results.reduce((sum,r)=>sum+r.count,0)
    const top=await c.env.DB.prepare(
      `SELECT b.id,b.text AS name,COUNT(*) AS count FROM usage_logs u
       JOIN board_cards b ON b.id=u.card_id WHERE u.user_id=? GROUP BY b.id ORDER BY count DESC LIMIT 8`,
    ).bind(userId).all<{id:number;name:string;count:number}>()
    const sensors=await c.env.DB.prepare(
      'SELECT event_type,value,label,recorded_at FROM sensor_events WHERE user_id=? ORDER BY id DESC LIMIT 10',
    ).bind(userId).all<{event_type:string;value:number|null;label:string|null;recorded_at:string}>()
    return ok(c,{
      aacUserId:userId,from:c.req.query('from')??'',to:c.req.query('to')??'',
      totalCardActions:total,emergencyCount:rows.results.find(r=>r.action==='EMERGENCY')?.count??0,
      topCards:top.results,categoryShares:[],sensors:sensors.results.map(s=>({
        type:s.event_type,value:s.value,label:s.label,recordedAt:s.recorded_at,
      })),
      insights:total?['최근 카드 사용 기록을 확인할 수 있어요.']:['아직 사용 기록이 없어요.'],
    })
  })
  app.get(root+'/ai/context',async c=>{
    const {userId,user}=await access(c)
    return ok(c,{
      aacUserId:userId,age:null,profileNotes:user.notes??null,
      communicationPreferences:{
        sentenceLevel:user.sentence_level,maxRecommendedSentenceWords:user.max_recommended_sentence_words,
        easyWordsPreferred:!!user.easy_words_preferred,
        abstractExpressionsRestricted:!!user.abstract_expressions_restricted,
        complexGrammarRestricted:!!user.complex_grammar_restricted,
        conciseDirectPreferred:!!user.concise_direct_preferred,
      },
      prioritizedVocabulary:[],recentExpressions:[],currentSituation:c.req.query('currentSituation')??null,
    })
  })
  app.post(root+'/ai/recommendations',async c=>{
    await access(c,true)
    // No AI provider key configured: this is deliberately a transparent local fallback.
    const d=await jsonBody<{currentSituation?:string}>(c)
    const input=(d.currentSituation??'도움이 필요해요').trim().slice(0,80)
    return ok(c,{sentence:input})
  })
  app.get('/api/v1/health',c=>ok(c,{
    service:'malmoa-cloudflare-d1',status:'UP',oauthConfigured:{
      google:!!(c.env.GOOGLE_CLIENT_ID&&c.env.GOOGLE_CLIENT_SECRET),
      kakao:!!c.env.KAKAO_REST_API_KEY,
    },
  }))
}
