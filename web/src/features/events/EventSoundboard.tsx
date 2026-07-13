import { useMemo, useState, type ComponentType, type SVGProps } from 'react';
import { Alert, Avatar, Button, Input, Modal, SegmentedTabs } from '@/components/ui';
import { BallIcon, GloveIcon, XCircleIcon } from '@/components/ui/icons';
import { useToast } from '@/components/toast/useToast';
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
      <p className="text-sm text-slate-400">Adiciona jogadores para poderes registar eventos.</p>
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
      <div className="grid grid-cols-3 gap-2">
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={a.onClick}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition active:scale-[0.97] ${
              a.danger
                ? 'border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/15'
                : 'border-white/[0.07] bg-white/[0.03] text-pitch-300 hover:border-pitch-500/40 hover:bg-white/[0.06]'
            }`}
          >
            <a.Icon width={26} height={26} aria-hidden />
            <span className="text-xs font-semibold leading-tight text-slate-200">{a.label}</span>
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
    { key: 'A', label: 'Equipa A', dot: 'bg-pitch-500' },
    { key: 'B', label: 'Equipa B', dot: 'bg-sky-500' },
    { key: 'none', label: 'Sem equipa', dot: 'bg-slate-500' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {META.map(({ key, label, dot }) => {
        const list = groups[key].filter((p) => p.player_id !== excludeId);
        if (list.length === 0) return null;
        return (
          <div key={key}>
            {teamsAssigned && (
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className={`h-2 w-2 rounded-full ${dot}`} /> {label}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {list.map((gp) => {
                const on = selectedId === gp.player_id;
                return (
                  <button
                    key={gp.id}
                    type="button"
                    onClick={() => onPick(gp)}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition active:scale-[0.98] ${
                      on
                        ? 'border-pitch-500 bg-pitch-500/15'
                        : 'border-navy-700 bg-navy-850 hover:border-pitch-500/50 hover:bg-navy-800'
                    }`}
                  >
                    <Avatar name={gp.profile?.name} src={gp.profile?.photo_url} size="sm" />
                    <span className="min-w-0 truncate text-sm font-medium text-slate-100">
                      {gp.profile?.name ?? 'Jogador'}
                    </span>
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
  const toast = useToast();

  const [variant, setVariant] = useState<GoalVariant>('normal');
  const [minute, setMinute] = useState(String(currentMinute));
  const [scorer, setScorer] = useState<GamePlayerWithProfile | null>(null);
  const [assistId, setAssistId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwn = variant === 'own_goal';
  // Assistência só existe em golo normal (não em penálti, livre ou autogolo).
  const allowsAssist = variant === 'normal';

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
      });
      toast.show(`${isOwn ? 'Autogolo' : 'Golo'} · ${scorer.profile?.name ?? 'Jogador'} ✓`, 'success');
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
        <span className="flex items-center gap-2">
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
      <div className="flex flex-col gap-4">
        {error && <Alert kind="error">{error}</Alert>}

        <SegmentedTabs<GoalVariant> value={variant} onChange={setVariant} items={VARIANTS} className="w-full" />

        <label className="text-sm text-slate-400">
          Minuto
          <Input
            type="number"
            min={0}
            max={200}
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="mt-1 w-24"
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-200">
            {isOwn ? 'Quem marcou na própria baliza' : 'Marcador'}
          </p>
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
            <p className="mb-2 text-sm font-semibold text-slate-200">
              Assistência <span className="font-normal text-slate-500">(opcional · mesma equipa)</span>
            </p>
            <PlayerGrid
              players={players.filter((p) => p.team === scorer.team)}
              selectedId={assistId}
              excludeId={scorer.player_id}
              onPick={(gp) => setAssistId((cur) => (cur === gp.player_id ? null : gp.player_id))}
            />
          </div>
        )}
        {isOwn && (
          <p className="text-xs text-slate-500">
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
      toast.show(`${eventType.label} · ${gp.profile?.name ?? 'Jogador'} ✓`, 'success');
      onClose();
    } catch {
      setError('Não foi possível registar o evento.');
    }
  }

  return (
    <Modal open onClose={onClose} variant="sheet" title={eventType.label} description="Escolhe quem">
      <div className="flex flex-col gap-4">
        {error && <Alert kind="error">{error}</Alert>}

        <label className="text-sm text-slate-400">
          Minuto
          <Input
            type="number"
            min={0}
            max={200}
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="mt-1 w-24"
          />
        </label>

        {eventType.supports_tags && tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const on = tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                    on
                      ? 'border-pitch-500 bg-pitch-500 text-navy-975 shadow-glow'
                      : 'border-navy-700 text-slate-300 hover:bg-navy-800'
                  }`}
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
