import { SettingsRow, Switch } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { useT } from '@/shared/i18n/useT';
import { useAnalyticsConsent, useSetAnalyticsConsent } from '../hooks/trackingHooks';

interface Props {
  userId: string;
}

/** Estado do consentimento de tracking, com a decisão sempre reversível. */
export function PrivacyCard({ userId }: Props) {
  const { data: consent, isError } = useAnalyticsConsent(userId);
  const setConsent = useSetAnalyticsConsent();
  const toast = useToast();
  const { t } = useT();

  const granted = consent === 'granted';

  const decide = () =>
    setConsent.mutate(!granted, {
      onSuccess: () =>
        toast.show(
          granted ? t('settings.privacy.disabledToast') : t('settings.privacy.enabledToast'),
        ),
      onError: (error) =>
        toast.show(t('settings.privacy.saveError', { message: error.message }), 'error'),
    });

  return (
    <SettingsRow
      label={t('settings.privacy.title')}
      control={
        <Switch
          checked={granted}
          onChange={decide}
          disabled={setConsent.isPending || isError}
          aria-label={t('settings.privacy.title')}
        />
      }
    />
  );
}
