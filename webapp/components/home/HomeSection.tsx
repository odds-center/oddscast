/**
 * Home page section wrapper — based on SectionCard
 */
import SectionCard from '@/components/page/SectionCard';
import type { IconName } from '../icons';

interface HomeSectionProps {
  title: string;
  /** Description below title */
  description?: string;
  icon?: IconName;
  /** View all link (href + label) */
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
  /** Accent style (left golden line) */
  accent?: boolean;
  className?: string;
  /** Info badge next to title (e.g., "6 races") */
  badge?: string | number;
}

export default function HomeSection(props: HomeSectionProps) {
  return <SectionCard {...props} />;
}
