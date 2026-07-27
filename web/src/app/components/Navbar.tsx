import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { AccountMenu } from './AccountMenu';
import { NavDrawer } from './NavDrawer';
import type { FullProfile } from '@/features/profile/hooks/profileHooks';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { Avatar, IconButton } from '@/shared/components/ui';
import { BallIcon, BellIcon, MenuIcon } from '@/shared/components/ui/icons';
import { ReportBugModal } from '@/features/feedback/components/ReportBugModal';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/notificationHooks';
import { useT } from '@/shared/i18n/useT';
import { navItems } from '../lib/navItems';
import s from './Navbar.module.css';

const desktopLinks = navItems.filter((item) => item.to !== '/' && item.to !== '/profile');

/** Fixed header: logo, horizontal nav on desktop (with account menu), hamburger + drawer on mobile/tablet. */
export function Navbar({ profile }: { profile: FullProfile }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { t } = useT();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { data: unread = 0 } = useUnreadNotificationCount(profile.id);

  function openReport() {
    setDrawerOpen(false);
    setReportOpen(true);
  }

  async function handleSignOut() {
    setDrawerOpen(false);
    const ok = await confirm({
      title: t('settings.session.confirmTitle'),
      message: t('settings.session.confirmMessage'),
      confirmLabel: t('settings.session.confirmLabel'),
    });
    if (!ok) return;
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <Link to="/" className={s.logo} aria-label={t('nav.home')}>
          <span className={s.logoMark}>
            <BallIcon width={16} height={16} />
          </span>
        </Link>

        <Link to="/" className={s.brand} aria-label={t('nav.home')}>
          <BallIcon width={18} height={18} className={s.brandIcon} />
          <span className={s.wordmark}>Peladinhas</span>
        </Link>

        <div className={s.barContent}>
          <nav className={s.links} aria-label={t('navDrawer.ariaLabel')}>
            {desktopLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? `${s.link} ${s.linkActive}` : s.link)}
              >
                <span className={s.linkLabel}>{t(item.label)}</span>
              </NavLink>
            ))}
          </nav>

          <div className={s.actions}>
            <span className={s.bellWrap}>
              <Link
                to="/notifications"
                className={s.bellLink}
                aria-label={
                  unread > 0 ? t('navbar.openMenuUnread', { count: unread }) : t('nav.notifications')
                }
              >
                <BellIcon width={20} height={20} />
              </Link>
              {unread > 0 && <span className={s.dot} aria-hidden="true" />}
            </span>
            <span className={s.accountDesktop}>
              <AccountMenu profile={profile} onSignOut={handleSignOut} onReport={openReport} />
            </span>

            <Link to="/profile" aria-label={t('navbar.viewProfile')} className={s.avatarLink}>
              <Avatar name={profile.name} src={profile.photo_url} size="sm" />
            </Link>
            <span className={s.menuWrap}>
              <IconButton
                label={
                  unread > 0 ? t('navbar.openMenuUnread', { count: unread }) : t('navbar.openMenu')
                }
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon width={20} height={20} />
              </IconButton>
              {unread > 0 && <span className={s.dot} aria-hidden="true" />}
            </span>
          </div>
        </div>
      </div>

      <NavDrawer
        profile={profile}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSignOut={handleSignOut}
        onReport={openReport}
      />

      <ReportBugModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </header>
  );
}
