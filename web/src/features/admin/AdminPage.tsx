import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { Navigate } from 'react-router-dom';
import { Alert, Button, Card, Field, Input, Select } from '@/components/ui';
import { AssistIcon, BallIcon, StarIcon, TrophyIcon, UsersIcon } from '@/components/ui/icons';
import { useProfile } from '@/features/profile/useProfile';
import { useProfilesList } from '@/features/profile/useProfilesList';
import { useToast } from '@/components/toast/useToast';
import {
  useActiveXpRules,
  useAdminSetPassword,
  useRunBackfill,
  useSetXpRule,
  type XpRule,
} from './adminHooks';

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

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-16 text-slate-400">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-pitch-500" />
      </div>
    );
  if (profile?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tightest text-white sm:text-3xl">Administração</h1>
      <ResetPasswordCard />
      <BackfillCard />
      <XpRulesCard />
    </div>
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
      toast.show('Password reposta ✓', 'success');
    } catch {
      setError('Não foi possível repor a password.');
    }
  }

  return (
    <Card>
      <h2 className="mb-2 font-bold text-slate-100">Repor password</h2>
      <p className="mb-3 text-sm text-slate-400">
        Define uma nova password para um jogador (sem depender de email). Comunica-lha depois.
      </p>
      {error && (
        <div className="mb-3">
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      <div className="flex flex-col gap-3">
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
        <div className="flex justify-end">
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
      <h2 className="mb-2 font-bold text-slate-100">Recalcular progressão</h2>
      <p className="mb-3 text-sm text-slate-400">
        Atribui XP a jogos fechados ainda não processados e reavalia conquistas de todos os
        jogadores (idempotente). Útil após adicionar conquistas novas.
      </p>
      <Button onClick={() => backfill.mutate()} loading={backfill.isPending}>
        Correr backfill
      </Button>
      {backfill.isError && (
        <div className="mt-3">
          <Alert kind="error">Falhou. Confirma que és admin.</Alert>
        </div>
      )}
      {backfill.isSuccess && (
        <div className="mt-3">
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
      <h2 className="mb-2 font-bold text-slate-100">Regras de XP</h2>
      <p className="mb-3 text-sm text-slate-400">
        Alterar cria uma nova versão — o histórico de XP fica intacto.
      </p>
      <ul className="flex flex-col gap-2">
        {rules?.map((rule) => <XpRuleRow key={rule.id} rule={rule} />)}
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
    <li className="flex items-center gap-3 rounded-xl border border-navy-800 bg-navy-950 p-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-pitch-300">
        {(() => {
          const Icon = RULE_ICONS[rule.code] ?? StarIcon;
          return <Icon width={18} height={18} />;
        })()}
      </span>
      <span className="flex-1 text-sm font-medium text-slate-200">
        {RULE_LABELS[rule.code] ?? rule.code}
      </span>
      <div className="relative">
        <Input
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className="w-20 pr-8 text-center font-bold"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          XP
        </span>
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
