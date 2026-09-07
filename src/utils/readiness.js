import { TAX_YEAR, canGenerate8843 } from '../data/taxSeason.js'
import { readStored, seasonKey } from './storage.js'
export function computeReadiness({ uid = 'guest', questionnaire }) {
  const status = readStored(seasonKey('status', uid))
  const statusChecked = status?.taxYear === TAX_YEAR && status.badge === 'nra'
  const questionnaireDone = questionnaire?.taxYear === TAX_YEAR && Boolean(questionnaire.answers)
  const saved = readStored(seasonKey('checklist', uid), {})
  const knownIds = [
    'form-8843',
    'form-1040nr',
    'w2',
    '1042s',
    '1099int',
    '1098t',
    'passport',
    'f1-visa',
    'i20',
    'i94',
    'ssn-itin',
    'residency-review',
  ]
  const values =
    saved && typeof saved === 'object' && !Array.isArray(saved)
      ? Object.entries(saved)
          .filter(([id]) => knownIds.includes(id))
          .map(([, v]) => v === true)
      : []
  const checked = values.filter(Boolean).length
  const checklistPoints = values.length ? Math.round((30 * checked) / values.length) : 0
  const formDone =
    canGenerate8843(TAX_YEAR) && readStored(seasonKey('8843-generated', uid)) === true
  const treatyDone = readStored(seasonKey('treaty-reviewed', uid)) === true
  const score =
    (statusChecked ? 25 : 0) +
    (questionnaireDone ? 20 : 0) +
    checklistPoints +
    (formDone ? 15 : 0) +
    (treatyDone ? 10 : 0)
  return {
    score,
    tasks: [
      {
        id: 'status',
        label: 'Review your residency status',
        done: statusChecked,
        points: 25,
        link: '/status-checker',
      },
      {
        id: 'questionnaire',
        label: 'Complete the tax questionnaire',
        done: questionnaireDone,
        points: 20,
        link: '/questionnaire',
      },
      {
        id: 'checklist',
        label: values.length
          ? `Gather your documents (${checked} of ${values.length})`
          : 'Gather your documents',
        done: values.length > 0 && checked === values.length,
        points: 30 - checklistPoints,
        link: '/checklist',
      },
      {
        id: 'form8843',
        label: canGenerate8843(TAX_YEAR)
          ? 'Prepare Form 8843, if required'
          : 'Prepare Form 8843 · final IRS form pending',
        done: formDone,
        points: 15,
        link: '/form-8843',
      },
      {
        id: 'treaty',
        label: 'Review treaty guidance for your country',
        done: treatyDone,
        points: 10,
        link: '/questionnaire',
      },
    ],
  }
}
export function scoreColor(score) {
  if (score >= 90) return '#22c55e'
  if (score >= 70) return '#3b82f6'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}
