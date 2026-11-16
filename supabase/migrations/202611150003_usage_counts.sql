-- Anonymous daily usage totals: one row per day and event name, holding only a count.
-- No user, address, device or content is stored. Free: uses the existing Supabase project.
create table if not exists public.usage_counts (
  day date not null,
  event text not null,
  n bigint not null default 0,
  primary key (day, event)
);

-- Row level security with no policies: the totals cannot be read or written through the
-- public API. Read them in the Supabase SQL editor (see docs/USAGE-COUNTS.md).
alter table public.usage_counts enable row level security;

-- The anon key is public, so anyone can call this; the allowlist keeps the table to a few
-- rows a day and the per-event ceiling stops a flood from growing the numbers without bound.
create or replace function public.count_event(p_event text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_event not in ('visit', 'status_check_done', 'form8843_started', 'form8843_downloaded', 'chat_message') then
    raise exception 'unknown event';
  end if;

  insert into public.usage_counts as u (day, event, n)
  values ((now() at time zone 'utc')::date, p_event, 1)
  on conflict (day, event) do update
    set n = u.n + 1
    where u.n < 1000000;
end;
$$;

revoke all on function public.count_event(text) from public;
grant execute on function public.count_event(text) to anon, authenticated;
