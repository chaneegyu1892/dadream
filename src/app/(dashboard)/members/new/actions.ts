'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { PHOTO_BUCKET } from '@/lib/photos';
import { MAX_PHOTO_BYTES, photoExtensionFor } from '@/lib/photo-validation';
import { createClient } from '@/lib/supabase/server';

const memberSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요.').max(30),
  cellId: z.string().uuid().nullable(),
  duty: z.string().trim().max(30).nullable(),
  isOfficer: z.boolean(),
  phone: z.string().trim().max(20).nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export async function createMember(formData: FormData): Promise<{ error?: string }> {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) {
    return { error: '명부 등록 권한이 없어요.' };
  }

  const parsed = memberSchema.safeParse({
    name: formData.get('name'),
    cellId: (formData.get('cellId') as string) || null,
    duty: (formData.get('duty') as string) || null,
    isOfficer: formData.get('isOfficer') === 'on',
    phone: (formData.get('phone') as string) || null,
    birthDate: (formData.get('birthDate') as string) || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.' };
  }

  const supabase = await createClient();

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
      duty: parsed.data.duty,
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

  revalidatePath('/members');
  return {};
}
