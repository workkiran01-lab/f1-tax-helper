# Chat answer-quality check

A fixed set of student questions, each with the facts a correct answer must contain and the mistakes it must not make. It exists to catch the failures that hurt a tax helper most: a wrong deadline or amount, "no treaty" for a country the app has not reviewed, asking for an SSN, a promised outcome, a non-IRS link, or ignoring the required answer shape.

It does not prove an answer is right. It is a tripwire. After every prompt, model or season change, run it and then read a sample of the answers yourself.

## When to run it

- After editing `lib/taxPrompt.js` or the season and treaty data (`src/data`) that feed the prompt.
- After changing `GROQ_MODEL` or when Groq retires a model.
- When the filing season rolls forward (re-review every case, see below).
- Not on every commit: it calls the real chat API, which spends free-tier model quota and the shared daily chat budget (`CHAT_DAILY_CAP`, default 3000). A full run is 38 requests, about 100,000 model tokens and roughly 20 minutes. Groq's free tier allows 200,000 tokens a day per model, so a full run uses about half of what students can use that day. Run a subset (`--only`) while iterating and the full set once before a release, ideally late in the evening US time.

## How to run it

From a machine that can reach the site:

```
node qa/chat-eval/run.mjs                                   # the live site
node qa/chat-eval/run.mjs --url http://localhost:3000/api/chat   # `vercel dev`
node qa/chat-eval/run.mjs --only forms,safe-01              # a category or case ids
```

It prints one line per case, writes `qa/chat-eval/results/latest.json` (ignored by git, includes every answer) and exits non-zero when any critical case fails or fewer than 90% pass (`--min 0.95` to tighten). The default pace is one case every 30 seconds (`--delay`): the model's free tier allows 8,000 tokens a minute and an answer costs about 3,000, so faster runs get rate-limited answers that look like quality failures.

The production API only accepts requests from the site's own origin. From a browser instead, load the bundled runner on a page of the deployed site and call it:

```
npx esbuild qa/chat-eval/browser-entry.js --bundle --format=iife --minify --outfile=public/assets/__chat-eval.js
# push a branch with that file, wait for its Vercel preview, open <preview>/robots.txt, then:
document.head.append(Object.assign(document.createElement('script'), { src: '/assets/__chat-eval.js' }))
const run = await window.runChatEval({ only: ['forms'], delayMs: 30000 })   // run.summary, run.results
```

Delete `public/assets/__chat-eval.js` before merging; it is a throwaway for preview runs.

## What a case holds

| Field | Meaning |
| --- | --- |
| `question` | What the student types |
| `kind` | `substantive` must use the four sections (Answer, Why, IRS Reference, Next Step) and stay under 2,600 characters; `plain` is a short reply with no sections; `either` accepts a short plain reply (such as a clarifying question) or, if the answer uses headings, holds it to the full shape |
| `must` | Groups of alternative patterns. Every group needs one match, so a correct answer in any wording passes |
| `mustNot` | Patterns for the known wrong answers (an obsolete amount, "no treaty", an invented address) |
| `critical` | One failure fails the whole run: safety, money, dates, treaties |
| `gold` | One sentence stating the expected answer, for the human reviewer |
| `source`, `reviewed` | The IRS page the expectation comes from and the date a person last checked it |

Every answer is also checked for: all four sections and a named IRS source, links only to `irs.gov`, no request for an SSN, ITIN or passport number, and no guarantee of an outcome. Every answer also fails the check `scope` if a sentence says the app prepares, drafts or files a Form 1040-NR without saying it does not. An answer the model stopped at its token cap (`finish_reason` `length`) fails with the check `truncated`, because it can read as finished; the summary counts them in `truncated`, and `byModel` counts how many answers each model wrote.

## Keeping it honest

- When a rule, amount or deadline changes in `src/data/taxSeason.js`, update the matching case, its `reviewed` date and its `source` in the same change. `tests/chatEval.test.js` ties the June 15 and April 15 cases to the season data.
- A case that fails because the pattern was too strict is a bug in the case. Loosen the pattern and keep the failing answer as a unit test in `tests/chatEval.test.js`.
- A case that fails because the answer is wrong is a bug in the prompt or the model. Fix `lib/taxPrompt.js`, run again, and do not weaken the case.
- Add a case whenever a real student question gets a bad answer.
- Read at least five answers in `results/latest.json` after each run, including a few that passed. A mechanical pass can still hide a confusing answer.
