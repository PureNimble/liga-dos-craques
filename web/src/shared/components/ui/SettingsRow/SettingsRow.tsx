import { type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { ChevronRightIcon } from '../icons';
import s from './SettingsRow.module.css';

interface SettingsRowProps {
  label: ReactNode;
  /** Botão visível no desktop; no mobile a linha toda fica clicável com seta. */
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'secondary' | 'danger';
  /** Ação terminal (ex.: terminar sessão) em vez de navegação — sem seta no mobile. */
  navigational?: boolean;
  disabled?: boolean;
  /** Controlo sempre visível no desktop (ex.: toggle/switch). No mobile continua
   * visível, a menos que `onMobileTap` esteja definido — nesse caso dá lugar
   * a uma linha clicável com resumo + seta (drill-down para um subecrã). */
  control?: ReactNode;
  /** Valor atual mostrado antes da seta na linha mobile (ex.: "Automático"). */
  mobileValue?: ReactNode;
  /** Handler do tap mobile quando difere do desktop (ex.: abrir um subecrã em
   * vez do botão/controlo do desktop). Por omissão usa `onAction`. */
  onMobileTap?: () => void;
  /** Usa a linha clicável com seta também no desktop, em vez do botão — para
   * ações de navegação (ex.: abrir um modal/subecrã) sem alternativa a botão. */
  arrowStyle?: boolean;
}

/**
 * Uma linha de Definições: rótulo à esquerda, ação à direita. No desktop a
 * ação é um botão (ou controlo) de tamanho fixo; no mobile vira uma linha
 * inteira clicável com seta (padrão de lista de definições nativo).
 */
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
