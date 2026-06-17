'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createMember } from '@/app/(dashboard)/members/new/actions';
import { compressPhoto } from '@/lib/compress-photo';
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

interface MemberFormProps {
  cells: { id: string; name: string }[];
  officerPositionOptions: string[];
}

export function MemberForm({ cells, officerPositionOptions }: MemberFormProps) {
  const router = useRouter();
  const [cellId, setCellId] = useState<string>('none');
  const [cellRole, setCellRole] = useState<string>('none');
  const [officerPosition, setOfficerPosition] = useState<string>('none');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    if (cellId !== 'none') formData.set('cellId', cellId);
    formData.set('cellRole', cellRole === 'none' ? '' : cellRole);
    formData.set('officerPosition', officerPosition === 'none' ? '' : officerPosition);
    startTransition(async () => {
      const photo = formData.get('photo');
      if (photo instanceof File && photo.size > 0) {
        formData.set('photo', await compressPhoto(photo));
      }
      const result = await createMember(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push('/members');
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">이름 *</Label>
        <Input id="name" name="name" required maxLength={30} placeholder="홍길동" />
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
          <Label htmlFor="phone">전화번호</Label>
          <Input id="phone" name="phone" type="tel" placeholder="010-0000-0000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="birthDate">생년월일</Label>
          <Input id="birthDate" name="birthDate" type="date" />
        </div>
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
        <Label htmlFor="photo">사진 (자동으로 용량을 줄여 올려요)</Label>
        <Input id="photo" name="photo" type="file" accept="image/*" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isOfficer" className="size-4" />
        임원이에요
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '등록 중...' : '명부에 등록'}
      </Button>
    </form>
  );
}
