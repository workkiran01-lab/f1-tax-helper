# F1 Tax Helper

US tax preparation guidance for international students. The current season is **2027 filing for 2026 income**. The app provides educational guidance, a residency screening flow, document checklists, AI chat, and a client-side Form 8843 helper. It does not submit returns or certify tax eligibility.

See [the September 2026 audit](docs/AUDIT-2027.md) for corrected bugs, IRS sources, verification, and release limits.

## Run and verify

Use Node.js 22 or later and the committed lockfile.

```bash
npm ci
npm run dev
npm test
npm run build
npm audit --audit-level=high
```

Vite serves the frontend. Use `vercel dev` when testing the `/api/chat` and `/api/waitlist` Edge functions locally. `npm run preview` serves the production frontend build. CI runs tests, the build, and the dependency audit for pull requests and pushes to main.

## Configuration

Copy `.env.example` to `.env.local` and replace placeholders for the services you use. Do not commit real credentials. Public tools and guest mode work without Supabase configuration; email and OAuth sign-in require it.

| Variables                                            | Location          | Purpose                                                                                               |
| ---------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`        | Browser           | Public project URL and anon key for authentication; never use a service-role key here                 |
| `VITE_SENTRY_DSN`                                    | Browser, optional | Error monitoring; user, request, breadcrumb, and extra data are removed before events are sent        |
| `GROQ_API_KEY`, optional `GROQ_MODEL`                | Server only       | Chat inference; default model is `llama-3.3-70b-versatile`                                            |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Server only       | Recommended global rate limiting; without them, each server instance uses a bounded local fallback    |
| `RESEND_API_KEY`                                     | Server only       | Waitlist confirmation email                                                                           |
| `ALLOWED_ORIGINS`                                    | Server, optional  | Comma-separated exact additional origins; Vercel deployment and branch URLs are allowed automatically |

Configure Supabase's site URL and redirect allowlist for `/auth/callback` on each supported app origin. If the Supabase project changes, update its exact host in the Content Security Policy in `vercel.json` too. Origin checks limit browser callers; they do not authenticate public guest API traffic. Rate limits remain necessary.

The account deletion UI calls the authenticated `public.delete_user()` RPC. Its migration is in `supabase/migrations/202609070001_self_delete.sql`. Review and apply it to the intended Supabase project before releasing account deletion. The frontend must never receive a service-role key. Review any project-specific dependent records or storage separately; this repository does not contain the live database schema.

## Tax season and Form 8843

`src/data/taxSeason.js` holds the explicit tax year, filing year, reviewed dates, source URLs, expected deadlines, and verified PDF fingerprint. The season never advances automatically with the calendar.

As reviewed on September 7, 2026, the final IRS Form 8843 available is for **2025**; the 2026 form is a draft. The wizard defaults to **2026 preparation only**. It blocks downloads until that year's final form and exact field mapping have been verified. Users can explicitly select the verified 2025 form for prior-year work. Never relabel a prior-year PDF or enable filing from a draft.

Before enabling a new form year: obtain the final IRS PDF, verify its printed year and every AcroForm field, update the template year and SHA-256, review dates and rules, update the PDF regression fixtures, and inspect rendered output and native checkbox values. See the audit's release steps.

## Architecture and privacy

- React 18, Vite, React Router, and Tailwind; preserve the existing navy/blue visual style. Motion uses short transitions and respects reduced-motion preferences.
- `AuthProvider` in `src/hooks/useAuth.js` owns the shared auth/guest session. Use `useAuth()` from route components.
- Shared rule helpers live in `src/utils/taxRules.js`; reviewed treaty guidance is in `src/data/treaties.js`. Unreviewed treaty entries require review rather than implying no treaty exists.
- `lib/taxPrompt.js` uses the same season and treaty sources as the frontend. API handlers validate input and enforce rate limits before contacting paid services. Upstash supplies a shared production limit; an in-memory fallback keeps unconfigured previews usable.
- Browser storage keys include tax year and user ID. Completed questionnaires can also sync to authenticated Supabase user metadata. Chat history and checklist progress are local to the browser.
- Sensitive Form 8843 drafts use tab-scoped `sessionStorage`; PDF generation runs locally with `pdf-lib` and an embedded Inter font. Form fields are not sent to the chat API. Browser storage is not encrypted, and downloaded PDFs must be managed separately.

Live OAuth, Groq, Redis, Resend, Supabase deletion, and Vercel routing require checks in a configured environment. The automated suite uses synthetic data and mocked external services.
