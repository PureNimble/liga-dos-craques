import type { TranslationDict } from '@/shared/i18n/translations';

export const profileTranslations = {
  'profile.loadError': {
    pt: 'Não foi possível carregar o teu perfil.',
    en: "Couldn't load your profile.",
  },
  'profile.editProfile': { pt: 'Editar perfil', en: 'Edit profile' },
  'profile.password': { pt: 'Password', en: 'Password' },
  'profile.statsTitle': { pt: 'Estatísticas gerais', en: 'General stats' },
  'profile.season.title': { pt: 'Esta época', en: 'This season' },
  'profile.viewAll': { pt: 'Ver todas', en: 'View all' },

  'profile.tabs.perfil': { pt: 'Perfil', en: 'Profile' },
  'profile.tabs.estatisticas': { pt: 'Estatísticas', en: 'Stats' },
  'profile.tabs.historico': { pt: 'Histórico', en: 'History' },
  'profile.tabs.conquistas': { pt: 'Conquistas', en: 'Achievements' },
  'profile.tabs.jogos': { pt: 'Jogos', en: 'Games' },

  'profile.header.avgRating': { pt: 'Nota média', en: 'Average rating' },
  'profile.header.avgRatingCaption': {
    pt: 'Média das avaliações por jogo',
    en: 'Average rating per game',
  },
  'profile.header.goalsPerGame': { pt: 'Golos/jogo', en: 'Goals/game' },
  'profile.foot.left': { pt: 'esquerdo', en: 'left' },
  'profile.foot.right': { pt: 'direito', en: 'right' },
  'profile.foot.both': { pt: 'ambidextro', en: 'ambidextrous' },

  'profile.hero.level': { pt: 'Nível {level}', en: 'Level {level}' },
  'profile.hero.xpToNext': {
    pt: '+{count} XP para o nível seguinte',
    en: '+{count} XP to next level',
  },
  'profile.hero.maxLevel': { pt: 'Nível máximo', en: 'Max level' },

  'profile.positions.title': { pt: 'Posições', en: 'Positions' },
  'profile.positions.main': { pt: 'Posição principal', en: 'Main position' },
  'profile.positions.secondary': { pt: 'Posições secundárias', en: 'Secondary positions' },
  'profile.positions.none': { pt: 'Nenhuma', en: 'None' },

  'profile.about.title': { pt: 'Sobre', en: 'About' },
  'profile.about.fullName': { pt: 'Nome completo', en: 'Full name' },
  'profile.about.birthDate': { pt: 'Data de nascimento', en: 'Date of birth' },
  'profile.about.foot': { pt: 'Pé preferido', en: 'Preferred foot' },
  'profile.about.height': { pt: 'Altura', en: 'Height' },
  'profile.about.locality': { pt: 'Localidade', en: 'Location' },
  'profile.about.memberSince': { pt: 'Membro desde', en: 'Member since' },

  'profile.compare.title': { pt: 'Comparar jogador', en: 'Compare player' },
  'profile.compare.placeholder': { pt: 'Pesquisar jogador…', en: 'Search player…' },
  'profile.compare.compare': { pt: 'Comparar', en: 'Compare' },
  'profile.compare.vs': { pt: 'vs', en: 'vs' },

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
