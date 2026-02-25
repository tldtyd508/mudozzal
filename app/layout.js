import './globals.css';

export const metadata = {
  title: '무도짤 - 없는 게 없는 무한도전 짤 찾기',
  description: '무한도전 명장면, 밈, 짤을 키워드로 검색하세요. 무야호부터 메뚜기까지, 모든 무도 짤이 여기에!',
  keywords: ['무한도전', '무도', '짤', '밈', 'meme', '무야호', 'MBC'],
  openGraph: {
    title: '무도짤 - 없는 게 없는 무한도전 짤 찾기',
    description: '무한도전 명장면, 밈, 짤을 키워드로 검색하세요.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
