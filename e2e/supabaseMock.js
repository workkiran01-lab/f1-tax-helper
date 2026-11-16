// A stand-in for the Supabase endpoints the app calls, for the signed-in browser tests. The
// build under test points at SUPABASE_URL, a host that does not exist, and every request to it
// is answered here: no real project, account or key is involved.
export const SUPABASE_URL = 'https://e2e-test.supabase.co'
export const ANON_KEY = 'e2e-anon-key'
// supabase-js keeps the session under sb-<first label of the project host>-auth-token.
export const SESSION_STORAGE_KEY = 'sb-e2e-test-auth-token'
export const USER_ID = '11111111-1111-4111-8111-111111111111'
export const USER_EMAIL = 'e2e.student@example.test'

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

export function fakeAccessToken(expiresInSeconds = 3600) {
  const now = Math.floor(Date.now() / 1000)
  return [
    b64({ alg: 'HS256', typ: 'JWT' }),
    b64({
      sub: USER_ID,
      email: USER_EMAIL,
      aud: 'authenticated',
      role: 'authenticated',
      iat: now,
      exp: now + expiresInSeconds,
    }),
    'e2e-signature',
  ].join('.')
}

// `fail` makes individual calls fail so the app's error paths can be exercised:
// { updateUser: 500, deleteUser: 500, logout: 500 }.
export async function mockSupabase(page, { fail = {}, metadata = {} } = {}) {
  const state = {
    user: {
      id: USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: USER_EMAIL,
      email_confirmed_at: '2026-01-01T00:00:00Z',
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: { ...metadata },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    deleted: false,
    fail: { ...fail },
    unmocked: [],
    // Every request the app made to Supabase, with its parsed JSON body (if any).
    requests: [],
  }
  const calls = (match) => state.requests.filter((r) => match(r))
  const api = {
    state,
    userUpdates: () => calls((r) => r.method === 'PUT' && r.path === '/auth/v1/user'),
    counts: () => calls((r) => r.path === '/rest/v1/rpc/count_event'),
    countNames: () => api.counts().map((r) => r.body?.p_event),
    deleteCalls: () => calls((r) => r.path === '/rest/v1/rpc/delete_user'),
    logouts: () => calls((r) => r.path === '/auth/v1/logout'),
    authorizations: () => calls((r) => r.path === '/auth/v1/authorize'),
    // Requests no route above answers. The app must not call an endpoint the tests do not know.
    unmocked: () => state.unmocked,
  }

  await page.route(`${SUPABASE_URL}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const cors = {
      'access-control-allow-origin': request.headers().origin || '*',
      'access-control-allow-headers':
        request.headers()['access-control-request-headers'] || '*',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    }
    const json = (status, body) =>
      route.fulfill({
        status,
        headers: { ...cors, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })

    let body = null
    try {
      body = request.postDataJSON()
    } catch {
      body = null
    }
    state.requests.push({
      method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: request.headers(),
      body,
    })

    if (url.pathname === '/auth/v1/authorize') {
      // Google sign-in: send the browser straight back to the app with a session.
      const back = new URL(url.searchParams.get('redirect_to'))
      back.hash = new URLSearchParams({
        access_token: fakeAccessToken(),
        refresh_token: 'e2e-refresh-token',
        expires_in: '3600',
        token_type: 'bearer',
      }).toString()
      return route.fulfill({ status: 302, headers: { ...cors, location: back.toString() } })
    }
    if (url.pathname === '/auth/v1/user') {
      if (state.deleted) return json(401, { code: 401, msg: 'invalid claim: missing sub claim' })
      if (method === 'PUT') {
        if (state.fail.updateUser) return json(state.fail.updateUser, { code: state.fail.updateUser, msg: 'failed' })
        state.user = {
          ...state.user,
          user_metadata: { ...state.user.user_metadata, ...(body?.data || {}) },
        }
      }
      return json(200, state.user)
    }
    if (url.pathname === '/auth/v1/token') {
      return json(200, {
        access_token: fakeAccessToken(),
        refresh_token: 'e2e-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: state.user,
      })
    }
    if (url.pathname === '/auth/v1/logout') {
      if (state.fail.logout) return json(state.fail.logout, { code: state.fail.logout, msg: 'failed' })
      // A deleted user's token is no longer valid; supabase-js treats that as already signed out.
      if (state.deleted) return json(401, { code: 401, msg: 'invalid JWT' })
      return route.fulfill({ status: 204, headers: cors })
    }
    if (url.pathname === '/rest/v1/rpc/count_event') return route.fulfill({ status: 204, headers: cors })
    if (url.pathname === '/rest/v1/rpc/delete_user') {
      if (state.fail.deleteUser) return json(state.fail.deleteUser, { message: 'delete failed' })
      state.deleted = true
      return route.fulfill({ status: 204, headers: cors })
    }
    state.unmocked.push(`${method} ${url.pathname}`)
    return json(404, { message: `unexpected request to ${url.pathname}` })
  })
  return api
}

// Starts the page already signed in, the way supabase-js leaves it after a Google sign-in.
export async function seedSession(page, user) {
  const session = {
    access_token: fakeAccessToken(),
    refresh_token: 'e2e-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  }
  await page.addInitScript(
    ([key, value]) => {
      // Once per browser profile: after signing out, a reload must not sign the page back in.
      if (localStorage.getItem('e2e-seeded')) return
      localStorage.setItem('e2e-seeded', '1')
      localStorage.setItem(key, value)
    },
    [SESSION_STORAGE_KEY, JSON.stringify(session)],
  )
}
