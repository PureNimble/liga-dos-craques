import type { TranslationDict } from '@/shared/i18n/translations';

/** Text for the `/challenges` landing page (Crossbar, Penalties, generic versus/attempts). */
export const challengesTranslations = {
  'challenges.title': { pt: 'Desafios', en: 'Challenges' },
  'challenges.note': {
    pt: 'Área separada — não conta para as estatísticas dos jogos.',
    en: "Separate area — doesn't count towards game stats.",
  },

  'challenges.record.label': { pt: 'Recorde', en: 'Record' },
  'challenges.record.wins': { pt: '{count} vitórias', en: '{count} wins' },
  'challenges.record.empty': { pt: 'Ainda sem registos.', en: 'No records yet.' },

  'challenges.ranking.title': { pt: 'Ranking', en: 'Ranking' },
  'challenges.history.title': { pt: 'Histórico recente', en: 'Recent history' },
  'challenges.history.fallbackName': { pt: 'Jogador', en: 'Player' },

  'challenges.result.win': { pt: 'Vitória', en: 'Win' },
  'challenges.result.loss': { pt: 'Derrota', en: 'Loss' },
  'challenges.result.draw': { pt: 'Empate', en: 'Draw' },
  'challenges.result.na': { pt: '—', en: '—' },

  'challenges.stats.winsShort': { pt: '{count}V', en: '{count}W' },
  'challenges.stats.record': {
    pt: '{wins}V-{losses}D · {games} jogos',
    en: '{wins}W-{losses}L · {games} games',
  },
  'challenges.stats.attempts': { pt: '{count} tentativas', en: '{count} attempts' },

  'challenges.session.status.setup': { pt: 'Por começar', en: 'Not started' },
  'challenges.session.status.active': { pt: 'A decorrer', en: 'In progress' },
  'challenges.session.status.finished': { pt: 'Terminada', en: 'Finished' },
  'challenges.session.deleteConfirmTitle': {
    pt: 'Apagar esta sessão?',
    en: 'Delete this session?',
  },
  'challenges.session.delete': { pt: 'Apagar sessão', en: 'Delete session' },

  'challenges.sessions.ongoing': { pt: 'Sessões a decorrer', en: 'Ongoing sessions' },
  'challenges.sessions.player': { pt: 'jogador', en: 'player' },
  'challenges.sessions.players': { pt: 'jogadores', en: 'players' },

  'challenges.crossbar.newSession': {
    pt: 'Nova sessão de Crossbar',
    en: 'New Crossbar session',
  },
  'challenges.crossbar.variant.quick': { pt: 'Rápida', en: 'Quick' },
  'challenges.crossbar.variant.long': { pt: 'Longa', en: 'Long' },
  'challenges.crossbar.spotsCount': { pt: '{count} posições', en: '{count} spots' },

  'challenges.penalty.newSession': {
    pt: 'Nova sessão de Penáltis',
    en: 'New Penalty Kicks session',
  },
  'challenges.penalty.entry.goals.label': { pt: 'Mais penáltis', en: 'Most penalties' },
  'challenges.penalty.entry.goals.hint': {
    pt: 'X rondas; ganha quem marcar mais. No difícil, o jogo escolhe a zona.',
    en: 'X rounds; whoever scores the most wins. On hard, the game picks the zone.',
  },
  'challenges.penalty.entry.zones.label': { pt: 'Preencher zonas', en: 'Fill the zones' },
  'challenges.penalty.entry.zones.hint': {
    pt: 'Escolhe a zona e marca; ganha o 1º a preencher as 6.',
    en: 'Pick the zone and score; first to fill all 6 wins.',
  },
  'challenges.penalty.mode.pen_goals': { pt: 'Mais golos', en: 'Most goals' },
  'challenges.penalty.mode.pen_zones': { pt: 'Preencher zonas', en: 'Fill the zones' },
  'challenges.penalty.mode.pen_target': { pt: 'Zona sorteada', en: 'Random zone' },

  'challenges.form.title': { pt: 'Registar tentativa', en: 'Log attempt' },
  'challenges.form.playerLabel': { pt: 'Jogador', en: 'Player' },
  'challenges.form.opponentLabel': { pt: 'Adversário', en: 'Opponent' },
  'challenges.form.resultLabel': { pt: 'Resultado', en: 'Result' },
  'challenges.form.scoreLabel': { pt: 'Pontuação', en: 'Score' },
  'challenges.form.scoreHint': { pt: 'Ex.: nº de acertos/golos', en: 'E.g.: number of hits/goals' },
  'challenges.form.choose': { pt: 'Escolher…', en: 'Choose…' },
  'challenges.form.submit': { pt: 'Registar', en: 'Log' },
  'challenges.form.error.player': { pt: 'Escolhe o jogador.', en: 'Choose the player.' },
  'challenges.form.error.opponent': { pt: 'Escolhe o adversário.', en: 'Choose the opponent.' },
  'challenges.form.error.opponentSame': {
    pt: 'O adversário tem de ser diferente.',
    en: 'The opponent must be different.',
  },
  'challenges.form.error.submit': {
    pt: 'Não foi possível registar a tentativa.',
    en: "Couldn't log the attempt.",
  },
} satisfies TranslationDict;

/** Valid translation keys for the challenges feature. */
export type ChallengesTranslationKey = keyof typeof challengesTranslations;
