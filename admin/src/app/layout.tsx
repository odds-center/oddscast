import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Golden Race Admin',
  description: 'Golden Race 관리자 페이지',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ko'>
      <body>
        <div className='min-h-screen bg-gray-50'>
          {/* 네비게이션 */}
          <nav className='bg-white shadow-sm border-b'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              <div className='flex justify-between h-16'>
                <div className='flex'>
                  <Link href='/' className='flex items-center px-4 text-xl font-bold text-gray-900'>
                    🏇 Golden Race Admin
                  </Link>

                  <div className='flex space-x-4 ml-6'>
                    <Link
                      href='/subscription-plans'
                      className='inline-flex items-center px-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                    >
                      구독 플랜
                    </Link>
                    <Link
                      href='/single-purchase-config'
                      className='inline-flex items-center px-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                    >
                      개별 구매 설정
                    </Link>
                    <Link
                      href='/analytics'
                      className='inline-flex items-center px-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                    >
                      AI 통계
                    </Link>
                    <Link
                      href='/users'
                      className='inline-flex items-center px-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                    >
                      사용자
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* 메인 콘텐츠 */}
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
