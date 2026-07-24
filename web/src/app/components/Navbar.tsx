import { Suspense, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { NavDrawer } from './NavDrawer';
import type { FullProfile } from '@/features/profile/hooks/profileHooks';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { Avatar, IconButton } from '@/shared/components/ui';
import { MenuIcon } from '@/shared/components/ui/icons';
import { NextGameTeaser } from '@/features/games/components/NextGameTeaser';
import { ReportBugModal } from '@/features/feedback/components/ReportBugModal';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/notificationHooks';
import { useT } from '@/shared/i18n/useT';
import s from './Navbar.module.css';

/** Fixed header: logo, avatar and menu button — navigation and groups live entirely in the drawer. */
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
        <Suspense fallback={null}>
          <NextGameTeaser />
        </Suspense>

        <div className={s.actions}>
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
