'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import {
  addServiceRole,
  assignService,
  removeServiceRole,
  unassignService,
} from '@/app/(dashboard)/service/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ServiceBoardProps {
  selectedWeek: string; // YYYY-MM-DD (일요일)
  thisWeek: string;
  roles: { id: string; name: string }[];
  assignments: { id: string; roleId: string; memberName: string }[];
  members: { id: string; name: string }[];
  canEdit: boolean;
}

export function ServiceBoard({
  selectedWeek,
  thisWeek,
  roles,
  assignments,
  members,
  canEdit,
}: ServiceBoardProps) {
  const router = useRouter();
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [manageRoles, setManageRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const weekDate = parseISO(selectedWeek);
  const isThisWeek = selectedWeek === thisWeek;

  function moveWeek(deltaDays: number) {
    router.push(`/service?week=${format(addDays(weekDate, deltaDays), 'yyyy-MM-dd')}`);
  }

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border px-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => moveWeek(-7)}>
          ← 지난주
        </Button>
        <p className="font-semibold">
          {format(weekDate, 'M월 d일')} 주일
          {isThisWeek && <Badge className="ml-2">이번 주</Badge>}
        </p>
        <Button variant="ghost" size="sm" onClick={() => moveWeek(7)}>
          다음주 →
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        {roles.map((role) => {
          const assigned = assignments.filter((a) => a.roleId === role.id);
          return (
            <div key={role.id} className="flex items-start justify-between border-b px-4 py-3 last:border-b-0">
              <div className="flex items-center gap-2">
                <p className="w-20 shrink-0 text-sm font-medium">{role.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {assigned.length === 0 && (
                    <span className="text-sm text-muted-foreground">미배정</span>
                  )}
                  {assigned.map((a) => (
                    <Badge key={a.id} variant="secondary" className="gap-1">
                      {a.memberName}
                      {canEdit && (
                        <button
                          onClick={() => run(() => unassignService({ assignmentId: a.id }))}
                          disabled={isPending}
                          className="ml-0.5 text-muted-foreground hover:text-destructive"
                          aria-label={`${a.memberName} 배정 해제`}
                        >
                          ✕
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
              {canEdit && (
                <div className="shrink-0">
                  {pickFor === role.id ? (
                    <Select
                      onValueChange={(memberId) => {
                        setPickFor(null);
                        run(() => assignService({ serviceDate: selectedWeek, roleId: role.id, memberId }));
                      }}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue placeholder="청년 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setPickFor(role.id)}>
                      + 배정
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {canEdit && (
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => setManageRoles((v) => !v)}>
            ⚙️ 직책 관리 {manageRoles ? '닫기' : '열기'}
          </Button>
          {manageRoles && (
            <div className="space-y-2 rounded-xl border p-3">
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <Badge key={r.id} variant="outline" className="gap-1">
                    {r.name}
                    <button
                      onClick={() => run(() => removeServiceRole({ roleId: r.id }))}
                      disabled={isPending}
                      className="ml-0.5 text-muted-foreground hover:text-destructive"
                      aria-label={`${r.name} 직책 삭제`}
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="새 직책 이름"
                  maxLength={20}
                  className="h-8"
                />
                <Button
                  size="sm"
                  disabled={isPending || !newRole.trim()}
                  onClick={() => {
                    run(() => addServiceRole({ name: newRole.trim() }));
                    setNewRole('');
                  }}
                >
                  추가
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                직책을 삭제하면 해당 직책의 모든 주차 배정 기록도 함께 삭제돼요.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
