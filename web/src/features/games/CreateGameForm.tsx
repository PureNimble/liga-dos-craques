import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Field, Input, Select } from '@/shared/components/ui';
import { isoToLocalInput, localInputToISO } from '@/shared/lib/datetime';
import { useCreateGame, useGameFormats, useUpdateGame, type GameWithFormat } from './gameHooks';
import { createGameSchema, type CreateGameValues } from './game.schemas';
import s from './CreateGameForm.module.css';

interface CreateGameFormProps {
  onSuccess: (gameId: string) => void;
  onCancel: () => void;
  /** Se fornecido, o formulário edita este jogo em vez de criar. */
  game?: GameWithFormat;
}

export function CreateGameForm({ onSuccess, onCancel, game }: CreateGameFormProps) {
  const isEdit = Boolean(game);
  const { data: formats } = useGameFormats();
  const createGame = useCreateGame();
  const updateGame = useUpdateGame(game?.id ?? '');

  const form = useForm<CreateGameValues>({
    resolver: zodResolver(createGameSchema),
    defaultValues: game
      ? {
          scheduled_at: isoToLocalInput(game.scheduled_at),
          location: game.location ?? '',
          format_id: game.format_id,
          notes: game.notes ?? '',
        }
      : {},
  });

  async function onSubmit(values: CreateGameValues) {
    // O nº que joga vem do formato (tamanho do campo). Inscrições sem limite.
    const fmt = formats?.find((f) => f.id === Number(values.format_id));
    const payload = {
      scheduled_at: localInputToISO(values.scheduled_at),
      location: values.location,
      format_id: values.format_id,
      max_players: fmt ? fmt.players_per_side * 2 : 10,
      notes: values.notes,
    };
    if (game) {
      await updateGame.mutateAsync(payload);
      onSuccess(game.id);
    } else {
      const created = await createGame.mutateAsync(payload);
      onSuccess(created.id);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={s.form}>
      <Field
        label="Data e hora"
        htmlFor="scheduled_at"
        error={form.formState.errors.scheduled_at?.message}
      >
        <Input id="scheduled_at" type="datetime-local" {...form.register('scheduled_at')} />
      </Field>

      <Field label="Localização" htmlFor="location" error={form.formState.errors.location?.message}>
        <Input id="location" placeholder="Ex.: Pavilhão Municipal" {...form.register('location')} />
      </Field>

      <Field
        label="Formato"
        htmlFor="format_id"
        hint="Define quantos jogam (tamanho do campo). Sem limite de inscrições — quem vier a mais fica suplente."
        error={form.formState.errors.format_id?.message}
      >
        <Select id="format_id" {...form.register('format_id')}>
          <option value="">Escolher…</option>
          {formats?.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Notas" htmlFor="notes" error={form.formState.errors.notes?.message}>
        <Input id="notes" placeholder="Opcional" {...form.register('notes')} />
      </Field>

      {(createGame.isError || updateGame.isError) && (
        <Alert kind="error">Não foi possível guardar o jogo.</Alert>
      )}

      <div className={s.footer}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={form.formState.isSubmitting || createGame.isPending || updateGame.isPending}
        >
          {isEdit ? 'Guardar' : 'Criar jogo'}
        </Button>
      </div>
    </form>
  );
}
