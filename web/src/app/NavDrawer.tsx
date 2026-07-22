import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import type { FullProfile } from '@/features/profile/profileHooks';
import { Avatar } from '@/shared/components/ui';
import { AlertIcon, CloseIcon, LogoutIcon, MoreIcon } from '@/shared/components/ui/icons';
import { useUnreadNotificationCount } from '@/features/notifications/notificationHooks';
import { useActiveGroup } from '@/features/groups/useActiveGroup';
import { AddGroupModal } from '@/features/groups/AddGroupModal';
import { GroupSwitcherModal } from '@/features/groups/GroupSwitcherModal';
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
  const { groupId, myGroups, switchGroup } = useActiveGroup();
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [manageGroupId, setManageGroupId] = useState<string | null>(null);

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

        {/* No tablet/desktop a troca de grupo já vive na coluna (GroupRail);
            aqui fica só para o telemóvel, que não tem espaço para a coluna. */}
        <div className={s.groupsSection}>
          <h3 className={s.groupsTitle}>Grupos</h3>
          <ul className={s.groupList}>
            {myGroups.map((g) => {
              const active = g.group_id === groupId;
              return (
                <li key={g.group_id} className={s.groupRow}>
                  <button
                    type="button"
                    className={[s.groupItem, active ? s.groupItemActive : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      if (!active) switchGroup(g.group_id);
                      onClose();
                    }}
                  >
                    <Avatar name={g.name} src={g.photo_url} size="sm" />
                    <span className={s.groupItemName}>{g.name}</span>
                  </button>
                  <button
                    type="button"
                    className={s.groupManage}
                    aria-label={`Gerir ${g.name}`}
                    onClick={() => setManageGroupId(g.group_id)}
                  >
                    <MoreIcon width={18} height={18} />
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" className={s.addGroupLink} onClick={() => setAddGroupOpen(true)}>
            + Adicionar grupo
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

      {addGroupOpen && <AddGroupModal onClose={() => setAddGroupOpen(false)} />}
      {manageGroupId && (
        <GroupSwitcherModal groupId={manageGroupId} onClose={() => setManageGroupId(null)} />
      )}
    </div>,
    document.body,
  );
}
