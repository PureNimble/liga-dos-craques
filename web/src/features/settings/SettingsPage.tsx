import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { useAuth } from '@/features/auth/useAuth';
import { useProfile } from '@/features/profile/profileHooks';
import { ReportBugModal } from '@/features/feedback/ReportBugModal';
import { PrivacyCard } from '@/features/tracking/PrivacyCard';
import s from './SettingsPage.module.css';

/** Definições da conta: perfil, privacidade, ajuda e sessão. */
export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [reportOpen, setReportOpen] = useState(false);

  async function handleSignOut() {
    const ok = await confirm({
      title: 'Terminar sessão?',
      message: 'Vais precisar de iniciar sessão novamente.',
      confirmLabel: 'Sair',
    });
    if (!ok) return;
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className={s.page}>
      <header>
        <h1 className={s.pageTitle}>Definições</h1>
        <p className={s.subtitle}>{user?.email}</p>
      </header>

      <section className={s.card}>
        <div className={s.text}>
          <h2 className={s.title}>Conta</h2>
          <p className={s.body}>
            {profile?.name ?? 'O teu perfil'} — nome, posição, foto e password.
          </p>
        </div>
        <div className={s.actions}>
          <Link to="/profile">
            <Button variant="secondary">Editar perfil</Button>
          </Link>
          <Link to="/update-password">
            <Button variant="ghost">Mudar password</Button>
          </Link>
        </div>
      </section>

      {profile && <PrivacyCard userId={profile.id} />}

      <section className={s.card}>
        <div className={s.text}>
          <h2 className={s.title}>Ajuda</h2>
          <p className={s.body}>
            Alguma coisa partida ou estranha? Diz-nos — o reporte chega ao admin com a página onde
            estavas.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setReportOpen(true)}>
          Reportar problema
        </Button>
      </section>

      <section className={s.card}>
        <div className={s.text}>
          <h2 className={s.title}>Sessão</h2>
          <p className={s.body}>Termina a sessão neste dispositivo.</p>
        </div>
        <Button variant="danger" onClick={handleSignOut}>
          Terminar sessão
        </Button>
      </section>

      <ReportBugModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
