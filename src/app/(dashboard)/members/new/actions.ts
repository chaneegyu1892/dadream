'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth';
import { revalidateMemberCaches } from '@/lib/dashboard-cache-invalidation';
import {
  DEFAULT_OFFICER_POSITION_OPTIONS,
  FIXED_CELL_ROLE,
} from '@/lib/member-edit';
import { roleAtLeast } from '@/lib/roles';
import { PHOTO_BUCKET } from '@/lib/photos';
import { MAX_PHOTO_BYTES, photoExtensionFor } from '@/lib/photo-validation';
import { createClient } from '@/lib/supabase/server';

const memberSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요.').max(30),
  cellId: z.string().uuid().nullable(),
  cellRole: z.string().nullable(),
  officerPosition: z.string().nullable(),
  isOfficer: z.boolean(),
  phone: z.string().trim().max(20).nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

const NONE_TOKENS = new Set(['', 'none', '없음']);

function roleOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return NONE_TOKENS.has(trimmed) ? null : trimmed;
}

function deriveLegacyDuty(cellRole: string | null, officerPosition: string | null): string | null {
  if (officerPosition) return officerPosition;
  if (cellRole === FIXED_CELL_ROLE) return FIXED_CELL_ROLE;
  return null;
}

export async function createMember(formData: FormData): Promise<{ error?: string }> {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) {
    return { error: '명부 등록 권한이 없어요.' };
  }

  const cellRole = roleOrNull(formData.get('cellRole'));
  const officerPosition = roleOrNull(formData.get('officerPosition'));

  const parsed = memberSchema.safeParse({
    name: formData.get('name'),
    cellId: (formData.get('cellId') as string) || null,
    cellRole,
    officerPosition,
    isOfficer: formData.get('isOfficer') === 'on',
    phone: (formData.get('phone') as string) || null,
    birthDate: (formData.get('birthDate') as string) || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.' };
  }

  const supabase = await createClient();

  if (parsed.data.cellRole && parsed.data.cellRole !== FIXED_CELL_ROLE) {
    return { error: '셀 역할은 없음 또는 셀리더만 선택할 수 있어요.' };
  }

  const { data: dutyRows, error: dutyError } = await supabase
    .from('member_duties')
    .select('name')
    .neq('name', FIXED_CELL_ROLE)
    .order('sort_order')
    .order('name');
  if (dutyError) {
    console.error('[createMember] member_duties 조회 실패:', dutyError.message);
    return { error: '직책 목록을 확인하지 못했어요. 다시 시도해주세요.' };
  }
  const allowedPositions = dutyRows?.map((d) => d.name).filter(Boolean) ?? [];
  const validPositions: readonly string[] =
    allowedPositions.length > 0 ? allowedPositions : DEFAULT_OFFICER_POSITION_OPTIONS;
  if (parsed.data.officerPosition && !validPositions.includes(parsed.data.officerPosition)) {
    return { error: '직책은 목록에서 선택해주세요.' };
  }

  // 사진 업로드 (선택)
  let photoPath: string | null = null;
  const photo = formData.get('photo');
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) {
      return { error: '사진은 5MB 이하로 올려주세요.' };
    }
    const ext = photoExtensionFor(photo.type);
    if (!ext) {
      return { error: 'JPG, PNG, WebP, GIF 이미지만 올릴 수 있어요.' };
    }
    photoPath = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(photoPath, photo, { contentType: photo.type });
    if (uploadError) {
      return { error: '사진 업로드에 실패했어요. 다시 시도해주세요.' };
    }
  }

  const { data: created, error: insertError } = await supabase
    .from('members')
    .insert({
      name: parsed.data.name,
      cell_id: parsed.data.cellId,
      cell_role: parsed.data.cellRole,
      officer_position: parsed.data.officerPosition,
      duty: deriveLegacyDuty(parsed.data.cellRole, parsed.data.officerPosition),
      is_officer: parsed.data.isOfficer,
      photo_path: photoPath,
    })
    .select('id')
    .single();

  if (insertError || !created) {
    return { error: '명부 등록에 실패했어요. 잠시 후 다시 시도해주세요.' };
  }

  if (parsed.data.phone || parsed.data.birthDate) {
    const { error: contactError } = await supabase.from('member_contact').insert({
      member_id: created.id,
      phone: parsed.data.phone,
      birth_date: parsed.data.birthDate,
    });
    if (contactError) {
      return { error: '연락처 저장에 실패했어요. 명부는 등록됐으니 상세에서 다시 입력해주세요.' };
    }
  }

  revalidateMemberCaches();
  revalidatePath('/members');
  return {};
}
