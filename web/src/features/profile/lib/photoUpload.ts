import { supabase } from '@/shared/lib/supabase';

/** Uploads a cropped photo blob to the `avatars` bucket under the user's own folder, returning a cache-busted public URL. */
export async function uploadProfilePhoto(
  userId: string,
  filename: string,
  blob: Blob,
): Promise<string> {
  const path = `${userId}/${filename}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: 'image/webp', cacheControl: '3600' });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Deletes a previously uploaded profile photo from the `avatars` bucket. */
export async function removeProfilePhoto(userId: string, filename: string): Promise<void> {
  const { error } = await supabase.storage.from('avatars').remove([`${userId}/${filename}`]);
  if (error) throw error;
}
