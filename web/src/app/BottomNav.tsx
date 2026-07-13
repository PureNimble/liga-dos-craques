import { NavLink } from 'react-router-dom';
import type { FullProfile } from '@/features/profile/profileHooks';
import { navItems, adminNavItem } from './navItems';
import s from './BottomNav.module.css';

/** Barra de navegação inferior (telemóvel) — assinatura tipo FotMob. */
export function BottomNav({ profile }: { profile: FullProfile }) {
  const items = profile.role === 'admin' ? [...navItems, adminNavItem] : navItems;

  return (
    <nav className={s.nav}>
      <div className={s.inner}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? `${s.link} ${s.linkActive}` : s.link)}
          >
            {({ isActive }) => (
              <>
                <item.icon width={22} height={22} strokeWidth={isActive ? 2.1 : 1.7} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
