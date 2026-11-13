# App navigation restructure (November 2026)

The app had no navigation after the homepage, three separate checklists, and two status tools whose results each page reconciled on its own. This change gives every signed-in screen the same shell and one source for status and progress. Tax rules, deadlines, treaty text, Form 8843 validation and PDF filling are unchanged.

## What a student sees

| Place | Route | Replaces |
| --- | --- | --- |
| Home | `/home` | `/welcome`. Shows one "next step", four filing steps with their state, and the personal deadline. |
| My Taxes | `/taxes` | `/results` and `/checklist`. One status, the guidance that follows from it, one checklist, deadlines and filing options. |
| Form 8843 | `/form-8843` | Same wizard, now with a back arrow, "Draft saved in this tab" and "Save & exit". The tab bar is hidden while filling it in. |
| Ask AI | `/chat` | Same chat. Starts from the status My Taxes shows; past conversations open from a history button. |
| Account | `/account` | The settings panel and sign-out/delete buttons that lived inside the chat sidebar. Adds profile editing and a guest-to-Google prompt. |

Desktop shows the four places in a left sidebar; phones show a bottom tab bar. Old addresses redirect.

## Decisions worth knowing

- **Step order is Status → Form 8843 → Documents → File.** The mockup listed documents second, but the checklist contains "Form 8843" itself, so it cannot be finished before the form.
- **The two status tools still exist and still ask different questions.** Fusing their question sets would change screening logic, which needs a tax review. Instead `currentTaxProfile()` picks the most recent result and every screen, including the chat, reads only that. "Edit my answers" opens the questionnaire. The quick status check stays as the no-login entry from the homepage.
- **Form 8843 progress is read from the tab's draft.** Drafts hold passport details and stay in `sessionStorage`, so a new tab reports "Not started" rather than claiming saved sections it cannot show.
- **Tax year 2026 cannot be downloaded yet**, so "Print, sign and mail" stays locked with the reason shown, and a completed draft reads "waiting", not "done".
- **Sign-out destination.** `signOut('/')` from a protected screen used to land on `/login` because the route guard's redirect overrode it. The guard now uses the destination passed to `signOut`.

## Removed

`WelcomePage`, `ResultsPage`, `ChecklistPage`, `ReadinessCard` and `utils/readiness.js` (the 100-point score, which could not reach 100 for 2026), `ChatSidebar`, `ChatChecklistPanel` and `components/checklist/data.js` (a second, generic checklist with its own storage), `FloatingChatButton`, and the unused `Footer` (the only links to the Coming Soon pages).

## Verification

`tests/appShell.test.jsx` covers the profile, the journey states, navigation between tabs, focus flows, signed-out access, redirects, onboarding, Home, My Taxes, chat context and Account. Screens were also checked in a headless browser at 390×844 and 1280×820 for layout, console errors and horizontal overflow.
