import { createClient } from '@/lib/supabase/server';

const PHOTO_BUCKET = 'member-photos';
const SIGNED_URL_TTL_SECONDS = 3600;

/** 사진 경로 목록을 1시간짜리 signed URL 맵으로 변환한다. */
export async function getSignedPhotoUrls(paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  const valid = paths.filter(Boolean);
  if (valid.length === 0) return urls;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(valid, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return urls;

  for (const item of data) {
    if (item.signedUrl && item.path) {
      urls.set(item.path, item.signedUrl);
    }
  }
  return urls;
}

export { PHOTO_BUCKET };
