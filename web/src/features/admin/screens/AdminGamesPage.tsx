import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { formatGameDateTime } from '@/shared/lib/datetime';
import { useGames, type GameWithFormat } from '@/features/games/hooks/gameHooks';
import { GAME_STATUS_KEY, GAME_STATUS_TONE } from '@/features/games/lib/gameStatus';
import { useT } from '@/shared/i18n/useT';
import { useAdminCancelGame, useAdminDeleteGame, useAdminReopenGame } from '../hooks/adminHooks';
import cards from '../adminCards.module.css';
import s from './AdminGamesPage.module.css';

export function AdminGamesPage() {
  const { data: games, isLoading } = useGames();

  return (
    <>
      <Card>
        <h2 className={cards.cardTitle}>Todos os jogos</h2>
        <p className={cards.cardDesc}>
          Abrir um jogo leva ao detalhe, onde podes corrigir eventos, equipas e resultado. Aqui
          podes cancelar (reversível) ou apagar. Um jogo fechado não se apaga, mas pode ser
          reaberto: volta à revisão, corriges, e a XP é reatribuída ao fechar de novo.
        </p>

        {isLoading ? (
          <p className={s.muted}>A carregar…</p>
        ) : (games?.length ?? 0) === 0 ? (
          <p className={s.muted}>Ainda não há jogos.</p>
        ) : (
          <ul className={s.list}>
            {games?.map((g) => (
              <GameRow key={g.id} game={g} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function GameRow({ game }: { game: GameWithFormat }) {
  const { t } = useT();
  const cancel = useAdminCancelGame();
  const del = useAdminDeleteGame();
  const reopen = useAdminReopenGame();
  const confirm = useConfirm();
  const toast = useToast();

  const hasScore = game.team_a_score != null && game.team_b_score != null;
  const isClosed = game.status === 'closed';
  const isCancelled = game.status === 'cancelled';
  const isReopenable = isClosed || game.status === 'voting_open';

  async function onCancel() {
    const ok = await confirm({
      title: 'Cancelar jogo?',
      message: 'O jogo fica marcado como cancelado. Podes reverter no detalhe do jogo.',
      confirmLabel: 'Cancelar jogo',
      danger: true,
    });
    if (!ok) return;
    try {
      await cancel.mutateAsync(game.id);
      toast.show('Jogo cancelado.', 'success');
    } catch {
      toast.show('Não foi possível cancelar.', 'error');
    }
  }

  async function onReopen() {
    const ok = await confirm({
      title: 'Reabrir jogo?',
      message:
        'O jogo volta à revisão: eventos e resultado ficam editáveis. A XP deste jogo é estornada e volta a ser atribuída quando fechares outra vez (em "Apurar MVP/Flop").',
      confirmLabel: 'Reabrir',
    });
    if (!ok) return;
    try {
      await reopen.mutateAsync(game.id);
      toast.show('Jogo reaberto para revisão.', 'success');
    } catch {
      toast.show('Não foi possível reabrir.', 'error');
    }
  }

  async function onDelete() {
    const ok = await confirm({
      title: 'Apagar jogo?',
      message: 'Apaga o jogo e todos os seus eventos e plantel. Esta ação é irreversível.',
      confirmLabel: 'Apagar',
      danger: true,
    });
    if (!ok) return;
    try {
      await del.mutateAsync(game.id);
      toast.show('Jogo apagado.', 'success');
    } catch {
      toast.show('Não foi possível apagar.', 'error');
    }
  }

  return (
    <li className={s.row}>
      <div className={s.info}>
        <span className={s.date}>{formatGameDateTime(game.scheduled_at)}</span>
        <span className={s.meta}>
          {game.game_format?.label ?? '—'}
          {hasScore && (
            <>
              {' · '}
              <span className={s.score}>
                {game.team_a_score}–{game.team_b_score}
              </span>
            </>
          )}
        </span>
      </div>

      <Badge tone={GAME_STATUS_TONE[game.status]}>{t(GAME_STATUS_KEY[game.status])}</Badge>

      <div className={s.actions}>
        <Link to={`/games/${game.id}`} className={s.openLink}>
          Abrir
        </Link>
        {!isCancelled && !isClosed && (
          <Button size="sm" variant="ghost" onClick={onCancel} loading={cancel.isPending}>
            Cancelar
          </Button>
        )}
        {isReopenable && (
          <Button size="sm" variant="secondary" onClick={onReopen} loading={reopen.isPending}>
            Reabrir
          </Button>
        )}
        <Button
          size="sm"
          variant="danger"
          onClick={onDelete}
          loading={del.isPending}
          disabled={isClosed}
          title={isClosed ? 'Jogos fechados não se apagam (a XP já foi atribuída)' : undefined}
        >
          Apagar
        </Button>
      </div>
    </li>
  );
}
