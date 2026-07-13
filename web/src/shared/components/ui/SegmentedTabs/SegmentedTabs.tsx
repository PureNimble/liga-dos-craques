import { type ReactNode } from 'react';
import s from './SegmentedTabs.module.css';

interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: TabItem<T>[];
  className?: string;
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  items,
  className = '',
}: SegmentedTabsProps<T>) {
  return (
    <div className={[s.tabs, className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={[s.tab, value === item.value ? s.active : ''].filter(Boolean).join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
