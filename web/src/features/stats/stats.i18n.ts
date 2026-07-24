import type { TranslationDict } from '@/shared/i18n/translations';

/** Textos da grelha de estatísticas individuais (`StatsGrid`). */
export const statsTranslations = {
  'stats.games': { pt: 'Jogos', en: 'Games' },
  'stats.goals': { pt: 'Golos', en: 'Goals' },
  'stats.assistsShort': { pt: 'Assist.', en: 'Ast.' },
  'stats.wins': { pt: 'Vitórias', en: 'Wins' },
  'stats.winRate': { pt: '% Vitórias', en: 'Win %' },
  'stats.assists': { pt: 'Assistências', en: 'Assists' },
  'stats.saves': { pt: 'Defesas', en: 'Saves' },
  'stats.mvps': { pt: 'MVPs', en: 'MVPs' },
  'stats.flops': { pt: 'Flops', en: 'Flops' },

  // Estado bloqueado (PlayerHeader, PlayerCharts)
  'stats.lock.own': { pt: 'Joga {count} jogos para desbloquear', en: 'Play {count} games to unlock' },
  'stats.lock.other': {
    pt: 'Disponível a partir de {count} jogos',
    en: 'Available from {count} games',
  },

  // PlayerCharts
  'stats.chart.form': { pt: 'Forma', en: 'Form' },
  'stats.chart.lastGames': { pt: 'Últimos {count} jogos', en: 'Last {count} games' },
  'stats.chart.goalsAssists': { pt: 'Golos e assistências', en: 'Goals and assists' },
  'stats.chart.perGame': { pt: 'Por jogo', en: 'Per game' },
  'stats.chart.xpBySource': { pt: 'XP por fonte', en: 'XP by source' },
  'stats.chart.xpSourceHint': { pt: 'De onde vem o XP', en: 'Where the XP comes from' },
  'stats.chart.tooltip': {
    pt: '{goals} golos · {assists} assist.',
    en: '{goals} goals · {assists} assists',
  },
} satisfies TranslationDict;

export type StatsTranslationKey = keyof typeof statsTranslations;
