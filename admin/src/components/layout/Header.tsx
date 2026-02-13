import { useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, User, LogOut } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Header() {
  const router = useRouter();
  const { user, clearAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    clearAuth();
    router.push('/login');
  };

  return (
    <div className='sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8'>
      <div className='flex flex-1 gap-x-4 self-stretch lg:gap-x-6'>
        <div className='flex flex-1'></div>
        <div className='flex items-center gap-x-4 lg:gap-x-6'>
          <button type='button' className='-m-2.5 p-2.5 text-gray-400 hover:text-gray-500'>
            <span className='sr-only'>알림 보기</span>
            <Bell className='h-6 w-6' aria-hidden='true' />
          </button>

          <div className='hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200' aria-hidden='true' />

          <div className='relative'>
            <button
              type='button'
              onClick={() => setMenuOpen(!menuOpen)}
              className='-m-1.5 flex items-center p-1.5'
            >
              <span className='sr-only'>사용자 메뉴 열기</span>
              <div className='h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center'>
                <User className='h-5 w-5 text-gray-600' />
              </div>
              <span className='hidden lg:flex lg:items-center'>
                <span className='ml-4 text-sm font-semibold leading-6 text-gray-900'>
                  {user?.email || '관리자'}
                </span>
              </span>
            </button>
            {menuOpen && (
              <>
                <div
                  className='fixed inset-0 z-10'
                  onClick={() => setMenuOpen(false)}
                  aria-hidden='true'
                />
                <div className='absolute right-0 z-20 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5'>
                  <button
                    onClick={handleLogout}
                    className='flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  >
                    <LogOut className='h-4 w-4' />
                    로그아웃
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
