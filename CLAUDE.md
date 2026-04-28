# F1 Tax Helper — Claude Code guide

## Stack

### dependencies
| Package | Version | Purpose |
|---|---|---|
| `@sentry/react` | ^10.49.0 | Frontend error tracking; initialized in `src/main.jsx` if `VITE_SENTRY_DSN` is set |
| `@supabase/supabase-js` | ^2.99.3 | Auth (magic link / OAuth) and user session management |
| `lucide-react` | ^0.468.0 | Icon library used across all pages |
| `pdf-lib` | ^1.17.1 | Client-side PDF field filling for Form 8843 |
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | DOM renderer |
| `react-router-dom` | ^7.13.1 | Client-side routing with `BrowserRouter` |

### devDependencies
| Package | Version | Purpose |
|---|---|---|
| `@vitejs/plugin-react` | ^4.3.4 | Vite plugin for JSX/React fast refresh |
| `autoprefixer` | ^10.4.20 | PostCSS plugin for CSS vendor prefixes |
| `postcss` | ^8.4.49 | CSS transformation pipeline (required by Tailwind) |
| `tailwindcss` | ^3.4.15 | Utility-first CSS framework |
| `vite` | ^6.0.1 | Build tool and dev server |

---

## Environment variables

| Name | File | Side | Notes |
|---|---|---|---|
| `VITE_SENTRY_DSN` | `src/main.jsx` | Client (bundled) | Optional — Sentry init skipped if absent |
| `VITE_SUPABASE_URL` | `src/utils/supabase.js` | Client (bundled) | Public Supabase project URL; safe to expose |
| `VITE_SUPABASE_ANON_KEY` | `src/utils/supabase.js` | Client (bundled) | Supabase anon/public key; safe to expose |
| `GROQ_API_KEY` | `api/chat.js` | **Server-side only** (Vercel Edge) | **MUST NOT have `VITE_` prefix** — would expose the key in the browser bundle |

---

## File map

### Root config
- [package.json](package.json) — project metadata, deps, and npm scripts
- [vite.config.js](vite.config.js) — Vite config; only the React plugin, no aliases or proxies
- [vercel.json](vercel.json) — SPA rewrite (all paths → index.html), security headers (CSP, HSTS, X-Frame-Options, etc.), Supabase domain allowlisted in CSP
- [tailwind.config.js](tailwind.config.js) — extends Tailwind with CSS-var-based color tokens (background, foreground, card, primary, etc.) and radius scale

### api/
- [api/chat.js](api/chat.js) — Vercel Edge function; proxies chat messages to Groq (`llama-3.3-70b-versatile`) with SSE streaming; contains the AI persona (`Alex`) and system prompt; enforces IP-based rate limit (20 req/60 s) and origin allowlist

### src/
- [src/main.jsx](src/main.jsx) — entry point; conditionally initializes Sentry; renders `<App />`
- [src/App.jsx](src/App.jsx) — root component; defines all routes; implements `ProtectedRoute` (redirects to `/login` when unauthenticated); lazy-loads `ChatPage`, `Form8843Page`, `AboutPage`
- [src/index.css](src/index.css) — global styles; defines CSS custom properties for all design tokens using `oklch` color space; applies Tailwind base/components/utilities

### src/hooks/
- [src/hooks/useAuth.js](src/hooks/useAuth.js) — subscribes to `supabase.auth.onAuthStateChange` as single source of truth; exposes `{ user, loading, signOut }`; used by `ProtectedRoute` and `QuestionnairePage`

### src/utils/
- [src/utils/supabase.js](src/utils/supabase.js) — creates and exports the singleton Supabase client; consumed by `useAuth.js` and `QuestionnairePage.jsx`
- [src/utils/form8843Fields.js](src/utils/form8843Fields.js) — `fillForm8843(pdfBytes, formData)`: maps form state to IRS PDF field names via `pdf-lib`; field coordinate comments verified April 2026 against `form8843.pdf`; used only by `Form8843Page.jsx`
- [src/utils/cn.js](src/utils/cn.js) — minimal className utility (`filter(Boolean).join(' ')`); no `clsx`/`tailwind-merge` dependency

### src/components/checklist/
- [src/components/checklist/data.js](src/components/checklist/data.js) — exports `SECTIONS` array defining three checklist sections (Identity, Income, Education) with item IDs, names, descriptions, and detail text; consumed by `ChecklistPage.jsx` (not read — unverified)

