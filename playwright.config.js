import { defineConfig, devices } from '@playwright/test'
import { ANON_KEY, SUPABASE_URL } from './e2e/supabaseMock.js'

// Two builds of the app are tested against `vite preview`; neither talks to a real service.
//
// 1. Guest tests (smoke.spec.js, port 4173): built without Supabase settings, so the app runs
//    in guest mode. The AI endpoint is mocked inside the specs.
// 2. Signed-in tests (signed-in.spec.js, port 4174): built with a fake Supabase address and
//    key, and opened under the production hostname so the anonymous usage counter is active.
//    Chromium maps that hostname to this machine, so nothing reaches the real site, and every
//    request to the fake Supabase address is answered by e2e/supabaseMock.js.
const SIGNED_IN_HOST = 'www.f1taxhelper.com'
const SIGNED_IN_PORT = 4174

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', testIgnore: /signed-in/, use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', testIgnore: /signed-in/, use: { ...devices['Pixel 7'] } },
    ...[
      ['signed-in desktop', devices['Desktop Chrome']],
      ['signed-in phone', devices['Pixel 7']],
    ].map(([name, device]) => ({
      name,
      testMatch: /signed-in\.spec/,
      use: {
        ...device,
        channel: 'chromium',
        // A service worker would answer some requests without the mock seeing them.
        serviceWorkers: 'block',
        baseURL: `http://${SIGNED_IN_HOST}:${SIGNED_IN_PORT}`,
        launchOptions: {
          args: [
            `--host-resolver-rules=MAP ${SIGNED_IN_HOST} 127.0.0.1`,
            // The real site is https. Plain http on this hostname would not be a secure context,
            // and the Form 8843 template check needs crypto.subtle.
            `--unsafely-treat-insecure-origin-as-secure=http://${SIGNED_IN_HOST}:${SIGNED_IN_PORT}`,
          ],
        },
      },
    })),
  ],
  webServer: [
    {
      command: 'npm run build && npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: `npx vite build --outDir dist-signed-in && npx vite preview --outDir dist-signed-in --port ${SIGNED_IN_PORT} --strictPort`,
      env: { VITE_SUPABASE_URL: SUPABASE_URL, VITE_SUPABASE_ANON_KEY: ANON_KEY },
      url: `http://localhost:${SIGNED_IN_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
})
