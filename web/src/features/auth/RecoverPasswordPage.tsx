import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { Alert, Button, Field, Input } from '@/shared/components/ui';
import { AuthLayout } from './AuthLayout';
import { recoverSchema, type RecoverValues } from './auth.schemas';

export function RecoverPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RecoverValues>({ resolver: zodResolver(recoverSchema) });

  async function onSubmit(values: RecoverValues) {
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthLayout title="Recuperar password">
      {error && <Alert kind="error">{error}</Alert>}

      {sent ? (
        <Alert kind="success">
          Se existir uma conta com esse email, enviámos um link para definires uma nova password.
        </Alert>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </Field>
          <Button type="submit" loading={form.formState.isSubmitting}>
            Enviar link de recuperação
          </Button>
          <p className="text-center text-xs text-slate-500">
            Se o email não chegar, pede a um administrador para repor a tua password.
          </p>
        </form>
      )}

      <p className="text-center text-sm">
        <Link to="/login" className="text-pitch-400 hover:underline">
          Voltar ao início de sessão
        </Link>
      </p>
    </AuthLayout>
  );
}
