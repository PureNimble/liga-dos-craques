import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Loading,
  Page,
  PageTitle,
  SegmentedTabs,
} from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { CheckIcon } from '@/shared/components/ui/icons';
import { useGroupMembers } from '@/features/groups/hooks/groupHooks';
import { useActiveGroupId } from '@/features/groups/hooks/useActiveGroup';
import { useChallenges, usePenaltyCreateAndStart } from '../../hooks/challengeHooks';
import {
  PENALTY_DIFFICULTY_LABEL,
  PENALTY_ENTRIES,
  entryToMode,
  parsePenaltyEntry,
  type PenaltyDifficulty,
} from '../../lib/penalty/penaltyModes';
import cb from '../crossbar/CrossbarSessionPage.module.css';

/** Client-side Penalties setup: pick the mode (and difficulty), players and rounds. */
export function PenaltySetupPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const entryKey = parsePenaltyEntry(params.get('m')) ?? 'goals';
  const entry = PENALTY_ENTRIES.find((e) => e.key === entryKey)!;
  const { data: challenges } = useChallenges();
  const penalty = challenges?.find((c) => c.code === 'penalty');
  const groupId = useActiveGroupId();
  const { data: profiles } = useGroupMembers(groupId);
  const createAndStart = usePenaltyCreateAndStart();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState<PenaltyDifficulty>('facil');
  const [rounds, setRounds] = useState('5');

  const usesRounds = entry.key === 'goals';
  const mode = entryToMode(entry.key, difficulty);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function start() {
    if (!penalty || selected.size < 2) {
      toast.show('Escolhe pelo menos 2 jogadores.', 'error');
      return;
    }
    const parsed = Number(rounds);
    if (usesRounds && (!Number.isFinite(parsed) || parsed < 1)) {
      toast.show('Indica um nº de rondas válido.', 'error');
      return;
    }
    try {
      const id = await createAndStart.mutateAsync({
        challenge_id: penalty.id,
        mode,
        player_ids: [...selected],
        rounds: usesRounds ? Math.floor(parsed) : null,
      });
      navigate(`/challenges/penalty/${id}`, { state: { justStarted: true } });
    } catch {
      toast.show('Não foi possível começar a sessão.', 'error');
    }
  }

  return (
    <Page>
      <div>
        <button className={cb.back} onClick={() => navigate('/challenges')}>
          ← Desafios
        </button>
        <PageTitle>Nova sessão · {entry.label}</PageTitle>
      </div>

      <div className={cb.body}>
        {entry.hasDifficulty && (
          <Card>
            <div className={cb.setupHead}>
              <h2 className={cb.cardTitle}>Dificuldade</h2>
            </div>
            <SegmentedTabs<PenaltyDifficulty>
              value={difficulty}
              onChange={setDifficulty}
              items={[
                { value: 'facil', label: PENALTY_DIFFICULTY_LABEL.facil },
                { value: 'dificil', label: PENALTY_DIFFICULTY_LABEL.dificil },
              ]}
            />
            <p className={cb.muted}>
              {difficulty === 'dificil'
                ? 'O jogo sorteia a zona onde tens de marcar.'
                : 'Remata para onde quiseres - só conta marcar.'}
            </p>
          </Card>
        )}

        <Card>
          <div className={cb.setupHead}>
            <h2 className={cb.cardTitle}>Quem joga? ({selected.size})</h2>
            <Badge tone="sky">{entry.label}</Badge>
          </div>
          <p className={cb.muted}>{entry.hint}</p>
          {!profiles ? (
            <Loading />
          ) : (
            <div className={cb.pickGrid}>
              {profiles.map((p) => {
                const on = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(p.id)}
                    className={[cb.pickChip, on ? cb.pickChipOn : ''].filter(Boolean).join(' ')}
                  >
                    <Avatar name={p.name} src={p.photo_url} size="sm" />
                    <span className={cb.pickName}>{p.name}</span>
                    {on && <CheckIcon className={cb.pickCheck} width={16} height={16} />}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {usesRounds && (
          <Card>
            <Field
              label="Rondas"
              htmlFor="pen-rounds"
              hint="Cada jogador remata uma vez por ronda; ganha quem marcar mais."
            >
              <Input
                id="pen-rounds"
                type="number"
                min={1}
                inputMode="numeric"
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
              />
            </Field>
          </Card>
        )}

        <Button
          block
          size="lg"
          onClick={start}
          loading={createAndStart.isPending}
          disabled={selected.size < 2}
        >
          Sortear ordem e começar
        </Button>
      </div>
    </Page>
  );
}
