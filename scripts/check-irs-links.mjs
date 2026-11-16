#!/usr/bin/env node
// Lists every irs.gov address the app, the chat prompt and the chat test set rely on, and (with
// --online) checks that each still opens. The IRS reorganises its site: in 2026 the treaty
// directory moved and the old address became a 404, which silently broke every link to it.
// Run `node scripts/check-irs-links.mjs --online` from a machine that can reach irs.gov before
// each filing season and after any change to a link. The tests run the offline part.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const FOLDERS = ['src', 'lib', 'qa', 'api']
const FULL = /https:\/\/www\.irs\.gov\/[A-Za-z0-9_./#%-]+/g
const TEMPLATE = /\$\{IRS\}(\/[A-Za-z0-9_./#%-]+)/g

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      if (name !== 'results' && name !== 'node_modules') yield* files(path)
    } else if (/\.(jsx?|mjs)$/.test(name)) yield path
  }
}

// Returns a sorted list of unique https://www.irs.gov/... addresses found in the code.
export function collectIrsUrls(root = ROOT) {
  const found = new Set()
  for (const folder of FOLDERS) {
    for (const file of files(join(root, folder))) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(FULL)) found.add(m[0].replace(/[.,;:]+$/, ''))
      for (const m of text.matchAll(TEMPLATE)) found.add(`https://www.irs.gov${m[1]}`.replace(/[.,;:]+$/, ''))
    }
  }
  return [...found].sort()
}

// Addresses the IRS retired, found by running this check in November 2026.
export const KNOWN_DEAD = Object.freeze([
  'https://www.irs.gov/individuals/international-taxpayers/united-states-income-tax-treaties-a-to-z',
  'https://www.irs.gov/individuals/international-taxpayers/state-and-local-taxes',
  'https://www.irs.gov/individuals/international-taxpayers/green-card-test',
  'https://www.irs.gov/individuals/international-taxpayers/exempt-individual-who-is-a-teacher-or-trainee',
  'https://www.irs.gov/individuals/international-taxpayers/scholarships-and-fellowship-grants',
  'https://www.irs.gov/forms-pubs/about-form-8316',
])

async function check(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (link check)' }, redirect: 'follow' })
  const html = (response.headers.get('content-type') || '').includes('html') ? await response.text() : ''
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() || ''
  return { ok: response.status === 200 && !/^404/.test(title), status: response.status, title }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const urls = collectIrsUrls()
  if (!process.argv.includes('--online')) {
    console.log(urls.join('\n'))
    console.log(`\n${urls.length} addresses. Add --online to check that each one opens.`)
  } else {
    let bad = 0
    for (const url of urls) {
      const result = await check(url).catch((e) => ({ ok: false, status: 0, title: String(e.message) }))
      if (!result.ok) bad += 1
      console.log(`${result.ok ? 'ok  ' : 'FAIL'} ${result.status} ${url}${result.ok ? '' : `  ${result.title}`}`)
    }
    console.log(`\n${urls.length - bad} of ${urls.length} open.`)
    process.exit(bad ? 1 : 0)
  }
}
