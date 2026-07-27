import type { TranslationDict } from '@/shared/i18n/translations';

export const teamsTranslations = {
  'teams.title': { pt: 'Equipas', en: 'Teams' },
  'teams.rebalance': { pt: 'Rebalancear', en: 'Rebalance' },
  'teams.generateError': {
    pt: 'Não foi possível equilibrar as equipas.',
    en: "Couldn't balance the teams.",
  },
  'teams.emptyAuto': {
    pt: 'As equipas formam-se automaticamente à medida que a malta confirma presença.',
    en: 'Teams form automatically as people confirm.',
  },
  'teams.team': { pt: 'Equipa {team}', en: 'Team {team}' },
  'teams.formationPrefix': { pt: 'Formação ·', en: 'Formation ·' },
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
  'teams.rename': { pt: 'Renomear equipa', en: 'Rename team' },
  'teams.renameSave': { pt: 'Guardar', en: 'Save' },
  'teams.renameCancel': { pt: 'Cancelar', en: 'Cancel' },
  'teams.logo.change': { pt: 'Mudar logótipo', en: 'Change logo' },
  'teams.logo.errorType': { pt: 'Escolhe um ficheiro de imagem.', en: 'Pick an image file.' },
  'teams.logo.errorSize': {
    pt: 'Imagem demasiado grande (máx. 8 MB).',
    en: 'Image too large (max 8 MB).',
  },
  'teams.logo.errorUpload': { pt: 'Falha no upload.', en: 'Upload failed.' },
  'teams.captainAbbr': { pt: 'C', en: 'C' },
  'teams.goalkeeperAbbr': { pt: 'GR', en: 'GK' },
  'teams.equipment.title': { pt: 'Equipamento', en: 'Equipment' },
} satisfies TranslationDict;

/** Valid translation keys for the teams feature. */
export type TeamsTranslationKey = keyof typeof teamsTranslations;
