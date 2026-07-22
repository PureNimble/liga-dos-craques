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
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Rota relativa a /admin; ausente enquanto a secção não está construída. */
  to?: string;
};

/** Secções já disponíveis (com página própria). */
export const adminSections: AdminSection[] = [
  {
    key: 'players',
    label: 'Jogadores',
    description: 'Gerir contas, funções e reposição de password.',
    icon: UsersIcon,
    to: 'players',
  },
  {
    key: 'games',
    label: 'Jogos & eventos',
    description: 'Corrigir, cancelar ou apagar jogos.',
    icon: BallIcon,
    to: 'games',
  },
  {
    key: 'goals',
    label: 'Golos icónicos',
    description: 'Criar e editar os golos do desafio.',
    icon: TargetIcon,
    to: 'goals',
  },
  {
    key: 'achievements',
    label: 'Conquistas',
    description: 'Definições de conquistas e critérios.',
    icon: MedalIcon,
    to: 'achievements',
  },
  {
    key: 'reference',
    label: 'Dados de referência',
    description: 'Formatos, posições, tipos de evento e tags.',
    icon: WhistleIcon,
    to: 'reference',
  },
  {
    key: 'reports',
    label: 'Reportes de bugs',
    description: 'Problemas reportados pela malta.',
    icon: AlertIcon,
    to: 'reports',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'Atividade, adesão e tendências ao longo do tempo.',
    icon: ChartIcon,
    to: 'analytics',
  },
  {
    key: 'system',
    label: 'Sistema',
    description: 'Estado da ligação, backfill e regras de XP.',
    icon: ShieldIcon,
    to: 'system',
  },
];

/** Secções planeadas — aparecem no dashboard como "brevemente". */
export const upcomingSections: AdminSection[] = [];
