import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refresh, revalidatePath } from 'next/cache';
import { getSessionProfile } from '@/lib/auth';
import { syncDashboardData } from '@/app/(dashboard)/admin/sync-actions';

vi.mock('next/cache', () => ({
  refresh: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getSessionProfile: vi.fn(),
}));

const getSessionProfileMock = vi.mocked(getSessionProfile);
const revalidatePathMock = vi.mocked(revalidatePath);
const refreshMock = vi.mocked(refresh);

describe('syncDashboardData', () => {
  beforeEach(() => {
    getSessionProfileMock.mockReset();
    revalidatePathMock.mockReset();
    refreshMock.mockReset();
  });

  it('임원 이상만 대시보드 캐시를 동기화할 수 있다', async () => {
    getSessionProfileMock.mockResolvedValue({
      userId: 'u1',
      role: 'officer',
      approval: 'approved',
      memberId: 'm1',
      kakaoNickname: '임원',
    });

    const result = await syncDashboardData();

    expect(result.ok).toBe(true);
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePathMock).toHaveBeenCalledWith('/');
    expect(revalidatePathMock).toHaveBeenCalledWith('/members');
    expect(revalidatePathMock).toHaveBeenCalledWith('/visits');
    expect(refreshMock).toHaveBeenCalledTimes(1);
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
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
