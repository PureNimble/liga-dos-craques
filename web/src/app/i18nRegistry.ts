import type { TranslationDict } from '@/shared/i18n/translations';
import { authTranslations } from '@/features/auth/auth.i18n';
import { settingsTranslations } from '@/features/settings/settings.i18n';
import { trackingTranslations } from '@/features/tracking/tracking.i18n';
import { notificationsTranslations } from '@/features/notifications/notifications.i18n';
import { profileTranslations } from '@/features/profile/profile.i18n';
import { gamesTranslations } from '@/features/games/games.i18n';
import { teamsTranslations } from '@/features/teams/teams.i18n';
import { rankingsTranslations } from '@/features/rankings/rankings.i18n';
import { challengesTranslations } from '@/features/challenges/challenges.i18n';
import { adminTranslations } from '@/features/admin/admin.i18n';
import { xpTranslations } from '@/features/xp/xp.i18n';
import { statsTranslations } from '@/features/stats/stats.i18n';
import { achievementsTranslations } from '@/features/achievements/achievements.i18n';
import { placesTranslations } from '@/features/places/places.i18n';
import { navTranslations } from './nav.i18n';
import { homeTranslations } from './home.i18n';

/**
 * Junta o dicionário de cada feature num só registo, para o `I18nProvider`
 * (`shared/i18n/`, que não pode depender de `features/`). Cada feature dona
 * do seu ficheiro `*.i18n.ts` — este ficheiro só agrega, não define texto.
 */
export const i18nRegistry: TranslationDict = {
  ...navTranslations,
  ...homeTranslations,
  ...authTranslations,
  ...settingsTranslations,
  ...trackingTranslations,
  ...notificationsTranslations,
  ...profileTranslations,
  ...gamesTranslations,
  ...teamsTranslations,
  ...rankingsTranslations,
  ...challengesTranslations,
  ...adminTranslations,
  ...xpTranslations,
  ...statsTranslations,
  ...achievementsTranslations,
  ...placesTranslations,
};
