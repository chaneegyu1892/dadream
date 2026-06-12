/** 업로드를 허용하는 이미지 MIME 타입 → 저장 확장자 매핑. */
const PHOTO_TYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * MIME 타입이 허용된 이미지면 저장에 쓸 확장자를, 아니면 null을 반환한다.
 * 확장자를 파일명이 아닌 MIME 타입에서 유도해 경로 조작을 차단한다.
 */
export function photoExtensionFor(mimeType: string): string | null {
  return PHOTO_TYPE_TO_EXT[mimeType.toLowerCase()] ?? null;
}
