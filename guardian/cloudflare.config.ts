import { bindings, defineConfig } from '@cloudflare/config'

// 독립 실험 서버: 기존 Railway, Vercel 또는 다른 D1을 변경하지 않습니다.
export default defineConfig({
  accountId: '7b64a9355090f275d478c49af95a7fb2',
  worker: {
    name: 'malmoa-mobile-independent',
    compatibilityDate: '2026-11-18',
    entrypoint: './worker/index.ts',
    assets: {
      htmlHandling: 'drop-trailing-slash',
      notFoundHandling: '404-page',
      runWorkerFirst: ['/api/*', '/oauth2/*', '/login/oauth2/*'],
    },
    env: {
      PUBLIC_BASE_URL: bindings.text('https://malmoa-mobile-independent.kds10111.workers.dev'),
      DB: bindings.d1({
        id: 'c5b1d7fe-c6d1-4b27-aecd-3675b61d7ccf',
        name: 'malmoa-mobile-independent',
      }),
      ASSETS: bindings.assets(),
    },
  },
})