### src/pages/
- [src/pages/QuestionnairePage.jsx](src/pages/QuestionnairePage.jsx) — multi-step questionnaire (6 steps); saves/restores progress to `sessionStorage` under key `'f1-questionnaire-progress'`; resolves treaty data from `TREATY_COUNTRIES` object; saves final results to Supabase user metadata and navigates to `/results`; protected route
- [src/pages/Form8843Page.jsx](src/pages/Form8843Page.jsx) — 5-step wizard for filling and downloading Form 8843 PDF; persists draft to `localStorage` under key `'f1_form8843_v3'`; reads name seed from `localStorage` key `'f1_user_name'`; calls `fillForm8843` from `src/utils/form8843Fields.js`; **not** a protected route

### src/pages/ — not read, describe before editing
- [src/pages/HomePage.jsx](src/pages/HomePage.jsx) — not read, describe before editing
- [src/pages/LoginPage.jsx](src/pages/LoginPage.jsx) — not read, describe before editing
- [src/pages/AuthCallbackPage.jsx](src/pages/AuthCallbackPage.jsx) — not read, describe before editing
- [src/pages/WelcomePage.jsx](src/pages/WelcomePage.jsx) — not read, describe before editing
- [src/pages/ChatPage.jsx](src/pages/ChatPage.jsx) — not read, describe before editing
- [src/pages/ChecklistPage.jsx](src/pages/ChecklistPage.jsx) — not read, describe before editing
- [src/pages/ResultsPage.jsx](src/pages/ResultsPage.jsx) — not read, describe before editing
- [src/pages/AboutPage.jsx](src/pages/AboutPage.jsx) — not read, describe before editing
- [src/pages/PrivacyPolicy.jsx](src/pages/PrivacyPolicy.jsx) — not read, describe before editing
- [src/pages/TermsOfService.jsx](src/pages/TermsOfService.jsx) — not read, describe before editing
- [src/pages/Disclaimer.jsx](src/pages/Disclaimer.jsx) — not read, describe before editing
- [src/pages/PrivacyPage.jsx](src/pages/PrivacyPage.jsx) — not read, describe before editing
- [src/pages/TermsPage.jsx](src/pages/TermsPage.jsx) — not read, describe before editing
- [src/pages/ContactPage.jsx](src/pages/ContactPage.jsx) — not read, describe before editing
- [src/pages/ComingSoon.jsx](src/pages/ComingSoon.jsx) — not read, describe before editing

### src/components/ — not read, describe before editing
- [src/components/Navbar.jsx](src/components/Navbar.jsx) — not read, describe before editing
- [src/components/Footer.jsx](src/components/Footer.jsx) — not read, describe before editing
- [src/components/DisclaimerBanner.jsx](src/components/DisclaimerBanner.jsx) — not read, describe before editing
- [src/components/FloatingChatButton.jsx](src/components/FloatingChatButton.jsx) — not read, describe before editing
- [src/components/HeroSection.jsx](src/components/HeroSection.jsx) — not read, describe before editing
- [src/components/FeaturesSection.jsx](src/components/FeaturesSection.jsx) — not read, describe before editing
- [src/components/HowItWorksSection.jsx](src/components/HowItWorksSection.jsx) — not read, describe before editing
- [src/components/ui/Button.jsx](src/components/ui/Button.jsx) — not read, describe before editing
- [src/components/checklist/FilingOptionsSection.jsx](src/components/checklist/FilingOptionsSection.jsx) — not read, describe before editing
- [src/components/chat/ChatMain.jsx](src/components/chat/ChatMain.jsx) — not read, describe before editing
- [src/components/chat/ChatSidebar.jsx](src/components/chat/ChatSidebar.jsx) — not read, describe before editing
- [src/components/chat/ChatChecklistPanel.jsx](src/components/chat/ChatChecklistPanel.jsx) — not read, describe before editing
- [src/components/chat/IRSDisclaimer.jsx](src/components/chat/IRSDisclaimer.jsx) — not read, describe before editing
- [src/components/legal/LegalLayout.jsx](src/components/legal/LegalLayout.jsx) — not read, describe before editing
- [src/layout/Layout.jsx](src/layout/Layout.jsx) — not read, describe before editing

---

## Architecture rules

