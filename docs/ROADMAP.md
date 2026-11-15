# Roadmap: reliability and premium polish

Order matters. Each phase ships as its own PR with tests; colours stay as tokens, one `.hero-surface` per screen, motion only on action or arrival, reduced motion respected.

## Phase 0: Reliability

1. Apply `supabase/migrations/202609070001_self_delete.sql` to the live project and test account deletion with a throwaway account.
2. Weekly keep-alive workflow so the free Supabase project is not auto-paused.
3. Chat failure alerting (Sentry on `/api/chat` 5xx) and a manual QA list of representative F-1 questions.
4. Playwright smoke test in CI: public pages, guest flow, status check, Form 8843 fill and PDF download, chat (mocked).
5. 2026 Form 8843 stays preparation-only until the IRS publishes the final form; reminder for January.

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
