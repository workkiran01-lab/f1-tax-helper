-- Deploy through the Supabase migration process. Never expose a service-role key
-- in the frontend. A logged-in caller may delete only their own auth account.
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
