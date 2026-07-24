import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/shared/lib/supabase';
import { Alert, Button, Field, Input, Modal } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { updatePasswordSchema, type UpdatePasswordValues } from '../schemas/auth.schemas';
import s from '../auth.module.css';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

/** Sheet para mudar a password estando já autenticado (Definições > Conta). */
export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<UpdatePasswordValues>({ resolver: zodResolver(updatePasswordSchema) });

  async function onSubmit(values: UpdatePasswordValues) {
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setError(error.message);
      return;
    }
    toast.show('Password atualizada', 'success');
    form.reset();
    onClose();
  }

  function handleClose() {
    setError(null);
    form.reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Mudar password"
      variant="sheet"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} loading={form.formState.isSubmitting}>
            Guardar
          </Button>
        </>
      }
    >
      {error && <Alert kind="error">{error}</Alert>}
      <form onSubmit={form.handleSubmit(onSubmit)} className={s.form}>
        <Field
          label="Nova password"
          htmlFor="new-password"
          hint="Mínimo 8 caracteres"
          error={form.formState.errors.password?.message}
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            {...form.register('password')}
          />
        </Field>
        <Field
          label="Confirmar password"
          htmlFor="confirm-password"
          error={form.formState.errors.confirm?.message}
        >
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            {...form.register('confirm')}
          />
        </Field>
      </form>
    </Modal>
  );
}