**Styling approach**
- Tailwind utility classes everywhere. CSS custom properties (defined in `src/index.css`) map to Tailwind color tokens (`background`, `foreground`, `card`, `primary`, etc.) using `oklch` color space. Never use raw hex/rgb in new components — always use token names.
- `src/utils/cn.js` is the className helper. It is a plain `filter+join` — no `clsx` or `tailwind-merge`. Do not pass conflicting Tailwind classes expecting the last one to win.

**Theme**
- Design tokens in `src/index.css` define a light theme (light background ~white, dark foreground). The loading spinners in `App.jsx` use hardcoded `bg-[#0f172a]` (dark slate) for the lazy-load fallback — this is inconsistent with the token system.

**Auth pattern**
- Supabase handles auth (magic link or OAuth). `useAuth.js` subscribes to `onAuthStateChange` — this is the **only** source of truth for session state. Do not call `supabase.auth.getUser()` directly.
- `ProtectedRoute` in `App.jsx` reads `{ user, loading }` from `useAuth`; shows a spinner while loading, redirects to `/login` while unauthenticated.
- Post-auth redirect goes through `/auth/callback` (handled by `AuthCallbackPage`).

**Data persistence**
- Questionnaire in-progress state: `sessionStorage`, key `'f1-questionnaire-progress'`
- Form 8843 draft: `localStorage`, key `'f1_form8843_v3'`
- Name seed for Form 8843 pre-fill: `localStorage`, key `'f1_user_name'`
- Completed questionnaire results: Supabase user metadata (written from `QuestionnairePage`, line ~370)

**API pattern**
- The only backend endpoint is `api/chat.js` (Vercel Edge). Frontend POSTs `{ messages: [...] }` to `/api/chat`. The response is a raw SSE stream proxied from Groq. No other API routes exist.
- The Groq API key lives only in `process.env.GROQ_API_KEY` on the server. It must never be prefixed `VITE_`.

**PDF approach**
- Entirely client-side. `pdf-lib` loads the IRS `form8843.pdf` bytes in the browser, fills AcroForm fields by exact name, overlays checkbox "X" characters via `page.drawText`, then triggers a browser download. No server-side rendering.
- PDF field names are documented in the comment block at the top of `src/utils/form8843Fields.js` and were verified April 2026.

**Route protection**
- `ProtectedRoute` wraps children in `App.jsx`. Unauthenticated users see `<FullScreenSpinner>` during loading, then are redirected to `/login`. Only `/`, `/login`, `/auth/callback`, `/form-8843`, `/about`, and static legal/info pages are public.
- `/form-8843` is intentionally **not** protected (no `ProtectedRoute` wrapper in `App.jsx`).

**Lazy loading**
- `ChatPage`, `Form8843Page`, and `AboutPage` are lazy-loaded via `React.lazy`. The fallback is `<LazySuspense>` (dark-bg spinner defined in `App.jsx`). All other pages are eagerly imported.

---

## Targeted edit guide

**Change AI persona or system prompt**
- File: [api/chat.js](api/chat.js), `SYSTEM_PROMPT` constant (~line 20). The persona name "Alex" is defined there.

**Add a new country tax treaty**
- File: [src/pages/QuestionnairePage.jsx](src/pages/QuestionnairePage.jsx), `TREATY_COUNTRIES` object (~line 209). Add a key matching the country string exactly as it appears in the `COUNTRIES` array. Shape: `{ article, wageCap, scholarshipExempt, form8833Required }`.

**Add a checklist item**
- File: [src/components/checklist/data.js](src/components/checklist/data.js). Add an object with `{ id, name, description, details }` to the appropriate section's `items` array.

**Add a new page/route**
1. Create the page component in `src/pages/`.
2. File: [src/App.jsx](src/App.jsx) — add the import (lazy or eager) and a `<Route>` in `AppRoutes`. Wrap with `<ProtectedRoute>` if auth is required.

**Change Form 8843 field mapping**
- File: [src/utils/form8843Fields.js](src/utils/form8843Fields.js), inside `fillForm8843`. Field names are documented in the comment block at the top. Cross-reference coordinates with `form8843.pdf` if remapping.

**Modify questionnaire flow or action items**
- File: [src/pages/QuestionnairePage.jsx](src/pages/QuestionnairePage.jsx). Steps are controlled by `currentStep` state. Step-skip logic is in `goToNextStep` (~line 277). Result/action-item generation references `TREATY_COUNTRIES` (~line 370).

