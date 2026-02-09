import './globals.css';

export const metadata = {
  title: '아이디어큐브 아름/SW코딩 - 출결관리',
  description: '아이디어큐브 아름/SW코딩 학원 학생 출결관리 애플리케이션',
};

import AuthWrapper from '@/components/AuthWrapper';

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
