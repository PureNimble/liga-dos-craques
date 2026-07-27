import { BallIcon, ChevronRightIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import panel from './homePanel.module.css';
import s from './HomeNewsMock.module.css';

/** Mocked featured-news teaser (placeholder content, real feed not implemented yet). */
export function HomeNewsMock() {
  const { t } = useT();

  return (
    <div className={panel.panel}>
      <div className={panel.panelHead}>
        <h2 className={panel.panelTitle}>{t('home.news.title')}</h2>
        <span className={panel.panelLink}>
          {t('home.news.seeAll')} <ChevronRightIcon width={14} height={14} />
        </span>
      </div>
      <div className={s.newsItem}>
        <span className={s.newsThumb} aria-hidden="true">
          <BallIcon width={22} height={22} />
        </span>
        <div className={s.newsBody}>
          <p className={s.newsHeadline}>{t('home.news.item1.title')}</p>
          <p className={s.newsDate}>{t('home.news.item1.date')}</p>
        </div>
      </div>
    </div>
  );
}
