import type { TranslationDict } from '@/shared/i18n/translations';
import { authTranslations } from '@/features/auth/i18n/auth.i18n';
import { settingsTranslations } from '@/features/settings/i18n/settings.i18n';
import { trackingTranslations } from '@/features/tracking/i18n/tracking.i18n';
import { notificationsTranslations } from '@/features/notifications/i18n/notifications.i18n';
import { profileTranslations } from '@/features/profile/i18n/profile.i18n';
import { gamesTranslations } from '@/features/games/i18n/games.i18n';
import { teamsTranslations } from '@/features/teams/i18n/teams.i18n';
import { rankingsTranslations } from '@/features/rankings/i18n/rankings.i18n';
import { challengesTranslations } from '@/features/challenges/i18n/challenges.i18n';
import { adminTranslations } from '@/features/admin/i18n/admin.i18n';
import { xpTranslations } from '@/features/xp/i18n/xp.i18n';
import { statsTranslations } from '@/features/stats/i18n/stats.i18n';
import { achievementsTranslations } from '@/features/achievements/i18n/achievements.i18n';
import { placesTranslations } from '@/features/places/i18n/places.i18n';
import { navTranslations } from '../i18n/nav.i18n';
import { homeTranslations } from '../i18n/home.i18n';

/** Combines every feature's translation dictionary into one registry for `I18nProvider`. */
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
