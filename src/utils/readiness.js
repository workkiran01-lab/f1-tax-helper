// Filing Readiness score — aggregates progress signals from localStorage
// (plus the questionnaire from Supabase user metadata, passed in by the caller).
// All storage reads are defensive: missing/corrupt/unavailable storage must
// degrade to "not done", never throw.

function safeGetItem(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeParse(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function computeReadiness({ uid, questionnaire }) {
  // statusChecked (25): 'f1_status_result' parses to a non-null object
  const statusResult = safeParse(safeGetItem('f1_status_result') ?? 'null')
  const statusChecked = statusResult !== null && typeof statusResult === 'object'

  // questionnaireDone (20): caller passes user_metadata.questionnaire or equivalent
  const questionnaireDone = Boolean(questionnaire)

  // checklistProgress (30, partial credit): fraction of checked keys in whatever
  // shape ChecklistPage stored — we don't assume a specific item set.
  let checkedCount = 0
  let totalKeys = 0
  const checklistState = safeParse(safeGetItem(`f1_checklist_state_${uid || 'guest'}`) ?? 'null')
  if (checklistState && typeof checklistState === 'object') {
    const values = Object.values(checklistState)
    totalKeys = values.length
    checkedCount = values.filter(Boolean).length
  }
  const checklistFraction = totalKeys > 0 ? checkedCount / totalKeys : 0
  const checklistPoints = Math.round(30 * checklistFraction)
  const checklistDone = totalKeys > 0 && checkedCount === totalKeys

  // form8843Generated (15) / treatyChecked (10): simple flags
  const form8843Generated = safeGetItem('f1_8843_generated') === 'true'
  const treatyChecked = safeGetItem('f1_treaty_checked') === 'true'

  const score =
    (statusChecked ? 25 : 0) +
    (questionnaireDone ? 20 : 0) +
    checklistPoints +
    (form8843Generated ? 15 : 0) +
    (treatyChecked ? 10 : 0)

  const checklistLabel =
    checkedCount > 0 && !checklistDone
      ? `Gather your documents (${checkedCount} of ${totalKeys} collected)`
      : 'Gather your documents'

  const tasks = [
    { id: 'status', label: 'Check your residency status', done: statusChecked, points: 25, link: '/status-checker' },
    { id: 'questionnaire', label: 'Complete the tax questionnaire', done: questionnaireDone, points: 20, link: '/questionnaire' },
    { id: 'checklist', label: checklistLabel, done: checklistDone, points: 30 - checklistPoints, link: '/checklist' },
    { id: 'form8843', label: 'Generate your Form 8843', done: form8843Generated, points: 15, link: '/form-8843' },
    { id: 'treaty', label: 'Check your tax treaty', done: treatyChecked, points: 10, link: '/treaty-detector' },
  ]

  return { score, tasks }
}

export function scoreColor(score) {
  if (score >= 90) return '#22c55e'
  if (score >= 70) return '#3b82f6'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}
