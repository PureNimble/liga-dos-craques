import {
  BallIcon,
  BellIcon,
  HomeIcon,
  PinIcon,
  SettingsIcon,
  ShieldIcon,
  TargetIcon,
  TrophyIcon,
  UserIcon,
} from '@/shared/components/ui/icons';
import type { NavTranslationKey } from '../i18n/nav.i18n';
import type { ComponentType, SVGProps } from 'react';

/** A navigation entry: route, translation key and icon. */
export type NavItem = {
  to: string;
  label: NavTranslationKey;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
};

export const navItems: NavItem[] = [
  { to: '/', label: 'nav.home', icon: HomeIcon, end: true },
  { to: '/games', label: 'nav.games', icon: BallIcon },
  { to: '/rankings', label: 'nav.rankings', icon: TrophyIcon },
  { to: '/challenges', label: 'nav.challenges', icon: TargetIcon },
  { to: '/places', label: 'nav.places', icon: PinIcon },
  { to: '/profile', label: 'nav.profile', icon: UserIcon },
];

export const adminNavItem: NavItem = { to: '/admin', label: 'nav.admin', icon: ShieldIcon };

export const notificationsNavItem: NavItem = {
  to: '/notifications',
  label: 'nav.notifications',
  icon: BellIcon,
};

export const settingsNavItem: NavItem = {
  to: '/settings',
  label: 'nav.settings',
  icon: SettingsIcon,
};
