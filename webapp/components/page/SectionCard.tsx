import { Card, SectionTitle } from '../ui';
import type { IconName } from '../icons';

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: IconName;
  accent?: boolean;
  className?: string;
}

export default function SectionCard({ children, title, icon, accent, className = '' }: SectionCardProps) {
  return (
    <Card as='section' variant={accent ? 'accent' : 'default'} className={className}>
      {title && <SectionTitle title={title} icon={icon} />}
      {children}
    </Card>
  );
}
