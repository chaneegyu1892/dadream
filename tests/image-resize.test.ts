import { describe, expect, it } from 'vitest';
import { fitWithin } from '@/lib/image-resize';

describe('fitWithin', () => {
  it('최대 크기 이하 이미지는 원본 크기를 유지한다', () => {
    expect(fitWithin(400, 300, 512)).toEqual({ width: 400, height: 300 });
    expect(fitWithin(512, 512, 512)).toEqual({ width: 512, height: 512 });
  });

  it('가로가 긴 이미지는 가로를 최대 크기에 맞춘다', () => {
    expect(fitWithin(2048, 1024, 512)).toEqual({ width: 512, height: 256 });
  });

  it('세로가 긴 이미지는 세로를 최대 크기에 맞춘다', () => {
    expect(fitWithin(1024, 2048, 512)).toEqual({ width: 256, height: 512 });
  });

  it('크기는 1px 미만으로 내려가지 않는다', () => {
    expect(fitWithin(10000, 1, 512)).toEqual({ width: 512, height: 1 });
  });

  it('비율을 유지하며 반올림한다', () => {
    const { width, height } = fitWithin(1000, 750, 512);
    expect(width).toBe(512);
    expect(height).toBe(384);
  });
});
