import type { TranslationDict } from '@/shared/i18n/translations';

/** Textos da página de Definições (exceto Privacidade, que vive em tracking). */
export const settingsTranslations = {
  'settings.title': { pt: 'Definições', en: 'Settings' },
  'settings.back': { pt: 'Voltar', en: 'Back' },

  'settings.section.account': { pt: 'Conta', en: 'Account' },
  'settings.section.appearance': { pt: 'Aparência', en: 'Appearance' },
  'settings.section.notifications': { pt: 'Notificações', en: 'Notifications' },
  'settings.section.privacy': { pt: 'Privacidade', en: 'Privacy' },
  'settings.section.support': { pt: 'Suporte', en: 'Support' },

  'settings.account.change': { pt: 'Mudar', en: 'Change' },
  'settings.account.username.title': { pt: 'Nome de utilizador', en: 'Username' },
  'settings.account.password.title': { pt: 'Password', en: 'Password' },
  'settings.account.email.title': { pt: 'Email', en: 'Email' },

  'settings.appearance.title': { pt: 'Aparência', en: 'Appearance' },
  'settings.appearance.light': { pt: 'Claro', en: 'Light' },
  'settings.appearance.dark': { pt: 'Escuro', en: 'Dark' },
  'settings.appearance.system': { pt: 'Sistema', en: 'System' },

  'settings.language.title': { pt: 'Idioma', en: 'Language' },

  'settings.help.title': { pt: 'Ajuda', en: 'Help' },
  'settings.help.report': { pt: 'Reportar problema', en: 'Report a problem' },

  'settings.help.faq.xp.q': { pt: 'Como ganho XP?', en: 'How do I earn XP?' },
  'settings.help.faq.xp.a': {
    pt: 'O XP fica registado por jogo assim que é fechado — não é preciso pedir nada, é automático. Vês o total e o nível no teu perfil.',
    en: "XP is recorded per game as soon as it's closed — nothing to request, it's automatic. Your total and level show up on your profile.",
  },

  'settings.help.faq.groups.q': { pt: 'Como mudo de grupo?', en: 'How do I switch groups?' },
  'settings.help.faq.groups.a': {
    pt: 'Usa o seletor de grupo no topo (junto ao teu avatar). Para entrar num grupo novo precisas de um código de convite, a menos que o grupo seja público.',
    en: "Use the group switcher at the top (next to your avatar). Joining a new group needs an invite code, unless it's a public group.",
  },

  'settings.help.faq.challenges.q': {
    pt: 'Como funcionam os desafios (Crossbar, Penáltis, Golos Icónicos)?',
    en: 'How do the challenges (Crossbar, Penalties, Iconic Goals) work?',
  },
  'settings.help.faq.challenges.a': {
    pt: 'Crossbar e Penáltis são sessões ao vivo entre jogadores — o ranking conta vitórias, não pontos. Golos Icónicos é individual: rodas um carrossel para tentares replicar um golo histórico.',
    en: 'Crossbar and Penalties are live sessions between players — the ranking counts wins, not points. Iconic Goals is solo: you spin a carousel and try to replicate a historic goal.',
  },

  'settings.help.faq.reopenGame.q': {
    pt: 'Fechei um jogo com dados errados, como corrijo?',
    en: 'I closed a game with wrong data — how do I fix it?',
  },
  'settings.help.faq.reopenGame.a': {
    pt: 'Pede a um admin do grupo para reabrir o jogo. O XP já atribuído é estornado e recalculado quando o jogo for fechado de novo com os dados certos.',
    en: 'Ask a group admin to reopen the game. Any XP already given is reversed and recalculated once the game is closed again with the right data.',
  },

  'settings.help.faq.stillStuck.q': {
    pt: 'Não encontraste a resposta que procuravas?',
    en: "Didn't find what you were looking for?",
  },
  'settings.help.faq.stillStuck.a': {
    pt: 'Usa "Reportar problema" logo abaixo — a mensagem chega diretamente a quem trata da app.',
    en: 'Use "Report a problem" right below — the message goes straight to whoever runs the app.',
  },

  'settings.session.title': { pt: 'Sessão', en: 'Session' },
  'settings.session.signOut': { pt: 'Terminar sessão', en: 'Sign out' },
  'settings.session.confirmTitle': { pt: 'Terminar sessão?', en: 'Sign out?' },
  'settings.session.confirmMessage': {
    pt: 'Vais precisar de iniciar sessão novamente.',
    en: "You'll need to sign in again.",
  },
  'settings.session.confirmLabel': { pt: 'Sair', en: 'Sign out' },
} satisfies TranslationDict;

export type SettingsTranslationKey = keyof typeof settingsTranslations;
