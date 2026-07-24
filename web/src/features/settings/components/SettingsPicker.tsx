import { Card, IconButton, Page } from '@/shared/components/ui';
import { CheckIcon, ChevronLeftIcon } from '@/shared/components/ui/icons';
import s from './SettingsPicker.module.css';

interface PickerOption<T extends string> {
  value: T;
  label: string;
}

interface SettingsPickerProps<T extends string> {
  title: string;
  backLabel: string;
  options: PickerOption<T>[];
  value: T;
  onChange: (value: T) => void;
  onBack: () => void;
}

/** Single-choice sub-screen (Appearance/Language on mobile) — a list with a check on the active option. */
export function SettingsPicker<T extends string>({
  title,
  backLabel,
  options,
  value,
  onChange,
  onBack,
}: SettingsPickerProps<T>) {
  return (
    <Page>
      <div className={s.header}>
        <IconButton label={backLabel} onClick={onBack} className={s.back}>
          <ChevronLeftIcon aria-hidden="true" />
        </IconButton>
        <h1 className={s.title}>{title}</h1>
      </div>

      <Card padded={false} className={s.panel}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={s.row}
            onClick={() => {
              onChange(opt.value);
              onBack();
            }}
          >
            <span>{opt.label}</span>
            {value === opt.value && <CheckIcon className={s.check} aria-hidden="true" />}
          </button>
        ))}
      </Card>
    </Page>
  );
}
