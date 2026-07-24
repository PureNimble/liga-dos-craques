import type { ComponentType, SVGProps } from 'react';
import {
  AlertIcon,
  BallIcon,
  ChartIcon,
  MedalIcon,
  ShieldIcon,
  TargetIcon,
  UsersIcon,
  WhistleIcon,
} from '@/shared/components/ui/icons';

/** An admin dashboard section: nav entry, icon, and optional route once built. */
export type AdminSection = {
  key: string;
  labelKey: string;
  descriptionKey: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  to?: string;
};

export const adminSections: AdminSection[] = [
  {
    key: 'players',
    labelKey: 'admin.section.players.label',
    descriptionKey: 'admin.section.players.description',
    icon: UsersIcon,
    to: 'players',
  },
  {
    key: 'games',
    labelKey: 'admin.section.games.label',
    descriptionKey: 'admin.section.games.description',
    icon: BallIcon,
    to: 'games',
  },
  {
    key: 'goals',
    labelKey: 'admin.section.goals.label',
    descriptionKey: 'admin.section.goals.description',
    icon: TargetIcon,
    to: 'goals',
  },
  {
    key: 'achievements',
    labelKey: 'admin.section.achievements.label',
    descriptionKey: 'admin.section.achievements.description',
    icon: MedalIcon,
    to: 'achievements',
  },
  {
    key: 'reference',
    labelKey: 'admin.section.reference.label',
    descriptionKey: 'admin.section.reference.description',
    icon: WhistleIcon,
    to: 'reference',
  },
  {
    key: 'reports',
    labelKey: 'admin.section.reports.label',
    descriptionKey: 'admin.section.reports.description',
    icon: AlertIcon,
    to: 'reports',
  },
  {
    key: 'analytics',
    labelKey: 'admin.section.analytics.label',
    descriptionKey: 'admin.section.analytics.description',
    icon: ChartIcon,
    to: 'analytics',
  },
  {
    key: 'system',
    labelKey: 'admin.section.system.label',
    descriptionKey: 'admin.section.system.description',
    icon: ShieldIcon,
    to: 'system',
  },
];

export const upcomingSections: AdminSection[] = [];
