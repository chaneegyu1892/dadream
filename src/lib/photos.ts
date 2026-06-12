import { createPhotoUrlCache } from '@/lib/photo-url-cache';
import { createClient } from '@/lib/supabase/server';

const PHOTO_BUCKET = 'member-photos';
const SIGNED_URL_TTL_SECONDS = 12 * 60 * 60;

// 인스턴스 수명 동안 URL을 재사용해 브라우저 이미지 캐시가 동작하게 한다.
const urlCache = createPhotoUrlCache();

/** 사진 경로 목록을 signed URL 맵으로 변환한다. 발급된 URL은 만료 전까지 재사용한다. */
export async function getSignedPhotoUrls(paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  const valid = Array.from(new Set(paths.filter(Boolean)));
  if (valid.length === 0) return urls;

  const now = Date.now();
  const missing: string[] = [];
  for (const path of valid) {
    const cached = urlCache.get(path, now);
    if (cached) {
      urls.set(path, cached);
    } else {
      missing.push(path);
    }
  }
  if (missing.length === 0) return urls;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(missing, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    if (error) {
      console.error('[getSignedPhotoUrls] signed URL 발급 실패:', error.message);
    }
    return urls;
  }

  const expiresAt = now + SIGNED_URL_TTL_SECONDS * 1000;
  for (const item of data) {
    if (item.signedUrl && item.path) {
      urls.set(item.path, item.signedUrl);
      urlCache.set(item.path, item.signedUrl, expiresAt);
    }
  }
  return urls;
}

export { PHOTO_BUCKET };
