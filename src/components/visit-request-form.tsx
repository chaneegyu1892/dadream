'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createVisitRequest } from '@/app/(dashboard)/visits/actions';
import { TIME_OF_DAY_LABELS, type PreferredSlot } from '@/lib/visits';
import { MemberPicker } from '@/components/member-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VisitRequestFormProps {
  selfMemberId: string | null;
  /** officer+ 대리 신청용 명부 목록. null이면 본인 신청만 가능 */
  proxyMembers: { id: string; name: string }[] | null;
}

type SlotDraft = { key: string; date: string; timeOfDay: PreferredSlot['timeOfDay'] | '' };

function newSlot(): SlotDraft {
  return { key: crypto.randomUUID(), date: '', timeOfDay: '' };
}

export function VisitRequestForm({ selfMemberId, proxyMembers }: VisitRequestFormProps) {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string>(selfMemberId ?? '');
  const [slots, setSlots] = useState<SlotDraft[]>(() => [newSlot()]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateSlot(index: number, patch: Partial<SlotDraft>) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function submit() {
    setError(null);
    const validSlots = slots.filter((s): s is PreferredSlot & SlotDraft => Boolean(s.date && s.timeOfDay));
    if (validSlots.length === 0) {
      setError('희망 날짜와 시간대를 1개 이상 선택해주세요.');
      return;
    }
    if (!memberId) {
      setError('대상 청년을 선택해주세요.');
      return;
    }
    startTransition(async () => {
      const result = await createVisitRequest({
        memberId,
        slots: validSlots.map((s) => ({ date: s.date, timeOfDay: s.timeOfDay })),
        message: message.trim() || undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push('/visits');
    });
  }

  return (
    <div className="space-y-4">
      {proxyMembers && (
        <div className="space-y-1.5">
          <Label>대상 청년</Label>
          <MemberPicker
            items={proxyMembers.map((m) => ({
              id: m.id,
              name: m.name,
              description: m.id === selfMemberId ? '나' : null,
            }))}
            value={memberId || null}
            onSelect={setMemberId}
            title="심방 대상 청년"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>희망 시간 (최대 3개)</Label>
        <div className="space-y-2">
          {slots.map((slot, i) => (
            <div key={slot.key} className="flex gap-2">
              <Input
                type="date"
                value={slot.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => updateSlot(i, { date: e.target.value })}
                className="flex-1"
              />
              <Select
                value={slot.timeOfDay}
                onValueChange={(v) => updateSlot(i, { timeOfDay: v as PreferredSlot['timeOfDay'] })}
              >
                <SelectTrigger className="w-28 shrink-0">
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
            </div>
          ))}
        </div>
        {slots.length < 3 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSlots((prev) => [...prev, newSlot()])}
          >
            + 희망 시간 추가
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">나누고 싶은 내용 (선택)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="목사님과 나누고 싶은 이야기를 편하게 적어주세요."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={isPending} className="w-full">
        {isPending ? '신청 중...' : '심방 신청하기'}
      </Button>
    </div>
  );
}
