import { useRef, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { Alert, Avatar, Button } from '@/shared/components/ui';
import { compressImage } from '@/features/profile/lib/imageCompression';
import s from './GroupAvatarUpload.module.css';

interface GroupAvatarUploadProps {
  groupId: string;
  photoUrl: string | null;
  name: string;
  onUploaded: (publicUrl: string) => void;
}

const MAX_INPUT_BYTES = 8 * 1024 * 1024;

/** Uploads the group photo, storing it under a path prefixed by the group id. */
export function GroupAvatarUpload({ groupId, photoUrl, name, onUploaded }: GroupAvatarUploadProps) {
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
      const path = `${groupId}/avatar.webp`;
      const { error: upErr } = await supabase.storage
        .from('group-avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/webp', cacheControl: '3600' });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from('group-avatars').getPublicUrl(path);
      onUploaded(`${data.publicUrl}?v=${Date.now()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={s.wrap}>
      <Avatar name={name} src={photoUrl} size="xl" />
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
          size="sm"
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
