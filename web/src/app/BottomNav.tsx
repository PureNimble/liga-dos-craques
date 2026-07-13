import { NavLink } from 'react-router-dom';
import type { FullProfile } from '@/features/profile/profileHooks';
import { navItems, adminNavItem } from './navItems';

/** Barra de navegação inferior (telemóvel) — assinatura tipo FotMob. */
export function BottomNav({ profile }: { profile: FullProfile }) {
  const items = profile.role === 'admin' ? [...navItems, adminNavItem] : navItems;

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t border-navy-800 pb-safe sm:hidden">
      <div className="mx-auto flex max-w-5xl items-stretch justify-around px-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                isActive ? 'text-pitch-400' : 'text-slate-400'
              }`
            }
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
