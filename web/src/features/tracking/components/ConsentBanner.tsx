import { Button } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { useT } from '@/shared/i18n/useT';
import { useSetAnalyticsConsent } from '../hooks/trackingHooks';
import s from './ConsentBanner.module.css';

/** Consent request banner, shown until the player decides. */
export function ConsentBanner() {
  const setConsent = useSetAnalyticsConsent();
  const toast = useToast();
  const { t } = useT();

  const decide = (granted: boolean) =>
    setConsent.mutate(granted, {
      onSuccess: () => toast.show(granted ? t('consent.thanks') : t('consent.declined')),
      onError: (error) => toast.show(t('consent.error', { message: error.message }), 'error'),
    });

  return (
    <aside className={s.banner} role="dialog" aria-labelledby="consent-title">
      <div className={s.text}>
        <h2 id="consent-title" className={s.title}>
          {t('consent.title')}
        </h2>
        <p className={s.body}>{t('consent.body')}</p>
      </div>
      <div className={s.actions}>
        <Button variant="ghost" onClick={() => decide(false)} disabled={setConsent.isPending}>
          {t('consent.decline')}
        </Button>
        <Button onClick={() => decide(true)} disabled={setConsent.isPending}>
          {t('consent.accept')}
        </Button>
      </div>
    </aside>
  );
}
