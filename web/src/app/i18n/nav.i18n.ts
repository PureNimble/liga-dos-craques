import type { TranslationDict } from '@/shared/i18n/translations';

/** Textos da navegação (Navbar, NavDrawer, GroupRail) — cromo sempre visível. */
export const navTranslations = {
  'nav.home': { pt: 'Início', en: 'Home' },
  'nav.games': { pt: 'Jogos', en: 'Games' },
  'nav.rankings': { pt: 'Rankings', en: 'Rankings' },
  'nav.challenges': { pt: 'Desafios', en: 'Challenges' },
  'nav.places': { pt: 'Campos', en: 'Fields' },
  'nav.profile': { pt: 'Perfil', en: 'Profile' },
  'nav.admin': { pt: 'Admin', en: 'Admin' },
  'nav.notifications': { pt: 'Notificações', en: 'Notifications' },
  'nav.settings': { pt: 'Definições', en: 'Settings' },

  'navDrawer.ariaLabel': { pt: 'Navegação', en: 'Navigation' },
  'navDrawer.close': { pt: 'Fechar', en: 'Close' },
  'navDrawer.groups': { pt: 'Grupos', en: 'Groups' },
  'navDrawer.addGroup': { pt: '+ Adicionar grupo', en: '+ Add group' },
  'navDrawer.manageGroup': { pt: 'Gerir {name}', en: 'Manage {name}' },
  'navDrawer.reportProblem': { pt: 'Reportar problema', en: 'Report a problem' },
  'navDrawer.signOut': { pt: 'Terminar sessão', en: 'Sign out' },

  'navbar.viewProfile': { pt: 'Ver perfil', en: 'View profile' },
  'navbar.openMenu': { pt: 'Abrir menu', en: 'Open menu' },
  'navbar.openMenuUnread': { pt: 'Abrir menu ({count} por ler)', en: 'Open menu ({count} unread)' },
} satisfies TranslationDict;

export type NavTranslationKey = keyof typeof navTranslations;
