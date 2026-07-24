import { useEffect, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Field, Input, Select } from '@/shared/components/ui';
import { isoToLocalInput, localInputToISO } from '@/shared/lib/datetime';
import { useSearchPlaces, type Place } from '@/features/places/hooks/placeHooks';
import { AddPlaceModal } from '@/features/places/components/AddPlaceModal';
import { useCreateGame, useGameFormats, useUpdateGame, type GameWithFormat } from '../hooks/gameHooks';
import { createGameSchema, type CreateGameValues } from '../schemas/game.schemas';
import s from './CreateGameForm.module.css';

interface CreateGameFormProps {
  onSuccess: (gameId: string) => void;
  onCancel: () => void;
  game?: GameWithFormat;
}

const SEARCH_DEBOUNCE_MS = 300;

/** Form for creating or editing a game. */
export function CreateGameForm({ onSuccess, onCancel, game }: CreateGameFormProps) {
  const isEdit = Boolean(game);
  const { data: formats } = useGameFormats();
  const createGame = useCreateGame();
  const updateGame = useUpdateGame(game?.id ?? '');
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const form = useForm<CreateGameValues>({
    resolver: zodResolver(createGameSchema),
    defaultValues: game
      ? {
          scheduled_at: isoToLocalInput(game.scheduled_at),
          location: game.location ?? '',
          place_id: game.place_id ?? null,
          format_id: game.format_id,
          notes: game.notes ?? '',
        }
      : {},
  });

  const locationText = form.watch('location') ?? '';
  const locationField = form.register('location');

  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(locationText), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [locationText]);

  const { data: suggestions } = useSearchPlaces(debouncedQuery);

  function handleLocationChange(e: ChangeEvent<HTMLInputElement>) {
    locationField.onChange(e);
    form.setValue('place_id', null);
    setSuggestionsOpen(true);
  }

  function selectPlace(place: Place) {
    form.setValue('place_id', place.id, { shouldValidate: true });
    form.setValue('location', place.name, { shouldValidate: true });
    setSuggestionsOpen(false);
  }

  function handlePlaceCreated(place: Place) {
    selectPlace(place);
  }

  async function onSubmit(values: CreateGameValues) {
    const fmt = formats?.find((f) => f.id === Number(values.format_id));
    const payload = {
      scheduled_at: localInputToISO(values.scheduled_at),
      location: values.location,
      place_id: values.place_id ?? null,
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
        <Input
          id="location"
          placeholder="Escreve o nome do campo…"
          autoComplete="off"
          {...locationField}
          onChange={handleLocationChange}
          onFocus={() => setSuggestionsOpen(true)}
          onBlur={(e) => {
            locationField.onBlur(e);
            setSuggestionsOpen(false);
          }}
        />

        {suggestionsOpen && suggestions && suggestions.length > 0 && (
          <ul className={s.suggestions}>
            {suggestions.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={s.suggestion}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectPlace(p)}
                >
                  {p.name} <span className={s.suggestionMeta}>{p.concelho}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className={s.addPlaceLink}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowAddPlaceModal(true)}
        >
          + Adicionar novo campo
        </button>
      </Field>

      <Field
        label="Formato"
        htmlFor="format_id"
        hint="Define quantos jogam (tamanho do campo). Sem limite de inscrições - quem vier a mais fica suplente."
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

      {showAddPlaceModal && (
        <AddPlaceModal
          onClose={() => setShowAddPlaceModal(false)}
          onCreated={handlePlaceCreated}
          defaultName={locationText}
        />
      )}
    </form>
  );
}
