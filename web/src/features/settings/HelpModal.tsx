import { Modal } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import s from './HelpModal.module.css';

const FAQ_KEYS = ['xp', 'groups', 'challenges', 'reopenGame', 'stillStuck'] as const;

/** Perguntas frequentes sobre a app — não substitui o "Reportar problema". */
export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();

  return (
    <Modal open={open} onClose={onClose} title={t('settings.help.title')} variant="sheet" size="md">
      <dl className={s.list}>
        {FAQ_KEYS.map((key) => (
          <div key={key} className={s.item}>
            <dt className={s.question}>{t(`settings.help.faq.${key}.q`)}</dt>
            <dd className={s.answer}>{t(`settings.help.faq.${key}.a`)}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
