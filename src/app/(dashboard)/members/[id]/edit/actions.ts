'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth';
import { revalidateMemberCaches } from '@/lib/dashboard-cache-invalidation';
import { roleAtLeast } from '@/lib/roles';
import {
  DEFAULT_OFFICER_POSITION_OPTIONS,
  FIXED_CELL_ROLE,
  parseMemberEdit,
} from '@/lib/member-edit';
import { PHOTO_BUCKET } from '@/lib/photos';
import { MAX_PHOTO_BYTES, photoExtensionFor } from '@/lib/photo-validation';
import { createClient } from '@/lib/supabase/server';
import type { TablesUpdate } from '@/types/supabase';

const memberIdSchema = z.string().uuid();

/**
 * 임원+가 명부에서 관리하는 필드(이름/셀/직분/성별/등록일 등)와
 * 연락처(전화/생일/세례)를 수정한다.
 * 권한은 반드시 세션에서만 도출하고, 클라이언트 입력은 신뢰하지 않는다.
 * member_private는 이 액션에서 다루지 않는다.
 */
export async function updateMember(
  memberId: string,
  formData: FormData,
): Promise<{ error?: string; success?: true }> {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) {
    return { error: '명부 수정 권한이 없어요.' };
  }

  if (!memberIdSchema.safeParse(memberId).success) {
    return { error: '잘못된 요청이에요.' };
  }

  const now = new Date().toISOString();
  const supabase = await createClient();

  const { data: dutyRows, error: dutyError } = await supabase
    .from('member_duties')
    .select('name')
    .neq('name', FIXED_CELL_ROLE)
    .order('sort_order')
    .order('name');
  if (dutyError) {
    console.error('[updateMember] member_duties 조회 실패:', dutyError.message);
    return { error: '직책 목록을 확인하지 못했어요. 다시 시도해주세요.' };
  }

  const { data: currentMember, error: currentMemberError } = await supabase
    .from('members')
    .select('cell_role, officer_position, duty, photo_path')
    .eq('id', memberId)
    .single();
  if (currentMemberError || !currentMember) {
    console.error('[updateMember] 기존 명부 조회 실패:', currentMemberError?.message);
    return { error: '수정할 청년을 찾지 못했어요.' };
  }

  // 이미 삭제된 옛 직책이라도 현재 값이면 보존할 수 있도록 허용 목록에 포함한다.
  const allowedPositionSet = new Set(
    dutyRows?.map((d) => d.name).filter(Boolean) ?? [],
  );
  if (currentMember.officer_position) {
    allowedPositionSet.add(currentMember.officer_position);
  }
  const legacyDuty = currentMember.duty?.trim();
  if (legacyDuty && legacyDuty !== FIXED_CELL_ROLE) {
    allowedPositionSet.add(legacyDuty);
  }
  const allowedPositions = Array.from(allowedPositionSet);
  const parsed = parseMemberEdit(
    formData,
    allowedPositions.length > 0 ? allowedPositions : DEFAULT_OFFICER_POSITION_OPTIONS,
  );
  if (!parsed.success) {
    return { error: parsed.error };
  }

  // 사진 처리: 새 파일 업로드(교체) 또는 삭제. 둘 다 아니면 기존 사진을 유지한다.
  const removePhoto = formData.get('removePhoto') === 'on';
  const photo = formData.get('photo');
  // undefined = 변경 없음, null = 삭제, string = 새 경로
  let nextPhotoPath: string | null | undefined;
  let photoToDelete: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) {
      return { error: '사진은 5MB 이하로 올려주세요.' };
    }
    const ext = photoExtensionFor(photo.type);
    if (!ext) {
      return { error: 'JPG, PNG, WebP, GIF 이미지만 올릴 수 있어요.' };
    }
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, photo, { contentType: photo.type });
    if (uploadError) {
      console.error('[updateMember] 사진 업로드 실패:', uploadError.message);
      return { error: '사진 업로드에 실패했어요. 다시 시도해주세요.' };
    }
    nextPhotoPath = path;
    photoToDelete = currentMember.photo_path ?? null; // 이전 사진은 저장 후 정리
  } else if (removePhoto && currentMember.photo_path) {
    nextPhotoPath = null;
    photoToDelete = currentMember.photo_path;
  }

  const memberUpdate: TablesUpdate<'members'> = { ...parsed.data.member, updated_at: now };
  if (nextPhotoPath !== undefined) {
    memberUpdate.photo_path = nextPhotoPath;
  }

  const { error: memberError } = await supabase
    .from('members')
    .update(memberUpdate)
    .eq('id', memberId);
  if (memberError) {
    console.error('[updateMember] members update 실패:', memberError.message);
    return { error: '명부 정보를 저장하지 못했어요. 다시 시도해주세요.' };
  }

  // 명부 갱신이 성공한 뒤에만 이전 사진을 스토리지에서 정리한다(실패해도 본 작업은 성공).
  if (photoToDelete) {
    const { error: removeError } = await supabase.storage.from(PHOTO_BUCKET).remove([photoToDelete]);
    if (removeError) {
      console.error('[updateMember] 이전 사진 삭제 실패:', removeError.message);
    }
  }

  const { error: contactError } = await supabase
    .from('member_contact')
    .upsert(
      { member_id: memberId, ...parsed.data.contact, updated_at: now },
      { onConflict: 'member_id' },
    );
  if (contactError) {
    console.error('[updateMember] member_contact upsert 실패:', contactError.message);
    return { error: '연락처 정보를 저장하지 못했어요. 다시 시도해주세요.' };
  }

  revalidateMemberCaches();
  revalidatePath('/members');
  revalidatePath(`/members/${memberId}`);
  revalidatePath(`/members/${memberId}/edit`);
  revalidatePath('/me');
  return { success: true };
}
