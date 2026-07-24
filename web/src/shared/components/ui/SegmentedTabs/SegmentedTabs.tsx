import { type ReactNode } from 'react';
import s from './SegmentedTabs.module.css';

interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  /** Necessário quando `label` não é texto (ex.: um ícone). */
  ariaLabel?: string;
}

interface SegmentedTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: TabItem<T>[];
  className?: string;
  /** `sm` (por omissão) é o padrão de barra de navegação; `md` iguala o tamanho de `Button`. */
  size?: 'sm' | 'md';
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  items,
  className = '',
  size = 'sm',
}: SegmentedTabsProps<T>) {
  return (
    <div className={[s.tabs, size === 'md' ? s.tabsMd : '', className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          aria-label={item.ariaLabel}
          aria-pressed={value === item.value}
          className={[s.tab, size === 'md' ? s.tabMd : '', value === item.value ? s.active : '']
            .filter(Boolean)
            .join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
