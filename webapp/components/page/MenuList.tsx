import Link from 'next/link';
import Icon, { IconName } from '../icons';
import { Card, SectionTitle } from '../ui';

interface MenuItemProps {
  href: string;
  icon: IconName;
  label: string;
}

const menuItemClass =
  'flex items-center gap-4 py-4 px-4 rounded-xl text-foreground hover:bg-stone-50 active:bg-stone-100 transition-colors min-h-[56px] touch-manipulation font-medium text-[16px] -webkit-tap-highlight-color-transparent';

export function MenuItem({ href, icon, label }: MenuItemProps) {
  return (
    <Link href={href} className={menuItemClass}>
      <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-stone-50 shrink-0'>
        <Icon name={icon} size={20} strokeWidth={2} className='text-stone-500' />
      </span>
      <span className='flex-1'>{label}</span>
      <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
    </Link>
  );
}

interface MenuListProps {
  items: Array<{ href: string; icon: IconName; label: string }>;
  title?: string;
  className?: string;
}

export default function MenuList({ items, title, className = '' }: MenuListProps) {
  return (
    <Card as='section' className={className}>
      {title && <SectionTitle title={title} />}
      <div className='divide-y divide-[var(--border)]'>
        {items.map((item) => (
          <MenuItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
        ))}
      </div>
    </Card>
  );
}
