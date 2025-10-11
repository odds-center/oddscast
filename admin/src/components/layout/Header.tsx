import { Bell, User } from 'lucide-react';

export default function Header() {
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
            <button type='button' className='-m-1.5 flex items-center p-1.5'>
              <span className='sr-only'>사용자 메뉴 열기</span>
              <div className='h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center'>
                <User className='h-5 w-5 text-gray-600' />
              </div>
              <span className='hidden lg:flex lg:items-center'>
                <span
                  className='ml-4 text-sm font-semibold leading-6 text-gray-900'
                  aria-hidden='true'
                >
                  관리자
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
