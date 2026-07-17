import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import type { FullProfile } from '@/features/profile/profileHooks';
import { ProfileEditModal } from '@/features/profile/ProfileEditModal';
import { usePlayerStatsSuspense } from '@/features/stats/statsHooks';
import { usePlayerXpSuspense } from '@/features/xp/xpHooks';
import { Avatar, Card } from '@/shared/components/ui';
import { XpBar } from '@/features/xp/XpBar';
import { StatsGrid } from '@/features/stats/StatsGrid';
import { BallIcon, TrophyIcon, ChevronRightIcon } from '@/shared/components/ui/icons';
import { listMissing, profileCompletion } from '@/features/profile/profileCompletion';
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
  const completion = profileCompletion(profile);
  const [editOpen, setEditOpen] = useState(false);

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

      {/* Perfil incompleto */}
      {!completion.isComplete && (
        <Card className={s.onboard}>
          <h2 className={s.onboardTitle}>Completa o teu perfil</h2>
          <p className={s.onboardText}>
            Falta {listMissing(completion.missing)}.{' '}
            {/* Só a posição entra no gerador de equipas. */}
            {completion.positionMissing
              ? 'A posição principal é o que o gerador de equipas usa para te encaixar.'
              : 'Ajuda a malta a conhecer-te melhor.'}
          </p>
          <button type="button" className={s.cta} onClick={() => setEditOpen(true)}>
            Completar perfil <ChevronRightIcon width={16} height={16} />
          </button>
        </Card>
      )}

      {/* O mesmo modal da página de perfil. */}
      {editOpen && <ProfileEditModal profile={profile} onClose={() => setEditOpen(false)} />}

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
