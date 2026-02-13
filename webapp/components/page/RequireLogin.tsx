import { ReactNode } from 'react';
import Link from 'next/link';
import Icon from '../icons';
import { routes } from '@/lib/routes';

interface RequireLoginProps {
  /** 링크 텍스트 (기본: 로그인) */
  linkText?: string;
  /** suffix — 기본: 확인할 수 있습니다 */
  suffix?: string;
  /** action — 버튼 등 추가 CTA (action 있으면 우선 사용) */
  action?: ReactNode;
  /** 로그인 버튼 노출 여부 (기본 true, action 없을 때만 적용) */
  showLoginButton?: boolean;
  className?: string;
}

/**
 * 로그인 필요 시 표시할 메시지
 */
export default function RequireLogin({
  linkText = '로그인',
  suffix = '확인할 수 있습니다',
  action,
  showLoginButton = true,
  className = '',
}: RequireLoginProps) {
  const button =
    action ??
    (showLoginButton ? (
      <Link href={routes.auth.login} className='btn-primary inline-flex items-center gap-2 px-6 py-3'>
        <Icon name='LogIn' size={18} />
        {linkText}
      </Link>
    ) : null);

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <p className='text-text-secondary text-sm'>
        <Link href={routes.auth.login} className='link-primary'>
          {linkText}
        </Link>
        {' '}
        후 {suffix}.
      </p>
      {button}
    </div>
  );
}
