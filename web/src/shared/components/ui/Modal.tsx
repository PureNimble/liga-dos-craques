import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** No telemóvel, apresenta como "bottom sheet" (desliza de baixo). */
  variant?: 'center' | 'sheet';
  size?: 'sm' | 'md' | 'lg';
  /** Impede fechar ao clicar fora / Esc (ex.: enquanto submete). */
  dismissible?: boolean;
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'center',
  size = 'md',
  dismissible = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Fecha com Esc + bloqueia scroll do body enquanto aberto.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && dismissible) onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    // Foca o painel para leitores de ecrã / navegação por teclado.
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  const isSheet = variant === 'sheet';

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex ${
        isSheet ? 'items-end sm:items-center' : 'items-center'
      } justify-center`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
        onClick={() => dismissible && onClose()}
      />

      {/* Painel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden border border-navy-700 bg-navy-900 shadow-modal outline-none ${SIZES[size]} ${
          isSheet
            ? 'animate-slide-up rounded-t-2xl pb-safe sm:animate-scale-in sm:rounded-2xl'
            : 'mx-4 animate-scale-in rounded-2xl'
        }`}
      >
        {isSheet && (
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-navy-700 sm:hidden" />
        )}

        {(title || dismissible) && (
          <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-slate-400">{description}</p>}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-navy-800 hover:text-white"
              >
                <CloseIcon width={20} height={20} />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-navy-800 bg-navy-900/60 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
