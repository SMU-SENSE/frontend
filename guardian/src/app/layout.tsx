import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../styles/global.css'
import '../styles/figma-flow.css'
import '../styles/figma-restore.css'
import '../styles/figma-restore-extra.css'
import '../styles/figma-connect.css'
import '../styles/figma-final.css'
import '../styles/figma-final-2.css'
import '../styles/figma-final-3.css'
import '../styles/figma-pixel-perfect.css'
import '../styles/figma-pixel-qa.css'
import '../styles/figma-voice-final.css'
import '../styles/figma-auth-final.css'
import '../styles/figma-connect-final.css'
import '../styles/figma-source-lock.css'
import '../styles/figma-position-lock.css'
import '../styles/yeoseo-source.css'
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
