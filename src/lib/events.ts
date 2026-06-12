import { z } from 'zod';

export const EVENT_COLOR_OPTIONS = [
  { value: 'sky', label: '파랑' },
  { value: 'emerald', label: '초록' },
  { value: 'amber', label: '노랑' },
  { value: 'violet', label: '보라' },
  { value: 'pink', label: '분홍' },
] as const;

export type EventColor = (typeof EVENT_COLOR_OPTIONS)[number]['value'];

export const eventColorSchema = z.enum(EVENT_COLOR_OPTIONS.map((option) => option.value) as [EventColor, ...EventColor[]]);

export function normalizeEventColor(color: string | null | undefined): EventColor {
  const parsed = eventColorSchema.safeParse(color);
  return parsed.success ? parsed.data : 'sky';
}

export const calendarEventInputSchema = z.object({
  title: z.string().trim().min(1, '일정 제목을 입력해주세요.').max(80, '일정 제목은 80자 이하로 입력해주세요.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜를 선택해주세요.'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '시작 시간을 선택해주세요.'),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, '종료 시간을 확인해주세요.')
    .optional()
    .or(z.literal('')),
  location: z.string().trim().max(80, '장소는 80자 이하로 입력해주세요.').optional(),
  description: z.string().trim().max(1000, '메모는 1000자 이하로 입력해주세요.').optional(),
  color: eventColorSchema,
});

export type CalendarEventInput = z.input<typeof calendarEventInputSchema>;

export interface ParsedCalendarEventInput {
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  description: string | null;
  color: EventColor;
}

export type CalendarEventParseResult = ParsedCalendarEventInput | { error: string };

export function parseCalendarEventInput(input: CalendarEventInput): CalendarEventParseResult {
  const parsed = calendarEventInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.' };
  }

  const startsAt = toKstDateTime(parsed.data.date, parsed.data.startTime);
  const endsAt = parsed.data.endTime ? toKstDateTime(parsed.data.date, parsed.data.endTime) : null;

  if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return { error: '종료 시간은 시작 시간보다 늦어야 해요.' };
  }

  return {
    title: parsed.data.title,
    startsAt,
    endsAt,
    location: parsed.data.location || null,
    description: parsed.data.description || null,
    color: parsed.data.color,
  };
}

export function toKstDateTime(date: string, time: string): string {
  return `${date}T${time}:00+09:00`;
}

export function toKstDateOnly(date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
