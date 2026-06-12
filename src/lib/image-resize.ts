export interface Dimensions {
  width: number;
  height: number;
}

/** 비율을 유지하며 가로·세로가 max 이하가 되도록 줄인 크기를 반환한다. */
export function fitWithin(width: number, height: number, max: number): Dimensions {
  if (width <= max && height <= max) {
    return { width, height };
  }
  const scale = max / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
