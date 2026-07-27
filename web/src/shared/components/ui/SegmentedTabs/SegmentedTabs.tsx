import { type ReactNode } from 'react';
import s from './SegmentedTabs.module.css';

interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
}

interface SegmentedTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: TabItem<T>[];
  className?: string;
  size?: 'sm' | 'md';
  /** 'swatch' skips the filled active background so color-swatch labels stay legible. */
  variant?: 'default' | 'swatch';
}

/** Segmented control (tab-style toggle) between mutually exclusive options. */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  items,
  className = '',
  size = 'sm',
  variant = 'default',
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={[
        s.tabs,
        size === 'md' ? s.tabsMd : '',
        variant === 'swatch' ? s.tabsSwatch : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          aria-label={item.ariaLabel}
          aria-pressed={value === item.value}
          className={[
            s.tab,
            size === 'md' ? s.tabMd : '',
            value === item.value ? (variant === 'swatch' ? s.activeSwatch : s.active) : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
