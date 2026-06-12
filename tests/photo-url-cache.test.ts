import { describe, expect, it } from 'vitest';
import { createPhotoUrlCache } from '@/lib/photo-url-cache';

const HOUR_MS = 60 * 60 * 1000;

describe('createPhotoUrlCache', () => {
  it('저장한 URL을 만료 전까지 반환한다', () => {
    const cache = createPhotoUrlCache();
    cache.set('a.jpg', 'https://signed/a', 0 + 12 * HOUR_MS);
    expect(cache.get('a.jpg', 1 * HOUR_MS)).toBe('https://signed/a');
  });

  it('없는 경로는 null을 반환한다', () => {
    const cache = createPhotoUrlCache();
    expect(cache.get('missing.jpg', 0)).toBeNull();
  });

  it('만료가 임박한 URL은 null을 반환해 재발급을 유도한다', () => {
    const cache = createPhotoUrlCache();
    cache.set('a.jpg', 'https://signed/a', 12 * HOUR_MS);
    // 만료 30분 전부터는 재발급
    expect(cache.get('a.jpg', 12 * HOUR_MS - 10 * 60 * 1000)).toBeNull();
  });

  it('같은 경로에 다시 저장하면 새 URL로 교체된다', () => {
    const cache = createPhotoUrlCache();
    cache.set('a.jpg', 'https://signed/old', 12 * HOUR_MS);
    cache.set('a.jpg', 'https://signed/new', 24 * HOUR_MS);
    expect(cache.get('a.jpg', 1 * HOUR_MS)).toBe('https://signed/new');
  });
});
