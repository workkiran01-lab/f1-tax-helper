// Starter and follow-up questions for Ask AI. They adapt to what the student has already
// told the app, and never repeat something they have asked in this conversation.

const SEED = {
  income: [
    'Which forms do I need for my income?',
    'Do I qualify for a tax treaty?',
    'What is the filing deadline?',
    'What is Form 8843?',
  ],
  noIncome: [
    'Do I still need to file with no income?',
    'What is Form 8843?',
    'Where do I mail Form 8843?',
    'What is the filing deadline?',
  ],
  unknown: [
    'Do I need to file taxes?',
    'What is Form 8843?',
    'Do I qualify for a tax treaty?',
    'What is the filing deadline?',
  ],
}

const FOLLOW_UPS = [
  'Where do I mail it?',
  'What documents do I need?',
  'What happens if I miss the deadline?',
  'Can I e-file this?',
  'Do I need to file a state return?',
]

const norm = (text) => String(text).trim().toLowerCase()

export function suggestionsFor(context, asked = [], limit = 4) {
  const hasIncome = context?.answers?.hasUSIncome
  const seed = hasIncome === true ? SEED.income : hasIncome === false ? SEED.noIncome : SEED.unknown
  const used = new Set(asked.map(norm))
  const pool = asked.length ? [...FOLLOW_UPS, ...seed] : seed
  return pool.filter((q) => !used.has(norm(q))).slice(0, limit)
}
