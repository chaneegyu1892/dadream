interface CachedUrl {
  url: string;
  expiresAt: number;
}

/** 만료 30분 전부터는 재발급을 유도한다. */
const REFRESH_BUFFER_MS = 30 * 60 * 1000;

export interface PhotoUrlCache {
  get(path: string, now: number): string | null;
  set(path: string, url: string, expiresAt: number): void;
}

/**
 * signed URL 인메모리 캐시.
 * 요청마다 새 서명이 발급되면 URL이 매번 바뀌어 브라우저 이미지 캐시가 무력화되므로,
 * 같은 서버 인스턴스에서는 만료 전까지 동일한 URL을 재사용한다.
 */
export function createPhotoUrlCache(): PhotoUrlCache {
  const entries = new Map<string, CachedUrl>();

  return {
    get(path: string, now: number): string | null {
      const entry = entries.get(path);
      if (!entry || entry.expiresAt - REFRESH_BUFFER_MS <= now) {
        return null;
      }
      return entry.url;
    },
    set(path: string, url: string, expiresAt: number): void {
      entries.set(path, { url, expiresAt });
    },
  };
}
