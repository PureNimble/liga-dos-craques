import { OnboardingSteps } from '@/shared/components/ui';
import { BallIcon } from '@/shared/components/ui/icons';
import { ProfileEditModal } from './ProfileEditModal';
import type { FullProfile } from '../hooks/profileHooks';
import s from './ProfileOnboardingPage.module.css';

/** Forced screen shown while the player's profile is missing position, preferred
 *  foot, weight or height; rendered by AppLayout, not a route. First step of the
 *  onboarding flow (profile → group), see `GroupOnboardingPage` for the second. */
export function ProfileOnboardingPage({ profile }: { profile: FullProfile }) {
  return (
    <main className={s.main}>
      <header className={s.header}>
        <span className={s.mark}>
          <BallIcon width={28} height={28} />
        </span>
        <h1 className={s.title}>Peladinhas</h1>
        <p className={s.subtitle}>Falta completar o teu perfil</p>
        <div className={s.steps}>
          <OnboardingSteps current={1} />
        </div>
      </header>

      <ProfileEditModal profile={profile} onClose={() => {}} requireCompletion />
    </main>
  );
}
