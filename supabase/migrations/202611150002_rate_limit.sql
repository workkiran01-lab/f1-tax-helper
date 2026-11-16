-- Shared request counters for the public API (chat, health, waitlist) and a global daily
-- budget for AI chat. Free: uses the existing Supabase project, no extra service.
-- Keys are hashed by the API before they arrive, so no raw IP address is stored.
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

-- Row level security with no policies: the table cannot be read or written directly
-- through the public API, only through rate_hit below.
alter table public.rate_limits enable row level security;

create or replace function public.rate_hit(p_key text, p_window_seconds integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  if p_key !~ '^(rl|budget):[a-z]{1,16}:[A-Za-z0-9-]{1,64}$'
     or p_window_seconds not between 1 and 172800 then
    raise exception 'invalid rate key';
  end if;

  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
          when r.window_start <= now() - make_interval(secs => p_window_seconds) then 1
          else r.hits + 1
        end,
        window_start = case
          when r.window_start <= now() - make_interval(secs => p_window_seconds) then now()
          else r.window_start
        end
  returning hits into v_hits;

  -- Occasional cleanup keeps the table tiny.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '3 days';
  end if;

  return v_hits;
end;
$$;

revoke all on function public.rate_hit(text, integer) from public;
grant execute on function public.rate_hit(text, integer) to anon, authenticated;
