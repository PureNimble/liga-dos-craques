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

export type AdminSection = {
  key: string;
  /** Chave i18n (`admin.i18n.ts`) — usar com `t(labelKey)` / `t(descriptionKey)`. */
  labelKey: string;
  descriptionKey: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Rota relativa a /admin; ausente enquanto a secção não está construída. */
  to?: string;
};

/** Secções já disponíveis (com página própria). */
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

/** Secções planeadas — aparecem no dashboard como "brevemente". */
export const upcomingSections: AdminSection[] = [];
