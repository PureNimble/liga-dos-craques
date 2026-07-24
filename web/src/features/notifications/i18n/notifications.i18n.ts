import type { TranslationDict } from '@/shared/i18n/translations';

export const notificationsTranslations = {
  'notifications.title': { pt: 'Notificações', en: 'Notifications' },
  'notifications.subtitle': {
    pt: 'Avisos sobre a tua conta, conquistas e jogos.',
    en: 'Updates about your account, achievements and games.',
  },
  'notifications.markRead': { pt: 'Marcar como lidas', en: 'Mark as read' },
  'notifications.loading': { pt: 'A carregar…', en: 'Loading…' },
  'notifications.empty.title': { pt: 'Sem avisos', en: 'No notifications' },
  'notifications.empty.description': {
    pt: 'Quando houver novidades sobre a tua conta, ficam aqui.',
    en: "When there's news about your account, it shows up here.",
  },

  'settings.push.title': { pt: 'Notificações push', en: 'Push notifications' },
  'settings.push.enabledToast': {
    pt: 'Notificações push ativadas.',
    en: 'Push notifications enabled.',
  },
  'settings.push.disabledToast': {
    pt: 'Notificações push desativadas.',
    en: 'Push notifications disabled.',
  },
  'settings.push.error': { pt: 'Não foi possível ativar: {message}', en: "Couldn't enable: {message}" },
  'settings.push.iosHint': {
    pt: 'No iPhone/iPad, adiciona a Peladinhas ao ecrã principal primeiro (Partilhar → Adicionar ao ecrã principal) para poderes ativar notificações.',
    en: 'On iPhone/iPad, add Peladinhas to your home screen first (Share → Add to Home Screen) to enable notifications.',
  },
} satisfies TranslationDict;

/** Union of all translation keys defined for the `notifications` feature. */
export type NotificationsTranslationKey = keyof typeof notificationsTranslations;
