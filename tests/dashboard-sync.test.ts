import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getSessionProfile } from '@/lib/auth';
import { DASHBOARD_CACHE_TAGS } from '@/lib/dashboard-cache-tags';
import { syncDashboardData } from '@/app/(dashboard)/admin/sync-actions';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getSessionProfile: vi.fn(),
}));

const getSessionProfileMock = vi.mocked(getSessionProfile);
const revalidatePathMock = vi.mocked(revalidatePath);
const revalidateTagMock = vi.mocked(revalidateTag);

describe('syncDashboardData', () => {
  beforeEach(() => {
    getSessionProfileMock.mockReset();
    revalidatePathMock.mockReset();
    revalidateTagMock.mockReset();
  });

  it('임원 이상만 명부/캘린더 캐시를 동기화할 수 있다', async () => {
    getSessionProfileMock.mockResolvedValue({
      userId: 'u1',
      role: 'officer',
      approval: 'approved',
      memberId: 'm1',
      kakaoNickname: '임원',
    });

    const result = await syncDashboardData();

    expect(result.ok).toBe(true);
    expect(revalidateTagMock).toHaveBeenCalledWith(DASHBOARD_CACHE_TAGS.members, { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith(DASHBOARD_CACHE_TAGS.cells, { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith(DASHBOARD_CACHE_TAGS.calendar, { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith(DASHBOARD_CACHE_TAGS.homeEvents, { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith(DASHBOARD_CACHE_TAGS.homeService, { expire: 0 });
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePathMock).toHaveBeenCalledWith('/members');
    expect(revalidatePathMock).toHaveBeenCalledWith('/visits');
  });

  it('일반 청년은 동기화할 수 없다', async () => {
    getSessionProfileMock.mockResolvedValue({
      userId: 'u2',
      role: 'member',
      approval: 'approved',
      memberId: 'm2',
      kakaoNickname: '청년',
    });

    const result = await syncDashboardData();

    expect(result).toEqual({ ok: false, message: '동기화 권한이 없어요.' });
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});
