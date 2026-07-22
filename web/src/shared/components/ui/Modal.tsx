import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';
import s from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** No telemóvel, apresenta como "bottom sheet" (desliza de baixo). */
  variant?: 'center' | 'sheet';
  size?: 'sm' | 'md' | 'lg' | 'auto';
  /** Impede fechar ao clicar fora / Esc (ex.: enquanto submete). */
  dismissible?: boolean;
}

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  sm: s.sm,
  md: s.md,
  lg: s.lg,
  auto: s.auto,
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
    // Bloqueia o scroll da página (ver `html.modal-open` no index.css).
    document.documentElement.classList.add('modal-open');
    // Foca o painel para leitores de ecrã / navegação por teclado.
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('modal-open');
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  const isSheet = variant === 'sheet';

  return createPortal(
    <div
      className={[s.overlay, isSheet ? s.overlaySheet : s.overlayCenter].join(' ')}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className={s.backdrop} onClick={() => dismissible && onClose()} />

      {/* Painel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[s.panel, sizeClass[size], isSheet ? s.sheet : s.center].join(' ')}
      >
        {isSheet && <div className={s.grip} />}

        {(title || dismissible) && (
          <div className={s.header}>
            <div className={s.headTitles}>
              {title && <h2 className={s.title}>{title}</h2>}
              {description && <p className={s.description}>{description}</p>}
            </div>
            {dismissible && (
              <button type="button" onClick={onClose} aria-label="Fechar" className={s.close}>
                <CloseIcon width={20} height={20} />
              </button>
            )}
          </div>
        )}

        <div className={s.body}>{children}</div>

        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
