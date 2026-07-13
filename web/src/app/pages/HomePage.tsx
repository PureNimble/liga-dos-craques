import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useProfile } from '@/features/profile/useProfile';
import { usePlayerStats } from '@/features/stats/useStats';
import { StatsGrid } from '@/features/stats/StatsGrid';
import { usePlayerXp } from '@/features/xp/useXp';
import { XpBar } from '@/features/xp/XpBar';
import { ConnectionStatus } from '@/features/health/ConnectionStatus';
import { Avatar, Card } from '@/components/ui';
import { BallIcon, TrophyIcon, ChevronRightIcon } from '@/components/ui/icons';

const quickActions = [
  { to: '/games', label: 'Ver jogos', hint: 'Próximos e resultados', icon: BallIcon },
  { to: '/rankings', label: 'Rankings', hint: 'Classificações da malta', icon: TrophyIcon },
];

export function HomePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: stats } = usePlayerStats(profile?.id);
  const { data: xp } = usePlayerXp(profile?.id);

  const displayName = profile?.name || user?.email?.split('@')[0] || 'jogador';

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Saudação */}
      <header className="flex items-center gap-3.5">
        <Link to="/profile" aria-label="Ver perfil" className="shrink-0">
          <Avatar name={profile?.name} src={profile?.photo_url} size="lg" />
        </Link>
        <div>
          <p className="text-sm text-slate-400">Bem-vindo de volta</p>
          <h1 className="text-2xl font-bold tracking-tightest text-white sm:text-3xl">{displayName}</h1>
        </div>
      </header>

      {xp && <XpBar xp={xp} />}

      {stats && stats.games > 0 && (
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">O teu resumo</h2>
            <Link
              to="/profile"
              className="flex items-center gap-0.5 text-xs font-semibold text-pitch-400 hover:text-pitch-300"
            >
              Ver tudo <ChevronRightIcon width={14} height={14} />
            </Link>
          </div>
          <StatsGrid stats={stats} compact />
        </section>
      )}

      {/* Novo jogador: onboarding */}
      {(!stats || stats.games === 0) && (
        <Card className="bg-gradient-to-br from-pitch-900/40 to-navy-900">
          <h2 className="font-bold text-white">Começa por aqui</h2>
          <p className="mt-1 text-sm text-slate-300">
            Completa o teu perfil (posições, pé preferido, dados físicos) para que o gerador de
            equipas te encaixe bem.
          </p>
          <Link
            to="/profile"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-pitch-500 px-4 py-2.5 text-sm font-semibold text-navy-975 shadow-glow transition hover:bg-pitch-400"
          >
            Completar perfil <ChevronRightIcon width={16} height={16} />
          </Link>
        </Card>
      )}

      {/* Acessos rápidos */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Acessos rápidos</h2>
        {quickActions.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card interactive className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-pitch-400">
                <a.icon width={22} height={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-100">{a.label}</p>
                <p className="text-xs text-slate-400">{a.hint}</p>
              </div>
              <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-500" />
            </Card>
          </Link>
        ))}
      </section>

      <ConnectionStatus />
    </div>
  );
}
