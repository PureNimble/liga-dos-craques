import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './index';
import { AlertIcon } from './icons';
import s from './ConfirmDialog.module.css';

interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Realça a acção de confirmar como destrutiva (vermelho). */
  danger?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Hook para pedir confirmação com um modal (substitui window.confirm):
 *   const confirm = useConfirm();
 *   if (await confirm({ title: '…', danger: true })) { … }
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm tem de estar dentro de <ConfirmProvider>');
  return ctx;
}

interface State extends ConfirmOptions {
  open: boolean;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ open: false, title: '' });
  const resolver = useRef<(v: boolean) => void>();

  const confirm = useCallback<ConfirmFn>((opts) => {
    setState({ ...opts, open: true });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function settle(result: boolean) {
    resolver.current?.(result);
    resolver.current = undefined;
    setState((s) => ({ ...s, open: false }));
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={state.open}
        onClose={() => settle(false)}
        variant="sheet"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              {state.cancelLabel ?? 'Cancelar'}
            </Button>
            <Button variant={state.danger ? 'danger' : 'primary'} onClick={() => settle(true)}>
              {state.confirmLabel ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        <div className={s.content}>
          <div className={[s.icon, state.danger ? s.iconDanger : s.iconNormal].join(' ')}>
            <AlertIcon width={22} height={22} />
          </div>
          <div className={s.text}>
            <h2 className={s.title}>{state.title}</h2>
            {state.message && <p className={s.message}>{state.message}</p>}
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}
