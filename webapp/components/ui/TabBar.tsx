/**
 * Shared segment-style tab bar component
 * Consistent compact style used in profile/edit, races/[id], predictions/matrix, etc.
 */
export interface TabOption<T extends string = string> {
  value: T;
  label: string;
}

export type TabBarVariant = 'filled' | 'subtle';
export type TabBarSize = 'sm' | 'md';

export interface TabBarProps<T extends string = string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: TabBarVariant;
  size?: TabBarSize;
  className?: string;
}

const tabBarClass = 'flex rounded-xl border border-border';
const tabBarFilled = 'bg-background-elevated';
const tabBarSubtle = 'bg-card';
const sizeSm = 'gap-1 p-1.5';
const sizeMd = 'gap-2 p-1';
const btnSm = 'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ease touch-manipulation';
const btnMd = 'flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ease touch-manipulation';
const filledActive = 'bg-stone-700 text-white';
const filledInactive = 'text-text-secondary hover:text-foreground';
const subtleActive = 'bg-background text-foreground shadow-sm';
const subtleInactive = 'text-text-secondary hover:text-foreground';

export default function TabBar<T extends string = string>({
  options,
  value,
  onChange,
  variant = 'subtle',
  size = 'sm',
  className = '',
}: TabBarProps<T>) {
  const isFilled = variant === 'filled';
  const isMd = size === 'md';
  const activeClass = isFilled ? filledActive : subtleActive;
  const inactiveClass = isFilled ? filledInactive : subtleInactive;
  const barClass = [tabBarClass, isFilled ? tabBarFilled : tabBarSubtle, isMd ? sizeMd : sizeSm].join(' ');
  const btnClass = isMd ? btnMd : btnSm;

  return (
    <div className={`${barClass} ${className}`.trim()}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type='button'
          onClick={() => onChange(opt.value)}
          className={`${btnClass} ${value === opt.value ? activeClass : inactiveClass}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
