'use client';

import { useState, useTransition } from 'react';
import { decideVisit } from '@/app/(dashboard)/visits/actions';
import { formatSlot, TIME_OF_DAY_LABELS, type PreferredSlot } from '@/lib/visits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VisitActionsProps {
  visitId: string;
  status: 'requested' | 'proposed' | 'confirmed';
  preferredSlots: PreferredSlot[];
  /** pastor: 확정·제안·반려·완료 / requester: 제안 수락·취소 */
  viewer: 'pastor' | 'requester';
}

type Mode = 'idle' | 'propose' | 'decline';

export function VisitActions({ visitId, status, preferredSlots, viewer }: VisitActionsProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [slotIndex, setSlotIndex] = useState('0');
  const [proposeDate, setProposeDate] = useState('');
  const [proposeTime, setProposeTime] = useState<PreferredSlot['timeOfDay'] | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(input: Parameters<typeof decideVisit>[0]) {
    setError(null);
    startTransition(async () => {
      const result = await decideVisit(input);
      if (result.error) setError(result.error);
      else setMode('idle');
    });
  }

  if (viewer === 'requester') {
    if (status === 'proposed') {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => run({ visitId, action: 'accept_proposal' })}
            >
              제안 수락
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => run({ visitId, action: 'cancel' })}
            >
              취소
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run({ visitId, action: 'cancel' })}
        >
          신청 취소
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // pastor
  if (status === 'confirmed') {
    return (
      <div className="space-y-2">
        <Button size="sm" disabled={isPending} onClick={() => run({ visitId, action: 'complete' })}>
          완료 처리
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {status === 'requested' && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={slotIndex} onValueChange={setSlotIndex}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {preferredSlots.map((slot, i) => (
                <SelectItem key={i} value={String(i)}>
                  {formatSlot(slot)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run({ visitId, action: 'confirm', slot: preferredSlots[Number(slotIndex)] })}
          >
            이 시간으로 확정
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => setMode('propose')}>
          다른 시간 제안
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => setMode('decline')}>
          반려
        </Button>
      </div>

      {mode === 'propose' && (
        <div className="flex flex-wrap gap-2">
          <Input
            type="date"
            value={proposeDate}
            onChange={(e) => setProposeDate(e.target.value)}
            className="w-40"
          />
          <Select value={proposeTime} onValueChange={(v) => setProposeTime(v as PreferredSlot['timeOfDay'])}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="시간대" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TIME_OF_DAY_LABELS) as PreferredSlot['timeOfDay'][]).map((t) => (
                <SelectItem key={t} value={t}>
                  {TIME_OF_DAY_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={isPending || !proposeDate || !proposeTime}
            onClick={() =>
              proposeTime &&
              run({ visitId, action: 'propose', slot: { date: proposeDate, timeOfDay: proposeTime } })
            }
          >
            제안 보내기
          </Button>
        </div>
      )}

      {mode === 'decline' && (
        <div className="space-y-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="반려 사유 (선택)"
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => run({ visitId, action: 'decline', reason: reason.trim() || undefined })}
          >
            반려하기
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
