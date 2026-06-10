-- 명부 사진용 비공개 버킷
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', false)
on conflict (id) do nothing;

-- 승인된 사용자는 열람(signed URL 발급), officer+만 업로드·수정·삭제
create policy member_photos_read on storage.objects for select
  using (bucket_id = 'member-photos' and public.role_at_least('member'));
create policy member_photos_insert on storage.objects for insert
  with check (bucket_id = 'member-photos' and public.role_at_least('officer'));
create policy member_photos_update on storage.objects for update
  using (bucket_id = 'member-photos' and public.role_at_least('officer'));
create policy member_photos_delete on storage.objects for delete
  using (bucket_id = 'member-photos' and public.role_at_least('officer'));
