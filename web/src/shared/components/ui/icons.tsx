import type { ComponentType, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}

/** Home icon. */
export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

/** Bar chart icon. */
export function ChartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4v16h16" />
      <path d="M8 15v-3" />
      <path d="M12 15V8" />
      <path d="M16 15v-5" />
    </svg>
  );
}

/** Hamburger menu icon. */
export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

/** Padlock icon. */
export function LockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <circle cx="12" cy="15.5" r="1" />
    </svg>
  );
}

/** Football icon. */
export function BallIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 3 2.2-1.1 3.5h-3.8L9 9.2 12 7Z" />
      <path d="m12 7-.1-4M15 9.2l3.6-1.3M13.9 12.7l2.3 3M10.1 12.7l-2.3 3M9 9.2 5.4 7.9" />
    </svg>
  );
}

/** Trophy icon. */
export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
      <path d="M12 14v3M8.5 21h7M9.5 21c0-1.5 1-2 2.5-2s2.5.5 2.5 2" />
    </svg>
  );
}

/** Target/bullseye icon. */
export function TargetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Single user icon. */
export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

/** Shield icon. */
export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
    </svg>
  );
}

/** Notification bell icon. */
export function BellIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 9a6 6 0 1 1 12 0c0 3.2.7 5 1.5 6H4.5C5.3 14 6 12.2 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

/** Settings gear icon. */
export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.1a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-3-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.1-3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 3 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
    </svg>
  );
}

/** Plus icon. */
export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Close (X) icon. */
export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** Right-pointing chevron icon. */
export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** Left-pointing chevron icon. */
export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

/** Downward-pointing chevron icon. */
export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Checkmark icon. */
export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 13 4 4 10-10" />
    </svg>
  );
}

/** Calendar icon. */
export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </svg>
  );
}

/** Map pin icon. */
export function PinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

/** Image placeholder icon. */
export function ImageIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17.5 5-5 3.5 3.5L17 11l3 3" />
    </svg>
  );
}

/** Phone handset icon. */
export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.6 3.5 4.8 5.3c-.5.5-.6 1.2-.3 1.9 2 4 5.1 7.1 9.1 9.1.7.3 1.4.2 1.9-.3l1.8-1.8-2.7-2.7-1.3.6a1 1 0 0 1-1.1-.2 13 13 0 0 1-3.4-3.4 1 1 0 0 1-.2-1.1l.6-1.3-2.7-2.7Z" />
    </svg>
  );
}

/** Multiple users icon. */
export function UsersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
      <path d="M16 5.2A3.5 3.5 0 0 1 16 12M17.5 15c2.4.4 3.5 2 3.5 5" />
    </svg>
  );
}

/** Referee whistle icon. */
export function WhistleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13 9h7a1 1 0 0 1 1 1 6 6 0 1 1-8.7-5.4" />
      <circle cx="8" cy="14" r="4" />
      <path d="M13 4.5 14.5 8" />
    </svg>
  );
}

/** Star icon. */
export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  );
}

/** Sparkle icon. */
export function SparkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

/** Logout icon. */
export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M10 12h10M17 9l3 3-3 3" />
    </svg>
  );
}

/** Warning/alert triangle icon. */
export function AlertIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 10v4M12 17.5v.5" />
    </svg>
  );
}

/** Dice icon. */
export function DiceIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Medal icon. */
export function MedalIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 3l2.6 5.2M16 3l-2.6 5.2" />
      <circle cx="12" cy="15" r="5.5" />
      <path d="m12 12.3.95 1.9 2.1.3-1.5 1.5.35 2.1-1.9-1-1.9 1 .35-2.1-1.5-1.5 2.1-.3.95-1.9Z" />
    </svg>
  );
}

/** Goal net icon. */
export function NetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16v11H4z" />
      <path d="M4 11h16M4 14.5h16M8 7v11M12 7v11M16 7v11" />
    </svg>
  );
}

/** Top hat icon (hat-trick). */
export function HatIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 4h8v9H8z" />
      <path d="M4.5 13h15" />
      <path d="M8 10h8" />
    </svg>
  );
}

/** Flame icon (streak/hot form). */
export function FlameIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3c1.2 3 4 4.2 4 8a4 4 0 0 1-8 0c0-1.6.6-2.7 1.6-3.7C11 8.8 12 7.2 12 3Z" />
      <path d="M12 20a2.4 2.4 0 0 0 2.4-2.5c0-1.4-1-2-1.5-3-.7 1-1.4 1-1.9 2A2.3 2.3 0 0 0 12 20Z" />
    </svg>
  );
}

/** Goalkeeper glove icon. */
export function GloveIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 11V6.5a1.5 1.5 0 0 1 3 0V10m0 0V4.5a1.5 1.5 0 0 1 3 0V10m0 0V5.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M6 11c-1.2.3-2 1.2-2 2.6 0 2 1.2 3.4 2.6 4.6.9.8 1.4 1.8 1.4 2.8h7v-1.5c0-1.4.6-2.4 1.6-3.4 1-1 1.4-2.2 1.4-4.1V12" />
    </svg>
  );
}

/** Substitution swap icon. */
export function SwapIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4v13M7 4 4 7M7 4l3 3M17 20V7M17 20l3-3M17 20l-3-3" />
    </svg>
  );
}

/** Circled X icon. */
export function XCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

/** Assist icon. */
export function AssistIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 15c4-1 6-3.5 7.5-7.5" />
      <path d="M7.5 7.5H11v3.5" />
      <circle cx="17.5" cy="16.5" r="3.5" />
    </svg>
  );
}

