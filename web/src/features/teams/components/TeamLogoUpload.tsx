import { useRef, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { Alert, Avatar, Button } from '@/shared/components/ui';
import { compressImage } from '@/features/profile/lib/imageCompression';
import { useT } from '@/shared/i18n/useT';
import s from './TeamLogoUpload.module.css';

interface TeamLogoUploadProps {
  gameId: string;
  side: 'A' | 'B';
  name: string;
  logoUrl: string | null;
  onUploaded: (publicUrl: string) => void;
}

const MAX_INPUT_BYTES = 8 * 1024 * 1024;

/** Uploads a team's logo, storing it under `<gameId>/<side>.webp`. */
export function TeamLogoUpload({ gameId, side, name, logoUrl, onUploaded }: TeamLogoUploadProps) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError(t('teams.logo.errorType'));
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError(t('teams.logo.errorSize'));
      return;
    }

    setUploading(true);
    try {
      const blob = await compressImage(file);
      const path = `${gameId}/${side}.webp`;
      const { error: upErr } = await supabase.storage
        .from('game-team-logos')
        .upload(path, blob, { upsert: true, contentType: 'image/webp', cacheControl: '3600' });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from('game-team-logos').getPublicUrl(path);
      onUploaded(`${data.publicUrl}?v=${Date.now()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('teams.logo.errorUpload'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={s.wrap}>
      <Avatar name={name} src={logoUrl} size="md" />
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
        {t('teams.logo.change')}
      </Button>
      {error && <Alert kind="error">{error}</Alert>}
    </div>
  );
}
