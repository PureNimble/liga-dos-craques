import { Alert } from '@/shared/components/ui';
import { AssistIcon } from '@/shared/components/ui/icons';
import { useGameEvents, useRemoveEvent } from '../hooks/eventHooks';
import { EventIcon } from './EventIcon';
import { eventTone } from '../lib/eventIcons';
import s from './EventTimeline.module.css';

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

  if (isLoading) return <p className={s.msg}>A carregar eventos…</p>;
  if (isError) return <Alert kind="error">Não foi possível carregar os eventos.</Alert>;

  if (!events || events.length === 0) {
    return <p className={s.msg}>Ainda não há eventos registados.</p>;
  }

  // A assistência aparece na linha do golo (não como evento separado).
  const nameById = new Map(events.map((e) => [e.player_id, e.profile?.name ?? 'Jogador']));
  const shown = events.filter((e) => e.event_type?.code !== 'assist');

  return (
    <ul className={s.list}>
      {shown.map((ev) => {
        const assistBy = (ev.meta as { assist_by?: string } | null)?.assist_by;
        return (
          <li key={ev.id} className={s.item}>
            <div className={s.left}>
              <span className={`${s.chip} ${eventTone(ev.event_type?.code ?? '')}`} aria-hidden>
                <EventIcon code={ev.event_type?.code ?? ''} width={17} height={17} />
              </span>
              <div>
                {ev.event_type?.code === 'substitution' ? (
                  <p className={s.line}>
                    {ev.minute !== null && <span className={s.muted}>{ev.minute}' </span>}
                    <span className={s.muted}>Substituição · </span>
                    <span className={s.subIn}>↑ {ev.profile?.name ?? 'Jogador'}</span>
                    <span className={s.faint}>
                      {' '}
                      ↓ {(ev.meta as { outName?: string } | null)?.outName ?? '—'}
                    </span>
                    {ev.team && <span className={s.faint}> · {ev.team}</span>}
                  </p>
                ) : (
                  <p className={s.line}>
                    {ev.minute !== null && <span className={s.muted}>{ev.minute}' </span>}
                    <span className={s.name}>{ev.profile?.name ?? 'Jogador'}</span>
                    <span className={s.muted}> · {ev.event_type?.label}</span>
                    {goalVariantLabel(ev.meta) && (
                      <span className={s.faint}> ({goalVariantLabel(ev.meta)})</span>
                    )}
                    {ev.team && <span className={s.faint}> · {ev.team}</span>}
                    {assistBy && (
                      <span className={s.assist}>
                        <AssistIcon width={12} height={12} /> {nameById.get(assistBy) ?? '—'}
                      </span>
                    )}
                  </p>
                )}
                {ev.event_tag.length > 0 && (
                  <div className={s.tags}>
                    {ev.event_tag.map(
                      (et) =>
                        et.tag && (
                          <span key={et.tag.code} className={s.tag}>
                            {et.tag.label}
                          </span>
                        ),
                    )}
                  </div>
                )}
              </div>
            </div>
            {canManage && (
              <button onClick={() => removeEvent.mutate(ev.id)} className={s.remove}>
                Remover
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
