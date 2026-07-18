import type { SVGProps } from 'react';

/**
 * Conjunto de ícones inline (stroke) — sem dependências externas.
 * Herdam a cor via `currentColor` e o tamanho via `width/height` (default 20).
 */
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

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <circle cx="12" cy="15.5" r="1" />
    </svg>
  );
}

export function BallIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 3 2.2-1.1 3.5h-3.8L9 9.2 12 7Z" />
      <path d="m12 7-.1-4M15 9.2l3.6-1.3M13.9 12.7l2.3 3M10.1 12.7l-2.3 3M9 9.2 5.4 7.9" />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
      <path d="M12 14v3M8.5 21h7M9.5 21c0-1.5 1-2 2.5-2s2.5.5 2.5 2" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 13 4 4 10-10" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17.5 5-5 3.5 3.5L17 11l3 3" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.6 3.5 4.8 5.3c-.5.5-.6 1.2-.3 1.9 2 4 5.1 7.1 9.1 9.1.7.3 1.4.2 1.9-.3l1.8-1.8-2.7-2.7-1.3.6a1 1 0 0 1-1.1-.2 13 13 0 0 1-3.4-3.4 1 1 0 0 1-.2-1.1l.6-1.3-2.7-2.7Z" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
      <path d="M16 5.2A3.5 3.5 0 0 1 16 12M17.5 15c2.4.4 3.5 2 3.5 5" />
    </svg>
  );
}

export function WhistleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13 9h7a1 1 0 0 1 1 1 6 6 0 1 1-8.7-5.4" />
      <circle cx="8" cy="14" r="4" />
      <path d="M13 4.5 14.5 8" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M10 12h10M17 9l3 3-3 3" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 10v4M12 17.5v.5" />
    </svg>
  );
}

/* -------------------------------- Eventos --------------------------------- */

export function GloveIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 11V6.5a1.5 1.5 0 0 1 3 0V10m0 0V4.5a1.5 1.5 0 0 1 3 0V10m0 0V5.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M6 11c-1.2.3-2 1.2-2 2.6 0 2 1.2 3.4 2.6 4.6.9.8 1.4 1.8 1.4 2.8h7v-1.5c0-1.4.6-2.4 1.6-3.4 1-1 1.4-2.2 1.4-4.1V12" />
    </svg>
  );
}

export function SwapIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4v13M7 4 4 7M7 4l3 3M17 20V7M17 20l3-3M17 20l-3-3" />
    </svg>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

export function AssistIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 15c4-1 6-3.5 7.5-7.5" />
      <path d="M7.5 7.5H11v3.5" />
      <circle cx="17.5" cy="16.5" r="3.5" />
    </svg>
  );
}

export function BootIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8v3.6c0 1 .6 1.8 1.6 2.1l9.7 2.7c2.3.6 4.7-.3 5.4-2.3.4-1.3-.2-2.5-1.6-2.9L11 11c-1.2-.3-1.8-1-2.3-2.1L8 6.7C7.6 5.7 6.8 5 5.7 5H4.5C3.7 5 3 5.7 3 6.5V8Z" />
      <path d="M4.5 16.8h14.2" />
    </svg>
  );
}
