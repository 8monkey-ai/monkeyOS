-- Reference pattern: exact lookup is available only through a narrow app-owned operation.
-- Do not expose auth.users, listUsers, service_role, or fuzzy/prefix search to a browser.
create or replace function public.add_member_by_email(target_email text, target_role text default 'member')
returns public.members
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_user_id uuid;
  added public.members;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select id into matched_user_id from auth.users where lower(email) = lower(target_email) limit 1;
  if matched_user_id is null then raise exception 'existing Auth user not found' using errcode = 'P0002'; end if;
  insert into public.members(user_id, role, created_by)
  values (matched_user_id, target_role, (select auth.uid())) returning * into added;
  return added;
end;
$$;
revoke execute on function public.add_member_by_email(text, text) from public, anon;
grant execute on function public.add_member_by_email(text, text) to authenticated;
