import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FullProfile } from '@/features/profile/hooks/profileHooks';
import { usePlayerXp } from '@/features/xp/hooks/xpHooks';
import { Avatar } from '@/shared/components/ui';
import {
  AlertIcon,
  ChevronDownIcon,
  LogoutIcon,
  SettingsIcon,
  UserIcon,
} from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import s from './AccountMenu.module.css';

interface Props {
  profile: FullProfile;
  onSignOut: () => void;
  onReport: () => void;
}

/** Desktop account trigger (avatar/name/level) that opens a small dropdown — profile, settings, report, sign out. */
export function AccountMenu({ profile, onSignOut, onReport }: Props) {
  const { t } = useT();
  const { data: xp } = usePlayerXp(profile.id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={s.wrap} ref={ref}>
      <button
        type="button"
        className={s.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={profile.name} src={profile.photo_url} size="sm" />
        <span className={s.meta}>
          <span className={s.name}>{profile.name}</span>
          {xp && (
            <span className={s.level}>
              {t('home.season.levelLabel')} {xp.level}
            </span>
          )}
        </span>
        <ChevronDownIcon width={16} height={16} className={open ? s.chevronOpen : s.chevron} />
      </button>

      {open && (
        <div className={s.panel} role="menu">
          <Link to="/profile" className={s.item} role="menuitem" onClick={() => setOpen(false)}>
            <UserIcon width={18} height={18} /> {t('nav.profile')}
          </Link>
          <Link to="/settings" className={s.item} role="menuitem" onClick={() => setOpen(false)}>
            <SettingsIcon width={18} height={18} /> {t('nav.settings')}
          </Link>
          <button
            type="button"
            className={s.item}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onReport();
            }}
          >
            <AlertIcon width={18} height={18} /> {t('navDrawer.reportProblem')}
          </button>
          <button
            type="button"
            className={`${s.item} ${s.danger}`}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogoutIcon width={18} height={18} /> {t('navDrawer.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
