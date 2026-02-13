import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className='flex items-center justify-between'>
      <div>
        <h1 className='text-xl font-bold text-gray-900'>{title}</h1>
        {description && <p className='mt-1 text-sm text-gray-600'>{description}</p>}
      </div>
      {children}
    </div>
  );
}
