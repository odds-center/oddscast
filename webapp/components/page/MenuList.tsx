import Link from 'next/link';
import Icon, { IconName } from '../icons';

interface MenuItemProps {
  href: string;
  icon: IconName;
  label: string;
}

const menuItemClass =
  'link-primary flex items-center gap-3 py-4 px-3 rounded-xl hover:bg-primary/5 active:bg-primary/10 transition-colors min-h-[48px] touch-manipulation';

export function MenuItem({ href, icon, label }: MenuItemProps) {
  return (
    <Link href={href} className={menuItemClass}>
      <Icon name={icon} size={20} />
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
    <section className={`card ${className}`}>
      {title && <h3 className='text-foreground font-semibold mb-3'>{title}</h3>}
      <div className='space-y-1'>
        {items.map((item) => (
          <MenuItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
        ))}
      </div>
    </section>
  );
}