/** Football boot icon. */
export function BootIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8v3.6c0 1 .6 1.8 1.6 2.1l9.7 2.7c2.3.6 4.7-.3 5.4-2.3.4-1.3-.2-2.5-1.6-2.9L11 11c-1.2-.3-1.8-1-2.3-2.1L8 6.7C7.6 5.7 6.8 5 5.7 5H4.5C3.7 5 3 5.7 3 6.5V8Z" />
      <path d="M4.5 16.8h14.2" />
    </svg>
  );
}

/** Curling free kick — ball with a curved trajectory into the corner. */
export function GoalCurveIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="5.5" cy="18.5" r="1.7" />
      <path d="M7 17.5C8 11 13 8.5 19 9.5" strokeDasharray="0.5 2.5" />
      <path d="m19 9.5-2.6-.9M19 9.5l-.9 2.5" />
    </svg>
  );
}

/** Magnifying glass search icon. */
export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.35-4.35" />
    </svg>
  );
}

/** Volley — ball in the air with an arced strike. */
export function GoalVolleyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="16.5" cy="6.5" r="1.8" />
      <path d="M15 8 8 15" />
      <path d="M4 18.5 8.2 16l1.6 3.2" />
    </svg>
  );
}

/** Bicycle kick — ball passing overhead (inverted arc). */
export function GoalBicycleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="16.5" r="1.8" />
      <path d="M12 14.7C12 7 5.5 6.5 5 11.5" />
      <path d="m5 11.5-1.4-1.7M5 11.5l2.1-.8" />
    </svg>
  );
}

/** Scorpion kick — heel strike sending the ball backward. */
export function GoalScorpionIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="6.5" cy="16.5" r="1.8" />
      <path d="M8.3 15.7c6-1.2 6.8-6.5 2.4-8.4" />
      <path d="m10.7 7.3-1.8.2M10.7 7.3l.5 1.9" />
    </svg>
  );
}

/** Spin move — rotation arrows around the ball. */
export function GoalSpinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="1.6" />
      <path d="M12 6.4a5.6 5.6 0 0 1 5 3.1" />
      <path d="M17.4 6.2 17 9.6l-3.4-.5" />
      <path d="M12 17.6a5.6 5.6 0 0 1-5-3.1" />
      <path d="M6.6 17.8 7 14.4l3.4.5" />
    </svg>
  );
}

/** Slalom run — path dribbling past defenders. */
export function GoalDribbleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="4.5" cy="18.5" r="1.5" />
      <path d="M5.6 17.6 9 12l3 4 3.2-6 3 4.4" strokeDasharray="0.5 2" />
      <circle cx="9" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Lob over the goalkeeper — high arc. */
export function GoalLobIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 17.5C7 8 16.5 8 19.5 17.5" />
      <path d="M4 18h3M19.5 18h-3" />
      <circle cx="4" cy="17.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Full-field run — arrow crossing the pitch. */
export function GoalRunIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M12 6v12" />
      <path d="M5 12h11" strokeDasharray="0.5 2" />
      <path d="m16 12-2.2-1.4M16 12l-2.2 1.4" />
    </svg>
  );
}

/** Powerful strike — ball with speed lines. */
export function GoalPowerIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="16" cy="12" r="2.2" />
      <path d="M3 8.5h7M2.5 12H10M3 15.5h7" />
    </svg>
  );
}

/** Free kick over the wall — ball, wall, and arc. */
export function GoalWallIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="4.5" cy="18" r="1.5" />
      <path d="M13.5 19v-4.5M16 19v-4.5M18.5 19v-4.5" />
      <path d="M5.6 17C8 10.5 12.5 10.5 15 14.5" strokeDasharray="0.5 2" />
    </svg>
  );
}

/** Team play — web of passes between players. */
export function GoalWebIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 17 10 8l6 5 3-7" strokeDasharray="0.5 2" />
      <circle cx="5" cy="17" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="8" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="13" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="19" cy="6" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Sound on — speaker with sound waves. */
export function SoundOnIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
      <path d="M15 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M17.5 7.5a7 7 0 0 1 0 9" />
    </svg>
  );
}

/** Sound off — muted speaker. */
export function SoundOffIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
      <path d="m16 10 4 4M20 10l-4 4" />
    </svg>
  );
}

/** Sun icon (light theme). */
export function SunIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

/** Moon icon (dark theme). */
export function MoonIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
    </svg>
  );
}

/** Computer icon (system theme). */
export function ComputerIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="M8.5 20.5h7M12 16.5v4" />
    </svg>
  );
}

/** More (ellipsis) icon. */
export function MoreIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

const ICON_BY_NAME: Record<string, ComponentType<IconProps>> = {
  ball: BallIcon,
  target: TargetIcon,
  trophy: TrophyIcon,
  goal: NetIcon,
  medal: MedalIcon,
  check: CheckIcon,
  hat: HatIcon,
  flame: FlameIcon,
  star: StarIcon,
  spark: SparkIcon,
  dice: DiceIcon,
  versus: UsersIcon,
  g_curve: GoalCurveIcon,
  g_volley: GoalVolleyIcon,
  g_bicycle: GoalBicycleIcon,
  g_scorpion: GoalScorpionIcon,
  g_spin: GoalSpinIcon,
  g_dribble: GoalDribbleIcon,
  g_lob: GoalLobIcon,
  g_run: GoalRunIcon,
  g_power: GoalPowerIcon,
  g_wall: GoalWallIcon,
  g_web: GoalWebIcon,
};

/** Names available for `NamedIcon` (e.g. picking an achievement's icon). */
export const ICON_NAMES = Object.keys(ICON_BY_NAME);

/** Icon chosen by name; falls back to the medal icon for an unknown key. */
export function NamedIcon({ name, ...props }: IconProps & { name: string }) {
  const Icon = ICON_BY_NAME[name] ?? MedalIcon;
  return <Icon {...props} />;
}
