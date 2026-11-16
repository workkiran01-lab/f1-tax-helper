# Roadmap: reliability and premium polish

Status (2026-11-15): Phases 0 to 3 are shipped except the items listed under Open.

Order matters. Each phase ships as its own PR with tests; colours stay as tokens, one `.hero-surface` per screen, motion only on action or arrival, reduced motion respected.

## Phase 0: Reliability

1. Apply `supabase/migrations/202609070001_self_delete.sql` to the live project and test account deletion with a throwaway account.
2. Weekly keep-alive workflow so the free Supabase project is not auto-paused.
3. Chat failure alerting (Sentry on `/api/chat` 5xx) and a manual QA list of representative F-1 questions.
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

- Test account deletion end to end with a throwaway Google account (owner).
- Chat failure alerting (Sentry on `/api/chat` 5xx) and the manual QA question list.
- In-app preview of the actual generated PDF. The wizard has a live HTML replica ("Preparation preview, not for filing"); showing the real PDF needs a pdf.js worker and a CSP change, so it is deferred.
- Lighthouse on a local build: mobile 94, desktop 100, accessibility, best practices and SEO 100. The remaining mobile gap is client-side rendering of the landing headline; closing it needs prerendering.
- January 2027: replace the 2026 draft with the final IRS Form 8843 and verify the field mapping before enabling generation.
- Verify the standalone mailing address in `FORM_8843_MAILING` each season (the form's own instructions and the IRS where-to-file page should agree).
