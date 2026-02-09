import './globals.css';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

export const metadata = {
  title: '아이디어큐브 출결관리 - 프리미엄 시스템',
  description: '아이디어큐브 코딩학원 학생 출결관리 애플리케이션',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="main-container">
          <Sidebar />
          <main className="content-wrapper">
            {children}
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
