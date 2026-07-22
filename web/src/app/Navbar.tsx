import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';

import { NavDrawer } from './NavDrawer';
import type { FullProfile } from '@/features/profile/profileHooks';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { Avatar, IconButton } from '@/shared/components/ui';
import { BallIcon, MenuIcon } from '@/shared/components/ui/icons';
import { ReportBugModal } from '@/features/feedback/ReportBugModal';
import { useUnreadNotificationCount } from '@/features/notifications/notificationHooks';
import s from './Navbar.module.css';

/** Cabeçalho fixo: logótipo, avatar e menu — a navegação vive toda na gaveta. */
export function Navbar({ profile }: { profile: FullProfile }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
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
      title: 'Terminar sessão?',
      message: 'Vais precisar de iniciar sessão novamente.',
      confirmLabel: 'Sair',
    });
    if (!ok) return;
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <Link to="/" className={s.logo}>
          <span className={s.logoMark}>
            <BallIcon width={18} height={18} />
          </span>
          Peladinhas
        </Link>

        <div className={s.actions}>
          <Link to="/profile" aria-label="Ver perfil" className={s.avatarLink}>
            <Avatar name={profile.name} src={profile.photo_url} size="sm" />
          </Link>
          <span className={s.menuWrap}>
            <IconButton
              label={unread > 0 ? `Abrir menu (${unread} por ler)` : 'Abrir menu'}
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
