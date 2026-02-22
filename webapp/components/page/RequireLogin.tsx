import { ReactNode } from 'react';
import Link from 'next/link';
import Icon from '../icons';
import { routes } from '@/lib/routes';

interface RequireLoginProps {
  /** Link text (default: login) */
  linkText?: string;
  /** Suffix — default: can be viewed */
  suffix?: string;
  /** Action — additional CTA like button (takes priority if provided) */
  action?: ReactNode;
  /** Whether to show login button (default true, only applies when action is not provided) */
  showLoginButton?: boolean;
  className?: string;
}

/**
 * Message to display when login is required
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
      <Link href={routes.auth.login} className='btn-primary inline-flex items-center gap-1.5 px-4 py-2'>
        <Icon name='LogIn' size={18} />
        {linkText}
      </Link>
    ) : null);

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <p className='text-text-secondary text-[16px] leading-relaxed'>
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
