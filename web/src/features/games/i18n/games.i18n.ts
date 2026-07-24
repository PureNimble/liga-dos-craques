import type { TranslationDict } from '@/shared/i18n/translations';

export const gamesTranslations = {
  'games.title': { pt: 'Jogos', en: 'Games' },
  'games.create': { pt: 'Criar jogo', en: 'Create game' },
  'games.createFirst': { pt: 'Criar o primeiro', en: 'Create the first one' },
  'games.tab.upcoming': { pt: 'Próximos', en: 'Upcoming' },
  'games.tab.past': { pt: 'Anteriores', en: 'Past' },
  'games.loadError': { pt: 'Não foi possível carregar os jogos.', en: "Couldn't load games." },
  'games.empty.upcoming.title': { pt: 'Sem jogos por jogar', en: 'No games scheduled' },
  'games.empty.upcoming.description': {
    pt: 'Marca o próximo jogo e convoca a malta.',
    en: 'Schedule the next game and call up the group.',
  },
  'games.empty.past.title': {
    pt: 'Ainda não há jogos passados',
    en: 'No past games yet',
  },
  'games.empty.past.description': {
    pt: 'Os jogos concluídos aparecem aqui.',
    en: 'Finished games show up here.',
  },
  'games.createModal.title': { pt: 'Criar jogo', en: 'Create game' },
  'games.createModal.description': {
    pt: 'Marca a data, o formato e convoca a malta.',
    en: 'Set the date and format, and call up the group.',
  },

  'games.status.draft': { pt: 'Rascunho', en: 'Draft' },
  'games.status.scheduled': { pt: 'Agendado', en: 'Scheduled' },
  'games.status.open': { pt: 'Inscrições abertas', en: 'Registrations open' },
  'games.status.teams_generated': { pt: 'Equipas geradas', en: 'Teams generated' },
  'games.status.in_progress': { pt: 'A decorrer', en: 'In progress' },
  'games.status.finished': { pt: 'Terminado', en: 'Finished' },
  'games.status.voting_open': { pt: 'Votação aberta', en: 'Voting open' },
  'games.status.closed': { pt: 'Fechado', en: 'Closed' },
  'games.status.cancelled': { pt: 'Cancelado', en: 'Cancelled' },
  'games.transition.scheduled': { pt: 'Agendar', en: 'Schedule' },
  'games.transition.open': { pt: 'Abrir inscrições', en: 'Open registrations' },
  'games.transition.teams_generated': { pt: 'Gerar equipas', en: 'Generate teams' },
  'games.transition.in_progress': { pt: 'Iniciar jogo', en: 'Start game' },
  'games.transition.finished': { pt: 'Terminar jogo', en: 'Finish game' },
  'games.transition.closed': { pt: 'Fechar (sem votação)', en: 'Close (no voting)' },
  'games.transition.cancelled': { pt: 'Cancelar jogo', en: 'Cancel game' },

  'games.detail.live': { pt: 'Ao vivo', en: 'Live' },
  'games.detail.notFound': { pt: 'Jogo não encontrado.', en: 'Game not found.' },
  'games.detail.backToGames': { pt: '← Voltar aos jogos', en: '← Back to games' },
  'games.detail.back': { pt: 'Jogos', en: 'Games' },
  'games.detail.manageGame': { pt: 'Gerir jogo', en: 'Manage game' },
  'games.detail.events': { pt: 'Eventos', en: 'Events' },
  'games.detail.reviewNotice': {
    pt: 'Fase de revisão: adiciona ou corrige eventos em falta. Ao apurar o MVP/Flop, os eventos ficam fechados.',
    en: 'Review phase: add or fix missing events. Once MVP/Flop is resolved, events are locked.',
  },
  'games.detail.eventsClosed': {
    pt: 'Jogo apurado - os eventos estão fechados.',
    en: 'Game resolved - events are closed.',
  },
  'games.detail.cancelTitle': { pt: 'Cancelar este jogo?', en: 'Cancel this game?' },
  'games.detail.cancelMessage': {
    pt: 'Os jogadores convocados serão notificados. Esta ação não pode ser revertida.',
    en: "Called-up players will be notified. This action can't be undone.",
  },
  'games.detail.cancelConfirm': { pt: 'Cancelar jogo', en: 'Cancel game' },
  'games.detail.closeTitle': { pt: 'Fechar o jogo?', en: 'Close the game?' },
  'games.detail.closeMessage': {
    pt: 'O jogo será fechado e o XP atribuído. Esta ação é definitiva.',
    en: 'The game will be closed and XP awarded. This action is final.',
  },
  'games.detail.closeConfirm': { pt: 'Fechar jogo', en: 'Close game' },
  'games.detail.closeRegistrationsTitle': {
    pt: 'Encerrar inscrições?',
    en: 'Close registrations?',
  },
  'games.detail.closeRegistrationsChanged': {
    pt: '{count} inscritos → o formato desce para {format}. Vou ajustar o jogo e formar equipas equilibradas.',
    en: '{count} registered → format drops to {format}. I’ll adjust the game and form balanced teams.',
  },
  'games.detail.closeRegistrationsSame': {
    pt: '{count} inscritos · formato {format}. Vou formar equipas equilibradas; os excedentes ficam no banco.',
    en: '{count} registered · {format} format. I’ll form balanced teams; anyone extra goes to the bench.',
  },
  'games.detail.closeRegistrationsConfirm': { pt: 'Encerrar e formar', en: 'Close and form teams' },
  'games.detail.manageTitle': { pt: 'Gerir jogo', en: 'Manage game' },
  'games.detail.editDetails': { pt: 'Editar detalhes', en: 'Edit details' },
  'games.detail.lockedNote': {
    pt: 'O jogo já começou - os detalhes estão bloqueados.',
    en: 'The game has already started - details are locked.',
  },
  'games.detail.closeRegistrationsAndForm': {
    pt: 'Encerrar inscrições e formar equipas',
    en: 'Close registrations and form teams',
  },
  'games.detail.currentResult': {
    pt: 'Resultado atual (dos eventos)',
    en: 'Current result (from events)',
  },
  'games.detail.finishGame': { pt: 'Terminar jogo', en: 'Finish game' },
  'games.detail.resolveAwards': { pt: 'Apurar MVP/Flop', en: 'Resolve MVP/Flop' },
  'games.detail.noActions': {
    pt: 'Sem ações disponíveis neste estado.',
    en: 'No actions available in this state.',
  },
  'games.detail.editTitle': { pt: 'Editar jogo', en: 'Edit game' },
  'games.detail.updateError': {
    pt: 'Não foi possível atualizar o estado.',
    en: "Couldn't update the status.",
  },

  'games.roster.title': { pt: 'Jogadores', en: 'Players' },
  'games.roster.count': { pt: '{count} inscritos · {confirmed} conf.', en: '{count} joined · {confirmed} conf.' },
  'games.roster.subs': { pt: '{count} supl.', en: '{count} subs' },
  'games.roster.empty': { pt: 'Ainda ninguém está inscrito.', en: 'No one has joined yet.' },
  'games.roster.addError': {
    pt: 'Não foi possível adicionar o jogador.',
    en: "Couldn't add the player.",
  },
  'games.roster.removeError': {
    pt: 'Não foi possível remover o jogador.',
    en: "Couldn't remove the player.",
  },
  'games.roster.fallbackName': { pt: 'Jogador', en: 'Player' },
  'games.roster.status.invited': { pt: 'Convidado', en: 'Invited' },
  'games.roster.status.confirmed': { pt: 'Confirmado', en: 'Confirmed' },
  'games.roster.status.played': { pt: 'Jogou', en: 'Played' },
  'games.roster.status.no_show': { pt: 'Faltou', en: 'No-show' },
  'games.roster.confirm': { pt: 'Confirmar', en: 'Confirm' },
  'games.roster.unconfirm': { pt: 'Desmarcar', en: 'Withdraw' },
  'games.roster.remove': { pt: 'Remover', en: 'Remove' },
  'games.roster.invitePlaceholder': { pt: 'Convidar jogador…', en: 'Invite player…' },
  'games.roster.invite': { pt: 'Convidar', en: 'Invite' },
  'games.roster.alreadyIn': { pt: 'Estás neste jogo.', en: "You're in this game." },
  'games.roster.joinMe': { pt: 'Inscrever-me', en: 'Join' },

  // NextGameTeaser
  'games.nextGameTeaser.noGames': { pt: 'Sem jogos', en: 'No games' },
  'games.nextGameTeaser.nextGame': { pt: 'Próximo jogo:', en: 'Next game:' },

} satisfies TranslationDict;

/** Union of all translation keys defined for the `games` feature. */
export type GamesTranslationKey = keyof typeof gamesTranslations;
