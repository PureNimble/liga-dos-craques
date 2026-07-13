import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import type { FullProfile } from '@/features/profile/profileHooks';
import { usePlayerStatsSuspense } from '@/features/stats/statsHooks';
import { usePlayerXpSuspense } from '@/features/xp/xpHooks';
import { Avatar, Card } from '@/shared/components/ui';
import { XpBar } from '@/features/xp/XpBar';
import { StatsGrid } from '@/features/stats/StatsGrid';
import { BallIcon, TrophyIcon, ChevronRightIcon } from '@/shared/components/ui/icons';
import s from './HomePage.module.css';

const quickActions = [
  { to: '/games', label: 'Ver jogos', hint: 'Próximos e resultados', icon: BallIcon },
  { to: '/rankings', label: 'Rankings', hint: 'Classificações da malta', icon: TrophyIcon },
];

export function HomePage() {
  const { user } = useAuth();

  const { profile } = useOutletContext<{ profile: FullProfile }>();
  const { data: stats } = usePlayerStatsSuspense(profile.id);
  const { data: xp } = usePlayerXpSuspense(profile.id);

  const displayName = profile.name || user?.email?.split('@')[0] || 'jogador';

  return (
    <div className={s.page}>
      {/* Saudação */}
      <header className={s.greeting}>
        <Link to="/profile" aria-label="Ver perfil" className={s.avatarLink}>
          <Avatar name={profile.name} src={profile.photo_url} size="lg" />
        </Link>
        <div>
          <p className={s.welcome}>Bem-vindo de volta</p>
          <h1 className={s.name}>{displayName}</h1>
        </div>
      </header>

      <XpBar xp={xp} />

      {stats.games > 0 && (
        <section>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>O teu resumo</h2>
            <Link to="/profile" className={s.seeAll}>
              Ver tudo <ChevronRightIcon width={14} height={14} />
            </Link>
          </div>
          <StatsGrid stats={stats} compact />
        </section>
      )}

      {/* Novo jogador: onboarding */}
      {stats.games === 0 && (
        <Card className={s.onboard}>
          <h2 className={s.onboardTitle}>Começa por aqui</h2>
          <p className={s.onboardText}>
            Completa o teu perfil (posições, pé preferido, dados físicos) para que o gerador de
            equipas te encaixe bem.
          </p>
          <Link to="/profile" className={s.cta}>
            Completar perfil <ChevronRightIcon width={16} height={16} />
          </Link>
        </Card>
      )}

      {/* Acessos rápidos */}
      <section className={s.quick}>
        <h2 className={s.sectionTitle}>Acessos rápidos</h2>
        {quickActions.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card interactive className={s.action}>
              <span className={s.actionIcon}>
                <a.icon width={22} height={22} />
              </span>
              <div className={s.actionBody}>
                <p className={s.actionLabel}>{a.label}</p>
                <p className={s.actionHint}>{a.hint}</p>
              </div>
              <ChevronRightIcon width={18} height={18} className={s.chevron} />
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
