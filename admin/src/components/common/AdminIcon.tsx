import type { LucideIcon } from 'lucide-react';

interface AdminIconProps {
  icon: LucideIcon;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * lucide-react 아이콘을 감싸서 Next.js Hydration 오류를 방지합니다.
 * suppressHydrationWarning으로 서버/클라이언트 SVG 렌더링 차이를 허용합니다.
 */
export function AdminIcon({ icon: Icon, className, ...props }: AdminIconProps) {
  return (
    <span suppressHydrationWarning>
      <Icon className={className} aria-hidden="true" {...props} />
    </span>
  );
}
