import type { TranslationDict } from '@/shared/i18n/translations';

/** `PlayerCard` (cardStats.ts) uses FIFA-style abbreviation codes (FIN/ASS/DEF/…) — those are intentional and not meant for translation. */
export const profileTranslations = {
  'profile.loadError': {
    pt: 'Não foi possível carregar o teu perfil.',
    en: "Couldn't load your profile.",
  },
  'profile.editProfile': { pt: 'Editar perfil', en: 'Edit profile' },
  'profile.password': { pt: 'Password', en: 'Password' },
  'profile.statsTitle': { pt: 'Estatísticas', en: 'Stats' },

  'profile.header.avgRating': { pt: 'Nota média', en: 'Average rating' },
  'profile.header.avgRatingCaption': {
    pt: 'Média das avaliações por jogo',
    en: 'Average rating per game',
  },
  'profile.header.games': { pt: '{count} jogos', en: '{count} games' },
  'profile.header.foot': { pt: 'Pé {foot}', en: '{foot} foot' },
  'profile.foot.left': { pt: 'esquerdo', en: 'left' },
  'profile.foot.right': { pt: 'direito', en: 'right' },
  'profile.foot.both': { pt: 'ambidextro', en: 'ambidextrous' },

  'profile.detail.back': { pt: 'Voltar', en: 'Back' },
  'profile.detail.notFound': { pt: 'Jogador não encontrado.', en: 'Player not found.' },
} satisfies TranslationDict;

/** Valid translation keys for the profile feature. */
export type ProfileTranslationKey = keyof typeof profileTranslations;
