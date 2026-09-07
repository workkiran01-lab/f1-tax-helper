# F1 Tax Helper contributor guide

Current architecture and setup are in [README.md](README.md). Review [docs/AUDIT-2027.md](docs/AUDIT-2027.md) for the September 2026 fixes and remaining release requirements.

## Product and architecture

- This is Vite + React, not Next.js. Keep the existing navy/blue style and quiet, accessible motion. Respect reduced-motion preferences.
- `src/App.jsx` defines React Router routes. `AuthProvider` in `src/hooks/useAuth.js` owns auth and guest state; consumers use `useAuth()`.
- `src/data/taxSeason.js` is the single reviewed season source. The 2027 filing season means 2026 income. Never roll tax rules forward automatically with the clock.
- `src/utils/taxRules.js` owns screening/action rules; `src/data/treaties.js` owns reviewed treaty guidance. Unknown cases must request review rather than invent eligibility or absence of a treaty.
- `src/utils/storage.js` scopes browser keys by tax year and user. Do not restore prior-year results as current guidance. Form drafts belong in session storage; do not send SSNs, passports, or form fields to chat or monitoring.
- `lib/taxPrompt.js` shares season/treaty data with the UI. `api/chat.js` and `api/waitlist.js` use the validated, rate-limited helpers in `lib/apiSafety.js`. Keep server secrets out of `VITE_` variables and browser code.
- `src/utils/form8843Fields.js` fills exact native AcroForm fields and checkbox states with an embedded font. It gates the printed tax year and template hash. Never draw an X as a substitute for a checkbox value, put a calendar year into a fiscal-year blank, or relabel a prior-year form.
- `src/utils/form8843Model.js` defines the wizard schema and validation. Tax year 2026 is preparation-only until the final IRS template and mapping have been verified.
- Account deletion requires the authenticated RPC in `supabase/migrations/202609070001_self_delete.sql`. Never use Supabase admin credentials in the browser.

## Verification

Run `npm ci`, `npm test`, `npm run build`, and `npm audit --audit-level=high`. Add regression coverage for substantive tax, storage, chat, API, or PDF fixes. Verify PDF native field values and rendered output after changes to mappings or appearances. Tests use synthetic data and mocked external services; distinguish these results from live deployment checks.
