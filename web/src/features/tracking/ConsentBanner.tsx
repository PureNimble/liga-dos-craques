import { Button } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { useSetAnalyticsConsent } from './trackingHooks';
import s from './ConsentBanner.module.css';

/** Pedido de consentimento, mostrado até o jogador decidir. */
export function ConsentBanner() {
  const setConsent = useSetAnalyticsConsent();
  const toast = useToast();

  const decide = (granted: boolean) =>
    setConsent.mutate(granted, {
      onSuccess: () =>
        toast.show(granted ? 'Obrigado pela ajuda!' : 'Não vamos registar a tua utilização.'),
      onError: (error) => toast.show(`Não foi possível guardar: ${error.message}`, 'error'),
    });

  return (
    <aside className={s.banner} role="dialog" aria-labelledby="consent-title">
      <div className={s.text}>
        <h2 id="consent-title" className={s.title}>
          Ajudas a melhorar a app?
        </h2>
        <p className={s.body}>
          Com a tua autorização, registamos que páginas visitas dentro da app — sem cookies de
          terceiros, sem publicidade e sem sair daqui. Só o admin vê os totais, e podes voltar atrás
          a qualquer momento em Definições (o histórico é apagado).
        </p>
      </div>
      <div className={s.actions}>
        <Button variant="ghost" onClick={() => decide(false)} disabled={setConsent.isPending}>
          Não, obrigado
        </Button>
        <Button onClick={() => decide(true)} disabled={setConsent.isPending}>
          Aceitar
        </Button>
      </div>
    </aside>
  );
}
