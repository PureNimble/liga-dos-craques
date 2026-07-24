import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { Alert, Button, Field, Input } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import { AuthLayout } from '../components/AuthLayout';
import { signupSchema, type SignupValues } from '../schemas/auth.schemas';
import s from '../auth.module.css';

export function SignupPage() {
  const navigate = useNavigate();
  const { t } = useT();
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const form = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupValues) {
    setError(null);

    const { data: available } = await supabase.rpc('username_available', {
      p_username: values.username,
    });
    if (available === false) {
      form.setError('username', { message: t('auth.signup.usernameTaken') });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { name: values.name, username: values.username },
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
    <AuthLayout title={t('auth.signup.title')}>
      {error && <Alert kind="error">{error}</Alert>}

      {confirmSent ? (
        <Alert kind="success">{t('auth.signup.confirmSent')}</Alert>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className={s.form}>
          <Field
            label={t('auth.signup.name')}
            htmlFor="name"
            error={form.formState.errors.name?.message}
          >
            <Input id="name" autoComplete="name" {...form.register('name')} />
          </Field>
          <Field
            label={t('auth.signup.username')}
            htmlFor="username"
            hint={t('auth.signup.usernameHint')}
            error={form.formState.errors.username?.message}
          >
            <Input id="username" autoComplete="username" {...form.register('username')} />
          </Field>
          <Field
            label={t('auth.signup.email')}
            htmlFor="email"
            error={form.formState.errors.email?.message}
          >
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </Field>
          <Field
            label={t('auth.signup.password')}
            htmlFor="password"
            hint={t('auth.signup.passwordHint')}
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
            {t('auth.signup.submit')}
          </Button>
        </form>
      )}

      <p className={s.switch}>
        {t('auth.signup.hasAccount')}{' '}
        <Link to="/login" className={s.linkStrong}>
          {t('auth.signup.signIn')}
        </Link>
      </p>
    </AuthLayout>
  );
}
