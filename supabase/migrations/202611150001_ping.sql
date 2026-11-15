-- Read-only liveness probe used by /api/health. It runs one real database query so the
-- free-plan project registers activity and is not auto-paused. It returns no data.
create or replace function public.ping()
returns boolean
language sql
stable
set search_path = ''
as $$ select true $$;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
