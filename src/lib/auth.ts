import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/roles';

export type SessionProfile = {
  userId: string;
  role: UserRole;
  approval: 'pending' | 'approved' | 'rejected';
  memberId: string | null;
  kakaoNickname: string | null;
};

/** 로그인한 사용자의 프로필을 조회한다. 미로그인이면 null. 같은 서버 렌더 요청 안에서는 중복 조회를 줄인다. */
export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, approval, member_id, kakao_nickname')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    // DB/네트워크 오류 — 권한을 추측하지 않고 미인증으로 처리한다
    console.error('[getSessionProfile] 프로필 조회 오류:', error.message);
    return null;
  }

  if (!profile) {
    // 트리거가 프로필을 만들기 전 — 승인 대기로 취급
    return {
      userId: user.id,
      role: 'member',
      approval: 'pending',
      memberId: null,
      kakaoNickname: null,
    };
  }

  return {
    userId: user.id,
    role: profile.role,
    approval: profile.approval,
    memberId: profile.member_id,
    kakaoNickname: profile.kakao_nickname,
  };
});
