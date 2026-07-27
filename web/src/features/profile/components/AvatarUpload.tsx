import { useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Alert, Avatar } from '@/shared/components/ui';
import { CloseIcon, PlusIcon } from '@/shared/components/ui/icons';
import { removeProfilePhoto, uploadProfilePhoto } from '../lib/photoUpload';
import { ImageCropper } from './ImageCropper';
import s from './AvatarUpload.module.css';

interface AvatarUploadProps {
  name: string;
  photoUrl: string | null;
  onUploaded: (publicUrl: string | null) => void;
}

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const FILENAME = 'avatar.webp';

/** Avatar image picker: a + badge over the avatar - click to crop and upload, or remove the current photo. */
export function AvatarUpload({ name, photoUrl, onUploaded }: AvatarUploadProps) {
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
        <button
          type="button"
          className={s.tile}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          aria-label={photoUrl ? 'Mudar foto de perfil' : 'Adicionar foto de perfil'}
        >
          <Avatar name={name} src={photoUrl} size="xl" />
          <span className={s.plusBadge}>
            <PlusIcon width={14} height={14} />
          </span>
        </button>

        {photoUrl && (
          <button
            type="button"
            className={s.removeBadge}
            disabled={busy}
            onClick={handleRemove}
            aria-label="Remover foto de perfil"
          >
            <CloseIcon width={12} height={12} />
          </button>
        )}
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
          aspect={1}
          outputWidth={480}
          round
          title="Ajustar foto de perfil"
          onCancel={() => setCropFile(null)}
          onConfirm={handleCropped}
        />
      )}
    </div>
  );
}
