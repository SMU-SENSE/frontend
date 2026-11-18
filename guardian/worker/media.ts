import type { Hono } from 'hono'
import { assertCsrf, HttpError, ok, randomToken, requireSession, userOwned, type Env } from './common'

const mediaPrefix='/api/v1/me/aac-users/:userId/media/images'

export function registerMedia(app:Hono<{Bindings:Env}>) {
  app.post(mediaPrefix,async c=>{
    const session=await requireSession(c)
    await assertCsrf(c,session)
    const userId=Number(c.req.param('userId'))
    await userOwned(c,userId,session.account_id)
    const form=await c.req.formData()
    const file=form.get('file')
    if(!(file instanceof File))throw new HttpError(400,'이미지 파일을 선택해 주세요.')
    const mime=['image/png','image/jpeg','image/webp'].find(t=>t===file.type)
    if(!mime||file.size<1||file.size>900_000)throw new HttpError(400,'PNG/JPEG/WebP 이미지(900KB 이하)만 업로드할 수 있어요.')
    const bytes=new Uint8Array(await file.arrayBuffer())
    const valid=mime==='image/png' ? bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47
      : mime==='image/jpeg' ? bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff
      : bytes[0]===0x52&&bytes[1]===0x49&&bytes[2]===0x46&&bytes[3]===0x46
    if(!valid)throw new HttpError(400,'이미지 파일 형식이 올바르지 않아요.')
    const ext=mime==='image/png'?'png':mime==='image/jpeg'?'jpg':'webp'
    const key=`${randomToken(16)}.${ext}`
    await c.env.DB.prepare('INSERT INTO media_images(user_id,image_key,mime_type,data) VALUES(?,?,?,?)')
      .bind(userId,key,mime,bytes).run()
    const url=`/api/v1/me/aac-users/${userId}/media/images/${key}`
    return ok(c,{url},201)
  })
  app.get(mediaPrefix+'/:key',async c=>{
    const session=await requireSession(c)
    const userId=Number(c.req.param('userId'))
    await userOwned(c,userId,session.account_id)
    const row=await c.env.DB.prepare('SELECT mime_type,data FROM media_images WHERE user_id=? AND image_key=?')
      .bind(userId,c.req.param('key')).first<{mime_type:string;data:ArrayBuffer}>()
    if(!row)throw new HttpError(404,'이미지를 찾을 수 없어요.','NOT_FOUND')
    return new Response(row.data,{
      headers:{'Content-Type':row.mime_type,'Cache-Control':'private, max-age=86400','X-Content-Type-Options':'nosniff'},
    })
  })
}
