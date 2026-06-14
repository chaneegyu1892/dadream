'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateMember } from '@/app/(dashboard)/members/[id]/edit/actions';
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
  duty: string;
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
  cells: { id: string; name: string }[];
  /** member_duties에서 불러온 직분 목록(`없음` 의사옵션은 폼이 직접 덧붙임). */
  dutyOptions: string[];
  initial: MemberEditInitial;
}

const GENDER_OPTIONS = [
  { value: 'none', label: '선택 안 함' },
  { value: '남자', label: '남자' },
  { value: '여자', label: '여자' },
];

export function MemberEditForm({ memberId, cells, dutyOptions, initial }: MemberEditFormProps) {
  const router = useRouter();
  const [cellId, setCellId] = useState<string>(initial.cellId || 'none');
  const [duty, setDuty] = useState<string>(initial.duty || 'none');
  const [gender, setGender] = useState<string>(initial.gender || 'none');
  const [baptized, setBaptized] = useState<Baptized>(initial.baptized);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('cellId', cellId === 'none' ? '' : cellId);
    formData.set('duty', duty === 'none' ? '' : duty);
    formData.set('gender', gender === 'none' ? '' : gender);
    formData.set('baptized', baptized);
    setError(null);
    startTransition(async () => {
      const result = await updateMember(memberId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/members/${memberId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <Label>직분</Label>
          <Select value={duty} onValueChange={setDuty}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음</SelectItem>
              {dutyOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
