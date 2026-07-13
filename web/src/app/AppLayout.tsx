import { Suspense, type ComponentType, type SVGProps } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { HomeIcon, BallIcon, TrophyIcon, TargetIcon, UserIcon } from '@/components/ui/icons';

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Início', icon: HomeIcon, end: true },
  { to: '/games', label: 'Jogos', icon: BallIcon },
  { to: '/rankings', label: 'Rankings', icon: TrophyIcon },
  { to: '/challenges', label: 'Desafios', icon: TargetIcon },
  { to: '/profile', label: 'Perfil', icon: UserIcon },
];

export function AppLayout() {
  const items = navItems;

  return (
    <div className="min-h-screen bg-navy-975">
      {/* Cabeçalho fixo estilo "vidro" */}
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
        </div>
      </header>

      <main className="mx-auto max-w-5xl pb-24 sm:pb-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-16 text-slate-400">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-pitch-500" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      {/* Barra de navegação inferior (telemóvel) — assinatura tipo FotMob */}
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
                  <item.icon
                    width={22}
                    height={22}
                    strokeWidth={isActive ? 2.1 : 1.7}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
