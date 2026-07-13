import { Alert } from '@/shared/components/ui';
import { AssistIcon } from '@/shared/components/ui/icons';
import { useGameEvents, useRemoveEvent } from './eventHooks';
import { EventIcon } from './EventIcon';
import { eventTone } from './eventIcons';

/** Etiqueta da variante de golo guardada em meta (penálti/livre). */
function goalVariantLabel(meta: unknown): string | null {
  const v = (meta as { variant?: string } | null)?.variant;
  if (v === 'penalty') return 'penálti';
  if (v === 'freekick') return 'livre';
  return null;
}

interface EventTimelineProps {
  gameId: string;
  canManage: boolean;
}

export function EventTimeline({ gameId, canManage }: EventTimelineProps) {
  const { data: events, isLoading, isError } = useGameEvents(gameId);
  const removeEvent = useRemoveEvent(gameId);

  if (isLoading) return <p className="text-sm text-slate-400">A carregar eventos…</p>;
  if (isError) return <Alert kind="error">Não foi possível carregar os eventos.</Alert>;

  if (!events || events.length === 0) {
    return <p className="text-sm text-slate-400">Ainda não há eventos registados.</p>;
  }

  // A assistência aparece na linha do golo (não como evento separado).
  const nameById = new Map(events.map((e) => [e.player_id, e.profile?.name ?? 'Jogador']));
  const shown = events.filter((e) => e.event_type?.code !== 'assist');

  return (
    <ul className="flex flex-col divide-y divide-navy-800">
      {shown.map((ev) => {
        const assistBy = (ev.meta as { assist_by?: string } | null)?.assist_by;
        return (
        <li key={ev.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${eventTone(
                ev.event_type?.code ?? '',
              )}`}
              aria-hidden
            >
              <EventIcon code={ev.event_type?.code ?? ''} width={17} height={17} />
            </span>
            <div>
              {ev.event_type?.code === 'substitution' ? (
                <p className="text-sm">
                  {ev.minute !== null && <span className="text-slate-400">{ev.minute}' </span>}
                  <span className="text-slate-400">Substituição · </span>
                  <span className="font-medium text-pitch-400">↑ {ev.profile?.name ?? 'Jogador'}</span>
                  <span className="text-slate-500">
                    {' '}
                    ↓ {(ev.meta as { outName?: string } | null)?.outName ?? '—'}
                  </span>
                  {ev.team && <span className="text-slate-500"> · {ev.team}</span>}
                </p>
              ) : (
                <p className="text-sm">
                  {ev.minute !== null && <span className="text-slate-400">{ev.minute}' </span>}
                  <span className="font-medium text-slate-100">{ev.profile?.name ?? 'Jogador'}</span>
                  <span className="text-slate-400"> · {ev.event_type?.label}</span>
                  {goalVariantLabel(ev.meta) && (
                    <span className="text-slate-500"> ({goalVariantLabel(ev.meta)})</span>
                  )}
                  {ev.team && <span className="text-slate-500"> · {ev.team}</span>}
                  {assistBy && (
                    <span className="ml-1 inline-flex items-center gap-1 text-slate-500">
                      <AssistIcon width={12} height={12} /> {nameById.get(assistBy) ?? '—'}
                    </span>
                  )}
                </p>
              )}
              {ev.event_tag.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {ev.event_tag.map(
                    (et) =>
                      et.tag && (
                        <span
                          key={et.tag.code}
                          className="rounded bg-navy-800 px-1.5 py-0.5 text-xs text-slate-300"
                        >
                          {et.tag.label}
                        </span>
                      ),
                  )}
                </div>
              )}
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => removeEvent.mutate(ev.id)}
              className="text-xs text-red-400 hover:underline"
            >
              Remover
            </button>
          )}
        </li>
        );
      })}
    </ul>
  );
}
