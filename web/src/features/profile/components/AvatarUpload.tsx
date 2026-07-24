import { useRef, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Alert, Button } from '@/shared/components/ui';
import { compressImage } from '../lib/imageCompression';
import s from './AvatarUpload.module.css';

interface AvatarUploadProps {
  photoUrl: string | null;
  name: string;
  onUploaded: (publicUrl: string) => void;
}

const MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8 MB antes de comprimir

export function AvatarUpload({ photoUrl, name, onUploaded }: AvatarUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Escolhe um ficheiro de imagem.');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError('Imagem demasiado grande (máx. 8 MB).');
      return;
    }

    setUploading(true);
    try {
      const blob = await compressImage(file);
      const path = `${user!.id}/avatar.webp`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: '3600',
      });
      if (upErr) throw upErr;

      // URL público com cache-busting para refletir a nova imagem de imediato.
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      onUploaded(`${data.publicUrl}?v=${Date.now()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload.');
    } finally {
      setUploading(false);
    }
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className={s.wrap}>
      <div className={s.avatar}>
        {photoUrl ? (
          <img src={photoUrl} alt="Foto de perfil" className={s.image} />
        ) : (
          <div className={s.fallback}>{initial}</div>
        )}
      </div>
      <div className={s.controls}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className={s.hiddenInput}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="secondary"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          Mudar foto
        </Button>
        {error && <Alert kind="error">{error}</Alert>}
      </div>
    </div>
  );
}
