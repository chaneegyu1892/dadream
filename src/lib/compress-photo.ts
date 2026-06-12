'use client';

import { fitWithin } from '@/lib/image-resize';

const MAX_DIMENSION = 512;
const WEBP_QUALITY = 0.8;

/**
 * 사진을 512px 이내 WebP로 압축한다 (아바타 용도라 충분한 해상도).
 * 브라우저가 디코딩하지 못하는 형식이거나 압축 효과가 없으면 원본을 반환하고,
 * 타입·용량 검증은 서버 액션에서 최종 수행된다.
 */
export async function compressPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_DIMENSION);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    );
    if (!blob || blob.size === 0 || blob.size >= file.size) return file;

    return new File([blob], 'photo.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}
