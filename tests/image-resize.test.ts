import { describe, expect, it } from 'vitest';
import { coverCropToSquare } from '@/lib/image-resize';

describe('coverCropToSquare', () => {
  it('정사각 이미지는 통째로, max 이하면 원본 크기를 유지한다', () => {
    expect(coverCropToSquare(400, 400, 512)).toEqual({ sx: 0, sy: 0, size: 400, target: 400 });
    expect(coverCropToSquare(512, 512, 512)).toEqual({ sx: 0, sy: 0, size: 512, target: 512 });
  });

  it('가로가 긴 이미지는 좌우를 잘라 가운데 정사각을 쓴다', () => {
    expect(coverCropToSquare(2048, 1024, 512)).toEqual({ sx: 512, sy: 0, size: 1024, target: 512 });
  });

  it('세로가 긴 이미지는 위아래를 잘라 가운데 정사각을 쓴다', () => {
    expect(coverCropToSquare(1024, 2048, 512)).toEqual({ sx: 0, sy: 512, size: 1024, target: 512 });
  });

  it('작은 이미지는 짧은 변 기준으로 잘라 그 크기를 출력한다', () => {
    expect(coverCropToSquare(400, 300, 512)).toEqual({ sx: 50, sy: 0, size: 300, target: 300 });
  });

  it('가운데 정렬 오프셋은 반올림한다', () => {
    // 가로 1001, 세로 300 → size 300, 남는 가로 701 / 2 = 350.5 → 351
    expect(coverCropToSquare(1001, 300, 512)).toEqual({ sx: 351, sy: 0, size: 300, target: 300 });
  });
});
