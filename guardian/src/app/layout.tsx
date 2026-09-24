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
import '../styles/guardian-product.css'
import '../styles/guardian-onboarding.css'
import '../styles/guardian-product-refine.css'
import { Providers } from './providers'
import { PwaRegistration } from '../components/PwaRegistration'

export const metadata: Metadata = {
  title: '말모아 보호자',
  description: 'AAC 보완대체의사소통 보호자 서비스',
  applicationName: 'MalMoa 보호자',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/malmoa-guardian.svg', apple: '/malmoa-guardian.svg' },
  appleWebApp: { capable: true, title: 'MalMoa 보호자', statusBarStyle: 'default' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers><PwaRegistration />{children}</Providers>
      </body>
    </html>
  )
}
