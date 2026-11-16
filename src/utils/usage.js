// Anonymous usage totals. Each call adds 1 to a daily counter for one allowlisted event name
// in Supabase (public.count_event). Nothing else is sent: no account, address, device or
// session identifier, no form content, no message text. Skipped when the browser sends Do Not
// Track or Global Privacy Control, and when Supabase is not configured.
// The Supabase key is public, so anyone can also call the counter: report these totals as
// approximate and never use them for anything that matters beyond trends.
export const USAGE_EVENTS = Object.freeze([
  'visit',
  'status_check_done',
  'form8843_started',
  'form8843_downloaded',
  'chat_message',
])

export function createTracker({
  url,
  key,
  fetchImpl = globalThis.fetch,
  nav = globalThis.navigator,
  storage,
} = {}) {
  const seen = new Set()
  function optedOut() {
    return nav?.doNotTrack === '1' || nav?.globalPrivacyControl === true
  }
  function alreadySent(name) {
    if (seen.has(name)) return true
    seen.add(name)
    try {
      const flag = `usage-sent:${name}`
      if (storage?.getItem(flag)) return true
      storage?.setItem(flag, '1')
    } catch {
      // Storage can be blocked; the in-memory set still stops repeats within this page load.
    }
    return false
  }
  // `once` sends the event at most once per browser tab session.
  return function track(name, { once = false } = {}) {
    if (!url || !key || typeof fetchImpl !== 'function') return false
    if (!USAGE_EVENTS.includes(name) || optedOut()) return false
    if (once && alreadySent(name)) return false
    try {
      Promise.resolve(
        fetchImpl(`${url}/rest/v1/rpc/count_event`, {
          method: 'POST',
          keepalive: true,
          credentials: 'omit',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ p_event: name }),
        }),
      ).catch(() => {})
    } catch {
      return false
    }
    return true
  }
}

let defaultTracker
export function trackEvent(name, options) {
  if (!defaultTracker) {
    let storage
    try {
      storage = globalThis.sessionStorage
    } catch {
      storage = undefined
    }
    defaultTracker = createTracker({
      url: import.meta.env.VITE_SUPABASE_URL,
      key: import.meta.env.VITE_SUPABASE_ANON_KEY,
      storage,
    })
  }
  return defaultTracker(name, options)
}
