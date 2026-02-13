import Icon, { IconName } from '../icons';

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: IconName;
  accent?: boolean;
  className?: string;
}

export default function SectionCard({ children, title, icon, accent, className = '' }: SectionCardProps) {
  return (
    <section
      className={`card ${accent ? 'border-l-4 border-l-primary' : ''} ${className}`}
    >
      {title && (
        <h3 className='text-foreground font-semibold mb-3 flex items-center gap-2'>
          {icon && (
            <span className='inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10'>
              <Icon name={icon} size={18} className='text-primary' strokeWidth={2} />
            </span>
          )}
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}
