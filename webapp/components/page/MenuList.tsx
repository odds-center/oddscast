import Link from 'next/link';
import Icon, { IconName } from '../icons';
import { Card, SectionTitle } from '../ui';

interface MenuItemProps {
  href: string;
  icon: IconName;
  label: string;
}

const menuItemClass =
  'flex items-center gap-4 py-4 px-5 rounded-xl text-foreground hover:bg-primary/10 active:bg-primary/15 transition-colors min-h-[56px] touch-manipulation font-medium text-[16px] hover:text-primary';

export function MenuItem({ href, icon, label }: MenuItemProps) {
  return (
    <Link href={href} className={menuItemClass}>
      <Icon name={icon} size={22} strokeWidth={2.5} />
      {label}
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
