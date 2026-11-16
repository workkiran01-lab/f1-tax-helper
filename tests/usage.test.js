import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createTracker, USAGE_EVENTS } from '../src/utils/usage.js'

const URL = 'https://example.supabase.co'
const KEY = 'public-anon-key'
const okFetch = () => vi.fn(async () => ({ ok: true }))
function memoryStorage() {
  const map = new Map()
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
}

describe('usage totals', () => {
  it('sends only the allowlisted event name, with no identifiers or content', async () => {
    const fetchImpl = okFetch()
    const track = createTracker({ url: URL, key: KEY, fetchImpl, nav: {} })
    expect(track('form8843_downloaded')).toBe(true)
    const [endpoint, init] = fetchImpl.mock.calls[0]
    expect(endpoint).toBe(`${URL}/rest/v1/rpc/count_event`)
    expect(JSON.parse(init.body)).toEqual({ p_event: 'form8843_downloaded' })
    expect(init.credentials).toBe('omit')
    expect(init.headers.apikey).toBe(KEY)
    expect(Object.keys(init.headers).sort()).toEqual(['Authorization', 'Content-Type', 'apikey'])
  })

  it('ignores unknown event names', () => {
    const fetchImpl = okFetch()
    const track = createTracker({ url: URL, key: KEY, fetchImpl, nav: {} })
    expect(track('typed_something')).toBe(false)
    expect(track('')).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('does nothing without Supabase configured', () => {
    const fetchImpl = okFetch()
    expect(createTracker({ fetchImpl, nav: {} })('visit')).toBe(false)
    expect(createTracker({ url: URL, fetchImpl, nav: {} })('visit')).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('respects Do Not Track and Global Privacy Control', () => {
    const fetchImpl = okFetch()
    expect(createTracker({ url: URL, key: KEY, fetchImpl, nav: { doNotTrack: '1' } })('visit')).toBe(
      false,
    )
    expect(
      createTracker({ url: URL, key: KEY, fetchImpl, nav: { globalPrivacyControl: true } })('visit'),
    ).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('sends a once-per-session event once, even across page loads in the same tab', () => {
    const fetchImpl = okFetch()
    const storage = memoryStorage()
    const first = createTracker({ url: URL, key: KEY, fetchImpl, nav: {}, storage })
    expect(first('visit', { once: true })).toBe(true)
    expect(first('visit', { once: true })).toBe(false)
    const reloaded = createTracker({ url: URL, key: KEY, fetchImpl, nav: {}, storage })
    expect(reloaded('visit', { once: true })).toBe(false)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    // Events without `once` are counted every time.
    expect(first('chat_message')).toBe(true)
    expect(first('chat_message')).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('still limits repeats within a page load when storage is blocked', () => {
    const fetchImpl = okFetch()
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const track = createTracker({ url: URL, key: KEY, fetchImpl, nav: {}, storage: blocked })
    expect(track('form8843_started', { once: true })).toBe(true)
    expect(track('form8843_started', { once: true })).toBe(false)
  })

  it('never throws or rejects when the network fails', async () => {
    const failing = vi.fn(() => Promise.reject(new Error('offline')))
    const throwing = vi.fn(() => {
      throw new Error('boom')
    })
    expect(() => createTracker({ url: URL, key: KEY, fetchImpl: failing, nav: {} })('visit')).not.toThrow()
    expect(createTracker({ url: URL, key: KEY, fetchImpl: throwing, nav: {} })('visit')).toBe(false)
    await Promise.resolve()
  })
})

describe('usage migration and policy', () => {
  const sql = readFileSync('supabase/migrations/202611150003_usage_counts.sql', 'utf8')
  it('allowlists exactly the events the client can send', () => {
    const body = /p_event not in \(([^)]*)\)/.exec(sql)[1]
    const allowed = [...body.matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1])
    expect(allowed.sort()).toEqual([...USAGE_EVENTS].sort())
  })
  it('stores only counts, cannot be read publicly and caps each event', () => {
    expect(sql).toMatch(/alter table public\.usage_counts enable row level security/)
    expect(sql).not.toMatch(/create policy/i)
    expect(sql).not.toMatch(/grant (select|insert|update|delete)/i)
    expect(sql).toMatch(/security definer/)
    expect(sql).toMatch(/set search_path = ''/)
    expect(sql).toMatch(/u\.n < 1000000/)
    expect(sql).toMatch(/grant execute on function public\.count_event\(text\) to anon, authenticated/)
    expect(sql).not.toMatch(/\b(ip|user_id|session|email)\b/i)
  })
  it('is described in the privacy policy with the opt-out signals', () => {
    const page = readFileSync('src/pages/PrivacyPage.jsx', 'utf8')
    expect(page).toMatch(/Usage totals: five anonymous daily counts/)
    expect(page).toMatch(/Do Not Track or Global Privacy Control/)
    expect(page).not.toMatch(/pages visited and features used/)
  })
})
