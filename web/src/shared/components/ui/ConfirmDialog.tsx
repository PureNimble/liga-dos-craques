import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './index';
import { AlertIcon } from './icons';

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
        <div className="flex gap-3.5 pt-1">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              state.danger ? 'bg-red-500/15 text-red-400' : 'bg-pitch-500/15 text-pitch-400'
            }`}
          >
            <AlertIcon width={22} height={22} />
          </div>
          <div className="pt-0.5">
            <h2 className="text-base font-bold text-white">{state.title}</h2>
            {state.message && <p className="mt-1 text-sm text-slate-400">{state.message}</p>}
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}
