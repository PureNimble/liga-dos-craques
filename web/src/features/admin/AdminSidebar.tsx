import { Link, NavLink } from 'react-router-dom';
import { ChevronLeftIcon, HomeIcon, ShieldIcon } from '@/shared/components/ui/icons';
import { adminSections, upcomingSections } from './adminSections';
import s from './AdminSidebar.module.css';

/** Navegação lateral persistente do dashboard de admin. */
export function AdminSidebar() {
  return (
    <aside className={s.sidebar}>
      <div className={s.brand}>
        <span className={s.brandMark}>
          <ShieldIcon width={18} height={18} />
        </span>
        <span className={s.brandText}>Administração</span>
      </div>

      <nav className={s.nav}>
        <NavLink to="/admin" end className={({ isActive }) => navClass(isActive, s)}>
          <HomeIcon width={18} height={18} />
          <span>Dashboard</span>
        </NavLink>

        <span className={s.group}>Gerir</span>
        {adminSections.map((sec) => (
          <NavLink key={sec.key} to={sec.to!} className={({ isActive }) => navClass(isActive, s)}>
            <sec.icon width={18} height={18} />
            <span>{sec.label}</span>
          </NavLink>
        ))}

        {upcomingSections.length > 0 && <span className={s.group}>Brevemente</span>}
        {upcomingSections.map((sec) => (
          <span key={sec.key} className={`${s.link} ${s.soon}`} aria-disabled>
            <sec.icon width={18} height={18} />
            <span>{sec.label}</span>
            <span className={s.soonDot} />
          </span>
        ))}
      </nav>

      <Link to="/" className={s.backToApp}>
        <ChevronLeftIcon width={16} height={16} />
        Voltar à app
      </Link>
    </aside>
  );
}

function navClass(isActive: boolean, s: Record<string, string>): string {
  return isActive ? `${s.link} ${s.linkActive}` : s.link;
}
