import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, Page, PageTitle } from '@/shared/components/ui';
import { BellIcon } from '@/shared/components/ui/icons';
import { formatGameDateTime } from '@/shared/lib/datetime';
import { useProfile } from '@/features/profile/profileHooks';
import { useT } from '@/shared/i18n/useT';
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

  const card = (
    <Card interactive className={item.read_at ? s.card : `${s.card} ${s.unread}`}>
      <span className={s.icon} aria-hidden="true">
        {KIND_ICON[item.kind] ?? '🔔'}
      </span>
      <div className={s.text}>
        <span className={s.itemTitle}>{item.title}</span>
        {item.body && <p className={s.body}>{item.body}</p>}
        <span className={s.date}>{formatGameDateTime(item.created_at)}</span>
      </div>
    </Card>
  );

  return (
    <li className={s.item}>
      {gameId ? (
        <Link to={`/games/${gameId}`} className={s.cardLink}>
          {card}
        </Link>
      ) : (
        <div className={s.cardLink}>{card}</div>
      )}
    </li>
  );
}

/** Caixa de avisos do jogador (conquistas removidas, jogos corrigidos, …). */
export function NotificationsPage() {
  const { data: profile } = useProfile();
  const { data: notifications, isLoading } = useNotifications(profile?.id);
  const markRead = useMarkNotificationsRead();
  const { t } = useT();

  const unread = (notifications ?? []).filter((n) => !n.read_at).length;

  // Ao abrir a caixa dão-se por lidos — o que interessa guardar é o aviso, não o badge.
  useEffect(() => {
    if (unread > 0 && !markRead.isPending) markRead.mutate(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread]);

  return (
    <Page>
      <div className={s.headerRow}>
        <div>
          <PageTitle>{t('notifications.title')}</PageTitle>
          <p className={s.subtitle}>{t('notifications.subtitle')}</p>
        </div>
        {(notifications?.length ?? 0) > 0 && (
          <Button
            variant="ghost"
            onClick={() => markRead.mutate(undefined)}
            disabled={markRead.isPending || unread === 0}
          >
            {t('notifications.markRead')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className={s.empty}>{t('notifications.loading')}</p>
      ) : (notifications?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<BellIcon width={26} height={26} />}
          title={t('notifications.empty.title')}
          description={t('notifications.empty.description')}
        />
      ) : (
        <ul className={s.list}>
          {notifications?.map((n) => (
            <NotificationRow key={n.id} item={n} />
          ))}
        </ul>
      )}
    </Page>
  );
}
