import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
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
