import { Modal } from '@/shared/components/ui';
import { ImageIcon, PhoneIcon, PinIcon } from '@/shared/components/ui/icons';
import type { Place } from './placeHooks';
import s from './PlaceDetailModal.module.css';

interface PlaceDetailModalProps {
  place: Place;
  onClose: () => void;
}

/** Dialog com os detalhes de um campo — aberto ao clicar num pin individual no mapa. */
export function PlaceDetailModal({ place, onClose }: PlaceDetailModalProps) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  return (
    <Modal open onClose={onClose} size="auto">
      <div className={s.layout}>
        <div className={s.imagePlaceholder}>
          <ImageIcon width={28} height={28} />
        </div>

        <div className={s.info}>
          <h3 className={s.name}>{place.name}</h3>

          <div className={s.details}>
            <span className={s.row}>
              <PinIcon width={16} height={16} />
              {place.concelho}, {place.district}
            </span>

            {place.phone && (
              <span className={s.row}>
                <PhoneIcon width={16} height={16} />
                {place.phone}
              </span>
            )}
          </div>

          <div className={s.actions}>
            <a className={s.actionLink} href={directionsUrl} target="_blank" rel="noreferrer">
              Direções
            </a>

            {place.url && (
              <a className={s.actionLink} href={place.url} target="_blank" rel="noreferrer">
                Ver ligação
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
