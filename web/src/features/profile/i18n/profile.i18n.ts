import type { TranslationDict } from '@/shared/i18n/translations';

/**
 * Textos do cromo da página de Perfil, incluindo `PlayerHeader`. `PlayerCard`
 * (cardStats.ts) usa códigos abreviados estilo FIFA (FIN/ASS/DEF/VIT/EXP/MVP,
 * GR/DEF/MED/AVA) — mantidos como estão de propósito, não são frases a traduzir.
 */
export const profileTranslations = {
  'profile.loadError': {
    pt: 'Não foi possível carregar o teu perfil.',
    en: "Couldn't load your profile.",
  },
  'profile.editProfile': { pt: 'Editar perfil', en: 'Edit profile' },
  'profile.password': { pt: 'Password', en: 'Password' },
  'profile.statsTitle': { pt: 'Estatísticas', en: 'Stats' },

  // PlayerHeader
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

  // PlayerDetailPage
  'profile.detail.back': { pt: 'Voltar', en: 'Back' },
  'profile.detail.notFound': { pt: 'Jogador não encontrado.', en: 'Player not found.' },
} satisfies TranslationDict;

export type ProfileTranslationKey = keyof typeof profileTranslations;
