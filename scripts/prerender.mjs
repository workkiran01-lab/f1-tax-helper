#!/usr/bin/env node
// Writes static HTML for the public information pages after `vite build`:
//   dist/index.html (the landing page), dist/tax-guide.html, dist/faq.html, dist/tax-treaties.html,
//   and dist/app-shell.html (the empty page every other route starts from)
// It takes the built index.html (scripts and styles already linked), puts the server-rendered
// page into #root and sets that page's title, description, social tags and canonical address.
// vercel.json rewrites each address to its file. Any failure exits non-zero so the build fails
// instead of deploying rewrites to files that do not exist.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT_EMPTY = '<div id="root"></div>'

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function setTag(html, pattern, tag) {
  if (!pattern.test(html)) throw new Error(`index.html has no tag matching ${pattern}`)
  return html.replace(pattern, tag)
}

// Pure: the built index.html with one page's markup and head details in it.
export function injectPage(template, { html, title, description, url }) {
  if (!template.includes(ROOT_EMPTY)) throw new Error('index.html has no empty #root to fill')
  if (/rel="canonical"/.test(template)) throw new Error('index.html already has a canonical link')
  const t = escapeHtml(title)
  const d = escapeHtml(description)
  const u = escapeHtml(url)
  let out = template
  out = setTag(out, /<title>[^<]*<\/title>/, `<title>${t}</title>`)
  out = setTag(out, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${d}" />`)
  out = setTag(out, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${t}" />`)
  out = setTag(out, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${d}" />`)
  out = setTag(out, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${t}" />`)
  out = setTag(out, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${d}" />`)
  out = out.replace('</head>', `  <link rel="canonical" href="${u}" />\n    <meta property="og:url" content="${u}" />\n  </head>`)
  // Tells the stylesheet not to replay the page's fade-in when the app takes over (index.css).
  if (!out.includes('<html lang="en">')) throw new Error('index.html has no <html lang="en"> tag to mark')
  out = out.replace('<html lang="en">', '<html lang="en" data-prerendered>')
  return out.replace(ROOT_EMPTY, `<div id="root">${html}</div>`)
}

export function checkPage(path, page) {
  if (!/<h1[\s>]/.test(page)) throw new Error(`${path}: no <h1> in the rendered page`)
  if (/<div id="root"><\/div>/.test(page)) throw new Error(`${path}: #root is empty`)
  if (/opacity:\s*0[;"]/.test(page)) throw new Error(`${path}: rendered with opacity 0, so the text would be invisible`)
}

async function main() {
  const outDir = resolve(process.argv[2] || 'dist')
  const serverDir = resolve('.prerender')
  try {
    // The empty page from `vite build`. Every page below is built from it, and it is kept as
    // the shell for all other routes, because index.html becomes the landing page.
    const template = readFileSync(join(outDir, 'index.html'), 'utf8')
    const entry = join(serverDir, 'prerender.js')
    if (!existsSync(entry)) throw new Error(`missing ${entry}; run vite build --ssr src/prerender.jsx first`)
    const { render, PRERENDERED_ROUTES, APP_SHELL_FILE, prerenderedFile } = await import(pathToFileURL(entry).href)
    if (!template.includes(ROOT_EMPTY)) throw new Error('index.html has no empty #root; was it already pre-rendered?')
    const pages = PRERENDERED_ROUTES.map((path) => {
      const page = injectPage(template, render(path))
      checkPage(path, page)
      return [path, prerenderedFile(path), page]
    })
    // Nothing is written until every page rendered, and the shell goes first.
    writeFileSync(join(outDir, APP_SHELL_FILE), template)
    console.log(`app shell -> ${APP_SHELL_FILE}`)
    for (const [path, file, page] of pages) {
      writeFileSync(join(outDir, file), page)
      console.log(`pre-rendered ${path} -> ${file} (${page.length} bytes)`)
    }
  } finally {
    rmSync(serverDir, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Pre-render failed: ${error.message}`)
    process.exit(1)
  })
}
