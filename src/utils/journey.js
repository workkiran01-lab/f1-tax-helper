import { TAX_YEAR, canGenerate8843 } from '../data/taxSeason.js'
import { checklistItems } from '../data/checklistItems.js'
import { STEP_FIELDS, restore8843, validate8843 } from './form8843Model.js'
import { readStored, seasonKey } from './storage.js'
import { currentTaxProfile } from './taxProfile.js'

export const FORM_SECTIONS = STEP_FIELDS.length

// How many Form 8843 sections of the in-progress draft are complete. The draft
// holds passport details, so it lives only in this tab's session storage; a new
// tab honestly reports "not started" rather than promising data it cannot show.
export function draftSections(uid, year = TAX_YEAR) {
  const raw = readStored(seasonKey('8843-draft-v4', uid, year), null, 'sessionStorage')
  if (!raw || typeof raw !== 'object') return 0
  const draft = restore8843(raw, year)
  return STEP_FIELDS.filter((_, step) => Object.keys(validate8843(draft, step)).length === 0).length
}

export function checklistProgress(uid, profile) {
  if (!profile) return { done: 0, total: 0 }
  const { ids } = checklistItems(profile)
  const saved = readStored(seasonKey('checklist', uid), {})
  const state = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
  return { done: ids.filter((id) => state[id] === true).length, total: ids.length }
}

// The four filing steps shown on Home, plus the single thing to do next.
// state: 'done' | 'current' | 'todo' | 'waiting' | 'locked'
export function computeJourney(user) {
  const uid = user?.id || 'guest'
  const profile = currentTaxProfile(user)
  const downloadable = canGenerate8843(TAX_YEAR)
  const generated = downloadable && readStored(seasonKey('8843-generated', uid)) === true
  const sections = draftSections(uid)
  const docs = checklistProgress(uid, profile)
  const filed = readStored(seasonKey('filed', uid)) === true
  const review = Boolean(profile?.needsReview)

  const status = {
    id: 'status',
    title: 'Check your tax status',
    detail: profile ? profile.label : '5 quick questions',
    to: profile ? '/taxes' : '/questionnaire',
    state: profile ? 'done' : 'todo',
    action: 'Check my tax status',
    about: 'Answer 5 quick questions so the app can show which forms and documents apply to you.',
  }

  const draftComplete = sections === FORM_SECTIONS
  const form = {
    id: 'form8843',
    title: 'Prepare Form 8843',
    to: '/form-8843',
    action: sections > 0 ? 'Continue Form 8843' : 'Start Form 8843',
    about:
      sections > 0
        ? `${FORM_SECTIONS - sections} of ${FORM_SECTIONS} sections left. Your draft stays in this browser tab.`
        : 'Every F-1 student who is a nonresident files this form, even with no income.',
  }
  if (!profile) Object.assign(form, { state: 'locked', detail: 'After your status check' })
  else if (review)
    Object.assign(form, {
      state: 'locked',
      detail: 'Only if your residency review confirms nonresident status',
    })
  else if (generated) Object.assign(form, { state: 'done', detail: `${TAX_YEAR} form downloaded` })
  else if (draftComplete && !downloadable)
    Object.assign(form, {
      state: 'waiting',
      detail: `Draft complete · download opens when the IRS ${TAX_YEAR} form is final`,
    })
  else
    Object.assign(form, {
      state: 'todo',
      detail:
        sections > 0
          ? `In progress · ${sections} of ${FORM_SECTIONS} sections`
          : downloadable
            ? 'Not started'
            : `Not started · you can draft now, download opens later`,
    })

  const documents = {
    id: 'documents',
    title: review ? 'Confirm your residency' : 'Gather your documents',
    detail: profile ? `${docs.done} of ${docs.total} items done` : 'After your status check',
    to: '/taxes#checklist',
    state: !profile ? 'locked' : docs.total > 0 && docs.done === docs.total ? 'done' : 'todo',
    action: review ? 'See what to review' : 'Open my checklist',
    about: review
      ? 'This app could not determine your tax residency. Your checklist starts with what to review before choosing any form.'
      : `${docs.total - docs.done} items left to collect before you file.`,
  }

  const file = {
    id: 'file',
    title: 'Print, sign and mail',
    to: '/taxes#filing',
    action: 'See how to file',
    about: 'Print, sign and date your form, then mail it or attach it to your tax return.',
  }
  if (filed) Object.assign(file, { state: 'done', detail: 'Marked as filed' })
  else if (generated) Object.assign(file, { state: 'todo', detail: 'Your form is ready to mail' })
  else
    Object.assign(file, {
      state: 'locked',
      detail: review
        ? 'After your residency review'
        : downloadable
          ? 'After you download Form 8843'
          : `Unlocks when the IRS releases the ${TAX_YEAR} form`,
    })

  const steps = [status, form, documents, file]
  const next = steps.find((s) => s.state === 'todo') || null
  if (next) next.state = 'current'
  const done = steps.filter((s) => s.state === 'done').length
  return { profile, steps, next, done, total: steps.length, allDone: done === steps.length }
}
