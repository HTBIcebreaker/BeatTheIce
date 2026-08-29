import './globals.css';

export const metadata = {
  title: 'BeattheIce - 파티 아이스브레이킹 & 퀘스트',
  description: '파티에서 처음 만난 사람들 간의 어색함을 깨고 소외되는 사람 없이 파티 분위기 HIGH를 돕는 실시간 모바일 웹앱',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧊</text></svg>",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-[#0B132B] text-slate-800 antialiased min-h-screen flex justify-center selection:bg-sky-500 selection:text-white">
        <div className="w-full max-w-md min-h-screen bg-slate-50 shadow-2xl relative flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
