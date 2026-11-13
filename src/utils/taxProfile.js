import { TAX_YEAR, filingDeadline } from '../data/taxSeason.js'
import { currentQuestionnaire, readStored, seasonKey } from './storage.js'

// One answer to "what is my tax status?" for the whole app.
//
// The quick status check and the questionnaire are separate screens that save
// separate results. Every page used to pick between them on its own (and the
// chat ignored the status check entirely), so two screens could disagree. This
// is the only place that decides: the most recently completed one wins. It
// reads their saved results as they are and does not change any tax rule.
export function currentTaxProfile(user) {
  const uid = user?.id || 'guest'
  const questionnaire = currentQuestionnaire(user)
  const stored = readStored(seasonKey('status', uid))
  const status = stored?.taxYear === TAX_YEAR && stored.badge ? stored : null
  if (!questionnaire && !status) return null

  const useQuestionnaire =
    Boolean(questionnaire) &&
    (!status || String(questionnaire.completedAt) >= String(status.checkedAt))

  if (useQuestionnaire) {
    const { answers } = questionnaire
    const needsReview = answers.residencyStatus !== 'Likely Nonresident Alien'
    const hasW2 = Boolean(answers.incomeTypes?.includes('w2'))
    return {
      source: 'questionnaire',
      label: needsReview ? 'Residency review needed' : 'Likely nonresident alien',
      needsReview,
      hasIncome: answers.hasUSIncome === true,
      hasW2,
      hasScholarship: Boolean(answers.incomeTypes?.includes('1042s')),
      deadline: needsReview ? null : filingDeadline(hasW2),
      updatedAt: questionnaire.completedAt || null,
      answers,
      actionItems: questionnaire.actionItems,
      hasTreatyBenefit: Boolean(questionnaire.hasTreatyBenefit),
      message: null,
    }
  }
  const needsReview = status.badge !== 'nra'
  return {
    source: 'status-check',
    label: needsReview ? 'Residency review needed' : 'Likely nonresident alien',
    needsReview,
    hasIncome: status.hasIncome === true,
    hasW2: status.hasW2 === true,
    hasScholarship: status.hasScholarship === true,
    deadline: needsReview ? null : filingDeadline(status.hasW2 === true),
    updatedAt: status.checkedAt || null,
    answers: null,
    actionItems: [],
    hasTreatyBenefit: false,
    message: typeof status.message === 'string' ? status.message : null,
  }
}

// What the AI assistant is told about the student. Built from the same profile
// the rest of the app shows, so the chat can no longer contradict My Taxes.
export function chatContextFor(profile) {
  if (!profile) return null
  if (profile.source === 'questionnaire')
    return { answers: profile.answers, actionItems: profile.actionItems }
  return {
    answers: {
      country: null,
      residencyStatus: profile.needsReview ? 'Residency review needed' : 'Likely Nonresident Alien',
      hasUSIncome: profile.hasIncome,
    },
    actionItems: [profile.message].filter(Boolean),
  }
}
