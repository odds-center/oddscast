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
  Ticket,
  Bot,
  TrendingUp,
  Database,
} from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';

const navigation = [
  { name: '대시보드', href: '/', icon: LayoutDashboard },
  { name: '회원 관리', href: '/users', icon: Users },
  { name: '경주 관리', href: '/races', icon: CalendarDays },
  { name: '경기 결과', href: '/results', icon: Trophy },
  { name: 'KRA 데이터', href: '/kra', icon: Database },
  { name: '마권 관리', href: '/bets', icon: DollarSign },
  { name: '구독 관리', href: '/subscriptions', icon: CreditCard },
  { name: '구독 플랜', href: '/subscription-plans', icon: CreditCard },
  { name: '개별 구매', href: '/single-purchase-config', icon: Ticket },
  { name: 'AI 설정', href: '/ai-config', icon: Bot },
  { name: 'AI 분석', href: '/analytics', icon: BarChart3 },
  { name: '수익 대시보드', href: '/revenue', icon: TrendingUp },
  { name: '통계', href: '/statistics', icon: BarChart3 },
  { name: '알림 관리', href: '/notifications', icon: Bell },
  { name: '설정', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <div className='hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-52 lg:flex-col'>
      <div className='flex grow flex-col gap-y-4 overflow-y-auto bg-white border-r border-gray-200 px-4'>
        <div className='flex h-12 shrink-0 items-center'>
          <h1 className='text-base font-bold text-primary-600'>GoldenRace Admin</h1>
        </div>
        <nav className='flex flex-1 flex-col'>
          <ul role='list' className='flex flex-1 flex-col gap-y-4'>
            <li>
              <ul role='list' className='-mx-1 space-y-0.5'>
                {navigation.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`
                          group flex gap-x-2 rounded px-2 py-1.5 text-sm leading-5 font-medium
                          ${
                            isActive
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <AdminIcon
                          icon={item.icon}
                          className={`h-5 w-5 shrink-0 ${
                            isActive
                              ? 'text-primary-600'
                              : 'text-gray-400 group-hover:text-primary-600'
                          }`}
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
