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
import { useT } from '@/shared/i18n/useT';
import s from './HomePage.module.css';

export function HomePage() {
  const { user } = useAuth();
  const { t } = useT();

  const { profile } = useOutletContext<{ profile: FullProfile }>();
  const { data: stats } = usePlayerStatsSuspense(profile.id);
  const { data: xp } = usePlayerXpSuspense(profile.id);

  const displayName = profile.name || user?.email?.split('@')[0] || t('home.fallbackName');
  const completion = profileCompletion(profile);
  const [editOpen, setEditOpen] = useState(false);

  const quickActions = [
    {
      to: '/games',
      label: t('home.action.games.label'),
      hint: t('home.action.games.hint'),
      icon: BallIcon,
    },
    {
      to: '/rankings',
      label: t('home.action.rankings.label'),
      hint: t('home.action.rankings.hint'),
      icon: TrophyIcon,
    },
  ];

  return (
    <div className={s.page}>
      {/* Saudação */}
      <header className={s.greeting}>
        <Link to="/profile" aria-label={t('navbar.viewProfile')} className={s.avatarLink}>
          <Avatar name={profile.name} src={profile.photo_url} size="lg" />
        </Link>
        <div>
          <p className={s.welcome}>{t('home.welcome')}</p>
          <h1 className={s.name}>{displayName}</h1>
        </div>
      </header>

      <XpBar xp={xp} />

      {stats.games > 0 && (
        <section>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>{t('home.summaryTitle')}</h2>
            <Link to="/profile" className={s.seeAll}>
              {t('home.seeAll')} <ChevronRightIcon width={14} height={14} />
            </Link>
          </div>
          <StatsGrid stats={stats} compact />
        </section>
      )}

      {/* Perfil incompleto */}
      {!completion.isComplete && (
        <Card>
          <h2 className={s.onboardTitle}>{t('home.onboard.title')}</h2>
          <p className={s.onboardText}>
            {t('home.onboard.missing', {
              missing: listMissing(
                completion.missing.map((key) => t(`home.onboard.field.${key}`)),
                t('home.onboard.and'),
              ),
            })}{' '}
            {/* Só a posição entra no gerador de equipas. */}
            {completion.positionMissing
              ? t('home.onboard.positionHint')
              : t('home.onboard.genericHint')}
          </p>
          <button type="button" className={s.cta} onClick={() => setEditOpen(true)}>
            {t('home.onboard.cta')} <ChevronRightIcon width={16} height={16} />
          </button>
        </Card>
      )}

      {/* O mesmo modal da página de perfil. */}
      {editOpen && <ProfileEditModal profile={profile} onClose={() => setEditOpen(false)} />}

      {/* Acessos rápidos */}
      <section className={s.quick}>
        <h2 className={s.sectionTitle}>{t('home.quickAccess')}</h2>
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
