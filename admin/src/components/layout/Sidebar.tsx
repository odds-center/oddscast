import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Trophy,
  DollarSign,
  Bell,
  Settings,
  BarChart3,
  CreditCard,
} from 'lucide-react';

const navigation = [
  { name: '대시보드', href: '/', icon: LayoutDashboard },
  { name: '회원 관리', href: '/users', icon: Users },
  { name: '경주 관리', href: '/races', icon: CalendarDays },
  { name: '경기 결과', href: '/results', icon: Trophy },
  { name: '마권 관리', href: '/bets', icon: DollarSign },
  { name: '구독 관리', href: '/subscriptions', icon: CreditCard },
  { name: '통계', href: '/statistics', icon: BarChart3 },
  { name: '알림 관리', href: '/notifications', icon: Bell },
  { name: '설정', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <div className='hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col'>
      <div className='flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6'>
        <div className='flex h-16 shrink-0 items-center'>
          <h1 className='text-xl font-bold text-primary-600'>GoldenRace Admin</h1>
        </div>
        <nav className='flex flex-1 flex-col'>
          <ul role='list' className='flex flex-1 flex-col gap-y-7'>
            <li>
              <ul role='list' className='-mx-2 space-y-1'>
                {navigation.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                          ${
                            isActive
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            isActive
                              ? 'text-primary-600'
                              : 'text-gray-400 group-hover:text-primary-600'
                          }`}
                          aria-hidden='true'
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
