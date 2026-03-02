import { Card } from '@/components/ui';

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper for auth pages: card with title and optional description.
 * Use for login, register, forgot-password, reset-password.
 */
export default function AuthCard({
  title,
  description,
  children,
  className = '',
}: AuthCardProps) {
  return (
    <Card as='section' className={`auth-card ${className}`.trim()}>
      <header className='mb-6'>
        <h1 className='text-xl font-semibold text-foreground tracking-tight'>
          {title}
        </h1>
        {description && (
          <p className='mt-1.5 text-sm text-text-secondary'>
            {description}
          </p>
        )}
      </header>
      {children}
    </Card>
  );
}
