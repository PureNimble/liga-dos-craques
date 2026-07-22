import { Button } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { useAnalyticsConsent, useSetAnalyticsConsent } from './trackingHooks';
import s from './PrivacyCard.module.css';

interface Props {
  userId: string;
}

/** Estado do consentimento de tracking, com a decisão sempre reversível. */
export function PrivacyCard({ userId }: Props) {
  const { data: consent, isError } = useAnalyticsConsent(userId);
  const setConsent = useSetAnalyticsConsent();
  const toast = useToast();

  const granted = consent === 'granted';

  const decide = () =>
    setConsent.mutate(!granted, {
      onSuccess: () =>
        toast.show(granted ? 'Tracking desligado e histórico apagado.' : 'Obrigado pela ajuda!'),
      onError: (error) => toast.show(`Não foi possível guardar: ${error.message}`, 'error'),
    });

  return (
    <section className={s.card}>
      <div className={s.text}>
        <h2 className={s.title}>Privacidade</h2>
        <p className={s.body}>
          {isError
            ? 'Não foi possível ler a tua preferência de tracking.'
            : granted
              ? 'Estás a ajudar: registamos as páginas que visitas dentro da app. Se mudares de ideias, apagamos tudo o que foi recolhido.'
              : 'Não estamos a registar a tua utilização. Se aceitares, guardamos apenas as páginas visitadas dentro da app.'}
        </p>
      </div>
      <Button
        variant={granted ? 'ghost' : 'secondary'}
        onClick={decide}
        disabled={setConsent.isPending || isError}
      >
        {granted ? 'Retirar consentimento' : 'Aceitar'}
      </Button>
    </section>
  );
}
