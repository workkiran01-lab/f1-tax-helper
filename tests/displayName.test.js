// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { displayNameFor, markProfileSynced, universityFor } from '../src/utils/displayName.js'
import { clearUserStorage } from '../src/utils/storage.js'

const user = (metadata = {}) => ({ id: 'u1', email: 'ada@example.test', user_metadata: metadata })

describe('the name and school shown for a student', () => {
  beforeEach(() => localStorage.clear())

  it('prefers the account, then this browser, then Google details, then the email', () => {
    expect(displayNameFor(user({ display_name: 'Ada', full_name: 'Ada G' }))).toBe('Ada')
    localStorage.setItem('display_name_u1', JSON.stringify('Local Ada'))
    expect(displayNameFor(user({ display_name: 'Account Ada' }))).toBe('Account Ada')
    expect(displayNameFor(user({ full_name: 'Google Ada' }))).toBe('Local Ada')
    localStorage.clear()
    expect(displayNameFor(user({ full_name: 'Google Ada' }))).toBe('Google Ada')
    expect(displayNameFor(user())).toBe('ada')
  })

  it('shows what was saved in this browser while the account is out of date, until a save succeeds', () => {
    localStorage.setItem('display_name_u1', JSON.stringify('New Name'))
    localStorage.setItem('university_u1', JSON.stringify('New School'))
    const stale = user({ display_name: 'Old Name', university: 'Old School' })
    markProfileSynced('u1', false)
    expect(displayNameFor(stale)).toBe('New Name')
    expect(universityFor(stale)).toBe('New School')
    markProfileSynced('u1', true)
    expect(displayNameFor(stale)).toBe('Old Name')
    expect(universityFor(stale)).toBe('Old School')
  })

  it('does not let an unsynced marker hide the account when nothing is saved in this browser', () => {
    markProfileSynced('u1', false)
    expect(displayNameFor(user({ display_name: 'Account Ada' }))).toBe('Account Ada')
  })

  it('clears the marker with the rest of a student’s data', () => {
    markProfileSynced('u1', false)
    clearUserStorage('u1')
    expect(localStorage.getItem('profile_pending_u1')).toBeNull()
  })
})
