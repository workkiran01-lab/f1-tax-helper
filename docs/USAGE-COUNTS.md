# Anonymous usage totals

What is counted, where it lives and how to read it. No cost: it uses the existing Supabase project.

## What is counted

| Event | When it fires |
| --- | --- |
| `visit` | Once per browser tab session, when the app loads |
| `status_check_done` | A status check or questionnaire is completed |
| `form8843_started` | Once per tab session, when the first Form 8843 step is completed |
| `form8843_downloaded` | A Form 8843 PDF is generated and downloaded |
| `chat_message` | A message is sent to the AI chat (the text is never counted or stored) |

Each event adds 1 to a row in `public.usage_counts` (`day`, `event`, `n`). The browser sends only the event name. There is no account, address, device or session identifier, and no form content or message text. Browsers that send Do Not Track or Global Privacy Control are skipped.

## How to read it

The table cannot be read through the public API. In the Supabase dashboard, open SQL Editor and run:

```sql
select day, event, n from public.usage_counts order by day desc, event;

-- the funnel for the last 30 days
select event, sum(n) as total
from public.usage_counts
where day >= current_date - 30
group by event
order by total desc;
```

## How far to trust it

- The Supabase key is public, so anyone can also call `count_event` directly. Treat the numbers as approximate and good for trends, not as audited figures. Do not quote them to a school or investor as exact.
- `visit` counts tab sessions, not people. A student who opens the app on two devices counts twice, and there is no way to count unique people without an identifier, by design.
- Each event stops counting at 1,000,000 a day so a flood cannot grow the numbers without bound.
- Counts are skipped when the browser blocks the request or Do Not Track is on, so they undercount.

## Adding an event

Change all three together: `USAGE_EVENTS` in `src/utils/usage.js`, the allowlist in a new migration that replaces `public.count_event`, and the usage line in the privacy policy. `tests/usage.test.js` fails if the first two disagree.
