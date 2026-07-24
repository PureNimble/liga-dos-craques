import { SettingsRow, Switch } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { useT } from '@/shared/i18n/useT';
import { pushSupported, useDisablePush, useEnablePush, usePushSubscriptionStatus } from './pushHooks';

interface Props {
  userId: string;
}

const isStandalone =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Ativa/desativa notificações push neste dispositivo (Web Push, sempre reversível). */
export function PushNotificationsCard({ userId }: Props) {
  const { data: enabled, isError } = usePushSubscriptionStatus();
  const enablePush = useEnablePush(userId);
  const disablePush = useDisablePush();
  const toast = useToast();
  const { t } = useT();

  if (!pushSupported) return null;

  const decide = () => {
    if (enabled) {
      disablePush.mutate(undefined, {
        onSuccess: () => toast.show(t('settings.push.disabledToast')),
        onError: (error) =>
          toast.show(t('settings.push.error', { message: error.message }), 'error'),
      });
      return;
    }
    enablePush.mutate(undefined, {
      onSuccess: () => toast.show(t('settings.push.enabledToast')),
      onError: (error) => {
        if (isIos && !isStandalone) {
          toast.show(t('settings.push.iosHint'), 'error');
          return;
        }
        toast.show(t('settings.push.error', { message: error.message }), 'error');
      },
    });
  };

  return (
    <SettingsRow
      label={t('settings.push.title')}
      control={
        <Switch
          checked={Boolean(enabled)}
          onChange={decide}
          disabled={enablePush.isPending || disablePush.isPending || isError}
          aria-label={t('settings.push.title')}
        />
      }
    />
  );
}
