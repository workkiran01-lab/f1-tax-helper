import { TAX_YEAR } from '../data/taxSeason.js'

export const seasonKey = (name, uid = 'guest', year = TAX_YEAR) =>
  `f1:${year}:${uid || 'guest'}:${name}`
export function readStored(key, fallback = null, type = 'localStorage') {
  try {
    const raw = globalThis[type]?.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}
export function writeStored(key, value, type = 'localStorage') {
  try {
    globalThis[type].setItem(key, JSON.stringify(value))
    globalThis.dispatchEvent?.(new Event('f1-storage-change'))
    return true
  } catch {
    return false
  }
}
export function removeStored(key, type = 'localStorage') {
  try {
    globalThis[type]?.removeItem(key)
  } catch {
    /* Browser storage can be disabled. */
  }
}
export function currentQuestionnaire(user) {
  const local = readStored(seasonKey('questionnaire', user?.id))
  const remote = user?.user_metadata?.questionnaire
  const valid = (v) => v?.taxYear === TAX_YEAR && v.answers && Array.isArray(v.actionItems)
  const candidates = [local, remote].filter(valid)
  return (
    candidates.sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))[0] || null
  )
}
export function clearUserStorage(uid = 'guest') {
  for (const type of ['localStorage', 'sessionStorage']) {
    try {
      const storage = globalThis[type]
      const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i))
      for (const key of keys) {
        if (
          (/^f1:\d{4}:/.test(key) && key.split(':')[2] === uid) ||
          [
            'f1_form8843_v3',
            'f1_user_name',
            'f1_status_result',
            'f1-questionnaire-progress',
            'f1_8843_generated',
            'f1_treaty_checked',
          ].includes(key) ||
          [
            'f1_checklist_state_',
            'f1-tax-helper-checklist_',
            'f1-conversations_',
            'display_name_',
            'university_',
          ].some((prefix) => key === prefix + uid)
        ) {
          storage.removeItem(key)
        }
      }
    } catch {
      /* Signing out must still work with blocked storage. */
    }
  }
}
