import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import s from './Toast.module.css';

/** Visual/semantic kind of a toast message. */
export type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

/** Shape of the toast context: exposes `show` to trigger a toast. */
export interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const kindClass: Record<ToastKind, string> = {
  success: s.success,
  error: s.error,
  info: s.info,
};

let counter = 0;

/** Provides toast notifications app-wide and renders the active toast stack. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={s.container}>
        {toasts.map((t) => (
          <div key={t.id} role="status" className={[s.toast, kindClass[t.kind]].join(' ')}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
