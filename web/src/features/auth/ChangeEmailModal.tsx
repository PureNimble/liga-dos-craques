import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/shared/lib/supabase';
import { Alert, Button, Field, Input, Modal } from '@/shared/components/ui';
import { emailSchema } from './auth.schemas';
import s from './auth.module.css';

const emailFormSchema = z.object({ email: emailSchema });
type EmailFormValues = z.infer<typeof emailFormSchema>;

interface ChangeEmailModalProps {
  open: boolean;
  currentEmail: string | undefined;
  onClose: () => void;
}

/** Sheet para mudar o email da conta — só fica ativo depois de confirmado por link. */
export function ChangeEmailModal({ open, currentEmail, onClose }: ChangeEmailModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const form = useForm<EmailFormValues>({ resolver: zodResolver(emailFormSchema) });

  async function onSubmit(values: EmailFormValues) {
    setError(null);
    const { error } = await supabase.auth.updateUser({ email: values.email });
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  function handleClose() {
    setError(null);
    setSent(false);
    form.reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Mudar email"
      variant="sheet"
      size="sm"
      footer={
        sent ? undefined : (
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} loading={form.formState.isSubmitting}>
              Enviar confirmação
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <Alert kind="success">
          Enviámos um link de confirmação para o novo email. O email da conta só muda depois de
          confirmares através dele.
        </Alert>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className={s.form}>
          {error && <Alert kind="error">{error}</Alert>}
          <Field label="Email atual" htmlFor="current-email">
            <Input id="current-email" value={currentEmail ?? ''} disabled readOnly />
          </Field>
          <Field
            label="Novo email"
            htmlFor="new-email"
            error={form.formState.errors.email?.message}
          >
            <Input id="new-email" type="email" autoComplete="email" {...form.register('email')} />
          </Field>
        </form>
      )}
    </Modal>
  );
}
