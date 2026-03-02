import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, isChecking } = useRequireAuth();

  if (isChecking || !isAuthenticated) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <LoadingSpinner size='lg' label='로그인 확인 중...' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Sidebar />
      <div className='lg:pl-52'>
        <Header />
        <main className='py-4'>
          <div className='max-w-7xl mx-auto px-4 sm:px-5 lg:px-6'>{children}</div>
        </main>
      </div>
    </div>
  );
}
