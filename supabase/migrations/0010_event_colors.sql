-- 캘린더 일정 색상 구분
alter table events
  add column if not exists color text not null default 'sky';

alter table events
  drop constraint if exists events_color_check;

alter table events
  add constraint events_color_check
  check (color in ('sky', 'emerald', 'amber', 'violet', 'pink'));

alter table events
  drop constraint if exists events_end_after_start_check;

alter table events
  add constraint events_end_after_start_check
  check (ends_at is null or ends_at > starts_at) not valid;
