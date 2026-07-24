import { useMemo, useState } from 'react';
import { Button, Card, Modal, YouTubeEmbed } from '@/shared/components/ui';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { useToast } from '@/shared/components/toast/useToast';
import {
  useForfeit,
  useIconicGoals,
  useMyReplicas,
  useMySpin,
  useReplicate,
  useSpin,
  type IconicGoal,
} from '../../hooks/iconic/iconicGoalHooks';
import { buildReel } from '../../lib/iconic/iconicSpin';
import { isMuted, primeAchievementAudio, primeTickAudio, setMuted } from '../../lib/iconic/spinnerSound';
import { AchievementToast } from './AchievementToast';
import { SoundOffIcon, SoundOnIcon } from '@/shared/components/ui/icons';
import { DifficultyPips, IconicSpinner } from './IconicSpinner';
import s from './IconicGoalsEntry.module.css';

/** Iconic Goals challenge card: spin, watch and self-declare replicated goals. */
export function IconicGoalsEntry() {
  const toast = useToast();
  const confirm = useConfirm();

  const { data: goals } = useIconicGoals();
  const { data: mySpinId } = useMySpin();
  const { data: replicated } = useMyReplicas();

  const spin = useSpin();
  const replicate = useReplicate();
  const forfeit = useForfeit();

  const [phase, setPhase] = useState<'idle' | 'spinning'>('idle');
  const [target, setTarget] = useState<number | null>(null);
  const [spinKey, setSpinKey] = useState('');
  const [preview, setPreview] = useState<IconicGoal | null>(null);
  const [unlocked, setUnlocked] = useState<IconicGoal | null>(null);
  const [muted, setMutedState] = useState(isMuted);

  const reel = useMemo(
    () => buildReel(goals ?? [], target ?? goals?.[0]?.id ?? 0, phase === 'spinning' ? 6 : 1),
    [goals, target, phase],
  );

  if (!goals) return null;

  const activeGoal = mySpinId != null ? goals.find((g) => g.id === mySpinId) : undefined;
  const unlockedCount = goals.filter((g) => replicated?.has(g.id)).length;
  const allDone = unlockedCount === goals.length;

  async function onSpin() {
    primeTickAudio();
    try {
      const id = await spin.mutateAsync();
      if (id == null) {
        toast.show('Já replicaste todos os golos icónicos!', 'success');
        return;
      }
      setTarget(id);
      setSpinKey(crypto.randomUUID());
      setPhase('spinning');
    } catch {
      toast.show('Não foi possível rodar. Tenta de novo.', 'error');
    }
  }

  async function onReplicate() {
    primeAchievementAudio();
    try {
      const id = await replicate.mutateAsync();
      const done = goals?.find((g) => g.id === id);
      if (done) setUnlocked(done);
      else toast.show('Golo replicado!', 'success');
    } catch {
      toast.show('Não foi possível registar. Tenta de novo.', 'error');
    }
  }

  async function onForfeit() {
    const ok = await confirm({
      title: 'Desistir deste golo?',
      message: 'O próximo sorteio é aleatório — podes não calhar neste tão cedo.',
      confirmLabel: 'Desistir',
      danger: true,
    });
    if (ok) forfeit.mutate();
  }

  return (
    <div className={s.body}>
      <svg width="0" height="0" aria-hidden className={s.filterDef}>
        <filter id="iconic-ink" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="1.35" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.28 0.55 0.78 1" />
            <feFuncG type="discrete" tableValues="0 0.28 0.55 0.78 1" />
            <feFuncB type="discrete" tableValues="0 0.28 0.55 0.78 1" />
          </feComponentTransfer>
        </filter>
      </svg>

      <Card>
        <div className={s.head}>
          <h2 className={s.cardTitle}>Golos Icónicos</h2>
          <div className={s.headRight}>
            <span className={s.count}>
              {unlockedCount}/{goals.length}
            </span>
            <button
              type="button"
              className={s.soundToggle}
              onClick={() => {
                const next = !muted;
                setMuted(next);
                setMutedState(next);
              }}
              aria-pressed={muted}
              aria-label={muted ? 'Ligar som' : 'Desligar som'}
              title={muted ? 'Ligar som' : 'Desligar som'}
            >
              {muted ? (
                <SoundOffIcon width={18} height={18} />
              ) : (
                <SoundOnIcon width={18} height={18} />
              )}
            </button>
          </div>
        </div>

        {phase === 'spinning' ? (
          <IconicSpinner
            items={reel.items}
            targetIndex={reel.targetIndex}
            spinning
            spinKey={spinKey}
            onDone={() => setPhase('idle')}
          />
        ) : activeGoal ? (
          <>
            <div className={s.activeHead}>
              <span className={s.scorer}>{activeGoal.scorer}</span>
              <span className={s.subtitle}>
                {activeGoal.title}
                {activeGoal.year ? ` · ${activeGoal.year}` : ''}
              </span>
              <DifficultyPips value={activeGoal.difficulty} />
            </div>
            <YouTubeEmbed
              videoId={activeGoal.youtube_id}
              title={`${activeGoal.scorer} — ${activeGoal.title}`}
              start={activeGoal.video_start}
              embeddable={activeGoal.embeddable}
            />
            <p className={s.hint}>
              Replica este golo numa pelada para o marcares como conseguido. Ainda não consegues?
              Desiste — mas o próximo é à sorte.
            </p>
            <div className={s.actions}>
              <Button onClick={onReplicate} loading={replicate.isPending}>
                Consegui!
              </Button>
              <Button variant="secondary" onClick={onForfeit} loading={forfeit.isPending}>
                Desistir
              </Button>
            </div>
          </>
        ) : (
          <>
            <IconicSpinner
              items={reel.items}
              targetIndex={reel.targetIndex}
              spinning={false}
              spinKey="idle"
            />
            <p className={s.hint}>
              Roda para receberes um golo icónico ao acaso. Replica-o numa pelada e marca-o como feito.
            </p>
            <div className={s.actions}>
              <Button onClick={onSpin} loading={spin.isPending} disabled={allDone}>
                {allDone ? 'Todos replicados' : 'Rodar'}
              </Button>
            </div>
          </>
        )}
      </Card>

      <div>
        <h2 className={s.sectionTitle}>Golos</h2>
        <div className={s.grid}>
          {goals.map((g) => {
            const isUnlocked = replicated?.has(g.id) ?? false;
            return (
              <button
                key={g.id}
                type="button"
                className={`${s.goalCard} ${isUnlocked ? s.done : ''}`}
                onClick={() => setPreview(g)}
              >
                <img
                  className={s.goalThumb}
                  src={`https://img.youtube.com/vi/${g.youtube_id}/hqdefault.jpg`}
                  alt={g.scorer}
                  loading="lazy"
                />
                <span className={s.goalScorer}>{g.scorer}</span>
                <span className={s.goalTitle}>
                  {g.title}
                  {g.year ? ` · ${g.year}` : ''}
                </span>
                <DifficultyPips value={g.difficulty} />
                {isUnlocked && <span className={s.doneTag}>Replicado</span>}
              </button>
            );
          })}
        </div>
      </div>

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.scorer}
        description={
          preview ? `${preview.title}${preview.year ? ` · ${preview.year}` : ''}` : undefined
        }
        size="lg"
      >
        {preview && (
          <YouTubeEmbed
            videoId={preview.youtube_id}
            title={`${preview.scorer} — ${preview.title}`}
            start={preview.video_start}
            embeddable={preview.embeddable}
          />
        )}
      </Modal>

      {unlocked && (
        <AchievementToast key={unlocked.id} goal={unlocked} onDone={() => setUnlocked(null)} />
      )}
    </div>
  );
}
