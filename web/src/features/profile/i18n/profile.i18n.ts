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

  'profile.overall': { pt: 'Geral', en: 'Overall' },
  'profile.attributes': { pt: 'Atributos', en: 'Attributes' },

  'profile.attr.fin': { pt: 'Finalização', en: 'Finishing' },
  'profile.attr.ass': { pt: 'Assistências', en: 'Assists' },
  'profile.attr.def': { pt: 'Defesas', en: 'Saves' },
  'profile.attr.vit': { pt: 'Vitórias', en: 'Wins' },
  'profile.attr.exp': { pt: 'Experiência', en: 'Experience' },
  'profile.attr.mvp': { pt: 'MVP', en: 'MVP' },

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

  'profile.position.gk': { pt: 'Guarda-redes', en: 'Goalkeeper' },
  'profile.position.cb': { pt: 'Defesa central', en: 'Centre-back' },
  'profile.position.rb': { pt: 'Lateral direito', en: 'Right-back' },
  'profile.position.lb': { pt: 'Lateral esquerdo', en: 'Left-back' },
  'profile.position.rwb': { pt: 'Ala direito', en: 'Right wing-back' },
  'profile.position.lwb': { pt: 'Ala esquerdo', en: 'Left wing-back' },
  'profile.position.dm': { pt: 'Médio defensivo', en: 'Defensive midfielder' },
  'profile.position.cm': { pt: 'Médio centro', en: 'Central midfielder' },
  'profile.position.am': { pt: 'Médio ofensivo', en: 'Attacking midfielder' },
  'profile.position.rm': { pt: 'Médio direito', en: 'Right midfielder' },
  'profile.position.lm': { pt: 'Médio esquerdo', en: 'Left midfielder' },
  'profile.position.rw': { pt: 'Extremo direito', en: 'Right winger' },
  'profile.position.lw': { pt: 'Extremo esquerdo', en: 'Left winger' },
  'profile.position.ss': { pt: 'Segundo avançado', en: 'Second striker' },
  'profile.position.st': { pt: 'Ponta de lança', en: 'Striker' },
} satisfies TranslationDict;

/** Valid translation keys for the profile feature. */
export type ProfileTranslationKey = keyof typeof profileTranslations;
