# F1 Tax Helper

US tax preparation guidance for international students. The current season is **2027 filing for 2026 income**. The app provides educational guidance, a residency screening flow, document checklists, AI chat, and a client-side Form 8843 helper. It does not submit returns or certify tax eligibility.

See [the September 2026 audit](docs/AUDIT-2027.md) for corrected bugs, IRS sources, verification, and release limits. The [November 2026 bug sweep](docs/BUGFIXES-2026-11.md) lists later fixes. Anonymous daily usage totals (what is counted, how to read it, how far to trust it) are described in [docs/USAGE-COUNTS.md](docs/USAGE-COUNTS.md).

## Run and verify

Use Node.js 22 or later and the committed lockfile.

```bash
npm ci
npm run dev
npm test
npm run build
npm audit --audit-level=high
```

Vite serves the frontend. Use `vercel dev` when testing the `/api/chat` Edge function locally. `npm run preview` serves the production frontend build. CI runs tests, the build, and the dependency audit for pull requests and pushes to main.

### Browser tests

`npm run test:e2e` builds the app twice and runs Playwright on desktop and phone sizes. The guest tests (`e2e/smoke.spec.js`) use a build without Supabase settings. The signed-in tests (`e2e/signed-in.spec.js`) use a build pointed at a fake Supabase address and open it under the production hostname (Chromium maps `www.f1taxhelper.com` to the local preview server and treats it as a secure context), which is what switches the anonymous usage counter on. `e2e/supabaseMock.js` answers every request to the fake address: Google sign-in, the user record, sign-out, the usage counter and account deletion. They check what the app sends (only an event name in each count, the public key rather than the student's session, no form values anywhere) and what it does with failures. They do not show that the real project works; test sign-in, sync and deletion once against a throwaway account before a release. When the app starts calling a new Supabase endpoint, add it to the mock and cover it in a signed-in test.

## Configuration

Copy `.env.example` to `.env.local` and replace placeholders for the services you use. Do not commit real credentials. Public tools and guest mode work without Supabase configuration; email and OAuth sign-in require it.

| Variables                                            | Location          | Purpose                                                                                               |
| ---------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`        | Browser           | Public project URL and anon key for authentication; never use a service-role key here                 |
| `VITE_SENTRY_DSN`                                    | Browser, optional | Error monitoring; user, request, breadcrumb, and extra data are removed before events are sent        |
| `GROQ_API_KEY`, optional `GROQ_MODEL`                | Server only       | Chat inference; default model is `openai/gpt-oss-120b` (Groq retired `llama-3.3-70b-versatile`)      |
| `GROQ_FALLBACK_MODELS`                              | Server, optional  | Models tried, in order, when the first is over its Groq limit or down. Default `openai/gpt-oss-20b`; `none` turns it off |
| `CHAT_DAILY_CAP`                                    | Server only       | Optional. Global ceiling on AI chat requests per day (default 3000), counted in Supabase              |
| `ALLOWED_ORIGINS`                                    | Server, optional  | Comma-separated exact additional origins; Vercel deployment and branch URLs are allowed automatically |

Configure Supabase's site URL and redirect allowlist for `/auth/callback` on each supported app origin. If the Supabase project changes, update its exact host in the Content Security Policy in `vercel.json` too. Origin checks limit browser callers; they do not authenticate public guest API traffic. Rate limits remain necessary.

The account deletion UI calls the authenticated `public.delete_user()` RPC. Its migration is in `supabase/migrations/202609070001_self_delete.sql`. Review and apply it to the intended Supabase project before releasing account deletion. The frontend must never receive a service-role key. Review any project-specific dependent records or storage separately; this repository does not contain the live database schema.

## Public information pages

`/tax-guide`, `/faq` and `/tax-treaties` are public, outside the signed-in shell. Their text is data in `src/data/guide.js`; every date, amount and the mailing address come from `src/data/taxSeason.js` and each section lists the IRS pages it rests on. The treaty lookup renders only `src/data/treaties.js`: countries the app has not reviewed are shown as "not reviewed", never as having no treaty. The pages say plainly that the app does not prepare or file Form 1040-NR or state returns. When a rule changes, update the season data, the sentence in `guide.js` and the review log together. `/blog` does not exist (it is the not-found page); `/privacy-policy` and `/terms-of-service` redirect to `/privacy` and `/terms`.

`src/data/site.js` holds the public host. `f1taxhelper.com` redirects to `www.f1taxhelper.com`, so the canonical link, sitemap and robots.txt name `www`; `useRouteMeta` sets the canonical address and og:url for every route, and the title and description of these pages, in the browser; `index.html` deliberately has no fixed canonical because it serves every route.

## IRS links

Every `irs.gov` address the app, the chat prompt and the chat test set use is listed by `node scripts/check-irs-links.mjs`; add `--online` to check that each one still opens (the IRS reorganises its site, and in 2026 the treaty directory moved, which broke the app's link and the one the chat gave students). Shared sources are in `SOURCES` in `src/data/taxSeason.js`. Run the online check before each filing season. Tests guard against the addresses already known to be dead.

## Chat capacity

Groq's free tier limits each model separately: 8,000 tokens a minute, 200,000 a day, 30 requests a minute and 1,000 a day (checked 2026-11-15 on Groq's rate-limits page). One answer costs about 3,000 tokens, so one model serves roughly two or three answers a minute and about 60 a day for the whole site. `api/chat.js` therefore tries the next model in `GROQ_MODEL` then `GROQ_FALLBACK_MODELS` (default `openai/gpt-oss-20b`) when Groq answers 429, 404 or 5xx, which doubles both numbers. A bad key (401/403) is not retried. When every model is over its limit and Groq says the wait is 12 seconds or less, the server holds the question for that long (plus up to 2 seconds of spread) and asks once more. If it is still full, or the wait is longer, the student gets "try again in about N seconds" (503 with `Retry-After`, from Groq's own header, at least 5 seconds); when Groq's wait is over two minutes a daily allowance is used up, and the message says the limit is reached and to try again in an hour or so instead of a generic error. Vercel's edge functions must start a response within 25 seconds, so the hold is capped at 12 seconds plus spread. When a model stops at its 1,200-token cap the stream ends with `finish_reason: length`; the chat screen then adds "This answer was cut short" under it and `qa/chat-eval` fails that case. The response header `X-Chat-Model` says which model answered, and the Vercel log line `Groq request failed: HTTP 429 on <model>: ...` carries Groq's own limit message, never the student's text. The answers from the fallback model are noticeably less careful: after changing the fallback list, run `qa/chat-eval` against a preview with the requests sent back to back so that most land on the fallback. For real headroom (beyond a few students at once) the only free lever left is to shrink the prompt; more than that needs Groq's paid tier.

## Chat answer quality

`qa/chat-eval/` holds 37 student questions with the facts each answer must contain and the mistakes it must not make (wrong deadline, "no treaty" for an unreviewed country, asking for an SSN, non-IRS links, guarantees). Run it after any change to `lib/taxPrompt.js`, the season or treaty data, or the chat model, then read a few answers yourself. It calls the real API and spends free-tier model tokens, so it is not part of CI. See [qa/chat-eval/README.md](qa/chat-eval/README.md).

## Tax season and Form 8843

`src/data/taxSeason.js` holds the explicit tax year, filing year, reviewed dates, source URLs, expected deadlines, and verified PDF fingerprint. The season never advances automatically with the calendar.

Two IRS forms are verified and filled in the browser (`FORM_8843_TEMPLATES` in `taxSeason.js`): **2026** (the default, filed in 2027; reviewed November 15, 2026, title "2026 Form 8843", created May 11, 2026, served at the IRS current-revision link) and **2025** for prior-year filing. Each year has its own file in `public/`, SHA-256 and field-name style (the 2026 form drops the zero padding, `f1_04` became `f1_4`). Any other year, or a file whose hash does not match its year, is refused. Never relabel a prior-year PDF or fill a draft.

Before enabling a new form year: obtain the final IRS PDF, verify its printed year and every AcroForm field, add a `FORM_8843_TEMPLATES` entry (file, SHA-256, field style), review dates and rules, update the PDF regression fixtures, and inspect rendered output and native checkbox values. See the audit's release steps.

## Architecture and privacy

- React 18, Vite, React Router, and Tailwind; preserve the existing navy/blue visual style. Motion uses short transitions and respects reduced-motion preferences.
- `AuthProvider` in `src/hooks/useAuth.js` owns the shared auth/guest session. Use `useAuth()` from route components.
- The visual system is token-based: light and dark palettes in `src/index.css`, switched from the header or Account → Appearance (Automatic follows the device), the platform's own UI typeface with Inter as fallback, translucent blurred bars, and two shared springs for all movement (`src/components/app/motion.jsx`).
- Signed-in screens share one shell (`src/components/app/AppShell.jsx`): a sidebar on desktop and a bottom tab bar on phones with four places — Home (`/home`), My Taxes (`/taxes`), Form 8843 (`/form-8843`) and Ask AI (`/chat`) — plus Account (`/account`). Step-by-step flows (`/questionnaire`, `/status-checker`, `/form-8843`) hide the tab bar and show a header with "Save & exit". The public status check and Form 8843 render without app chrome when signed out. Older addresses (`/welcome`, `/dashboard`, `/results`, `/checklist`) redirect.
- `src/utils/taxProfile.js` is the only place that decides the student's current status (the newer of the questionnaire and the quick status check). `src/utils/journey.js` turns it into the four Home steps and the single "next step". The one document checklist is defined in `src/data/checklistItems.js`.
- Shared rule helpers live in `src/utils/taxRules.js`; reviewed treaty guidance is in `src/data/treaties.js`. Unreviewed treaty entries require review rather than implying no treaty exists.
- `lib/taxPrompt.js` uses the same season and treaty sources as the frontend. API handlers validate input and enforce rate limits before contacting paid services. `lib/chatLimits.js` holds the chat size limits for both the server validator and the browser, which trims history to fit. Rate limits and the daily chat ceiling use a shared counter in Supabase (`public.rate_hit`, migration `202611150002_rate_limit.sql`); counters are keyed by a hash of the address. If the counter is unreachable, requests fall back to a per-instance limit and the failure is logged, so chat does not go down with it.
- Browser storage keys include tax year and user ID. Completed questionnaires can also sync to authenticated Supabase user metadata. Chat history and checklist progress are local to the browser.
- Sensitive Form 8843 drafts use tab-scoped `sessionStorage`; PDF generation runs locally with `pdf-lib` and an embedded Inter font. Form fields are not sent to the chat API. Browser storage is not encrypted, and downloaded PDFs must be managed separately.

Live OAuth, Groq, Supabase deletion, and Vercel routing require checks in a configured environment. The automated suite uses synthetic data and mocked external services.
