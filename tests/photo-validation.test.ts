import { describe, expect, it } from 'vitest';
import { photoExtensionFor } from '@/lib/photo-validation';

describe('photoExtensionFor', () => {
  it('허용된 이미지 MIME 타입은 확장자를 반환한다', () => {
    expect(photoExtensionFor('image/jpeg')).toBe('jpg');
    expect(photoExtensionFor('image/png')).toBe('png');
    expect(photoExtensionFor('image/webp')).toBe('webp');
    expect(photoExtensionFor('image/gif')).toBe('gif');
  });

  it('허용되지 않은 MIME 타입은 null을 반환한다', () => {
    expect(photoExtensionFor('image/svg+xml')).toBeNull();
    expect(photoExtensionFor('text/html')).toBeNull();
    expect(photoExtensionFor('application/pdf')).toBeNull();
    expect(photoExtensionFor('application/octet-stream')).toBeNull();
    expect(photoExtensionFor('')).toBeNull();
  });

  it('대소문자가 섞인 MIME 타입도 처리한다', () => {
    expect(photoExtensionFor('IMAGE/JPEG')).toBe('jpg');
    expect(photoExtensionFor('Image/Png')).toBe('png');
  });
});
