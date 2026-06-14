'use client';

import { useState, useTransition } from 'react';
import { updateSelfProfile } from '@/app/(dashboard)/me/actions';
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
import { Textarea } from '@/components/ui/textarea';

type Baptized = 'true' | 'false' | 'unknown';

export interface SelfProfileInitial {
  phone: string;
  birthDate: string;
  baptized: Baptized;
  address: string;
  workplace: string;
  familyInfo: string;
}

export function SelfProfileForm({ initial }: { initial: SelfProfileInitial }) {
  const [baptized, setBaptized] = useState<Baptized>(initial.baptized);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('baptized', baptized);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSelfProfile(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSaved(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        이 정보는 본인과 권한이 있는 임원·교역자에게만 보여요.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="phone">전화번호</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={initial.phone}
          placeholder="010-1234-5678"
          maxLength={20}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="birthDate">생년월일</Label>
        <Input id="birthDate" name="birthDate" type="date" defaultValue={initial.birthDate} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="baptized">세례</Label>
        <Select value={baptized} onValueChange={(v) => setBaptized(v as Baptized)}>
          <SelectTrigger id="baptized" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unknown">모름</SelectItem>
            <SelectItem value="true">받음</SelectItem>
            <SelectItem value="false">안 받음</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">주소</Label>
        <Input
          id="address"
          name="address"
          defaultValue={initial.address}
          placeholder="시/구/동까지만 적어도 괜찮아요"
          maxLength={200}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="workplace">직장/학교</Label>
        <Input id="workplace" name="workplace" defaultValue={initial.workplace} maxLength={100} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="familyInfo">가족 정보</Label>
        <Textarea
          id="familyInfo"
          name="familyInfo"
          defaultValue={initial.familyInfo}
          rows={3}
          maxLength={500}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !error && <p className="text-sm text-emerald-600">저장했어요.</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '저장 중...' : '저장'}
      </Button>
    </form>
  );
}
