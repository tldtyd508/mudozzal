import './globals.css';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: "무도짤 (MudoZzal) | 무한도전 짤방 아카이브",
  description: "필요할 때 바로 찾는 무한도전 레전드 짤방 모음",
  keywords: ['무한도전', '무도', '짤', '밈', 'meme', '무야호', 'MBC'],
  openGraph: {
    title: "무도짤 (MudoZzal) | 무한도전 짤방 아카이브",
    description: "필요할 때 바로 찾는 무한도전 레전드 짤방 모음",
    url: "https://mudozzal.vercel.app",
    siteName: "무도짤",
    images: [{ url: "https://mudozzal.vercel.app/og-image.png", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
