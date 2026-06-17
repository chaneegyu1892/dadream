'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateMember } from '@/app/(dashboard)/members/[id]/edit/actions';
import { compressPhoto } from '@/lib/compress-photo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Baptized = 'true' | 'false' | 'unknown';

export interface MemberEditInitial {
  name: string;
  cellId: string;
  cellRole: string;
  officerPosition: string;
  gender: string;
  registeredAt: string;
  phone: string;
  birthDate: string;
  baptized: Baptized;
  isOfficer: boolean;
  active: boolean;
}

interface MemberEditFormProps {
  memberId: string;
  memberName: string;
  /** 현재 등록된 사진의 signed URL. 없으면 null. */
  currentPhotoUrl: string | null;
  cells: { id: string; name: string }[];
  /** member_duties에서 불러온 직책 목록(`없음` 의사옵션은 폼이 직접 덧붙임). */
  officerPositionOptions: string[];
  initial: MemberEditInitial;
}

const GENDER_OPTIONS = [
  { value: 'none', label: '선택 안 함' },
  { value: '남자', label: '남자' },
  { value: '여자', label: '여자' },
];

export function MemberEditForm({
  memberId,
  memberName,
  currentPhotoUrl,
  cells,
  officerPositionOptions,
  initial,
}: MemberEditFormProps) {
  const router = useRouter();
  const [cellId, setCellId] = useState<string>(initial.cellId || 'none');
  const [cellRole, setCellRole] = useState<string>(initial.cellRole || 'none');
  const [officerPosition, setOfficerPosition] = useState<string>(initial.officerPosition || 'none');
  const [gender, setGender] = useState<string>(initial.gender || 'none');
  const [baptized, setBaptized] = useState<Baptized>(initial.baptized);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 사진: 새로 고른 파일 미리보기 / 기존 사진 삭제 의사
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  // 미리보기 object URL은 바뀌거나 언마운트될 때 해제한다.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // 화면에 보여줄 사진: 새 미리보기 > (삭제 안 했으면) 기존 사진 > 없음
  const shownPhoto = previewUrl ?? (removePhoto ? null : currentPhotoUrl);
  const hasPhoto = Boolean(shownPhoto);

  function onPickPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    if (file) setRemovePhoto(false);
  }

  function clearPhoto() {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    // 기존 사진이 있었으면 삭제, 없었으면 그냥 선택 취소.
    setRemovePhoto(Boolean(currentPhotoUrl));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('cellId', cellId === 'none' ? '' : cellId);
    formData.set('cellRole', cellRole === 'none' ? '' : cellRole);
    formData.set('officerPosition', officerPosition === 'none' ? '' : officerPosition);
    formData.set('gender', gender === 'none' ? '' : gender);
    formData.set('baptized', baptized);
    setError(null);
    startTransition(async () => {
      const photo = formData.get('photo');
      if (photo instanceof File && photo.size > 0) {
        // 새 사진은 클라이언트에서 압축해 업로드한다.
        formData.set('photo', await compressPhoto(photo));
      } else {
        formData.delete('photo');
        if (removePhoto) formData.set('removePhoto', 'on');
      }
      const result = await updateMember(memberId, formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success('명부 정보를 저장했어요.');
      router.push(`/members/${memberId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>사진</Label>
        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            {shownPhoto && <AvatarImage src={shownPhoto} alt={memberName} />}
            <AvatarFallback className="text-2xl">{memberName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Input
              ref={fileInputRef}
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={onPickPhoto}
              className="max-w-xs"
            />
            {hasPhoto && (
              <Button type="button" variant="ghost" size="sm" className="self-start text-destructive" onClick={clearPhoto}>
                사진 삭제
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {previewUrl
                ? '저장하면 새 사진으로 바뀌어요. (자동으로 용량을 줄여요)'
                : removePhoto
                  ? '저장하면 사진이 삭제돼요.'
                  : '새 사진을 고르면 기존 사진을 교체해요.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">이름 *</Label>
        <Input id="name" name="name" required maxLength={30} defaultValue={initial.name} />
      </div>

      <div className="space-y-1.5">
        <Label>셀</Label>
        <Select value={cellId} onValueChange={setCellId}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">무소속</SelectItem>
            {cells.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>셀 역할</Label>
          <Select value={cellRole} onValueChange={setCellRole}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음</SelectItem>
              <SelectItem value="셀리더">셀리더</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>직책</Label>
          <Select value={officerPosition} onValueChange={setOfficerPosition}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음</SelectItem>
              {officerPositionOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>성별</Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="registeredAt">등록일</Label>
        <Input id="registeredAt" name="registeredAt" type="date" defaultValue={initial.registeredAt} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone">전화번호</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={initial.phone} placeholder="010-0000-0000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="birthDate">생년월일</Label>
          <Input id="birthDate" name="birthDate" type="date" defaultValue={initial.birthDate} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>세례</Label>
        <Select value={baptized} onValueChange={(v) => setBaptized(v as Baptized)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unknown">모름</SelectItem>
            <SelectItem value="true">받음</SelectItem>
            <SelectItem value="false">안 받음</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isOfficer" defaultChecked={initial.isOfficer} className="size-4" />
        임원이에요
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={initial.active} className="size-4" />
        활성 상태예요
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? '저장 중...' : '저장'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.push(`/members/${memberId}`)}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
