-- member_duties의 `for all` 쓰기 정책이 SELECT에도 겹쳐 Supabase advisor
-- multiple_permissive_policies 경고를 만들지 않도록 동작별 정책으로 분리한다.

drop policy if exists member_duties_write on public.member_duties;
drop policy if exists member_duties_write_insert on public.member_duties;
drop policy if exists member_duties_write_update on public.member_duties;
drop policy if exists member_duties_write_delete on public.member_duties;

create policy member_duties_write_insert on public.member_duties
  for insert
  with check (role_at_least('officer'));

create policy member_duties_write_update on public.member_duties
  for update
  using (role_at_least('officer'))
  with check (role_at_least('officer'));

create policy member_duties_write_delete on public.member_duties
  for delete
  using (role_at_least('officer'));
