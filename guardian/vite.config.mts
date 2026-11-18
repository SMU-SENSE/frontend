import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

// Next의 디자인/페이지를 그대로 정적 export 하며, 결과물을 변형하지 않고 배포합니다.
export default defineConfig({
  plugins: [cloudflare()],
  publicDir: 'out',
  build: {
    rollupOptions: { input: 'vite-shell.html' },
  },
})
