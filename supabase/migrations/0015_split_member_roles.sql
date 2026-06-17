-- 셀 역할과 직책을 별도 컬럼으로 분리한다.
--   members.cell_role        : 셀 역할(없음/셀리더). DB로 관리하지 않는 고정 값.
--   members.officer_position : 직책(회장/부회장/총무/... ). member_duties로 관리.
-- 한 사람이 셀리더이면서 직책을 동시에 가질 수 있다(두 컬럼은 독립).
-- 직책끼리는 단일 select라 임원 직책과 팀장은 상호배타로 다룬다.
-- 기존 members.duty는 레거시/호환 필드로 남겨둔다(아직 drop하지 않음).

alter table public.members
  add column cell_role text null,
  add column officer_position text null;

alter table public.members
  add constraint members_cell_role_check
    check (cell_role is null or cell_role = '셀리더'),
  add constraint members_officer_position_check
    check (
      officer_position is null
      or length(btrim(officer_position)) between 1 and 30
    );

-- 기존 duty 값을 새 컬럼으로 백필한다.
update public.members
  set cell_role = '셀리더'
  where btrim(coalesce(duty, '')) = '셀리더';

update public.members
  set officer_position = btrim(duty)
  where duty is not null
    and btrim(duty) <> ''
    and btrim(duty) <> '셀리더';

-- member_duties는 이제 직책(두 번째 드롭다운)만 관리하므로 셀리더를 제거하고
-- 남은 직책 옵션의 정렬 순서를 재정렬한다.
delete from public.member_duties where name = '셀리더';

update public.member_duties
  set sort_order = case name
        when '회장' then 1
        when '부회장' then 2
        when '총무' then 3
        when '부총무' then 4
        when '서기' then 5
        when '회계' then 6
        when '팀장' then 7
        else sort_order
      end,
      updated_at = now()
  where name in ('회장', '부회장', '총무', '부총무', '서기', '회계', '팀장');
