/**
 * 홈 페이지 섹션 래퍼 — SectionCard 기반
 */
import SectionCard from '@/components/page/SectionCard';
import type { IconName } from '../icons';

interface HomeSectionProps {
  title: string;
  /** 제목 아래 설명 */
  description?: string;
  icon?: IconName;
  /** 더보기 링크 (href + label) */
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
  /** accent 스타일 (좌측 금색 라인) */
  accent?: boolean;
  className?: string;
  /** 제목 옆 인포 뱃지 (예: "6경기") */
  badge?: string | number;
}

export default function HomeSection(props: HomeSectionProps) {
  return <SectionCard {...props} />;
}
