import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { Alert, Button, Field, Input } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import { AuthLayout } from '../components/AuthLayout';
import { updatePasswordSchema, type UpdatePasswordValues } from '../schemas/auth.schemas';
import s from '../auth.module.css';

/**
 * Define uma nova password. Serve dois casos:
 *   - fluxo de recuperação (link do email cria uma sessão de recovery);
 *   - alteração de password por um utilizador já autenticado.
 */
export function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { t } = useT();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const form = useForm<UpdatePasswordValues>({ resolver: zodResolver(updatePasswordSchema) });

  async function onSubmit(values: UpdatePasswordValues) {
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate('/', { replace: true }), 1500);
  }

  return (
    <AuthLayout title={t('auth.updatePassword.title')}>
      {error && <Alert kind="error">{error}</Alert>}

      {done ? (
        <Alert kind="success">{t('auth.updatePassword.done')}</Alert>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className={s.form}>
          <Field
            label={t('auth.updatePassword.newPassword')}
            htmlFor="password"
            hint={t('auth.updatePassword.passwordHint')}
            error={form.formState.errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
          </Field>
          <Field
            label={t('auth.updatePassword.confirmPassword')}
            htmlFor="confirm"
            error={form.formState.errors.confirm?.message}
          >
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              {...form.register('confirm')}
            />
          </Field>
          <Button type="submit" loading={form.formState.isSubmitting}>
            {t('auth.updatePassword.submit')}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
