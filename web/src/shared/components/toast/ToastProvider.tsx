import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { CloseIcon } from '@/shared/components/ui/icons';
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

/** Provides toast notifications app-wide; only one toast shows at a time, a new one replaces it. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    clearTimeout(timeoutRef.current);
    setToast({ id: ++counter, message, kind });
    timeoutRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={s.container}>
        {toast && (
          <div key={toast.id} role="status" className={[s.toast, kindClass[toast.kind]].join(' ')}>
            <span className={s.message}>{toast.message}</span>
            <button type="button" className={s.close} aria-label="Fechar" onClick={dismiss}>
              <CloseIcon width={16} height={16} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
