import { describe, expect, it } from 'vitest';
import { config } from '@/proxy';

describe('proxy config', () => {
  it('prefetch 요청은 proxy 세션 검증을 건너뛴다', () => {
    expect(config.matcher).toEqual([
      expect.objectContaining({
        missing: expect.arrayContaining([
          { type: 'header', key: 'next-router-prefetch' },
          { type: 'header', key: 'purpose', value: 'prefetch' },
        ]),
      }),
    ]);
  });
});
