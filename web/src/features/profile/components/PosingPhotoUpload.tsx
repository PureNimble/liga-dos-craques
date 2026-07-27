import { useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Alert } from '@/shared/components/ui';
import { CloseIcon, PlusIcon } from '@/shared/components/ui/icons';
import { PLACEHOLDER_PLAYER_PHOTO } from '@/shared/lib/placeholderPhoto';
import { removeProfilePhoto, uploadProfilePhoto } from '../lib/photoUpload';
import { ImageCropper } from './ImageCropper';
import s from './PosingPhotoUpload.module.css';

interface PosingPhotoUploadProps {
  photoUrl: string | null;
  onUploaded: (publicUrl: string | null) => void;
}

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const FILENAME = 'posing.webp';
/** Portrait frame (width/height) shared by every place the posing photo is displayed. */
export const POSING_PHOTO_ASPECT = 3 / 4;

/** Full-body "posing" photo picker: a tile with a + badge over the placeholder/preview - click it to crop and upload, or remove the current photo. */
export function PosingPhotoUpload({ photoUrl, onUploaded }: PosingPhotoUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Escolhe um ficheiro de imagem.');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError('Imagem demasiado grande (máx. 8 MB).');
      return;
    }
    setCropFile(file);
  }

  async function handleCropped(blob: Blob) {
    setCropFile(null);
    setBusy(true);
    try {
      const url = await uploadProfilePhoto(user!.id, FILENAME, blob);
      onUploaded(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);
    try {
      await removeProfilePhoto(user!.id, FILENAME);
      onUploaded(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao remover.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.wrap}>
      <div className={s.tileWrap}>
        <img
          src={photoUrl ?? PLACEHOLDER_PLAYER_PHOTO}
          alt=""
          className={`${s.preview} ${photoUrl ? '' : s.previewPlaceholder}`}
        />

        <div className={s.actions}>
          <button
            type="button"
            className={s.plusBadge}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            aria-label={photoUrl ? 'Mudar foto de corpo inteiro' : 'Adicionar foto de corpo inteiro'}
          >
            <PlusIcon width={16} height={16} />
          </button>

          {photoUrl && (
            <button
              type="button"
              className={s.removeBadge}
              disabled={busy}
              onClick={handleRemove}
              aria-label="Remover foto de corpo inteiro"
            >
              <CloseIcon width={16} height={16} />
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={s.hiddenInput}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {error && <Alert kind="error">{error}</Alert>}

      {cropFile && (
        <ImageCropper
          file={cropFile}
          aspect={POSING_PHOTO_ASPECT}
          outputWidth={480}
          title="Ajustar foto de corpo inteiro"
          onCancel={() => setCropFile(null)}
          onConfirm={handleCropped}
        />
      )}
    </div>
  );
}
