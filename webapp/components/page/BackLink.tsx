import Link from 'next/link';

interface BackLinkProps {
  href: string;
  label: string;
  className?: string;
}

export default function BackLink({ href, label, className = '' }: BackLinkProps) {
  return (
    <Link href={href} className={`block mt-6 text-primary text-sm hover:underline ${className}`}>
      ← {label}
    </Link>
  );
}
