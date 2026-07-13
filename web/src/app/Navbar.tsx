import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';

import { navItems, adminNavItem } from './navItems';
import type { FullProfile } from '@/features/profile/profileHooks';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { Avatar, IconButton } from '@/shared/components/ui';
import { BallIcon, LogoutIcon } from '@/shared/components/ui/icons';

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
    <header className="glass sticky top-0 z-30 border-b border-navy-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pitch-500 text-navy-975 shadow-glow">
            <BallIcon width={18} height={18} />
          </span>
          Peladinhas
        </Link>

        {/* Navegação inline (desktop/tablet) — o perfil fica no avatar à direita */}
        <nav className="hidden items-center gap-1 sm:flex">
          {items
            .filter((item) => item.to !== '/profile')
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-pitch-500/15 text-pitch-400'
                      : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/profile" aria-label="Ver perfil" className="hidden sm:block">
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
