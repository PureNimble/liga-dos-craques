import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import type { FullProfile } from '@/features/profile/profileHooks';
import { Avatar } from '@/shared/components/ui';
import { AlertIcon, CloseIcon, LogoutIcon } from '@/shared/components/ui/icons';
import { useUnreadNotificationCount } from '@/features/notifications/notificationHooks';
import { navItems, adminNavItem, notificationsNavItem, settingsNavItem } from './navItems';
import s from './NavDrawer.module.css';

interface Props {
  profile: FullProfile;
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
  onReport: () => void;
}

/** Navegação lateral (telemóvel): gaveta que desliza da direita, aberta pelo menu. */
export function NavDrawer({ profile, open, onClose, onSignOut, onReport }: Props) {
  const items = profile.role === 'admin' ? [...navItems, adminNavItem] : navItems;
  const { data: unread = 0 } = useUnreadNotificationCount(profile.id);

  // Fecha com Esc + bloqueia o scroll da página enquanto aberta (ver `html.modal-open`).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.documentElement.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('modal-open');
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={s.overlay} role="dialog" aria-modal="true" aria-label="Navegação">
      <div className={s.backdrop} onClick={onClose} />

      <div className={s.panel}>
        <div className={s.head}>
          <NavLink to="/profile" className={s.profile} onClick={onClose}>
            <Avatar name={profile.name} src={profile.photo_url} size="sm" />
            <span className={s.name}>{profile.name}</span>
          </NavLink>
          <button type="button" onClick={onClose} aria-label="Fechar" className={s.close}>
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <nav className={s.nav}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => (isActive ? `${s.link} ${s.linkActive}` : s.link)}
            >
              {({ isActive }) => (
                <>
                  <item.icon width={20} height={20} strokeWidth={isActive ? 2.1 : 1.7} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to={notificationsNavItem.to}
          onClick={onClose}
          className={({ isActive }) => (isActive ? `${s.link} ${s.linkActive}` : s.link)}
        >
          <notificationsNavItem.icon width={20} height={20} />
          {notificationsNavItem.label}
          {unread > 0 && <span className={s.count}>{unread > 99 ? '99+' : unread}</span>}
        </NavLink>
        <NavLink
          to={settingsNavItem.to}
          onClick={onClose}
          className={({ isActive }) => (isActive ? `${s.link} ${s.linkActive}` : s.link)}
        >
          <settingsNavItem.icon width={20} height={20} />
          {settingsNavItem.label}
        </NavLink>
        <button type="button" className={s.link} onClick={onReport}>
          <AlertIcon width={20} height={20} />
          Reportar problema
        </button>
        <button type="button" className={s.signOut} onClick={onSignOut}>
          <LogoutIcon width={20} height={20} />
          Terminar sessão
        </button>
      </div>
    </div>,
    document.body,
  );
}
