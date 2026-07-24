import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Card, Field, Input, Modal, Select } from '@/shared/components/ui';
import { ICON_NAMES, NamedIcon } from '@/shared/components/ui/icons';
import { useToast } from '@/shared/components/toast/useToast';
import {
  useAddAchievement,
  useAllAchievements,
  useUpdateAchievement,
  type Achievement,
} from '@/features/achievements/hooks/achievementHooks';
import {
  SPECIAL_KEYS,
  STAT_METRICS,
  buildAchievementCode,
  buildCriteria,
  describeCriteria,
  parseCriteria,
} from '@/features/achievements/schemas/achievement.schemas';
import cards from '../adminCards.module.css';
import s from './AdminAchievementsPage.module.css';

/** Admin screen for creating, editing and toggling achievements. */
export function AdminAchievementsPage() {
  const { data: achievements, isLoading } = useAllAchievements();
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [creating, setCreating] = useState(false);

  const nextSort = (achievements ?? []).reduce((m, a) => Math.max(m, a.sort_order), 0) + 10;

  return (
    <>
      <Card>
        <div className={s.head}>
          <h2 className={cards.cardTitle}>Conquistas</h2>
          <Button size="sm" onClick={() => setCreating(true)}>
            Adicionar
          </Button>
        </div>
        <p className={cards.cardDesc}>
          Criar e editar conquistas. Depois de mudar critérios, corre “Recalcular progressão” em
          Sistema para reavaliar os jogadores. Para remover, desativa.
        </p>

        {isLoading ? (
          <p className={s.muted}>A carregar…</p>
        ) : (
          <ul className={s.list}>
            {achievements?.map((a) => (
              <AchievementRow key={a.id} achievement={a} onEdit={() => setEditing(a)} />
            ))}
          </ul>
        )}

        {creating && <AchievementModal nextSort={nextSort} onClose={() => setCreating(false)} />}
        {editing && <AchievementModal achievement={editing} onClose={() => setEditing(null)} />}
      </Card>
    </>
  );
}

function AchievementRow({ achievement, onEdit }: { achievement: Achievement; onEdit: () => void }) {
  const update = useUpdateAchievement();
  const toast = useToast();

  async function toggleActive() {
    try {
      await update.mutateAsync({ id: achievement.id, patch: { active: !achievement.active } });
    } catch {
      toast.show('Não foi possível atualizar.', 'error');
    }
  }

  return (
    <li className={`${s.row} ${achievement.active ? '' : s.inactive}`}>
      <span className={s.icon}>
        <NamedIcon name={achievement.icon} width={20} height={20} aria-hidden />
      </span>
      <div className={s.rowText}>
        <span className={s.rowLabel}>{achievement.label}</span>
        <span className={s.rowMeta}>{describeCriteria(achievement.criteria)}</span>
      </div>
      <button
        type="button"
        className={s.toggle}
        onClick={toggleActive}
        disabled={update.isPending}
        aria-pressed={achievement.active}
      >
        {achievement.active ? 'Ativa' : 'Inativa'}
      </button>
      <Button size="sm" variant="secondary" onClick={onEdit}>
        Editar
      </Button>
    </li>
  );
}

interface FormValues {
  label: string;
  description: string;
  icon: string;
  type: 'stat' | 'special';
  metric: string;
  gte: number;
  key: string;
  image_url: string;
}

function AchievementModal({
  achievement,
  nextSort,
  onClose,
}: {
  achievement?: Achievement;
  nextSort?: number;
  onClose: () => void;
}) {
  const add = useAddAchievement();
  const update = useUpdateAchievement();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const parsed = achievement ? parseCriteria(achievement.criteria) : undefined;
  const form = useForm<FormValues>({
    defaultValues: {
      label: achievement?.label ?? '',
      description: achievement?.description ?? '',
      icon: achievement?.icon ?? 'medal',
      type: parsed?.type ?? 'stat',
      metric: parsed?.type === 'stat' ? parsed.metric : STAT_METRICS[0].value,
      gte: parsed?.type === 'stat' ? parsed.gte : 1,
      key: parsed?.type === 'special' ? parsed.key : SPECIAL_KEYS[0].value,
      image_url: achievement?.image_url ?? '',
    },
  });
  const type = form.watch('type');
  const icon = form.watch('icon');

  async function onSubmit(v: FormValues) {
    setError(null);
    const label = v.label.trim();
    const description = v.description.trim();
    if (!label) return setError('Indica o nome da conquista.');
    if (!description) return setError('Indica a descrição.');

    const criteria =
      v.type === 'stat'
        ? buildCriteria({ type: 'stat', metric: v.metric, gte: Number(v.gte) })
        : buildCriteria({ type: 'special', key: v.key });

    const image_url = v.image_url.trim() || null;
    try {
      if (achievement) {
        await update.mutateAsync({
          id: achievement.id,
          patch: { label, description, icon: v.icon || 'medal', criteria, image_url },
        });
        toast.show('Conquista atualizada.', 'success');
      } else {
        await add.mutateAsync({
          code: buildAchievementCode(label),
          label,
          description,
          icon: v.icon || 'medal',
          criteria,
          image_url,
          sort_order: nextSort ?? 0,
        });
        toast.show('Conquista criada.', 'success');
      }
      onClose();
    } catch {
      setError('Não foi possível guardar. Confirma que és admin.');
    }
  }

  const errors = form.formState.errors;

  return (
    <Modal
      open
      onClose={onClose}
      title={achievement ? 'Editar conquista' : 'Nova conquista'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} loading={form.formState.isSubmitting}>
            {achievement ? 'Guardar' : 'Criar'}
          </Button>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className={s.form}>
        {error && <Alert kind="error">{error}</Alert>}

        <div className={s.iconRow}>
          <Field label="Ícone" htmlFor="a-icon">
            <div className={s.iconPicker}>
              <span className={s.iconPreview}>
                <NamedIcon name={icon} width={20} height={20} aria-hidden />
              </span>
              <Select id="a-icon" {...form.register('icon')}>
                {ICON_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
          </Field>
          <Field label="Nome" htmlFor="a-label" error={errors.label?.message}>
            <Input id="a-label" {...form.register('label')} />
          </Field>
        </div>
        <Field label="Descrição" htmlFor="a-desc" error={errors.description?.message}>
          <Input id="a-desc" {...form.register('description')} />
        </Field>

        <div className={s.grid}>
          <Field label="Tipo de critério" htmlFor="a-type">
            <Select id="a-type" {...form.register('type')}>
              <option value="stat">Estatística</option>
              <option value="special">Especial</option>
            </Select>
          </Field>

          {type === 'stat' ? (
            <>
              <Field label="Métrica" htmlFor="a-metric">
                <Select id="a-metric" {...form.register('metric')}>
                  {STAT_METRICS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mínimo (≥)" htmlFor="a-gte">
                <Input id="a-gte" type="number" inputMode="numeric" {...form.register('gte')} />
              </Field>
            </>
          ) : (
            <Field label="Regra especial" htmlFor="a-key">
              <Select id="a-key" {...form.register('key')}>
                {SPECIAL_KEYS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <Field label="Imagem (URL)" htmlFor="a-img" hint="Opcional — tem prioridade sobre o emoji">
          <Input id="a-img" {...form.register('image_url')} placeholder="https://…" />
        </Field>
      </form>
    </Modal>
  );
}
