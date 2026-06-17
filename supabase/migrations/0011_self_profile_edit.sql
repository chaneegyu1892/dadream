-- 승인되어 명부에 연결된 청년이 "본인" 연락처·상세 정보를 직접 생성/수정할 수 있도록 허용.
-- 기존 officer/staff 관리자 정책(contact_write / private_write)과 열람 정책은 그대로 둔다.
-- my_member_id()는 approved 프로필에만 member_id를 돌려주므로 대기/거절 사용자는 자동으로 차단된다.
-- select my_member_id()로 감싸 행마다 재평가되지 않게 하는 Supabase RLS 성능 가이드를 따른다.

-- member_contact: 본인 행 생성/수정
create policy contact_self_insert on member_contact
  for insert
  to authenticated
  with check (member_id = (select my_member_id()));

create policy contact_self_update on member_contact
  for update
  to authenticated
  using (member_id = (select my_member_id()))
  with check (member_id = (select my_member_id()));

-- member_private: 본인 행 생성/수정
create policy private_self_insert on member_private
  for insert
  to authenticated
  with check (member_id = (select my_member_id()));

create policy private_self_update on member_private
  for update
  to authenticated
  using (member_id = (select my_member_id()))
  with check (member_id = (select my_member_id()));