**Change home page pricing**
- File: [src/pages/HomePage.jsx](src/pages/HomePage.jsx) — not read; read before editing.

**Change auth/redirect behavior**
- Files: [src/hooks/useAuth.js](src/hooks/useAuth.js) (sign-out redirect), [src/App.jsx](src/App.jsx) (`ProtectedRoute` redirect target), [src/pages/AuthCallbackPage.jsx](src/pages/AuthCallbackPage.jsx) (post-login redirect) — AuthCallbackPage not read; read before editing.

---

## Known issues (what you observed)

1. **Duplicate legal page routes** — `App.jsx` registers both `/privacy-policy` (→ `PrivacyPolicy`) and `/privacy` (→ `PrivacyPage`), and both `/terms-of-service` (→ `TermsOfService`) and `/terms` (→ `TermsPage`). Four distinct components for two logical pages. Likely dead routes — verify which are linked before removing.

2. **Hardcoded dark background in lazy fallback** — `App.jsx` line 27: `bg-[#0f172a]` is used in `LazySuspense` but the design token system uses `bg-background` (which resolves to near-white). The spinner appears on a dark background inconsistent with the rest of the app theme.

3. **`TREATY_COUNTRIES` key "UK" won't match** — The `COUNTRIES` array in `QuestionnairePage.jsx` likely contains "United Kingdom" (not verified — the file was read only to line 80 where the list was still in alphabetical order and not yet at U). If the full list uses "United Kingdom", the treaty lookup `TREATY_COUNTRIES[answers.country]` will always miss for UK users. Verify the exact string in `COUNTRIES`.

4. **`localStorage` key `'f1_user_name'` origin unknown** — `Form8843Page.jsx` reads `localStorage.getItem('f1_user_name')` to pre-populate the name fields, but no file among those read writes this key. The write location is unverified — if it was removed or never implemented, the pre-fill silently no-ops.

5. **`cn.js` has no deduplication** — `src/utils/cn.js` is a plain filter+join. Conflicting Tailwind classes (e.g., `text-sm text-lg`) are both emitted; last-write-wins behavior expected from `tailwind-merge` is absent. Not a bug per se, but callers must not rely on override semantics.

6. **In-memory rate limiter resets on cold start** — `api/chat.js` uses a module-level `Map` for rate limiting. Vercel Edge functions may be re-instantiated per-request in some regions, resetting the counter. The rate limit is best-effort, not guaranteed.

---

## Efficient prompting rules

### Good prompts
1. "In `api/chat.js`, change the `SYSTEM_PROMPT` constant so Alex introduces herself as 'Nova' instead of 'Alex'."
2. "In `src/pages/QuestionnairePage.jsx`, add Vietnam to `TREATY_COUNTRIES` with `{ article: 'Article 19', wageCap: null, scholarshipExempt: true, form8833Required: true }` and add 'Vietnam' to the `COUNTRIES` array in alphabetical order."
3. "In `src/utils/form8843Fields.js` inside `fillForm8843`, the `taxYear` field currently calls `String(formData.taxYear || '2025').slice(-2)` — change the default from `'2025'` to `'2024'`."

### Bad prompts
1. "Update the tax treaty information." — Does not name file or which countries; forces full re-read of QuestionnairePage.
2. "Fix the styling so it looks consistent." — No file, no element, no token — requires reading every component.
3. "Add more checklist items." — Does not specify section, item text, or ID; requires reading data.js and guessing intent.

---

## Commands

```
npm install          # install dependencies
npm run dev          # start Vite dev server (frontend only)
npm run build        # production build to dist/
npm run preview      # serve the dist/ build locally
vercel dev           # run both frontend and api/ edge functions locally
```

---

## Dependency tree snapshot

```
  "dependencies": {
    "@sentry/react": "^10.49.0",
    "@supabase/supabase-js": "^2.99.3",
    "lucide-react": "^0.468.0",
    "pdf-lib": "^1.17.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.13.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "vite": "^6.0.1"
  }
```

---

## Env var usage snapshot

```
src/main.jsx:if (import.meta.env.VITE_SENTRY_DSN) {
src/main.jsx:    dsn: import.meta.env.VITE_SENTRY_DSN,
src/utils/supabase.js:  import.meta.env.VITE_SUPABASE_URL,
src/utils/supabase.js:  import.meta.env.VITE_SUPABASE_ANON_KEY,
api/chat.js:      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
```
