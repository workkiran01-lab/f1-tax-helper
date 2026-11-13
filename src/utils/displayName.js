import { readStored } from './storage.js'

// The name the student entered at onboarding wins; guests have no account
// metadata, so theirs lives in browser storage.
export function displayNameFor(user) {
  const metadata = user?.user_metadata || {}
  return (
    metadata.display_name ||
    readStored(`display_name_${user?.id || 'guest'}`, '') ||
    metadata.full_name ||
    metadata.name ||
    user?.email?.split('@')?.[0] ||
    ''
  )
}
export function universityFor(user) {
  return (
    user?.user_metadata?.university || readStored(`university_${user?.id || 'guest'}`, '') || ''
  )
}
export const firstName = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)[0] || ''
export const initialOf = (name) => (String(name || '').trim()[0] || 'S').toUpperCase()
