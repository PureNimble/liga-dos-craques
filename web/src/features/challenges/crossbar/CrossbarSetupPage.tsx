import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar, Badge, Button, Card, Field, Input, Loading, Page, PageTitle } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { CheckIcon } from '@/shared/components/ui/icons';
import { useProfilesList } from '@/features/profile/profileHooks';
import { useChallenges, useCreateAndStart } from '../challengeHooks';
import { CROSSBAR_VARIANT_LABEL, spotCount, type CrossbarVariant } from './crossbarSpots';
import s from './CrossbarSessionPage.module.css';

/** Setup client-side: escolhe jogadores e só então cria a sessão (já a decorrer). */
export function CrossbarSetupPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const variant: CrossbarVariant = params.get('v') === 'long' ? 'long' : 'quick';
  const { data: challenges } = useChallenges();
  const crossbar = challenges?.find((c) => c.code === 'crossbar');
  const { data: profiles } = useProfilesList();
  const createAndStart = useCreateAndStart();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [maxRounds, setMaxRounds] = useState('');

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function start() {
    if (!crossbar || selected.size < 2) {
      toast.show('Escolhe pelo menos 2 jogadores.', 'error');
      return;
    }
    try {
      const floor = spotCount(variant);
      const parsed = Number(maxRounds);
      const id = await createAndStart.mutateAsync({
        challenge_id: crossbar.id,
        spot_count: floor,
        player_ids: [...selected],
        max_rounds: maxRounds.trim() !== '' && parsed > 0 ? Math.max(Math.floor(parsed), floor) : null,
      });
      navigate(`/challenges/crossbar/${id}`, { state: { justStarted: true } });
    } catch {
      toast.show('Não foi possível começar a sessão.', 'error');
    }
  }

  return (
    <Page>
      <div>
        <button className={s.back} onClick={() => navigate('/challenges')}>
          ← Desafios
        </button>
        <PageTitle>Nova sessão</PageTitle>
      </div>

      <div className={s.body}>
        <Card>
          <div className={s.setupHead}>
            <h2 className={s.cardTitle}>Quem joga? ({selected.size})</h2>
            <Badge tone="sky">
              {CROSSBAR_VARIANT_LABEL[variant]} · {spotCount(variant)} posições
            </Badge>
          </div>
          <p className={s.muted}>Toca para adicionar ou remover.</p>
          {!profiles ? (
            <Loading />
          ) : (
            <div className={s.pickGrid}>
              {profiles.map((p) => {
                const on = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(p.id)}
                    className={[s.pickChip, on ? s.pickChipOn : ''].filter(Boolean).join(' ')}
                  >
                    <Avatar name={p.name} src={p.photo_url} size="sm" />
                    <span className={s.pickName}>{p.name}</span>
                    {on && <CheckIcon className={s.pickCheck} width={16} height={16} />}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <Field
            label="Máximo de rondas"
            htmlFor="cb-max-rounds"
            hint={`Opcional (mín. ${spotCount(variant)}). Se ninguém completar até lá, ganha quem chegou mais longe (empate → morte súbita).`}
          >
            <Input
              id="cb-max-rounds"
              type="number"
              min={spotCount(variant)}
              inputMode="numeric"
              placeholder="Sem limite"
              value={maxRounds}
              onChange={(e) => setMaxRounds(e.target.value)}
            />
          </Field>
        </Card>

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
