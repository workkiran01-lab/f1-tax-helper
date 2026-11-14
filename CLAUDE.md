# F1 Tax Helper contributor guide

Current architecture and setup are in [README.md](README.md). Review [docs/AUDIT-2027.md](docs/AUDIT-2027.md) for the September 2026 fixes and remaining release requirements.

## Product and architecture

- This is Vite + React, not Next.js. Keep the existing navy/blue style and quiet, accessible motion. Respect reduced-motion preferences.
- `src/App.jsx` defines React Router routes. `AuthProvider` in `src/hooks/useAuth.js` owns auth and guest state; consumers use `useAuth()`.
- Colours are tokens: use Tailwind names such as `bg-surface`, `text-ink-2`, `border-line`, `bg-tint` (defined as CSS variables in `src/index.css`, mapped in `tailwind.config.js`). Do not put hex values in components; `tests/designTokens.test.js` fails if you do.
- The app has light and dark appearances. Both are defined in `src/index.css` (`:root` and `:root[data-theme='light']`); add a colour role to both. `public/theme.js` applies the saved choice before first paint (it must stay an external file because the CSP forbids inline scripts) and `src/hooks/useTheme.js` owns the switch. Check new screens in both appearances.
- Each screen has at most one `.hero-surface` (the gradient card). Use `IconTile` for coloured icon squares and `Brand`/`BrandMark` for the logo.
- Motion comes from `src/components/app/motion.jsx` (`ScreenTransition`, `Sequence`, `ProgressRing`, `Sheet`, and the `snappy`/`settle` springs). Animate in response to an action or once per screen arrival; do not add per-card hover or scroll effects. Reduced-motion users are handled globally by `MotionConfig` and the CSS media query.
- Every signed-in route renders inside `AppShell` (`src/components/app/`). Add a screen by wrapping its route in `InApp` (or `AppShell focus` for a step-by-step flow) in `src/App.jsx`; do not give pages their own logo header or navigation. Use `PageHeader` for a tab's main screen and `FocusHeader` for flows.
- Read the student's status only through `currentTaxProfile()` in `src/utils/taxProfile.js`, and progress only through `computeJourney()` in `src/utils/journey.js`. Do not read the `status` or `questionnaire` storage keys from a page, and do not add a second checklist: extend `src/data/checklistItems.js`.
- `src/data/taxSeason.js` is the single reviewed season source. The 2027 filing season means 2026 income. Never roll tax rules forward automatically with the clock.
- `src/utils/taxRules.js` owns screening/action rules; `src/data/treaties.js` owns reviewed treaty guidance. Unknown cases must request review rather than invent eligibility or absence of a treaty.
- `src/utils/storage.js` scopes browser keys by tax year and user. Do not restore prior-year results as current guidance. Form drafts belong in session storage; do not send SSNs, passports, or form fields to chat or monitoring.
- `lib/taxPrompt.js` shares season/treaty data with the UI. `api/chat.js` and `api/waitlist.js` use the validated, rate-limited helpers in `lib/apiSafety.js`. Keep server secrets out of `VITE_` variables and browser code. Chat size limits live in `lib/chatLimits.js`; the client must fit history with `fitChatHistory` rather than send it raw.
- `src/utils/form8843Fields.js` fills exact native AcroForm fields and checkbox states with an embedded font. It gates the printed tax year and template hash. Never draw an X as a substitute for a checkbox value, put a calendar year into a fiscal-year blank, or relabel a prior-year form.
- `src/utils/form8843Model.js` defines the wizard schema and validation. Step validation reports only that step's fields (`STEP_FIELDS`); add new fields there. Tax year 2026 is preparation-only until the final IRS template and mapping have been verified.
- Account deletion requires the authenticated RPC in `supabase/migrations/202609070001_self_delete.sql`. Never use Supabase admin credentials in the browser.

## Verification

Run `npm ci`, `npm test`, `npm run build`, and `npm audit --audit-level=high`. Add regression coverage for substantive tax, storage, chat, API, or PDF fixes. Verify PDF native field values and rendered output after changes to mappings or appearances. Tests use synthetic data and mocked external services; distinguish these results from live deployment checks.
