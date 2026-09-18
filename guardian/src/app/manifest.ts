import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/guardian-mplus',
    name: 'MalMoa 보호자 M+',
    short_name: 'MalMoa 보호자',
    description: 'AAC 사용자 설정·편집·연결·안전 확인을 위한 보호자 앱',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F4F5F8',
    theme_color: '#149E69',
    orientation: 'any',
    icons: [
      {
        src: '/malmoa-guardian.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
