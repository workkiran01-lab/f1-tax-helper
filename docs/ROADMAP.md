# Roadmap: reliability and premium polish

Status (2026-11-15): Phases 0 to 3 are shipped except the items listed under Open.

Order matters. Each phase ships as its own PR with tests; colours stay as tokens, one `.hero-surface` per screen, motion only on action or arrival, reduced motion respected.

## Phase 0: Reliability

1. Apply `supabase/migrations/202609070001_self_delete.sql` to the live project and test account deletion with a throwaway account.
2. Weekly keep-alive workflow so the free Supabase project is not auto-paused.
3. Chat failure alerting (Sentry on `/api/chat` 5xx). The representative-questions QA list is `qa/chat-eval/` (37 graded cases, see its README).
4. Playwright smoke test in CI: public pages, guest flow, status check, Form 8843 fill and PDF download, chat (mocked).
5. 2026 Form 8843 enabled 15 Nov 2026 after the IRS published the final form (verified fields, hash, rendered output). Re-check the IRS page in January for a revised form or instructions.

## Phase 1: Onboarding and Home

- One-time disclaimer acknowledgement plus a quiet footer line, replacing the persistent banner.
- First-run welcome and a step-by-step status check with large type and springy transitions.
- Home hierarchy: hero card with the next action and progress ring, clear secondary cards.
- Short completion moments for finishing the status check and Form 8843.
- Skeleton loaders instead of spinners.

## Phase 2: Chat and the PDF

- Chat: markdown, streaming cursor, IRS source chips, copy, follow-up suggestions, status-aware starter prompts.
- In-app Form 8843 preview before download, then a print/sign/mail guide.
- Live answer summary in the Form 8843 wizard.

## Phase 3: Landing, mobile feel, speed

- Landing: product demo, key features, trust section.
- One display font with tabular numerals; spacing pass.
- PWA manifest, icons, splash; blurred bottom tab bar with safe areas.
- Lazy-load routes and the PDF library; Lighthouse 95+.
- Contrast, focus and screen-reader pass in light and dark.

## Open

- Done 2026-11-16: tax guide, FAQ and treaty lookup replace the "coming soon" pages; `/blog` removed; canonical, sitemap and robots moved to the www host. Owner decision: the waitlist endpoint (`/api/waitlist`, Resend, and the waitlist lines in the privacy policy) has no page in the app any more. Delete it, or put a waitlist for a future Form 1040-NR tool on a real page.
- Not built: Form 1040-NR preparation (decision 2026-11-15, too complex for now).
- Done 2026-11-16: anonymous daily usage totals (`docs/USAGE-COUNTS.md`), with signed-in browser tests (`e2e/signed-in.spec.js`) that check each count carries only an event name and that no form value is sent to Supabase.
- Known edge: if saving a name to the account fails, the new name is kept in this browser, but after a reload the older name from the account is shown. Fix with a "pending sync" marker if students report it.
- Test account deletion end to end with a throwaway Google account (owner).
- Run `node scripts/check-irs-links.mjs --online` before each season (28 addresses; all opened on 2026-11-16).
- Chat failure alerting (Sentry on `/api/chat` 5xx).
- Chat answer-quality check (`qa/chat-eval/`) done: run it after any prompt, model or season change and read five answers. It spends Groq free-tier tokens (a full run is about half of one model's daily allowance). The free tier (about 200,000 tokens a day, 8,000 a minute per model) is also the real capacity limit for students: roughly 60 answers a day.
- In-app preview of the actual generated PDF. The wizard has a live HTML replica ("Preparation preview, not for filing"); showing the real PDF needs a pdf.js worker and a CSP change, so it is deferred.
- Lighthouse on a local build: mobile 94, desktop 100, accessibility, best practices and SEO 100. The remaining mobile gap is client-side rendering of the landing headline; closing it needs prerendering.
- January 2027: re-check the IRS Form 8843 page for a revised 2026 form or instructions; any new file needs a new hash and a rendered check. In 2027 add the 2027 form the same way.
- Verify the standalone mailing address in `FORM_8843_MAILING` each season (the form's own instructions and the IRS where-to-file page should agree).
