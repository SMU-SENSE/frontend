import type { Hono } from 'hono'
import {assertCsrf, HttpError, jsonBody, ok, requireSession, userOwned, type AppContext, type Env} from './common'

const prefix = '/api/v1/me/aac-users/:userId/board'
function asCategory(row: Record<string, unknown>) {
  return {id:row.id,name:row.name,color:row.color,displayOrder:row.display_order}
}
function asCard(row: Record<string, unknown>) {
  return {
    id:row.id,categoryId:row.category_id,text:row.text,imageUrl:row.image_url,
    ttsText:row.tts_text,emergency:!!row.emergency,favorite:!!row.favorite,
    displayOrder:row.display_order,
  }
}
async function boardAccess(c: AppContext, mutation = false) {
  const session = await requireSession(c)
  if (mutation) await assertCsrf(c, session)
  const id = Number(c.req.param('userId'))
  const user = await userOwned(c, id, session.account_id)
  return {userId:id,user,session}
}
async function changed(c: AppContext, userId: number) {
  await c.env.DB.prepare('UPDATE aac_users SET board_version=board_version+1,updated_at=datetime(\'now\') WHERE id=?')
    .bind(userId).run()
}
async function categoryOwned(c:AppContext,userId:number,categoryId:number) {
  const row = await c.env.DB.prepare('SELECT * FROM board_categories WHERE id=? AND user_id=?')
    .bind(categoryId,userId).first<Record<string,unknown>>()
  if(!row) throw new HttpError(404,'분류를 찾을 수 없어요.','NOT_FOUND')
  return row
}
async function cardOwned(c:AppContext,userId:number,cardId:number) {
  const row = await c.env.DB.prepare('SELECT * FROM board_cards WHERE id=? AND user_id=?')
    .bind(cardId,userId).first<Record<string,unknown>>()
  if(!row) throw new HttpError(404,'카드를 찾을 수 없어요.','NOT_FOUND')
  return row
}
export function registerBoard(app:Hono<{Bindings:Env}>) {
  app.get(prefix,async c=>{
    const {userId,user}=await boardAccess(c)
    const [cats,cards]=await Promise.all([
      c.env.DB.prepare('SELECT * FROM board_categories WHERE user_id=? ORDER BY display_order,id').bind(userId).all<Record<string,unknown>>(),
      c.env.DB.prepare('SELECT * FROM board_cards WHERE user_id=? ORDER BY display_order,id').bind(userId).all<Record<string,unknown>>(),
    ])
    return ok(c,{
      aacUserId:userId,version:user.board_version,gridSize:user.grid_size,
      status:user.status,categories:cats.results.map(asCategory),cards:cards.results.map(asCard),
    })
  })
  app.post(prefix+'/categories',async c=>{
    const {userId}=await boardAccess(c,true)
    const input=await jsonBody<{name:string;color:string;displayOrder:number}>(c)
    if(!input.name?.trim()||input.name.length>50)throw new HttpError(400,'분류명을 확인해 주세요.')
    const result=await c.env.DB.prepare('INSERT INTO board_categories(user_id,name,color,display_order) VALUES(?,?,?,?)')
      .bind(userId,input.name.trim(),input.color??'#47B492',input.displayOrder??0).run()
    await changed(c,userId)
    return ok(c,asCategory((await categoryOwned(c,userId,Number(result.meta.last_row_id)))),201)
  })
  app.patch(prefix+'/categories/:categoryId',async c=>{
    const {userId}=await boardAccess(c,true)
    const id=Number(c.req.param('categoryId'))
    const old=await categoryOwned(c,userId,id)
    const input=await jsonBody<Partial<{name:string;color:string;displayOrder:number}>>(c)
    await c.env.DB.prepare('UPDATE board_categories SET name=?,color=?,display_order=? WHERE id=?')
      .bind(input.name??old.name,input.color??old.color,input.displayOrder??old.display_order,id).run()
    await changed(c,userId)
    return ok(c,asCategory((await categoryOwned(c,userId,id))))
  })
  app.delete(prefix+'/categories/:categoryId',async c=>{
    const {userId}=await boardAccess(c,true)
    const id=Number(c.req.param('categoryId'))
    await categoryOwned(c,userId,id)
    await c.env.DB.prepare('DELETE FROM board_categories WHERE id=?').bind(id).run()
    await changed(c,userId)
    return c.body(null,204)
  })
  app.post(prefix+'/cards',async c=>{
    const {userId}=await boardAccess(c,true)
    const i=await jsonBody<{
      categoryId:number;text:string;imageUrl?:string|null;ttsText?:string|null
      emergency?:boolean;displayOrder?:number
    }>(c)
    if(!i.text?.trim()||i.text.length>80||(i.ttsText?.length??0)>200)
      throw new HttpError(400,'AAC 카드 문장의 길이를 확인해 주세요.')
    if(i.categoryId!=null)await categoryOwned(c,userId,Number(i.categoryId))
    const r=await c.env.DB.prepare(
      'INSERT INTO board_cards(user_id,category_id,text,image_url,tts_text,emergency,display_order) VALUES(?,?,?,?,?,?,?)',
    ).bind(userId,i.categoryId??null,i.text.trim(),i.imageUrl??null,i.ttsText??null,i.emergency?1:0,i.displayOrder??0).run()
    await changed(c,userId)
    return ok(c,asCard(await cardOwned(c,userId,Number(r.meta.last_row_id))),201)
  })
  app.patch(prefix+'/cards/:cardId',async c=>{
    const {userId}=await boardAccess(c,true)
    const id=Number(c.req.param('cardId'))
    const old=await cardOwned(c,userId,id)
    const i=await jsonBody<Partial<{
      categoryId:number|null;text:string;imageUrl:string|null;ttsText:string|null;
      emergency:boolean;displayOrder:number
    }>>(c)
    if(i.categoryId!=null)await categoryOwned(c,userId,Number(i.categoryId))
    if(i.text!==undefined&&(!i.text.trim()||i.text.length>80))
      throw new HttpError(400,'AAC 카드 문장은 1~80자여야 해요.')
    await c.env.DB.prepare(
      'UPDATE board_cards SET category_id=?,text=?,image_url=?,tts_text=?,emergency=?,display_order=? WHERE id=?',
    ).bind(i.categoryId===undefined?old.category_id:i.categoryId,i.text??old.text,
      i.imageUrl===undefined?old.image_url:i.imageUrl,
      i.ttsText===undefined?old.tts_text:i.ttsText,
      i.emergency===undefined?old.emergency:(i.emergency?1:0),
      i.displayOrder??old.display_order,id).run()
    await changed(c,userId)
    return ok(c,asCard(await cardOwned(c,userId,id)))
  })
  app.patch(prefix+'/cards/:cardId/favorite',async c=>{
    const {userId}=await boardAccess(c,true)
    const id=Number(c.req.param('cardId'))
    await cardOwned(c,userId,id)
    const {favorite}=await jsonBody<{favorite:boolean}>(c)
    await c.env.DB.prepare('UPDATE board_cards SET favorite=? WHERE id=?').bind(favorite?1:0,id).run()
    await changed(c,userId)
    return ok(c,asCard(await cardOwned(c,userId,id)))
  })
  app.delete(prefix+'/cards/:cardId',async c=>{
    const {userId}=await boardAccess(c,true)
    const id=Number(c.req.param('cardId'))
    await cardOwned(c,userId,id)
    await c.env.DB.prepare('DELETE FROM board_cards WHERE id=?').bind(id).run()
    await changed(c,userId)
    return c.body(null,204)
  })
  app.get('/api/v1/me/aac-users/:userId/favorites',async c=>{
    const {userId}=await boardAccess(c)
    const rows=await c.env.DB.prepare('SELECT * FROM board_cards WHERE user_id=? AND favorite=1')
      .bind(userId).all<Record<string,unknown>>()
    return ok(c,rows.results.map(asCard))
  })
  app.get('/api/v1/me/aac-users/:userId/communication-profile',async c=>{
    const {userId,user}=await boardAccess(c)
    return ok(c,{
      aacUserId:userId,sentenceLevel:user.sentence_level,
      maxRecommendedSentenceWords:user.max_recommended_sentence_words,
      easyWordsPreferred:!!user.easy_words_preferred,
      abstractExpressionsRestricted:!!user.abstract_expressions_restricted,
      complexGrammarRestricted:!!user.complex_grammar_restricted,
      conciseDirectPreferred:!!user.concise_direct_preferred,
    })
  })
  app.patch('/api/v1/me/aac-users/:userId/communication-profile',async c=>{
    const {userId,user}=await boardAccess(c,true)
    const data=await jsonBody<Record<string,unknown>>(c)
    const pick=(field:string,existing:string)=> data[field]===undefined?user[existing]:(data[field]?1:0)
    const level=Number(data.sentenceLevel??user.sentence_level)
    if(level<1||level>4)throw new HttpError(400,'언어 수준은 1~4단계예요.')
    await c.env.DB.prepare(
      `UPDATE aac_users SET sentence_level=?,max_recommended_sentence_words=?,
      easy_words_preferred=?,abstract_expressions_restricted=?,
      complex_grammar_restricted=?,concise_direct_preferred=? WHERE id=?`,
    ).bind(level,data.maxRecommendedSentenceWords??user.max_recommended_sentence_words,
      pick('easyWordsPreferred','easy_words_preferred'),
      pick('abstractExpressionsRestricted','abstract_expressions_restricted'),
      pick('complexGrammarRestricted','complex_grammar_restricted'),
      pick('conciseDirectPreferred','concise_direct_preferred'),userId).run()
    const updated=await userOwned(c,userId,(await requireSession(c)).account_id)
    return ok(c,{
      aacUserId:userId,sentenceLevel:updated.sentence_level,
      maxRecommendedSentenceWords:updated.max_recommended_sentence_words,
      easyWordsPreferred:!!updated.easy_words_preferred,
      abstractExpressionsRestricted:!!updated.abstract_expressions_restricted,
      complexGrammarRestricted:!!updated.complex_grammar_restricted,
      conciseDirectPreferred:!!updated.concise_direct_preferred,
    })
  })
  app.patch('/api/v1/me/aac-users/:userId/sentence-level',async c=>{
    const {userId}=await boardAccess(c,true)
    const {level}=await jsonBody<{level:number}>(c)
    if(!Number.isInteger(level)||level<1||level>4)throw new HttpError(400,'언어 수준은 1~4단계예요.')
    await c.env.DB.prepare('UPDATE aac_users SET sentence_level=? WHERE id=?').bind(level,userId).run()
    return ok(c,{level})
  })
  app.patch('/api/v1/me/aac-users/:userId/status',async c=>{
    const {userId}=await boardAccess(c,true)
    const {status}=await jsonBody<{status:string}>(c)
    if(!['STABLE','EMERGENCY'].includes(status))throw new HttpError(400,'상태가 올바르지 않아요.')
    await c.env.DB.prepare('UPDATE aac_users SET status=? WHERE id=?').bind(status,userId).run()
    return ok(c,{status})
  })
}
