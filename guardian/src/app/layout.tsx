import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../styles/global.css'
import '../styles/figma-flow.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: '말모아',
  description: 'AAC 보완대체의사소통 서비스',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
