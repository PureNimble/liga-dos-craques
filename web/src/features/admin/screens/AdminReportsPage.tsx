import { Avatar, Badge, Button, Card } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { formatDateShort } from '@/shared/lib/datetime';
import {
  useBugReports,
  useResolveBugReport,
  type BugReportWithReporter,
} from '@/features/feedback/hooks/feedbackHooks';
import cards from '../adminCards.module.css';
import s from './AdminReportsPage.module.css';

export function AdminReportsPage() {
  const { data: reports, isLoading } = useBugReports();
  const openCount = (reports ?? []).filter((r) => r.status === 'open').length;

  return (
    <>
      <Card>
        <div className={s.head}>
          <h2 className={cards.cardTitle}>Reportes</h2>
          {openCount > 0 && <Badge tone="amber">{openCount} por resolver</Badge>}
        </div>

        {isLoading ? (
          <p className={s.muted}>A carregar…</p>
        ) : (reports?.length ?? 0) === 0 ? (
          <p className={s.muted}>Sem reportes. Tudo tranquilo.</p>
        ) : (
          <ul className={s.list}>
            {reports?.map((r) => (
              <ReportRow key={r.id} report={r} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function ReportRow({ report }: { report: BugReportWithReporter }) {
  const resolve = useResolveBugReport();
  const toast = useToast();
  const isResolved = report.status === 'resolved';

  async function toggle() {
    try {
      await resolve.mutateAsync({ id: report.id, resolved: !isResolved });
    } catch {
      toast.show('Não foi possível atualizar.', 'error');
    }
  }

  return (
    <li className={`${s.row} ${isResolved ? s.resolved : ''}`}>
      <Avatar
        name={report.reporter?.name ?? '?'}
        src={report.reporter?.photo_url ?? null}
        size="sm"
      />
      <div className={s.body}>
        <div className={s.meta}>
          <span className={s.reporter}>{report.reporter?.name ?? 'Desconhecido'}</span>
          <span className={s.dot}>·</span>
          <span className={s.date}>{formatDateShort(report.created_at)}</span>
          {report.page && <span className={s.page}>{report.page}</span>}
          {isResolved && (
            <Badge tone="green" className={s.tag}>
              Resolvido
            </Badge>
          )}
        </div>
        <p className={s.message}>{report.message}</p>
      </div>
      <Button
        size="sm"
        variant={isResolved ? 'ghost' : 'secondary'}
        onClick={toggle}
        loading={resolve.isPending}
      >
        {isResolved ? 'Reabrir' : 'Resolver'}
      </Button>
    </li>
  );
}
