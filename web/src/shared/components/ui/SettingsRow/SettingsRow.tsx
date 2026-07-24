import { type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { ChevronRightIcon } from '../icons';
import s from './SettingsRow.module.css';

interface SettingsRowProps {
  label: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'secondary' | 'danger';
  navigational?: boolean;
  disabled?: boolean;
  control?: ReactNode;
  mobileValue?: ReactNode;
  onMobileTap?: () => void;
  arrowStyle?: boolean;
}

/** A Settings row: label on the left, action on the right; collapses to a tappable row with a chevron on mobile. */
export function SettingsRow({
  label,
  actionLabel,
  onAction,
  actionVariant = 'secondary',
  navigational = true,
  disabled = false,
  control,
  mobileValue,
  onMobileTap,
  arrowStyle = false,
}: SettingsRowProps) {
  const tapHandler = onMobileTap ?? onAction;
  const hidesControlOnMobile = Boolean(control && onMobileTap);

  return (
    <div className={s.row}>
      <div className={s.text}>
        <h2 className={[s.label, actionVariant === 'danger' ? s.danger : ''].join(' ')}>{label}</h2>
      </div>

      {control && (
        <div className={[s.control, hidesControlOnMobile ? s.controlDesktopOnly : ''].join(' ')}>
          {control}
        </div>
      )}

      {!control && onAction && !arrowStyle && (
        <div className={s.desktopControl}>
          <Button
            variant={actionVariant}
            className={s.actionButton}
            disabled={disabled}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      )}

      {tapHandler && (
        <button
          type="button"
          className={[s.mobileTap, arrowStyle ? s.alwaysTap : ''].join(' ')}
          disabled={disabled}
          onClick={tapHandler}
          aria-label={actionLabel ?? undefined}
        >
          {mobileValue && <span className={s.mobileValue}>{mobileValue}</span>}
          {navigational && <ChevronRightIcon className={s.chevron} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
