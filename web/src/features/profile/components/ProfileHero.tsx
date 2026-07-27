import { EditIcon, ShieldIcon } from '@/shared/components/ui/icons';
import { PLACEHOLDER_PLAYER_PHOTO } from '@/shared/lib/placeholderPhoto';
import { useT } from '@/shared/i18n/useT';
import { useUpdatePosingPhoto } from '../hooks/profileHooks';
import { PosingPhotoUpload } from './PosingPhotoUpload';
import s from './ProfileHero.module.css';

interface ProfileHeroProps {
  name: string;
  photoUrl: string | null;
  positionLabel?: string | null;
  locality?: string | null;
  onEdit?: () => void;
}

/** Player identity card: photo/silhouette on a dark gradient, name and position - fixed dark like the app's other decorative "brand" cards. */
export function ProfileHero({ name, photoUrl, positionLabel, locality, onEdit }: ProfileHeroProps) {
  const { t } = useT();
  const updatePosingPhoto = useUpdatePosingPhoto();
  const [firstName, ...rest] = name.trim().split(/\s+/);
  const lastName = rest.join(' ');

  return (
    <div className={s.card}>
      <div className={s.stripes} aria-hidden />

      {onEdit && (
        <button type="button" onClick={onEdit} className={s.editPill}>
          <EditIcon width={13} height={13} />
          {t('profile.editProfile')}
        </button>
      )}

      <div className={s.photoArea}>
        {onEdit ? (
          <PosingPhotoUpload photoUrl={photoUrl} onUploaded={(url) => updatePosingPhoto.mutate(url)} />
        ) : (
          <img
            src={photoUrl ?? PLACEHOLDER_PLAYER_PHOTO}
            alt={name}
            className={`${s.photoImg} ${photoUrl ? '' : s.photoImgPlaceholder}`}
          />
        )}
      </div>

      <div className={s.info}>
        {lastName ? (
          <>
            <p className={s.firstName}>{firstName}</p>
            <p className={s.lastName}>{lastName}</p>
          </>
        ) : (
          <p className={s.lastName}>{firstName}</p>
        )}
        {(positionLabel || locality) && (
          <div className={s.subtitle}>
            <ShieldIcon width={14} height={14} />
            {positionLabel && <span>{positionLabel}</span>}
            {positionLabel && locality && <span aria-hidden>·</span>}
            {locality && <span>{locality}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
