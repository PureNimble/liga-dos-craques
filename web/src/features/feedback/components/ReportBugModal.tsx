import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, Button, Field, Modal } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { useSubmitBugReport } from '../hooks/feedbackHooks';
import s from './ReportBugModal.module.css';

/** Modal for any player to report a bug or issue. */
export function ReportBugModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const submit = useSubmitBugReport();
  const toast = useToast();
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    const text = message.trim();
    setError(null);
    if (text.length < 5) return setError('Descreve o problema com um pouco mais de detalhe.');
    try {
      await submit.mutateAsync({ message: text, page: location.pathname });
      toast.show('Obrigado! Reporte enviado.', 'success');
      setMessage('');
      onClose();
    } catch {
      setError('Não foi possível enviar. Tenta de novo.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reportar um problema"
      description="Encontraste um bug ou algo estranho? Conta-nos."
      variant="sheet"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={submit.isPending}>
            Enviar
          </Button>
        </>
      }
    >
      <div className={s.body}>
        {error && <Alert kind="error">{error}</Alert>}
        <Field label="O que aconteceu?" htmlFor="bug-msg">
          <textarea
            id="bug-msg"
            className={s.textarea}
            rows={5}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Descreve o problema e, se der, como aconteceu."
          />
        </Field>
      </div>
    </Modal>
  );
}
