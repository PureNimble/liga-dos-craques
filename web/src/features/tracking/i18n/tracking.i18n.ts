import type { TranslationDict } from '@/shared/i18n/translations';

export const trackingTranslations = {
  'settings.privacy.title': { pt: 'Registo de atividade', en: 'Activity tracking' },
  'settings.privacy.legalNote': {
    pt: 'A Peladinhas regista as páginas que visitas dentro da app para perceber o que é mais usado e continuar a melhorar as suas funcionalidades. Sem cookies de terceiros, sem publicidade. Só o admin vê os totais agregados.',
    en: 'Peladinhas records which pages you visit inside the app to understand what gets used and keep improving its features. No third-party cookies, no ads. Only the admin sees the aggregated totals.',
  },
  'settings.privacy.disabledToast': {
    pt: 'Tracking desligado e histórico apagado.',
    en: 'Tracking turned off and history deleted.',
  },
  'settings.privacy.enabledToast': { pt: 'Obrigado pela ajuda!', en: 'Thanks for the help!' },
  'settings.privacy.saveError': {
    pt: 'Não foi possível guardar: {message}',
    en: "Couldn't save: {message}",
  },

  'consent.title': { pt: 'Ajudas a melhorar a app?', en: 'Help improve the app?' },
  'consent.body': {
    pt: 'Com a tua autorização, registamos que páginas visitas dentro da app — sem cookies de terceiros, sem publicidade e sem sair daqui. Só o admin vê os totais, e podes voltar atrás a qualquer momento em Definições (o histórico é apagado).',
    en: 'With your permission, we log which pages you visit inside the app — no third-party cookies, no ads, and it never leaves here. Only the admin sees the totals, and you can change your mind anytime in Settings (your history gets deleted).',
  },
  'consent.decline': { pt: 'Não, obrigado', en: 'No, thanks' },
  'consent.accept': { pt: 'Aceitar', en: 'Accept' },
  'consent.thanks': { pt: 'Obrigado pela ajuda!', en: 'Thanks for the help!' },
  'consent.declined': {
    pt: 'Não vamos registar a tua utilização.',
    en: "We won't log your usage.",
  },
  'consent.error': { pt: 'Não foi possível guardar: {message}', en: "Couldn't save: {message}" },
} satisfies TranslationDict;

/** Valid translation keys for the tracking feature. */
export type TrackingTranslationKey = keyof typeof trackingTranslations;
