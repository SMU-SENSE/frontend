import { Hono } from 'hono'
import { HttpError, error, type Env } from './common'
import { registerOAuth } from './oauth'
import { registerUsers } from './users'
import { registerBoard } from './board'
import { registerPairing } from './pairing'
import { registerExtras } from './extras'
import { registerDevice } from './device'
import { registerMedia } from './media'

const app = new Hono<{ Bindings: Env }>()

registerOAuth(app)
registerUsers(app)
registerBoard(app)
registerPairing(app)
registerExtras(app)
registerDevice(app)
registerMedia(app)

app.onError((exception, c) => {
  if (exception instanceof HttpError) {
    return error(c, exception.status, exception.message, exception.code)
  }
  console.error('Unexpected Worker error:', exception)
  return error(c, 500, '요청을 처리하지 못했어요.', 'INTERNAL_SERVER_ERROR')
})

app.notFound(c => {
  const path = new URL(c.req.url).pathname
  if (path.startsWith('/api/') || path.startsWith('/oauth2/') || path.startsWith('/login/oauth2/')) {
    return error(c, 404, '해당 기능은 아직 구현되지 않았어요.', 'NOT_FOUND')
  }
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
