import s from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

/** Interruptor on/off (ex.: consentimento de tracking). */
export function Switch({ checked, onChange, disabled = false, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[s.switch, checked ? s.on : ''].filter(Boolean).join(' ')}
      {...props}
    >
      <span className={s.knob} />
    </button>
  );
}
