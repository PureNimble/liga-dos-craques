import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDownIcon, ChevronLeftIcon, HomeIcon, ShieldIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { adminSections, upcomingSections } from '../lib/adminSections';
import s from './AdminSidebar.module.css';

interface NavItem {
  key: string;
  to: string;
  end?: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
}

/** Navegação lateral persistente do dashboard de admin; em telemóvel vira um dropdown. */
export function AdminSidebar() {
  const { t } = useT();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const items: NavItem[] = [
    { key: 'dashboard', to: '/admin', end: true, icon: HomeIcon, label: t('admin.nav.dashboard') },
    ...adminSections.map((sec) => ({
      key: sec.key,
      to: `/admin/${sec.to}`,
      icon: sec.icon,
      label: t(sec.labelKey),
    })),
  ];
  const active =
    items.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    ) ?? items[0];

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <aside className={s.sidebar}>
      <div className={s.brand}>
        <span className={s.brandMark}>
          <ShieldIcon width={18} height={18} />
        </span>
        <span className={s.brandText}>{t('admin.brand')}</span>
      </div>

      <nav className={s.nav}>
        <NavLink to="/admin" end className={({ isActive }) => navClass(isActive, s)}>
          <HomeIcon width={18} height={18} />
          <span>{t('admin.nav.dashboard')}</span>
        </NavLink>

        <span className={s.group}>{t('admin.nav.manage')}</span>
        {adminSections.map((sec) => (
          <NavLink key={sec.key} to={sec.to!} className={({ isActive }) => navClass(isActive, s)}>
            <sec.icon width={18} height={18} />
            <span>{t(sec.labelKey)}</span>
          </NavLink>
        ))}

        {upcomingSections.length > 0 && <span className={s.group}>{t('admin.nav.comingSoon')}</span>}
        {upcomingSections.map((sec) => (
          <span key={sec.key} className={`${s.link} ${s.soon}`} aria-disabled>
            <sec.icon width={18} height={18} />
            <span>{t(sec.labelKey)}</span>
            <span className={s.soonDot} />
          </span>
        ))}
      </nav>

      <div className={s.navDropdown} ref={menuRef}>
        <button
          type="button"
          className={s.navTrigger}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <active.icon width={18} height={18} />
          <span>{active.label}</span>
          <ChevronDownIcon
            className={open ? s.chevronOpen : s.chevron}
            width={16}
            height={16}
          />
        </button>

        {open && (
          <ul className={s.navMenu} role="menu">
            {items.map((item) => (
              <li key={item.key} role="none">
                <NavLink
                  to={item.to}
                  end={item.end}
                  role="menuitem"
                  className={({ isActive }) => navClass(isActive, s)}
                >
                  <item.icon width={18} height={18} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link to="/" className={s.backToApp}>
        <ChevronLeftIcon width={16} height={16} />
        {t('admin.backToApp')}
      </Link>
    </aside>
  );
}

function navClass(isActive: boolean, s: Record<string, string>): string {
  return isActive ? `${s.link} ${s.linkActive}` : s.link;
}
