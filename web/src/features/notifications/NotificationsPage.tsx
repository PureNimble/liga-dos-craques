import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui';
import { formatGameDateTime } from '@/shared/lib/datetime';
import { useProfile } from '@/features/profile/profileHooks';
import { useMarkNotificationsRead, useNotifications, type Notification } from './notificationHooks';
import s from './NotificationsPage.module.css';

const KIND_ICON: Record<string, string> = {
  achievement_revoked: '🏅',
  game_reopened: '🛠️',
  game_invite: '📩',
  game_rsvp: '✅',
};

/** O jogo referido no aviso, quando existe — o aviso leva lá. */
function gameIdOf(item: Notification): string | null {
  const data = item.data as { game_id?: unknown } | null;
  return typeof data?.game_id === 'string' ? data.game_id : null;
}

function NotificationRow({ item }: { item: Notification }) {
  const gameId = gameIdOf(item);

  const content = (
    <>
      <span className={s.icon} aria-hidden="true">
        {KIND_ICON[item.kind] ?? '🔔'}
      </span>
      <div className={s.text}>
        <span className={s.itemTitle}>{item.title}</span>
        {item.body && <p className={s.body}>{item.body}</p>}
        <span className={s.date}>{formatGameDateTime(item.created_at)}</span>
      </div>
    </>
  );

  return (
    <li className={item.read_at ? s.item : `${s.item} ${s.unread}`}>
      {gameId ? (
        <Link to={`/games/${gameId}`} className={s.link}>
          {content}
        </Link>
      ) : (
        <div className={s.link}>{content}</div>
      )}
    </li>
  );
}

/** Caixa de avisos do jogador (conquistas removidas, jogos corrigidos, …). */
export function NotificationsPage() {
  const { data: profile } = useProfile();
  const { data: notifications, isLoading } = useNotifications(profile?.id);
  const markRead = useMarkNotificationsRead();

  const unread = (notifications ?? []).filter((n) => !n.read_at).length;

  // Ao abrir a caixa dão-se por lidos — o que interessa guardar é o aviso, não o badge.
  useEffect(() => {
    if (unread > 0 && !markRead.isPending) markRead.mutate(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread]);

  return (
    <div className={s.page}>
      <header className={s.head}>
        <div>
          <h1 className={s.pageTitle}>Notificações</h1>
          <p className={s.subtitle}>Avisos sobre a tua conta, conquistas e jogos.</p>
        </div>
        {(notifications?.length ?? 0) > 0 && (
          <Button
            variant="ghost"
            onClick={() => markRead.mutate(undefined)}
            disabled={markRead.isPending || unread === 0}
          >
            Marcar como lidas
          </Button>
        )}
      </header>

      {isLoading ? (
        <p className={s.empty}>A carregar…</p>
      ) : (notifications?.length ?? 0) === 0 ? (
        <p className={s.empty}>
          Sem avisos. Quando houver novidades sobre a tua conta, ficam aqui.
        </p>
      ) : (
        <ul className={s.list}>
          {notifications?.map((n) => (
            <NotificationRow key={n.id} item={n} />
          ))}
        </ul>
      )}
    </div>
  );
}
