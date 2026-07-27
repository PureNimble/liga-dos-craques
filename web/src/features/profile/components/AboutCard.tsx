import { Card } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import { formatDate } from '@/shared/lib/datetime';
import s from './AboutCard.module.css';

interface AboutCardProps {
  name: string;
  birthDate: string | null;
  footLabel: string | null;
  heightLabel: string | null;
  locality: string | null;
  memberSince: string;
}

/** "About" card: full name and other profile details visible only to the owner. */
export function AboutCard({
  name,
  birthDate,
  footLabel,
  heightLabel,
  locality,
  memberSince,
}: AboutCardProps) {
  const { t } = useT();
  const rows: [string, string][] = [
    [t('profile.about.fullName'), name],
    [t('profile.about.birthDate'), birthDate ? formatDate(birthDate) : '—'],
    [t('profile.about.foot'), footLabel ?? '—'],
    [t('profile.about.height'), heightLabel ?? '—'],
    [t('profile.about.locality'), locality ?? '—'],
    [t('profile.about.memberSince'), formatDate(memberSince)],
  ];

  return (
    <Card>
      <h2 className={s.title}>{t('profile.about.title')}</h2>
      <dl className={s.list}>
        {rows.map(([label, value]) => (
          <div key={label} className={s.row}>
            <dt className={s.label}>{label}</dt>
            <dd className={s.value}>{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
