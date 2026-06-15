import { describe, expect, it } from 'vitest';
import manifest from '@/app/manifest';

describe('PWA manifest', () => {
  it('홈화면 앱은 가벼운 launch 화면에서 시작한다', () => {
    expect(manifest().start_url).toBe('/launch');
    expect(manifest().background_color).toBe('#ffffff');
    expect(manifest().theme_color).toBe('#ffffff');
  });
});
