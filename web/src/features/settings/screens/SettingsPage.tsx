import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Page, PageTitle, SegmentedTabs, SettingsRow } from '@/shared/components/ui';
import { ComputerIcon, MoonIcon, SunIcon } from '@/shared/components/ui/icons';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ChangePasswordModal } from '@/features/auth/components/ChangePasswordModal';
import { ChangeEmailModal } from '@/features/auth/components/ChangeEmailModal';
import { useProfile } from '@/features/profile/hooks/profileHooks';
import { ChangeUsernameModal } from '@/features/profile/components/ChangeUsernameModal';
import { ReportBugModal } from '@/features/feedback/components/ReportBugModal';
import { PrivacyCard } from '@/features/tracking/components/PrivacyCard';
import { PushNotificationsCard } from '@/features/notifications/components/PushNotificationsCard';
import { pushSupported } from '@/features/notifications/hooks/pushHooks';
import { useTheme } from '@/shared/theme/useTheme';
import { type ThemeChoice } from '@/shared/theme/ThemeProvider';
import { useT } from '@/shared/i18n/useT';
import { LANG_LABELS, type LangCode } from '@/shared/i18n/translations';
import { SettingsPicker } from '../components/SettingsPicker';
import { HelpModal } from '../components/HelpModal';
import s from './SettingsPage.module.css';

const LANG_ITEMS: { value: LangCode; label: string }[] = (['pt', 'en'] as const).map((value) => ({
  value,
  label: LANG_LABELS[value],
}));
const THEME_ORDER: ThemeChoice[] = ['system', 'dark', 'light'];

type ActiveSheet = 'appearance' | 'language' | null;

/** Account settings: profile, appearance, language, privacy, help, and session. */
export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [reportOpen, setReportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const { theme, setTheme } = useTheme();
  const { t, lang, setLang } = useT();

  const themeItems: { value: ThemeChoice; label: ReactNode; ariaLabel: string }[] = [
    {
      value: 'light',
      label: <SunIcon aria-hidden="true" />,
      ariaLabel: t('settings.appearance.light'),
    },
    {
      value: 'dark',
      label: <MoonIcon aria-hidden="true" />,
      ariaLabel: t('settings.appearance.dark'),
    },
    {
      value: 'system',
      label: <ComputerIcon aria-hidden="true" />,
      ariaLabel: t('settings.appearance.system'),
    },
  ];
  const themeOptions = THEME_ORDER.map((value) => ({
    value,
    label: t(`settings.appearance.${value}`),
  }));

  async function handleSignOut() {
    const ok = await confirm({
      title: t('settings.session.confirmTitle'),
      message: t('settings.session.confirmMessage'),
      confirmLabel: t('settings.session.confirmLabel'),
    });
    if (!ok) return;
    await signOut();
    navigate('/login', { replace: true });
  }

  if (activeSheet === 'appearance') {
    return (
      <SettingsPicker<ThemeChoice>
        title={t('settings.appearance.title')}
        backLabel={t('settings.back')}
        options={themeOptions}
        value={theme}
        onChange={setTheme}
        onBack={() => setActiveSheet(null)}
      />
    );
  }
  if (activeSheet === 'language') {
    return (
      <SettingsPicker<LangCode>
        title={t('settings.language.title')}
        backLabel={t('settings.back')}
        options={LANG_ITEMS}
        value={lang}
        onChange={setLang}
        onBack={() => setActiveSheet(null)}
      />
    );
  }

  return (
    <Page>
      <PageTitle>{t('settings.title')}</PageTitle>

      <div>
        <h2 className={s.sectionTitle}>{t('settings.section.account')}</h2>
        <Card padded={false} className={s.panel}>
          <SettingsRow
            label={t('settings.account.username.title')}
            actionLabel={t('settings.account.change')}
            mobileValue={profile?.username}
            disabled={!profile}
            onAction={() => setUsernameModalOpen(true)}
            arrowStyle
          />

          <SettingsRow
            label={t('settings.account.password.title')}
            actionLabel={t('settings.account.change')}
            onAction={() => setPasswordModalOpen(true)}
            arrowStyle
          />

          <SettingsRow
            label={t('settings.account.email.title')}
            actionLabel={t('settings.account.change')}
            mobileValue={user?.email}
            onAction={() => setEmailModalOpen(true)}
            arrowStyle
          />
        </Card>
      </div>

      <div>
        <h2 className={s.sectionTitle}>{t('settings.section.appearance')}</h2>
        <Card padded={false} className={s.panel}>
          <SettingsRow
            label={t('settings.appearance.title')}
            control={
              <SegmentedTabs<ThemeChoice>
                value={theme}
                onChange={setTheme}
                items={themeItems}
                size="md"
              />
            }
            mobileValue={t(`settings.appearance.${theme}`)}
            onMobileTap={() => setActiveSheet('appearance')}
          />

          <SettingsRow
            label={t('settings.language.title')}
            control={
              <SegmentedTabs<LangCode>
                value={lang}
                onChange={setLang}
                items={LANG_ITEMS}
                size="md"
              />
            }
            mobileValue={LANG_LABELS[lang]}
            onMobileTap={() => setActiveSheet('language')}
          />
        </Card>
      </div>

      {profile && pushSupported && (
        <div>
          <h2 className={s.sectionTitle}>{t('settings.section.notifications')}</h2>
          <Card padded={false} className={s.panel}>
            <PushNotificationsCard userId={profile.id} />
          </Card>
        </div>
      )}

      {profile && (
        <div>
          <h2 className={s.sectionTitle}>{t('settings.section.privacy')}</h2>
          <Card padded={false} className={s.panel}>
            <PrivacyCard userId={profile.id} />
          </Card>
          <p className={s.groupNote}>{t('settings.privacy.legalNote')}</p>
        </div>
      )}

      <div>
        <h2 className={s.sectionTitle}>{t('settings.section.support')}</h2>
        <Card padded={false} className={s.panel}>
          <SettingsRow
            label={t('settings.help.title')}
            actionLabel={t('settings.help.title')}
            onAction={() => setHelpOpen(true)}
            arrowStyle
          />

          <SettingsRow
            label={t('settings.help.report')}
            actionLabel={t('settings.help.report')}
            onAction={() => setReportOpen(true)}
            arrowStyle
          />

          <SettingsRow
            label={t('settings.session.title')}
            actionLabel={t('settings.session.signOut')}
            actionVariant="danger"
            navigational={false}
            onAction={handleSignOut}
          />
        </Card>
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ReportBugModal open={reportOpen} onClose={() => setReportOpen(false)} />
      {profile && (
        <ChangeUsernameModal
          open={usernameModalOpen}
          currentUsername={profile.username}
          onClose={() => setUsernameModalOpen(false)}
        />
      )}
      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
      <ChangeEmailModal
        open={emailModalOpen}
        currentEmail={user?.email}
        onClose={() => setEmailModalOpen(false)}
      />
    </Page>
  );
}
