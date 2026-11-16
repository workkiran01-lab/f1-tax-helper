import { readStored, removeStored, writeStored } from './storage.js'

// The name the student entered at onboarding wins; guests have no account
// metadata, so theirs lives in browser storage.
//
// When saving to the account fails, the new values stay in this browser and the profile is
// marked unsynced. Until a later save succeeds the browser's values win, otherwise a reload
// would show the older name from the account right after "Saved in this browser".
const pendingKey = (id) => `profile_pending_${id}`
const isUnsynced = (id) => readStored(pendingKey(id), false) === true
export function markProfileSynced(id, synced) {
  if (synced) removeStored(pendingKey(id))
  else writeStored(pendingKey(id), true)
}

export function displayNameFor(user) {
  const metadata = user?.user_metadata || {}
  const id = user?.id || 'guest'
  const local = readStored(`display_name_${id}`, '')
  if (local && isUnsynced(id)) return local
  return (
    metadata.display_name ||
    local ||
    metadata.full_name ||
    metadata.name ||
    user?.email?.split('@')?.[0] ||
    ''
  )
}
export function universityFor(user) {
  const id = user?.id || 'guest'
  const local = readStored(`university_${id}`, '')
  if (local && isUnsynced(id)) return local
  return user?.user_metadata?.university || local || ''
}
export const firstName = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)[0] || ''
export const initialOf = (name) => (String(name || '').trim()[0] || 'S').toUpperCase()
