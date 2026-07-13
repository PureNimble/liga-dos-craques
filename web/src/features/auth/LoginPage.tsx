import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Alert, Button, Field, Input } from '@/components/ui';
import { AuthLayout } from './AuthLayout';
import { loginSchema, type LoginValues } from './auth.schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setError('Email ou password incorretos.');
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <AuthLayout title="Entra na tua conta">
      {error && <Alert kind="error">{error}</Alert>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
        </Field>
        <Button type="submit" loading={form.formState.isSubmitting}>
          Entrar
        </Button>
        <div className="text-center text-sm">
          <Link to="/recover" className="text-pitch-400 hover:underline">
            Esqueci-me da password
          </Link>
        </div>
      </form>

      <p className="text-center text-sm text-slate-400">
        Ainda não tens conta?{' '}
        <Link to="/signup" className="font-semibold text-pitch-400 hover:underline">
          Cria uma
        </Link>
      </p>
    </AuthLayout>
  );
}
