'use client';

import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addDays, format, parseISO } from 'date-fns';
import {
  addServiceRole,
  assignService,
  removeServiceRole,
  unassignService,
} from '@/app/(dashboard)/service/actions';
import { MemberPicker } from '@/components/member-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [newRole, setNewRole] = useState('');
  const [manageRoles, setManageRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const weekDate = parseISO(selectedWeek);
  const isThisWeek = selectedWeek === thisWeek;

  // 배정/해제를 즉시 화면에 반영한다(서버 응답 전). 실패하면 자동으로 원래 목록으로 되돌아간다.
  type OptimisticAction =
    | { type: 'assign'; id: string; roleId: string; memberName: string }
    | { type: 'unassign'; id: string };
  const [optimisticAssignments, applyOptimistic] = useOptimistic(
    assignments,
    (state, action: OptimisticAction) => {
      if (action.type === 'unassign') return state.filter((a) => a.id !== action.id);
      return [...state, { id: action.id, roleId: action.roleId, memberName: action.memberName }];
    },
  );

  function moveWeek(deltaDays: number) {
    router.push(`/service?week=${format(addDays(weekDate, deltaDays), 'yyyy-MM-dd')}`);
  }

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  function assignMember(roleId: string, memberId: string) {
    const memberName = members.find((m) => m.id === memberId)?.name ?? '';
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: 'assign', id: `temp-${roleId}-${memberId}`, roleId, memberName });
      const result = await assignService({ serviceDate: selectedWeek, roleId, memberId });
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  function unassignMember(assignmentId: string) {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: 'unassign', id: assignmentId });
      const result = await unassignService({ assignmentId });
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      }
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
          const assigned = optimisticAssignments.filter((a) => a.roleId === role.id);
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
                          onClick={() => {
                            if (!window.confirm(`${a.memberName} 님의 ${role.name} 배정을 해제할까요?`)) return;
                            unassignMember(a.id);
                          }}
                          disabled={isPending}
                          className="-my-2 -mr-1.5 ml-0.5 p-2 text-muted-foreground hover:text-destructive"
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
                  <MemberPicker
                    items={members}
                    onSelect={(memberId) => assignMember(role.id, memberId)}
                    title={`${role.name} 배정`}
                    trigger={
                      <Button variant="ghost" size="sm" disabled={isPending}>
                        + 배정
                      </Button>
                    }
                  />
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
                      onClick={() => {
                        if (!window.confirm(`'${r.name}' 직책을 삭제하면 모든 주차의 배정 기록도 함께 삭제돼요. 계속할까요?`)) return;
                        run(() => removeServiceRole({ roleId: r.id }));
                      }}
                      disabled={isPending}
                      className="-my-2 -mr-1.5 ml-0.5 p-2 text-muted-foreground hover:text-destructive"
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
