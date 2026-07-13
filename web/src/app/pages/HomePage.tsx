import { useAuth } from '@/features/auth/useAuth';

export function HomePage() {
  const { user } = useAuth();

  const displayName = user?.email?.split('@')[0] || 'jogador';

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Saudação */}
      <header>
        <p className="text-sm text-slate-400">Bem-vindo de volta</p>
        <h1 className="text-2xl font-bold tracking-tightest text-white sm:text-3xl">{displayName}</h1>
      </header>
    </div>
  );
}
