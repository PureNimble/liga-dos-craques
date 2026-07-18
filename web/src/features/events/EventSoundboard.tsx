import { useMemo, useState, type ComponentType, type SVGProps } from 'react';
import { Alert, Avatar, Button, Input, Modal, SegmentedTabs } from '@/shared/components/ui';
import { BallIcon, GloveIcon, XCircleIcon } from '@/shared/components/ui/icons';
import { useToast } from '@/shared/components/toast/useToast';
import type { GamePlayerWithProfile } from '@/features/games/gameHooks';
import type { Team } from '@/types/database';
import {
  useAddEvent,
  useEventTypes,
  useLogGoal,
  useTags,
  type EventType,
  type GoalVariant,
} from './eventHooks';
import s from './EventSoundboard.module.css';

interface EventSoundboardProps {
  gameId: string;
  players: GamePlayerWithProfile[];
  currentMinute: number;
}

const opponent = (t: Team | null): Team | null => (t === 'A' ? 'B' : t === 'B' ? 'A' : null);

type Sheet = { kind: 'goal' } | { kind: 'simple'; type: EventType } | null;

export function EventSoundboard({ gameId, players, currentMinute }: EventSoundboardProps) {
  const { data: eventTypes } = useEventTypes();
  const [sheet, setSheet] = useState<Sheet>(null);

  const byCode = useMemo(
    () => new Map((eventTypes ?? []).map((t) => [t.code, t])),
    [eventTypes],
  );
  const save = byCode.get('save');
  const penaltyMissed = byCode.get('penalty_missed');

  if (players.length === 0) {
    return (
      <p className={s.emptyMsg}>Adiciona jogadores para poderes registar eventos.</p>
    );
  }

  const actions = [
    { key: 'goal', Icon: BallIcon, label: 'Golo', danger: false, onClick: () => setSheet({ kind: 'goal' }) },
    save && {
      key: 'save',
      Icon: GloveIcon,
      label: 'Defesa',
      danger: false,
      onClick: () => setSheet({ kind: 'simple', type: save }),
    },
    penaltyMissed && {
      key: 'pm',
      Icon: XCircleIcon,
      label: 'Penálti falhado',
      danger: true,
      onClick: () => setSheet({ kind: 'simple', type: penaltyMissed }),
    },
  ].filter(Boolean) as {
    key: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
    label: string;
    danger: boolean;
    onClick: () => void;
  }[];

  return (
    <>
      <div className={s.actions}>
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={a.onClick}
            className={`${s.action} ${a.danger ? s.actionDanger : ''}`}
          >
            <a.Icon width={26} height={26} aria-hidden />
            <span className={s.actionLabel}>{a.label}</span>
          </button>
        ))}
      </div>

      {sheet?.kind === 'goal' && (
        <GoalModal
          gameId={gameId}
          players={players}
          currentMinute={currentMinute}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'simple' && (
        <SimpleEventModal
          gameId={gameId}
          players={players}
          eventType={sheet.type}
          currentMinute={currentMinute}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Grelha de jogadores (agrupada por equipa)                                   */
/* -------------------------------------------------------------------------- */
function PlayerGrid({
  players,
  selectedId,
  excludeId,
  onPick,
}: {
  players: GamePlayerWithProfile[];
  selectedId?: string | null;
  excludeId?: string | null;
  onPick: (gp: GamePlayerWithProfile) => void;
}) {
  const teamsAssigned = players.some((p) => p.team);
  const groups = useMemo(() => {
    const by: Record<string, GamePlayerWithProfile[]> = { A: [], B: [], none: [] };
    for (const p of players) by[p.team ?? 'none'].push(p);
    return by;
  }, [players]);

  const META: { key: 'A' | 'B' | 'none'; label: string; dot: string }[] = [
    { key: 'A', label: 'Equipa A', dot: s.dotA },
    { key: 'B', label: 'Equipa B', dot: s.dotB },
    { key: 'none', label: 'Sem equipa', dot: s.dotNone },
  ];

  return (
    <div className={s.grid}>
      {META.map(({ key, label, dot }) => {
        const list = groups[key].filter((p) => p.player_id !== excludeId);
        if (list.length === 0) return null;
        return (
          <div key={key}>
            {teamsAssigned && (
              <p className={s.groupLabel}>
                <span className={`${s.dot} ${dot}`} /> {label}
              </p>
            )}
            <div className={s.players}>
              {list.map((gp) => {
                const on = selectedId === gp.player_id;
                return (
                  <button
                    key={gp.id}
                    type="button"
                    onClick={() => onPick(gp)}
                    className={`${s.player} ${on ? s.playerActive : ''}`}
                  >
                    <Avatar name={gp.profile?.name} src={gp.profile?.photo_url} size="sm" />
                    <span className={s.playerName}>{gp.profile?.name ?? 'Jogador'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modal de golo: variante + marcador + assistência opcional                   */
/* -------------------------------------------------------------------------- */
const VARIANTS: { value: GoalVariant; label: string }[] = [
  { value: 'normal', label: 'Golo' },
  { value: 'penalty', label: 'Penálti' },
  { value: 'freekick', label: 'Livre' },
  { value: 'own_goal', label: 'Autogolo' },
];

function GoalModal({
  gameId,
  players,
  currentMinute,
  onClose,
}: {
  gameId: string;
  players: GamePlayerWithProfile[];
  currentMinute: number;
  onClose: () => void;
}) {
  const logGoal = useLogGoal(gameId);
  const { data: tags } = useTags();
  const toast = useToast();

  const [variant, setVariant] = useState<GoalVariant>('normal');
  const [minute, setMinute] = useState(String(currentMinute));
  const [scorer, setScorer] = useState<GamePlayerWithProfile | null>(null);
  const [assistId, setAssistId] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isOwn = variant === 'own_goal';
  // Assistência só existe em golo normal (não em penálti, livre ou autogolo).
  const allowsAssist = variant === 'normal';
  // Tags de técnica só fazem sentido em golo de bola corrida (normal ou livre).
  const allowsTags = variant === 'normal' || variant === 'freekick';

  function toggleTag(id: number) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    if (!scorer) return;
    setError(null);
    const team = isOwn ? opponent(scorer.team) : scorer.team;
    try {
      await logGoal.mutateAsync({
        scorerId: scorer.player_id,
        assistId: allowsAssist ? assistId : null,
        variant,
        team,
        minute: minute === '' ? null : Number(minute),
        tagIds: allowsTags ? tagIds : [],
      });
      toast.show(`${isOwn ? 'Autogolo' : 'Golo'} · ${scorer.profile?.name ?? 'Jogador'}`, 'success');
      onClose();
    } catch {
      setError('Não foi possível registar o golo.');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      variant="sheet"
      title={
        <span className={s.titleRow}>
          <BallIcon width={18} height={18} /> Registar golo
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!scorer} loading={logGoal.isPending}>
            Registar golo
          </Button>
        </>
      }
    >
      <div className={s.body}>
        {error && <Alert kind="error">{error}</Alert>}

        <SegmentedTabs<GoalVariant>
          value={variant}
          onChange={setVariant}
          items={VARIANTS}
          className={s.fullWidth}
        />

        <label className={s.minute}>
          Minuto
          <Input
            type="number"
            min={0}
            max={200}
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className={s.minuteInput}
          />
        </label>

        <div>
          <p className={s.sectionLabel}>{isOwn ? 'Quem marcou na própria baliza' : 'Marcador'}</p>
          <PlayerGrid
            players={players}
            selectedId={scorer?.player_id}
            onPick={(gp) => {
              setScorer(gp);
              if (assistId === gp.player_id) setAssistId(null);
            }}
          />
        </div>

        {allowsAssist && scorer && (
          <div>
            <p className={s.sectionLabel}>
              Assistência <span className={s.sectionHint}>(opcional · mesma equipa)</span>
            </p>
            <PlayerGrid
              players={players.filter((p) => p.team === scorer.team)}
              selectedId={assistId}
              excludeId={scorer.player_id}
              onPick={(gp) => setAssistId((cur) => (cur === gp.player_id ? null : gp.player_id))}
            />
          </div>
        )}
        {allowsTags && tags && tags.length > 0 && (
          <div>
            <p className={s.sectionLabel}>
              Como foi o golo <span className={s.sectionHint}>(opcional)</span>
            </p>
            <div className={s.tags}>
              {tags.map((tag) => {
                const on = tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`${s.tag} ${on ? s.tagActive : ''}`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {isOwn && (
          <p className={s.note}>
            O autogolo credita a equipa adversária e não conta como golo do jogador.
          </p>
        )}
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modal simples: defesa / penálti falhado — só escolher quem (+ tags)         */
/* -------------------------------------------------------------------------- */
function SimpleEventModal({
  gameId,
  players,
  eventType,
  currentMinute,
  onClose,
}: {
  gameId: string;
  players: GamePlayerWithProfile[];
  eventType: EventType;
  currentMinute: number;
  onClose: () => void;
}) {
  const addEvent = useAddEvent(gameId);
  const { data: tags } = useTags();
  const toast = useToast();

  const [minute, setMinute] = useState(String(currentMinute));
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(id: number) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function pick(gp: GamePlayerWithProfile) {
    setError(null);
    try {
      await addEvent.mutateAsync({
        player_id: gp.player_id,
        event_type_id: eventType.id,
        minute: minute === '' ? null : Number(minute),
        team: gp.team,
        tagIds: eventType.supports_tags ? tagIds : [],
      });
      toast.show(`${eventType.label} · ${gp.profile?.name ?? 'Jogador'}`, 'success');
      onClose();
    } catch {
      setError('Não foi possível registar o evento.');
    }
  }

  return (
    <Modal open onClose={onClose} variant="sheet" title={eventType.label} description="Escolhe quem">
      <div className={s.body}>
        {error && <Alert kind="error">{error}</Alert>}

        <label className={s.minute}>
          Minuto
          <Input
            type="number"
            min={0}
            max={200}
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className={s.minuteInput}
          />
        </label>

        {eventType.supports_tags && tags && tags.length > 0 && (
          <div className={s.tags}>
            {tags.map((tag) => {
              const on = tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`${s.tag} ${on ? s.tagActive : ''}`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        )}

        <PlayerGrid players={players} onPick={pick} />
      </div>
    </Modal>
  );
}
