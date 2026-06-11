'use client';

import { useState, useTransition } from 'react';
import { approveProfile, rejectProfile } from '@/app/(dashboard)/admin/approvals/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_LABELS, type UserRole } from '@/lib/roles';

interface CandidateOption {
  id: string;
  name: string;
  cellName: string | null;
}

interface ApprovalCardProps {
  profile: { id: string; kakaoNickname: string; createdAt: string };
  candidates: CandidateOption[];
  allUnlinked: CandidateOption[];
  cells: { id: string; name: string }[];
}

const NEW_MEMBER = '__new__';

export function ApprovalCard({ profile, candidates, allUnlinked, cells }: ApprovalCardProps) {
  const [memberId, setMemberId] = useState<string>(candidates[0]?.id ?? NEW_MEMBER);
  const [newName, setNewName] = useState(profile.kakaoNickname);
  const [newCellId, setNewCellId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('member');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const options = candidates.length > 0 ? candidates : allUnlinked;

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await approveProfile({
        profileId: profile.id,
        role,
        memberId: memberId === NEW_MEMBER ? undefined : memberId,
        newMemberName: memberId === NEW_MEMBER ? newName : undefined,
        newMemberCellId: memberId === NEW_MEMBER ? newCellId : undefined,
      });
      if (result.error) setError(result.error);
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectProfile({ profileId: profile.id });
      if (result.error) setError(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between text-base">
          <span>{profile.kakaoNickname}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {new Date(profile.createdAt).toLocaleDateString('ko-KR')} 가입
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">명부 연결</p>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.cellName ? ` (${c.cellName})` : ''}
                  {candidates.some((cand) => cand.id === c.id) ? ' · 추천' : ''}
                </SelectItem>
              ))}
              <SelectItem value={NEW_MEMBER}>➕ 명부에 새로 등록</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {memberId === NEW_MEMBER && (
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="실명 입력"
            />
            <Select value={newCellId ?? 'none'} onValueChange={(v) => setNewCellId(v === 'none' ? null : v)}>
              <SelectTrigger className="w-36 shrink-0">
                <SelectValue placeholder="셀 선택" />
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
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">역할</p>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button onClick={approve} disabled={isPending} className="flex-1">
            {isPending ? '처리 중...' : '승인'}
          </Button>
          <Button onClick={reject} disabled={isPending} variant="outline">
            거절
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
