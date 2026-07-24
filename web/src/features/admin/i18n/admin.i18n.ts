import type { TranslationDict } from '@/shared/i18n/translations';

export const adminTranslations = {
  'admin.brand': { pt: 'Administração', en: 'Administration' },
  'admin.nav.dashboard': { pt: 'Dashboard', en: 'Dashboard' },
  'admin.nav.manage': { pt: 'Gerir', en: 'Manage' },
  'admin.nav.comingSoon': { pt: 'Brevemente', en: 'Coming soon' },
  'admin.backToApp': { pt: 'Voltar à app', en: 'Back to app' },

  'admin.section.players.label': { pt: 'Jogadores', en: 'Players' },
  'admin.section.players.description': {
    pt: 'Gerir contas, funções e reposição de password.',
    en: 'Manage accounts, roles and password resets.',
  },
  'admin.section.games.label': { pt: 'Jogos & eventos', en: 'Games & events' },
  'admin.section.games.description': {
    pt: 'Corrigir, cancelar ou apagar jogos.',
    en: 'Fix, cancel or delete games.',
  },
  'admin.section.goals.label': { pt: 'Golos icónicos', en: 'Iconic goals' },
  'admin.section.goals.description': {
    pt: 'Criar e editar os golos do desafio.',
    en: 'Create and edit the challenge goals.',
  },
  'admin.section.achievements.label': { pt: 'Conquistas', en: 'Achievements' },
  'admin.section.achievements.description': {
    pt: 'Definições de conquistas e critérios.',
    en: 'Achievement definitions and criteria.',
  },
  'admin.section.reference.label': { pt: 'Dados de referência', en: 'Reference data' },
  'admin.section.reference.description': {
    pt: 'Formatos, posições, tipos de evento e tags.',
    en: 'Formats, positions, event types and tags.',
  },
  'admin.section.reports.label': { pt: 'Reportes de bugs', en: 'Bug reports' },
  'admin.section.reports.description': {
    pt: 'Problemas reportados pela malta.',
    en: 'Problems reported by the group.',
  },
  'admin.section.analytics.label': { pt: 'Analytics', en: 'Analytics' },
  'admin.section.analytics.description': {
    pt: 'Atividade, adesão e tendências ao longo do tempo.',
    en: 'Activity, adoption and trends over time.',
  },
  'admin.section.system.label': { pt: 'Sistema', en: 'System' },
  'admin.section.system.description': {
    pt: 'Estado da ligação, backfill e regras de XP.',
    en: 'Connection status, backfill and XP rules.',
  },

  'admin.dashboard.onlineUsers': { pt: 'Utilizadores online', en: 'Online users' },
  'admin.dashboard.server': { pt: 'Servidor', en: 'Server' },
  'admin.dashboard.server.connecting': { pt: 'A ligar…', en: 'Connecting…' },
  'admin.dashboard.server.online': { pt: 'Online', en: 'Online' },
  'admin.dashboard.server.offline': { pt: 'Offline', en: 'Offline' },
  'admin.dashboard.metric.players': { pt: 'Jogadores', en: 'Players' },
  'admin.dashboard.metric.games': { pt: 'Jogos', en: 'Games' },
  'admin.dashboard.metric.openReports': { pt: 'Reportes por resolver', en: 'Open reports' },
  'admin.dashboard.activity': { pt: 'Atividade', en: 'Activity' },
  'admin.dashboard.last12Months': { pt: 'últimos 12 meses', en: 'last 12 months' },
  'admin.dashboard.series.newPlayers': { pt: 'Novos jogadores', en: 'New players' },
  'admin.dashboard.series.games': { pt: 'Jogos', en: 'Games' },
  'admin.dashboard.series.goals': { pt: 'Golos', en: 'Goals' },
  'admin.dashboard.gamesByFormat': { pt: 'Jogos por formato', en: 'Games by format' },
  'admin.dashboard.gamesByWeekday': { pt: 'Jogos por dia da semana', en: 'Games by weekday' },
  'admin.dashboard.noGames': { pt: 'Sem jogos.', en: 'No games.' },
  'admin.dashboard.noData': { pt: 'Sem dados no período.', en: 'No data for this period.' },
} satisfies TranslationDict;

/** Union of every translation key defined in `adminTranslations`. */
export type AdminTranslationKey = keyof typeof adminTranslations;
