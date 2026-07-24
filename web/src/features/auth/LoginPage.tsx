import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { Alert, Button, Field, Input } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import { AuthLayout } from './AuthLayout';
import { loginSchema, type LoginValues } from './auth.schemas';
import s from './auth.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useT();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setError(null);
    const identifier = values.identifier.trim();

    let email = identifier;
    if (!identifier.includes('@')) {
      const { data, error: lookupError } = await supabase.rpc('get_email_by_username', {
        p_username: identifier,
      });
      if (lookupError || !data) {
        setError(t('auth.login.error'));
        return;
      }
      email = data;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: values.password });
    if (error) {
      setError(t('auth.login.error'));
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <AuthLayout title={t('auth.login.title')}>
      {error && <Alert kind="error">{error}</Alert>}

      <form onSubmit={form.handleSubmit(onSubmit)} className={s.form}>
        <Field
          label={t('auth.login.identifier')}
          htmlFor="identifier"
          error={form.formState.errors.identifier?.message}
        >
          <Input id="identifier" autoComplete="username" {...form.register('identifier')} />
        </Field>
        <Field
          label={t('auth.login.password')}
          htmlFor="password"
          error={form.formState.errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
        </Field>
        <Button type="submit" loading={form.formState.isSubmitting}>
          {t('auth.login.submit')}
        </Button>
        <div className={s.centerSm}>
          <Link to="/recover" className={s.link}>
            {t('auth.login.forgot')}
          </Link>
        </div>
      </form>

      <p className={s.switch}>
        {t('auth.login.noAccount')}{' '}
        <Link to="/signup" className={s.linkStrong}>
          {t('auth.login.createOne')}
        </Link>
      </p>
    </AuthLayout>
  );
}
