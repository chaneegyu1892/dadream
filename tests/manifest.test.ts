import { describe, expect, it } from 'vitest';
import manifest from '@/app/manifest';

describe('PWA manifest', () => {
  const m = manifest();

  it('설치형 앱으로 동작하는 핵심 필드를 갖춘다', () => {
    expect(m.name).toContain('다드림');
    expect(m.short_name).toBe('다드림');
    expect(m.display).toBe('standalone');
    expect(m.lang).toBe('ko');
  });

  it('홈화면 앱은 가벼운 launch 화면에서 시작한다', () => {
    expect(m.start_url).toBe('/launch');
    expect(m.background_color).toBe('#ffffff');
    expect(m.theme_color).toBe('#ffffff');
  });

  it('192/512 아이콘과 maskable 아이콘을 제공한다', () => {
    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    const maskable = (m.icons ?? []).some((i) => i.purpose === 'maskable');
    expect(maskable).toBe(true);
  });
});
