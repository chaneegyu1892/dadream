import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { updateSession } from '@/lib/supabase/middleware';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

const createServerClientMock = vi.mocked(createServerClient);

function request(pathname: string) {
  return new NextRequest(new URL(pathname, 'https://dadream.example'));
}

describe('updateSession', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it('public 경로는 Supabase 세션 조회 없이 바로 통과한다', async () => {
    const response = await updateSession(request('/login'));

    expect(response.status).toBe(200);
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it('미로그인 사용자가 보호 경로를 열면 로그인으로 보낸다', async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const response = await updateSession(request('/members'));

    expect(createServerClientMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://dadream.example/login');
  });
});
