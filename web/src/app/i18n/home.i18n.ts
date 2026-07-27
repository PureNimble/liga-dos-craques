import type { TranslationDict } from '@/shared/i18n/translations';

/** Translation strings for the Home screen. */
export const homeTranslations = {
  'home.welcome': { pt: 'Bem-vindo de volta', en: 'Welcome back' },
  'home.fallbackName': { pt: 'jogador', en: 'player' },
  'home.hero.confirmed': {
    pt: '{count} de {max} confirmados',
    en: '{count} of {max} confirmed',
  },
  'home.hero.noGame.cta': { pt: 'Sem jogo marcado', en: 'No match scheduled' },
  'home.hero.noGame.action': { pt: 'Marcar jogo', en: 'Schedule a match' },
  'home.hero.cta': { pt: 'Ver jogo', en: 'View match' },
  'home.hero.badge': { pt: 'Próximo jogo', en: 'Next match' },
  'home.hero.vs': { pt: 'vs', en: 'vs' },
  'home.season.levelLabel': { pt: 'Nível', en: 'Level' },
  'home.season.position': { pt: '{position}º lugar no grupo', en: '#{position} in the group' },
  'home.quick.games': { pt: 'Jogos', en: 'Games' },
  'home.quick.games.subtitle': { pt: 'Próximos e resultados', en: 'Upcoming and results' },
  'home.quick.rankings': { pt: 'Classificação', en: 'Rankings' },
  'home.quick.rankings.subtitle': { pt: 'Tabela do grupo', en: 'Group table' },
  'home.quick.challenges': { pt: 'Desafios', en: 'Challenges' },
  'home.quick.challenges.subtitle': {
    pt: 'Crossbar, penáltis e mais',
    en: 'Crossbar, penalties and more',
  },
  'home.quick.places': { pt: 'Campos', en: 'Fields' },
  'home.quick.places.subtitle': { pt: 'Locais de jogo', en: 'Game locations' },
  'home.ranking.title': { pt: 'Classificação', en: 'Rankings' },
  'home.ranking.seeAll': { pt: 'Ver tudo', en: 'See all' },
  'home.ranking.empty': { pt: 'Ainda sem jogos no grupo.', en: 'No games in the group yet.' },
  'home.results.title': { pt: 'Últimos resultados', en: 'Recent results' },
  'home.results.empty': { pt: 'Ainda sem jogos disputados.', en: 'No games played yet.' },
  'home.spotlight.week.title': { pt: 'Jogador da semana', en: 'Player of the week' },
  'home.spotlight.month.title': { pt: 'Jogador do mês', en: 'Player of the month' },
  'home.spotlight.seeAll': { pt: 'Ver todos', en: 'See all' },
  'home.spotlight.empty': { pt: 'Ainda sem destaque este mês.', en: 'No spotlight yet this month.' },
  'home.spotlight.goals': { pt: '{count} golos', en: '{count} goals' },
  'home.spotlight.assists': { pt: '{count} assist.', en: '{count} assists' },
  'home.spotlight.goalsLabel': { pt: 'Golos', en: 'Goals' },
  'home.spotlight.assistsLabel': { pt: 'Assistências', en: 'Assists' },
  'home.fixtures.title': { pt: 'Próximos jogos', en: 'Upcoming fixtures' },
  'home.fixtures.seeAll': { pt: 'Ver calendário', en: 'View calendar' },
  'home.fixtures.empty': { pt: 'Sem jogos marcados.', en: 'No games scheduled.' },
  'home.fixtures.home': { pt: 'Casa', en: 'Home' },
  'home.fixtures.away': { pt: 'Fora', en: 'Away' },
  'home.news.title': { pt: 'Notícias em destaque', en: 'Featured news' },
  'home.news.seeAll': { pt: 'Ver todas', en: 'See all' },
  'home.news.item1.title': {
    pt: 'Liga dos Craques estreia nova época',
    en: 'Liga dos Craques kicks off a new season',
  },
  'home.news.item1.date': { pt: '24 jul', en: 'Jul 24' },
  'home.achievements.title': { pt: 'Conquistas', en: 'Achievements' },
  'home.achievements.count': { pt: '{count}/{max}', en: '{count}/{max}' },
  'home.achievements.label': {
    pt: 'conquistas desbloqueadas',
    en: 'achievements unlocked',
  },
} satisfies TranslationDict;

/** Valid translation keys for the Home screen. */
export type HomeTranslationKey = keyof typeof homeTranslations;
