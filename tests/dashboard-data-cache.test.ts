import { describe, expect, it, vi } from 'vitest';
import { unstable_cache } from 'next/cache';

vi.mock('next/cache', () => ({
  // 본문 실행 없이 keyParts만 기록하는 모킹 (env 의존 회피)
  unstable_cache: vi.fn((_fn, keyParts) => () => ({ __cached: true, keyParts })),
}));

const unstableCacheMock = vi.mocked(unstable_cache);

describe('dashboard-data-cache keyParts', () => {
  it('getCachedMembersOverview: keyParts는 고정 prefix만 포함하고 userId/role은 인자로 위임한다', async () => {
    unstableCacheMock.mockClear();
    // 동적 import로 모듈 캐시 우회 (테스트 간 상태 격리)
    const { getCachedMembersOverview } = await import('@/lib/dashboard-data-cache');
    await getCachedMembersOverview('user-1', 'officer', 'tok');
    expect(unstableCacheMock).toHaveBeenCalledTimes(1);
    const [, keyParts] = unstableCacheMock.mock.calls[0]!;
    expect(keyParts).toEqual(['dashboard-members-overview']);
  });

  it('getCachedCells: keyParts는 고정 prefix만 포함한다', async () => {
    unstableCacheMock.mockClear();
    const { getCachedCells } = await import('@/lib/dashboard-data-cache');
    await getCachedCells('user-1', 'member', 'tok');
    const [, keyParts] = unstableCacheMock.mock.calls[0]!;
    expect(keyParts).toEqual(['dashboard-cells']);
  });

  it('getCachedCalendarDisplay: keyParts는 from/to만 포함한다 (시간 의존 변수만)', async () => {
    unstableCacheMock.mockClear();
    const { getCachedCalendarDisplay } = await import('@/lib/dashboard-data-cache');
    await getCachedCalendarDisplay('user-1', 'staff', 'tok', { from: '2026-06-01', to: '2026-06-30' });
    const [, keyParts] = unstableCacheMock.mock.calls[0]!;
    expect(keyParts).toEqual(['dashboard-calendar', '2026-06-01', '2026-06-30']);
  });

  it('getCachedHomeEvents: keyParts는 from/to만 포함한다', async () => {
    unstableCacheMock.mockClear();
    const { getCachedHomeEvents } = await import('@/lib/dashboard-data-cache');
    await getCachedHomeEvents('user-1', 'pastor', 'tok', { from: '2026-06-18', to: '2026-06-25' });
    const [, keyParts] = unstableCacheMock.mock.calls[0]!;
    expect(keyParts).toEqual(['dashboard-home-events', '2026-06-18', '2026-06-25']);
  });

  it('getCachedHomeService: keyParts는 thisWeek/nextWeek만 포함한다', async () => {
    unstableCacheMock.mockClear();
    const { getCachedHomeService } = await import('@/lib/dashboard-data-cache');
    await getCachedHomeService('user-1', 'member', 'tok', '2026-06-22', '2026-06-29');
    const [, keyParts] = unstableCacheMock.mock.calls[0]!;
    expect(keyParts).toEqual(['dashboard-home-service', '2026-06-22', '2026-06-29']);
  });

  it('STABLE_CACHE_SECONDS는 30분이다 (C1 합의: 권한 변경 반영 시간)', async () => {
    const { STABLE_CACHE_SECONDS } = await import('@/lib/dashboard-cache-tags');
    expect(STABLE_CACHE_SECONDS).toBe(30 * 60);
  });
});
