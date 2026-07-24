import type { TranslationDict } from '@/shared/i18n/translations';

export const rankingsTranslations = {
  'rankings.title': { pt: 'Rankings', en: 'Rankings' },
  'rankings.loadError': { pt: 'Não foi possível carregar o ranking.', en: "Couldn't load the ranking." },

  'rankings.scope.overall': { pt: 'Geral', en: 'Overall' },
  'rankings.scope.position': { pt: 'Posição', en: 'Position' },
  'rankings.scope.format': { pt: 'Formato', en: 'Format' },
  'rankings.scope.monthly': { pt: 'Mensal', en: 'Monthly' },
  'rankings.scope.annual': { pt: 'Anual', en: 'Annual' },

  'rankings.position.GK': { pt: 'Guarda-redes', en: 'Goalkeepers' },
  'rankings.position.DEF': { pt: 'Defesas', en: 'Defenders' },
  'rankings.position.MID': { pt: 'Médios', en: 'Midfielders' },
  'rankings.position.FWD': { pt: 'Avançados', en: 'Forwards' },

  'rankings.month.1': { pt: 'Janeiro', en: 'January' },
  'rankings.month.2': { pt: 'Fevereiro', en: 'February' },
  'rankings.month.3': { pt: 'Março', en: 'March' },
  'rankings.month.4': { pt: 'Abril', en: 'April' },
  'rankings.month.5': { pt: 'Maio', en: 'May' },
  'rankings.month.6': { pt: 'Junho', en: 'June' },
  'rankings.month.7': { pt: 'Julho', en: 'July' },
  'rankings.month.8': { pt: 'Agosto', en: 'August' },
  'rankings.month.9': { pt: 'Setembro', en: 'September' },
  'rankings.month.10': { pt: 'Outubro', en: 'October' },
  'rankings.month.11': { pt: 'Novembro', en: 'November' },
  'rankings.month.12': { pt: 'Dezembro', en: 'December' },

  'rankings.summary.wdg': { pt: '{games}J · {wins}V · {goals}G', en: '{games}P · {wins}W · {goals}G' },
  'rankings.summary.mvps': { pt: '{summary} · {mvps} MVP', en: '{summary} · {mvps} MVP' },
  'rankings.summary.xp': { pt: '{value} XP', en: '{value} XP' },
  'rankings.summary.points': { pt: '{value} pts', en: '{value} pts' },

  'rankings.empty.title': { pt: 'Ainda não há dados', en: 'No data yet' },
  'rankings.empty.description': {
    pt: 'Este ranking preenche-se assim que houver jogos registados.',
    en: 'This ranking fills in once games have been recorded.',
  },
} satisfies TranslationDict;

/** Valid translation keys for the rankings feature. */
export type RankingsTranslationKey = keyof typeof rankingsTranslations;
