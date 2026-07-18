import { Avatar } from '@/shared/components/ui';
import { TrophyIcon } from '@/shared/components/ui/icons';
import type { SessionPlayerWithProfile } from '../challengeHooks';
import { CROSSBAR_PITCH_H, CROSSBAR_PITCH_LEN, GOAL, spotPos } from './crossbarSpots';
import s from './CrossbarField.module.css';

interface CrossbarFieldProps {
  spotCount: number;
  players: SessionPlayerWithProfile[];
  currentPlayerId?: string;
  winnerId?: string | null;
}

const firstName = (name?: string | null) => (name ?? 'Jogador').trim().split(/\s+/)[0];
const pctX = (x: number) => (x / CROSSBAR_PITCH_LEN) * 100;
const pctY = (y: number) => (y / CROSSBAR_PITCH_H) * 100;

/** Campo landscape: baliza à esquerda, posições a subir para a direita. */
export function CrossbarField({
  spotCount,
  players,
  currentPlayerId,
  winnerId,
}: CrossbarFieldProps) {
  // Mostra só o jogador em foco (o da vez, ou o vencedor no fim).
  const focus = players.find(
    (p) =>
      (currentPlayerId && p.player_id === currentPlayerId) ||
      (winnerId && p.player_id === winnerId),
  );
  const focusDone = focus ? focus.current_spot >= spotCount : false;
  const focusPos = !focus
    ? GOAL
    : focusDone
      ? GOAL
      : spotPos(spotCount, focus.current_spot);

  return (
    <div className={s.field}>
      <svg className={s.lines} viewBox={`0 0 ${CROSSBAR_PITCH_LEN} 100`} aria-hidden focusable="false">
        <rect x="2" y="2" width="129.33" height="96" rx="2" />
        {/* Meio-campo (vertical). */}
        <line x1="66.67" y1="2" x2="66.67" y2="98" />
        <circle cx="66.67" cy="50" r="13.5" />
        {/* Baliza (esquerda) — grande área, pequena área e linha de golo. */}
        <rect x="2" y="20" width="20" height="60" />
        <rect x="2" y="36" width="10" height="28" />
        <rect x="1" y="44" width="2" height="12" />
        {/* Área contrária (direita). */}
        <rect x="111.33" y="20" width="20" height="60" />
        <rect x="121.33" y="36" width="10" height="28" />
        <rect x="130.33" y="44" width="2" height="12" />
      </svg>

      {/* Marcas das posições (numeradas). */}
      {Array.from({ length: spotCount }, (_, i) => {
        const pos = spotPos(spotCount, i);
        return (
          <span
            key={`spot-${i}`}
            className={s.spot}
            style={{ left: `${pctX(pos.x)}%`, top: `${pctY(pos.y)}%` }}
          >
            {i + 1}
          </span>
        );
      })}

      {/* Só o jogador em foco, no seu spot atual. */}
      {focus && (
        <div
          className={[s.token, winnerId ? s.tokenWinner : s.tokenCurrent].filter(Boolean).join(' ')}
          style={{ left: `${pctX(focusPos.x)}%`, top: `${pctY(focusPos.y)}%` }}
        >
          <span className={s.tokenName}>
            {winnerId && <TrophyIcon width={12} height={12} />}
            {firstName(focus.profile?.name)}
          </span>
          <Avatar
            name={focus.profile?.name}
            src={focus.profile?.photo_url}
            size="sm"
            className={s.tokenAvatar}
          />
        </div>
      )}
    </div>
  );
}
