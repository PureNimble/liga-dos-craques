import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { Navigate } from 'react-router-dom';
import { Alert, Button, Card, Field, Input, Loading, PageTitle, Select } from '@/shared/components/ui';
import { AssistIcon, BallIcon, StarIcon, TrophyIcon, UsersIcon } from '@/shared/components/ui/icons';
import { useProfile, useProfilesList } from '@/features/profile/profileHooks';
import { useToast } from '@/shared/components/toast/useToast';
import { ConnectionStatus } from '@/features/health/ConnectionStatus';
import {
  useActiveXpRules,
  useAdminSetPassword,
  useRunBackfill,
  useSetXpRule,
  type XpRule,
} from './adminHooks';
import s from './AdminPage.module.css';

const RULE_LABELS: Record<string, string> = {
  participation: 'Participação',
  win: 'Vitória',
  goal: 'Golo',
  assist: 'Assistência',
  mvp: 'MVP',
};

const RULE_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  participation: UsersIcon,
  win: TrophyIcon,
  goal: BallIcon,
  assist: AssistIcon,
  mvp: StarIcon,
};

export function AdminPage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) return <Loading />;
  if (profile?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className={s.page}>
      <PageTitle>Administração</PageTitle>
      <ConnectionStatusCard />
      <ResetPasswordCard />
      <BackfillCard />
      <XpRulesCard />
    </div>
  );
}

function ConnectionStatusCard() {
  return (
    <Card>
      <h2 className={s.cardTitle}>Estado da ligação</h2>
      <ConnectionStatus />
    </Card>
  );
}

function ResetPasswordCard() {
  const { data: profiles } = useProfilesList();
  const setPassword = useAdminSetPassword();
  const toast = useToast();
  const [userId, setUserId] = useState('');
  const [password, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!userId) return setError('Escolhe o jogador.');
    if (password.length < 8) return setError('A password deve ter pelo menos 8 caracteres.');
    try {
      await setPassword.mutateAsync({ userId, password });
      setPassword2('');
      toast.show('Password reposta', 'success');
    } catch {
      setError('Não foi possível repor a password.');
    }
  }

  return (
    <Card>
      <h2 className={s.cardTitle}>Repor password</h2>
      <p className={s.cardDesc}>
        Define uma nova password para um jogador (sem depender de email). Comunica-lha depois.
      </p>
      {error && (
        <div className={s.slotTop}>
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      <div className={s.form}>
        <Field label="Jogador" htmlFor="reset-user">
          <Select id="reset-user" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Escolher…</option>
            {profiles?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nova password" htmlFor="reset-pw" hint="Mínimo 8 caracteres">
          <Input
            id="reset-pw"
            type="text"
            value={password}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <div className={s.actions}>
          <Button onClick={submit} loading={setPassword.isPending}>
            Definir password
          </Button>
        </div>
      </div>
    </Card>
  );
}

function BackfillCard() {
  const backfill = useRunBackfill();
  return (
    <Card>
      <h2 className={s.cardTitle}>Recalcular progressão</h2>
      <p className={s.cardDesc}>
        Atribui XP a jogos fechados ainda não processados e reavalia conquistas de todos os
        jogadores (idempotente). Útil após adicionar conquistas novas.
      </p>
      <Button onClick={() => backfill.mutate()} loading={backfill.isPending}>
        Correr backfill
      </Button>
      {backfill.isError && (
        <div className={s.slot}>
          <Alert kind="error">Falhou. Confirma que és admin.</Alert>
        </div>
      )}
      {backfill.isSuccess && (
        <div className={s.slot}>
          <Alert kind="success">
            {backfill.data.games_awarded} jogos processados · {backfill.data.players_evaluated}{' '}
            jogadores avaliados.
          </Alert>
        </div>
      )}
    </Card>
  );
}

function XpRulesCard() {
  const { data: rules } = useActiveXpRules();
  return (
    <Card>
      <h2 className={s.cardTitle}>Regras de XP</h2>
      <p className={s.cardDesc}>
        Alterar cria uma nova versão — o histórico de XP fica intacto.
      </p>
      <ul className={s.rules}>
        {rules?.map((rule) => (
          <XpRuleRow key={rule.id} rule={rule} />
        ))}
      </ul>
    </Card>
  );
}

function XpRuleRow({ rule }: { rule: XpRule }) {
  const setRule = useSetXpRule();
  const [points, setPoints] = useState(String(rule.points));

  useEffect(() => setPoints(String(rule.points)), [rule.points]);

  const changed = Number(points) !== rule.points;

  return (
    <li className={s.rule}>
      <span className={s.ruleIcon}>
        {(() => {
          const Icon = RULE_ICONS[rule.code] ?? StarIcon;
          return <Icon width={18} height={18} />;
        })()}
      </span>
      <span className={s.ruleLabel}>{RULE_LABELS[rule.code] ?? rule.code}</span>
      <div className={s.pointsWrap}>
        <Input
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className={s.pointsInput}
        />
        <span className={s.pointsSuffix}>XP</span>
      </div>
      <Button
        variant={changed ? 'primary' : 'secondary'}
        size="sm"
        disabled={!changed || points === ''}
        loading={setRule.isPending}
        onClick={() => setRule.mutate({ code: rule.code, points: Number(points) })}
      >
        Guardar
      </Button>
    </li>
  );
}
