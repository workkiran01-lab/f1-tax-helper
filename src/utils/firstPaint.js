// Entry animations start from a hidden state (opacity 0). Two renders must not use that state:
//   - the build-time server render (src/prerender.jsx), or the static HTML would hide its text;
//   - the browser's first render on top of that static HTML, or text the reader can already
//     see would vanish and fade back in.
// Components read `skipEntryAnimation()` once, when they mount. After the app's first commit
// (`endFirstPaint`, called from App) everything animates as usual, including later navigation.
let skip = typeof document === 'undefined'

// Called by src/main.jsx before the first render when #root arrived with pre-rendered content.
export function startOverPrerenderedHtml() {
  skip = true
}
export function endFirstPaint() {
  if (typeof document !== 'undefined') skip = false
}
export function skipEntryAnimation() {
  return skip
}
