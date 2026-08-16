import "./globals.css";
import { Noto_Sans_KR } from 'next/font/google';

const notoSans = Noto_Sans_KR({
  subsets: ['latin'], 
  weight: ['400', '700'], 
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${notoSans.className} container`}>
        {children}
      </body>
    </html>
  );
}