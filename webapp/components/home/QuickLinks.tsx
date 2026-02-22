/**
 * Quick links grid — home main navigation
 */
import Link from 'next/link';
import Icon, { type IconName } from '../icons';
import { routes } from '@/lib/routes';

export interface QuickLinkItem {
  href: string;
  label: string;
  icon: IconName;
  description?: string;
}

const DEFAULT_LINKS: QuickLinkItem[] = [
  { href: routes.home, label: '경주', icon: 'Flag', description: '실시간 경주 목록' },
  { href: routes.results, label: '결과', icon: 'TrendingUp', description: '경주 결과 조회' },
  { href: routes.predictions.matrix, label: '종합 예상', icon: 'BarChart2', description: '용산종합지 스타일' },
  { href: routes.ranking, label: '랭킹', icon: 'Medal', description: '예측 적중 순위' },
  { href: routes.mypage.subscriptions, label: '구독', icon: 'Crown', description: '예측권 구독' },
  { href: routes.profile.index, label: '내 정보', icon: 'User', description: '프로필·설정' },
];

interface QuickLinksProps {
  items?: QuickLinkItem[];
  columns?: 2 | 3 | 6;
}

export default function QuickLinks({ items = DEFAULT_LINKS, columns = 3 }: QuickLinksProps) {
  const gridClass =
    columns === 2 ? 'grid-cols-2' : columns === 6 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-3 sm:gap-4`}>
      {items.map(({ href, label, icon, description }) => (
        <Link
          key={href}
          href={href}
          className='card card-hover flex flex-col items-center justify-center gap-2 py-6 px-4 text-center touch-manipulation group'
        >
          <span className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 group-hover:bg-stone-200 transition-colors shrink-0'>
            <Icon name={icon} size={24} className='text-stone-500' strokeWidth={2} />
          </span>
          <span className='font-semibold text-foreground group-hover:text-stone-700 transition-colors'>{label}</span>
          {description && <span className='text-xs text-text-secondary'>{description}</span>}
        </Link>
      ))}
    </div>
  );
}
