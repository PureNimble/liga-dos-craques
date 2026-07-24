import type { TranslationDict } from '@/shared/i18n/translations';

/** Textos das páginas de autenticação (login, registo, recuperação, nova password). */
export const authTranslations = {
  'auth.login.title': { pt: 'Entra na tua conta', en: 'Sign in to your account' },
  'auth.login.error': { pt: 'Credenciais inválidas.', en: 'Invalid credentials.' },
  'auth.login.identifier': {
    pt: 'Email ou nome de utilizador',
    en: 'Email or username',
  },
  'auth.login.password': { pt: 'Password', en: 'Password' },
  'auth.login.submit': { pt: 'Entrar', en: 'Sign in' },
  'auth.login.forgot': { pt: 'Esqueci-me da password', en: 'I forgot my password' },
  'auth.login.noAccount': { pt: 'Ainda não tens conta?', en: "Don't have an account yet?" },
  'auth.login.createOne': { pt: 'Cria uma', en: 'Create one' },

  'auth.signup.title': { pt: 'Cria a tua conta', en: 'Create your account' },
  'auth.signup.confirmSent': {
    pt: 'Conta criada! Confirma o teu email através do link que enviámos e depois inicia sessão.',
    en: 'Account created! Confirm your email using the link we sent, then sign in.',
  },
  'auth.signup.name': { pt: 'Nome', en: 'Name' },
  'auth.signup.username': { pt: 'Nome de utilizador', en: 'Username' },
  'auth.signup.usernameHint': {
    pt: 'Único — minúsculas, números e _.',
    en: 'Unique — lowercase, numbers and _.',
  },
  'auth.signup.usernameTaken': {
    pt: 'Esse nome de utilizador já está a ser usado.',
    en: 'That username is already taken.',
  },
  'auth.signup.email': { pt: 'Email', en: 'Email' },
  'auth.signup.password': { pt: 'Password', en: 'Password' },
  'auth.signup.passwordHint': { pt: 'Mínimo 8 caracteres', en: 'Minimum 8 characters' },
  'auth.signup.submit': { pt: 'Criar conta', en: 'Create account' },
  'auth.signup.hasAccount': { pt: 'Já tens conta?', en: 'Already have an account?' },
  'auth.signup.signIn': { pt: 'Entra', en: 'Sign in' },

  'auth.recover.title': { pt: 'Recuperar password', en: 'Recover password' },
  'auth.recover.sent': {
    pt: 'Se existir uma conta com esse email, enviámos um link para definires uma nova password.',
    en: "If there's an account with that email, we sent a link to set a new password.",
  },
  'auth.recover.email': { pt: 'Email', en: 'Email' },
  'auth.recover.submit': { pt: 'Enviar link de recuperação', en: 'Send recovery link' },
  'auth.recover.note': {
    pt: 'Se o email não chegar, pede a um administrador para repor a tua password.',
    en: "If the email doesn't arrive, ask an admin to reset your password.",
  },
  'auth.recover.backToLogin': { pt: 'Voltar ao início de sessão', en: 'Back to sign in' },

  'auth.updatePassword.title': { pt: 'Definir nova password', en: 'Set a new password' },
  'auth.updatePassword.done': {
    pt: 'Password atualizada. A redirecionar…',
    en: 'Password updated. Redirecting…',
  },
  'auth.updatePassword.newPassword': { pt: 'Nova password', en: 'New password' },
  'auth.updatePassword.passwordHint': { pt: 'Mínimo 8 caracteres', en: 'Minimum 8 characters' },
  'auth.updatePassword.confirmPassword': { pt: 'Confirmar password', en: 'Confirm password' },
  'auth.updatePassword.submit': { pt: 'Guardar password', en: 'Save password' },
} satisfies TranslationDict;

export type AuthTranslationKey = keyof typeof authTranslations;
