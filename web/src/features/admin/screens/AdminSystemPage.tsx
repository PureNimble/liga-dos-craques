import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { Alert, Button, Card, Input } from '@/shared/components/ui';
import {
  AssistIcon,
  BallIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
} from '@/shared/components/ui/icons';
import { useActiveXpRules, useRunBackfill, useSetXpRule, type XpRule } from '../hooks/adminHooks';
import s from '../adminCards.module.css';

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

/** Admin screen for running the progression backfill and editing XP rules. */
export function AdminSystemPage() {
  return (
    <>
      <BackfillCard />
      <XpRulesCard />
    </>
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
      <p className={s.cardDesc}>Alterar cria uma nova versão — o histórico de XP fica intacto.</p>
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
