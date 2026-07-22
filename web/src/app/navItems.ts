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
import type { ComponentType, SVGProps } from 'react';

export type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
};

export const navItems: NavItem[] = [
  { to: '/', label: 'Início', icon: HomeIcon, end: true },
  { to: '/games', label: 'Jogos', icon: BallIcon },
  { to: '/rankings', label: 'Rankings', icon: TrophyIcon },
  { to: '/challenges', label: 'Desafios', icon: TargetIcon },
  { to: '/places', label: 'Campos', icon: PinIcon },
  { to: '/profile', label: 'Perfil', icon: UserIcon },
];

export const adminNavItem: NavItem = { to: '/admin', label: 'Admin', icon: ShieldIcon };

/** Ficam fora da navegação principal — vivem na gaveta, junto às ações da conta. */
export const notificationsNavItem: NavItem = {
  to: '/notifications',
  label: 'Notificações',
  icon: BellIcon,
};

export const settingsNavItem: NavItem = {
  to: '/settings',
  label: 'Definições',
  icon: SettingsIcon,
};
