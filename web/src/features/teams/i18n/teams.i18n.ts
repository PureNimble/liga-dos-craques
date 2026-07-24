import type { TranslationDict } from '@/shared/i18n/translations';

export const teamsTranslations = {
  'teams.title': { pt: 'Equipas', en: 'Teams' },
  'teams.regenerate': { pt: 'Regenerar', en: 'Regenerate' },
  'teams.generate': { pt: 'Gerar equipas', en: 'Generate teams' },
  'teams.generateError': {
    pt: 'Não foi possível gerar as equipas.',
    en: "Couldn't generate teams.",
  },
  'teams.emptyManageable': {
    pt: 'Ainda não há equipas. Gera equipas equilibradas automaticamente.',
    en: 'No teams yet. Generate balanced teams automatically.',
  },
  'teams.emptyLocked': {
    pt: 'As equipas ainda não foram geradas.',
    en: 'Teams haven’t been generated yet.',
  },
  'teams.team': { pt: 'Equipa {team}', en: 'Team {team}' },
  'teams.formation': { pt: 'Formação · Equipa {team}', en: 'Formation · Team {team}' },
  'teams.formationCustom': { pt: 'Personalizada', en: 'Custom' },
  'teams.autoFill': { pt: 'Auto-preencher', en: 'Auto-fill' },
  'teams.dragHint': {
    pt: 'ou arrasta um jogador para mover ou trocar',
    en: 'or drag a player to move or swap',
  },
  'teams.ratingDiff': { pt: 'Diferença de rating: {diff}', en: 'Rating difference: {diff}' },
  'teams.unassigned': { pt: 'Por atribuir', en: 'Unassigned' },
  'teams.fallbackName': { pt: 'Jogador', en: 'Player' },
  'teams.bench': { pt: 'Banco', en: 'Bench' },
  'teams.subHint': {
    pt: 'Escolhe o titular que sai (toca num jogador em campo)',
    en: 'Pick who comes off (tap a player on the pitch)',
  },
  'teams.subCancel': { pt: 'cancelar', en: 'cancel' },
} satisfies TranslationDict;

/** Valid translation keys for the teams feature. */
export type TeamsTranslationKey = keyof typeof teamsTranslations;
