import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Alert, Button, Field, Input } from '@/components/ui';
import { AuthLayout } from './AuthLayout';
import { signupSchema, type SignupValues } from './auth.schemas';

export function SignupPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const form = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupValues) {
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { name: values.name },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setError(error.message);
      return;
    }
    // Se a confirmação de email estiver ativa, não há sessão imediata.
    if (data.session) {
      navigate('/', { replace: true });
    } else {
      setConfirmSent(true);
    }
  }

  return (
    <AuthLayout title="Cria a tua conta">
      {error && <Alert kind="error">{error}</Alert>}

      {confirmSent ? (
        <Alert kind="success">
          Conta criada! Confirma o teu email através do link que enviámos e depois inicia sessão.
        </Alert>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Nome" htmlFor="name" error={form.formState.errors.name?.message}>
            <Input id="name" autoComplete="name" {...form.register('name')} />
          </Field>
          <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </Field>
          <Field
            label="Password"
            htmlFor="password"
            hint="Mínimo 8 caracteres"
            error={form.formState.errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
          </Field>
          <Button type="submit" loading={form.formState.isSubmitting}>
            Criar conta
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-slate-400">
        Já tens conta?{' '}
        <Link to="/login" className="font-semibold text-pitch-400 hover:underline">
          Entra
        </Link>
      </p>
    </AuthLayout>
  );
}
