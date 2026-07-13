import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';

import { navItems, adminNavItem } from './navItems';
import type { FullProfile } from '@/features/profile/profileHooks';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { Avatar, IconButton } from '@/shared/components/ui';
import { BallIcon, LogoutIcon } from '@/shared/components/ui/icons';
import s from './Navbar.module.css';

/** Cabeçalho fixo: logótipo, navegação inline (desktop/tablet), avatar e logout. */
export function Navbar({ profile }: { profile: FullProfile }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const items = profile.role === 'admin' ? [...navItems, adminNavItem] : navItems;

  async function handleSignOut() {
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

        {/* Navegação inline (desktop/tablet) — o perfil fica no avatar à direita */}
        <nav className={s.nav}>
          {items
            .filter((item) => item.to !== '/profile')
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? `${s.navLink} ${s.navLinkActive}` : s.navLink
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className={s.actions}>
          <Link to="/profile" aria-label="Ver perfil" className={s.avatarLink}>
            <Avatar name={profile.name} src={profile.photo_url} size="sm" />
          </Link>
          <IconButton label="Terminar sessão" onClick={handleSignOut}>
            <LogoutIcon width={18} height={18} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
