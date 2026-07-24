import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';
import s from './Modal.module.css';

const CLOSE_DISTANCE_RATIO = 0.3;
const CLOSE_VELOCITY = 0.6;
const RESIST_UP = 0.35;
const SNAP_MS = 240;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'center' | 'sheet';
  size?: 'sm' | 'md' | 'lg' | 'auto';
  dismissible?: boolean;
}

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  sm: s.sm,
  md: s.md,
  lg: s.lg,
  auto: s.auto,
};

/** Dialog overlay; renders as a centered panel or, in `sheet` variant, a draggable bottom sheet. */
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
  const dragRef = useRef<{ startY: number; lastY: number; lastTime: number; velocity: number } | null>(
    null,
  );
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && dismissible) onClose();
    }
    document.addEventListener('keydown', onKey);
    document.documentElement.classList.add('modal-open');
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('modal-open');
    };
  }, [open, onClose, dismissible]);

  useEffect(() => {
    if (open) setDragY(0);
  }, [open]);

  if (!open) return null;

  const isSheet = variant === 'sheet';

  function handleGripPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isSheet || !dismissible) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, lastY: e.clientY, lastTime: performance.now(), velocity: 0 };
    setDragging(true);
  }

  function handleGripPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const now = performance.now();
    const dt = now - drag.lastTime;
    if (dt > 0) drag.velocity = (e.clientY - drag.lastY) / dt;
    drag.lastY = e.clientY;
    drag.lastTime = now;
    const delta = e.clientY - drag.startY;
    setDragY(delta >= 0 ? delta : delta * RESIST_UP);
  }

  function handleGripPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!drag) return;
    const delta = e.clientY - drag.startY;
    const offset = delta >= 0 ? delta : delta * RESIST_UP;
    const panelHeight = panelRef.current?.offsetHeight ?? 0;
    const shouldClose = offset > panelHeight * CLOSE_DISTANCE_RATIO || drag.velocity > CLOSE_VELOCITY;
    if (shouldClose) {
      setDragY(panelHeight + 48);
      window.setTimeout(onClose, SNAP_MS);
    } else {
      setDragY(0);
    }
  }

  return createPortal(
    <div
      className={[s.overlay, isSheet ? s.overlaySheet : s.overlayCenter].join(' ')}
      role="dialog"
      aria-modal="true"
    >
      <div className={s.backdrop} onClick={() => dismissible && onClose()} />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={[s.panel, sizeClass[size], isSheet ? s.sheet : s.center].join(' ')}
        style={
          isSheet && dragY !== 0
            ? {
                transform: `translateY(${dragY}px)`,
                transition: dragging ? 'none' : `transform ${SNAP_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              }
            : undefined
        }
      >
        {isSheet && (
          <div
            className={[s.grip, dismissible ? s.gripDraggable : ''].join(' ')}
            onPointerDown={handleGripPointerDown}
            onPointerMove={handleGripPointerMove}
            onPointerUp={handleGripPointerEnd}
            onPointerCancel={handleGripPointerEnd}
          />
        )}

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
