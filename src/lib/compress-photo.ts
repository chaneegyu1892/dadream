'use client';

import { coverCropToSquare } from '@/lib/image-resize';

const MAX_DIMENSION = 512;
const WEBP_QUALITY = 0.85;

/**
 * 사진을 가운데 기준 정사각형으로 크롭해 512px 이내 WebP로 저장한다.
 * 아바타가 원형으로 표시되므로 비율을 늘리지 않고(cover) 가운데를 채운다.
 * 브라우저가 디코딩하지 못하면 원본을 반환하고, 타입·용량 검증은 서버 액션에서 최종 수행된다.
 */
export async function compressPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const { sx, sy, size, target } = coverCropToSquare(bitmap.width, bitmap.height, MAX_DIMENSION);

    const canvas = document.createElement('canvas');
    canvas.width = target;
    canvas.height = target;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    // 원본의 정사각 영역(sx,sy,size)을 target×target 캔버스에 꽉 채워 그린다.
    ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, target, target);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    );
    if (!blob || blob.size === 0) return file;

    return new File([blob], 'photo.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}
