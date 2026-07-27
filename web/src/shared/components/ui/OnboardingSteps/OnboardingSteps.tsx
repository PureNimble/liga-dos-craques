import { CheckIcon } from '../icons';
import s from './OnboardingSteps.module.css';

const STEPS = [
  { step: 1, label: 'Perfil' },
  { step: 2, label: 'Grupo' },
] as const;

/** Step indicator (1. Perfil → 2. Grupo) shown atop the forced onboarding screens,
 *  so completing the profile and joining/creating a group read as one flow. */
export function OnboardingSteps({ current }: { current: 1 | 2 }) {
  return (
    <ol className={s.steps}>
      {STEPS.map(({ step, label }, i) => {
        const done = step < current;
        const active = step === current;
        return (
          <li key={step} className={s.step}>
            <span className={`${s.dot}${done ? ` ${s.dotDone}` : ''}${active ? ` ${s.dotActive}` : ''}`}>
              {done ? <CheckIcon width={14} height={14} /> : step}
            </span>
            <span className={`${s.label}${active ? ` ${s.labelActive}` : ''}`}>{label}</span>
            {i < STEPS.length - 1 && (
              <span className={`${s.connector}${done ? ` ${s.connectorDone}` : ''}`} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
