interface PageContentProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const maxWidthClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function PageContent({
  children,
  maxWidth = 'xl',
  className = '',
}: PageContentProps) {
  return <div className={`mx-auto w-full ${maxWidthClass[maxWidth]} ${className}`}>{children}</div>;
}
