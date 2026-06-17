export interface SquareCrop {
  /** 원본에서 잘라낼 정사각 영역의 좌상단 x */
  sx: number;
  /** 원본에서 잘라낼 정사각 영역의 좌상단 y */
  sy: number;
  /** 잘라낼 정사각 한 변(원본 px 기준) */
  size: number;
  /** 출력 정사각 한 변(size와 max 중 작은 값) */
  target: number;
}

/**
 * 원본 가운데를 기준으로 정사각형 영역을 잘라내기 위한 좌표·크기를 계산한다.
 * 아바타는 원형으로 표시되므로, 비율을 늘리지 않고 가운데를 채우도록(cover) 크롭한다.
 * 출력 한 변은 max를 넘지 않는다(고해상도 원본 축소).
 */
export function coverCropToSquare(width: number, height: number, max: number): SquareCrop {
  const size = Math.max(1, Math.min(width, height));
  const sx = Math.round((width - size) / 2);
  const sy = Math.round((height - size) / 2);
  const target = Math.min(size, max);
  return { sx, sy, size, target };
}
