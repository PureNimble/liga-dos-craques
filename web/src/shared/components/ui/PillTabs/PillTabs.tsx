import { type ReactNode } from 'react';
import s from './PillTabs.module.css';

interface PillTabsProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: ReactNode }[];
  className?: string;
}

export function PillTabs<T extends string | number>({
  value,
  onChange,
  items,
  className = '',
}: PillTabsProps<T>) {
  return (
    <div className={[s.pills, className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={[s.pill, value === item.value ? s.active : ''].filter(Boolean).join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
