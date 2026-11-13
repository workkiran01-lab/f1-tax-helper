# November 2026 bug sweep

Reviewed November 10–11, 2026 against `main` at `b1ee243`. Scope: a full read of the source, the existing test suite, a production build and the dependency audit. Every fix below has regression coverage in `tests/regressions.test.jsx` unless noted; 17 of its 18 tests fail against the previous source. Live services (Groq, Supabase, Resend, Redis, Vercel) were not exercised.

## Fixed

| Area | Bug | Fix |
| --- | --- | --- |
| CI | `npm audit --audit-level=high` failed on `main` (2 critical, 2 high), so the `App checks` workflow could not pass. | Updated vite, postcss-selector-parser and source-map-js in range; moved vitest to 5.0.5. Audit reports zero vulnerabilities. |
| Chat | **Chat was down.** The default model `llama-3.3-70b-versatile` was shut down by Groq on August 16, 2026 (free and developer tiers), and `.env.example` pinned it too, so every request returned "The AI service is unavailable". | Default is now `openai/gpt-oss-120b` with low reasoning effort and reasoning excluded from the stream. Failed upstream calls log their HTTP status (never message content). |
| Chat | The client sent raw history. One answer over 4,000 characters, or about 24,000 characters in total, made the server reject every later message in that conversation. | `lib/chatLimits.js` holds the limits for both sides; the client trims history to fit and keeps the opening context message. |
| Chat | Every message showed the current time, and all times changed on each re-render. | Messages store `createdAt`. |
| Chat | An empty answer bubble appeared next to the typing indicator until the first token arrived. | The indicator stands in for the answer until content exists. |
| Chat | An IRS Reference section without Markdown links rendered as an empty box, dropping citations given by name. | Plain reference text is shown; a section with only unsafe links is omitted. Links whose URL contains parentheses now parse. |
| Chat | Raw errors reached users: `Failed to fetch`, and JSON parser messages from a malformed stream event. | Both map to plain-language messages. |
| Chat | A failed sign-out opened the "Delete your account?" dialog. The sidebar ignored the name entered at onboarding. The Escape handler read a stale `deleteLoading`. | Inline sign-out error, onboarding name used, effect dependency corrected. |
| Form 8843 | Step validation checked characters and lengths for every field, not only the visible step. An entry on a later step (for example a non-Latin character in the address) blocked "Continue" on an earlier step with nothing highlighted. A hidden explanation could block the last step the same way. | Validation is scoped to the step's fields; hidden explanations are skipped. A failed final check opens the step that owns the error instead of step 1. |
| Questionnaire | Answering "No" to the F-1 question was saved for the tab session with no way back; every return visit reopened the notice. | "Change my answer" button. |
| Questionnaire | A restored country selection left the search box empty. | Search box shows the selection. |
| Dashboard | "Restart Questionnaire" resumed saved progress, and both buttons did the same thing. | Restart clears progress; the primary button reads Start, Continue or View My Results as appropriate. |
| Checklist | The header named the status-check result even when the list was built from a newer questionnaire. The download revoked its object URL in the same task as the click. | Header names the real source; link is attached and revoked later. |
| Status checker | IRS links replaced the unsaved result screen. A "review" result showed an empty requirements card. | IRS links open in a new tab; the card explains why no forms are listed. |
| Sign-in | Guests were redirected away from `/login`, so they could only move to a Google account by signing out, which clears guest data. The Google button stayed disabled after returning with the Back button. | Guests can stay on `/login`; state resets on `pageshow`. |
| Navbar | Guests saw a blank account label; `signOut` received the click event and its rejection was unhandled. | "Guest" label linking to the dashboard; handled sign-out. |
| Waitlist | The form hid the server's reason (invalid address, rate limit). | Server message shown. |
| Local dev | `vercel dev` serves on `http://localhost:3000`, which the origin check rejected, so the documented way to test the API locally returned 403. | Allowed outside production only. |
| Styles | `text-primary-foreground`, `bg-secondary`, `bg-accent`, `text-accent-foreground` and `ring-ring` were used but not defined, so the utilities were never generated (chat button text, checklist progress track, button hover and focus ring). | Colours added to `tailwind.config.js`. |
| Static files | `index.html` pointed to `og-image.png` and `robots.txt` to `sitemap.xml`; neither existed, so both URLs returned the app's HTML. | Both files added and excluded from the SPA rewrite. |
| Data | Kosovo, DR Congo, Hong Kong, Macau, Micronesia, Antigua and Barbuda and São Tomé and Príncipe were missing, and the questionnaire cannot finish without a selection. | Added as unreviewed entries (review path, no treaty claim). |

## Reviewed and left unchanged

- The preparation score cannot reach 100 for tax year 2026: 15 points wait on the final IRS Form 8843, and the status step only completes for a "likely nonresident" result. This matches the preparation-only rule for 2026.
- "50+ countries checked" on the homepage: six treaty entries are reviewed; the rest route to review. Wording is a product decision.
- `src/components/Footer.jsx` is not imported anywhere.
- Tax rules, deadlines, treaty text and the PDF field mapping were read against the September audit and not changed.

## Verification

`npm ci`, `npm test` (84 tests), `npm run build`, `npm audit --audit-level=high` (0 vulnerabilities).
