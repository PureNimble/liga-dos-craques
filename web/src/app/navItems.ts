import { BallIcon, HomeIcon, ShieldIcon, TargetIcon, TrophyIcon, UserIcon } from '@/shared/components/ui/icons';
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
  { to: '/profile', label: 'Perfil', icon: UserIcon },
];

export const adminNavItem: NavItem = { to: '/admin', label: 'Admin', icon: ShieldIcon };
