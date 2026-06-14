-- Consolidate contact/private write policies so self-edit and admin-edit do not create duplicate
-- permissive INSERT/UPDATE policies for the same role/action.

-- member_contact: officer+ may manage rows; approved linked members may insert/update only self.
drop policy if exists contact_write on member_contact;
drop policy if exists contact_self_insert on member_contact;
drop policy if exists contact_self_update on member_contact;

create policy contact_insert on member_contact
  for insert
  to authenticated
  with check ((select role_at_least('officer')) or member_id = (select my_member_id()));

create policy contact_update on member_contact
  for update
  to authenticated
  using ((select role_at_least('officer')) or member_id = (select my_member_id()))
  with check ((select role_at_least('officer')) or member_id = (select my_member_id()));

create policy contact_delete on member_contact
  for delete
  to authenticated
  using ((select role_at_least('officer')));

-- member_private: staff+ may manage rows; approved linked members may insert/update only self.
drop policy if exists private_write on member_private;
drop policy if exists private_self_insert on member_private;
drop policy if exists private_self_update on member_private;

create policy private_insert on member_private
  for insert
  to authenticated
  with check ((select role_at_least('staff')) or member_id = (select my_member_id()));

create policy private_update on member_private
  for update
  to authenticated
  using ((select role_at_least('staff')) or member_id = (select my_member_id()))
  with check ((select role_at_least('staff')) or member_id = (select my_member_id()));

create policy private_delete on member_private
  for delete
  to authenticated
  using ((select role_at_least('staff')));
