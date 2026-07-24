import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Card, Field, Input, Modal, Select } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import {
  useAddIconicGoal,
  useAllIconicGoals,
  useUpdateIconicGoal,
  type IconicGoal,
} from '../../hooks/iconic/iconicGoalHooks';
import { buildGoalCode, iconicGoalSchema, type IconicGoalValues } from '../../schemas/iconic/iconicGoal.schemas';
import s from './AdminIconicGoals.module.css';

function nextSortOrder(goals: IconicGoal[] | undefined): number {
  return (goals ?? []).reduce((max, g) => Math.max(max, g.sort_order), 0) + 10;
}

/** Admin dashboard card: list, create and edit iconic goals. */
export function AdminIconicGoals() {
  const { data: goals, isLoading } = useAllIconicGoals();
  const [editing, setEditing] = useState<IconicGoal | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <Card>
      <div className={s.head}>
        <h2 className={s.title}>Golos icónicos</h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          Adicionar
        </Button>
      </div>
      <p className={s.desc}>
        Criar e editar os golos do desafio. Golos criados aqui vivem só na base de dados (não entram
        em migrações). Para remover, desativa — apagar arrastaria os replicados dos jogadores.
      </p>

      {isLoading ? (
        <p className={s.muted}>A carregar…</p>
      ) : (
        <ul className={s.list}>
          {goals?.map((g) => (
            <GoalRow key={g.id} goal={g} onEdit={() => setEditing(g)} />
          ))}
        </ul>
      )}

      {creating && (
        <GoalFormModal nextSort={nextSortOrder(goals)} onClose={() => setCreating(false)} />
      )}
      {editing && <GoalFormModal goal={editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}

function GoalRow({ goal, onEdit }: { goal: IconicGoal; onEdit: () => void }) {
  const update = useUpdateIconicGoal();
  const toast = useToast();

  async function toggleActive() {
    try {
      await update.mutateAsync({ id: goal.id, patch: { active: !goal.active } });
    } catch {
      toast.show('Não foi possível atualizar.', 'error');
    }
  }

  return (
    <li className={`${s.row} ${goal.active ? '' : s.inactive}`}>
      <img
        className={s.thumb}
        src={`https://img.youtube.com/vi/${goal.youtube_id}/default.jpg`}
        alt=""
        loading="lazy"
      />
      <div className={s.rowText}>
        <span className={s.rowScorer}>{goal.scorer}</span>
        <span className={s.rowTitle}>
          {goal.title}
          {goal.year ? ` · ${goal.year}` : ''}
        </span>
      </div>
      <span className={s.diff}>D{goal.difficulty}</span>
      <button
        type="button"
        className={s.toggle}
        onClick={toggleActive}
        disabled={update.isPending}
        aria-pressed={goal.active}
      >
        {goal.active ? 'Ativo' : 'Inativo'}
      </button>
      <Button size="sm" variant="secondary" onClick={onEdit}>
        Editar
      </Button>
    </li>
  );
}

function GoalFormModal({
  goal,
  nextSort,
  onClose,
}: {
  goal?: IconicGoal;
  nextSort?: number;
  onClose: () => void;
}) {
  const add = useAddIconicGoal();
  const update = useUpdateIconicGoal();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<IconicGoalValues>({
    resolver: zodResolver(iconicGoalSchema),
    defaultValues: {
      scorer: goal?.scorer ?? '',
      title: goal?.title ?? '',
      achievement_name: goal?.achievement_name ?? '',
      youtube_id: goal?.youtube_id ?? '',
      year: goal?.year ?? undefined,
      difficulty: goal?.difficulty ?? 3,
      video_start: goal?.video_start ?? 0,
      embeddable: goal?.embeddable ?? true,
    },
  });

  async function onSubmit(values: IconicGoalValues) {
    setError(null);
    try {
      if (goal) {
        await update.mutateAsync({ id: goal.id, patch: values });
        toast.show('Golo atualizado.', 'success');
      } else {
        await add.mutateAsync({
          ...values,
          code: buildGoalCode(values.scorer, values.title),
          sort_order: nextSort ?? 0,
        });
        toast.show('Golo criado.', 'success');
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
      title={goal ? 'Editar golo' : 'Novo golo icónico'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} loading={form.formState.isSubmitting}>
            {goal ? 'Guardar' : 'Criar'}
          </Button>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className={s.form}>
        {error && <Alert kind="error">{error}</Alert>}

        <Field label="Jogador" htmlFor="g-scorer" error={errors.scorer?.message}>
          <Input id="g-scorer" {...form.register('scorer')} />
        </Field>
        <Field label="Título do golo" htmlFor="g-title" error={errors.title?.message}>
          <Input id="g-title" {...form.register('title')} />
        </Field>
        <Field
          label="Nome da conquista"
          htmlFor="g-ach"
          hint="Enigmático; vazio usa o título"
          error={errors.achievement_name?.message}
        >
          <Input id="g-ach" {...form.register('achievement_name')} />
        </Field>
        <Field
          label="Vídeo (URL ou ID do YouTube)"
          htmlFor="g-yt"
          error={errors.youtube_id?.message}
        >
          <Input id="g-yt" {...form.register('youtube_id')} placeholder="https://youtu.be/…" />
        </Field>

        <div className={s.grid}>
          <Field label="Ano" htmlFor="g-year" hint="Opcional" error={errors.year?.message}>
            <Input id="g-year" type="number" inputMode="numeric" {...form.register('year')} />
          </Field>
          <Field label="Dificuldade" htmlFor="g-diff" error={errors.difficulty?.message}>
            <Select id="g-diff" {...form.register('difficulty')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Início (s)"
            htmlFor="g-start"
            hint="Segundo do vídeo"
            error={errors.video_start?.message}
          >
            <Input id="g-start" type="number" inputMode="numeric" {...form.register('video_start')} />
          </Field>
        </div>

        <label className={s.check}>
          <input type="checkbox" {...form.register('embeddable')} />
          Permite reprodução embutida (desliga se o dono bloqueia o embed)
        </label>
      </form>
    </Modal>
  );
}
