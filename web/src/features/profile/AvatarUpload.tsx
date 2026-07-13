import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';
import { Alert, Button } from '@/components/ui';
import { compressImage } from './imageCompression';

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
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 overflow-hidden rounded-full bg-navy-800">
        {photoUrl ? (
          <img src={photoUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-300">
            {initial}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
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
