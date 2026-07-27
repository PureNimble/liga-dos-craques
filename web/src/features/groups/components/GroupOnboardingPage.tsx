import { OnboardingSteps } from '@/shared/components/ui';
import { BallIcon } from '@/shared/components/ui/icons';
import { GroupChooser } from './GroupChooser';
import s from './GroupOnboardingPage.module.css';

/** Forced screen shown while the player belongs to no group; rendered by AppLayout,
 *  not a route. Second step of the onboarding flow (profile → group), see
 *  `ProfileOnboardingPage` for the first. */
export function GroupOnboardingPage() {
  return (
    <main className={s.main}>
      <header className={s.header}>
        <span className={s.mark}>
          <BallIcon width={28} height={28} />
        </span>
        <h1 className={s.title}>Peladinhas</h1>
        <p className={s.subtitle}>Falta só um grupo</p>
        <div className={s.steps}>
          <OnboardingSteps current={2} />
        </div>
      </header>

      <GroupChooser />
    </main>
  );
}
