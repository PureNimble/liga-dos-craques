import type { ComponentType, SVGProps } from 'react';
import {
  AssistIcon,
  BallIcon,
  GloveIcon,
  ShieldIcon,
  SwapIcon,
  TargetIcon,
  XCircleIcon,
} from '@/shared/components/ui/icons';

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<string, IconCmp> = {
  goal: BallIcon,
  own_goal: BallIcon,
  assist: AssistIcon,
  save: GloveIcon,
  penalty_scored: TargetIcon,
  freekick_scored: TargetIcon,
  penalty_missed: XCircleIcon,
  substitution: SwapIcon,
};

export function EventIcon({
  code,
  width = 16,
  height = 16,
  className,
}: {
  code: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const Icon = ICONS[code] ?? ShieldIcon;
  return <Icon width={width} height={height} className={className} />;
}
