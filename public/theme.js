// Applies the saved appearance before the app paints, so a light-mode user
// never sees a dark flash. Kept as a file because the site's Content Security
// Policy does not allow inline scripts. Keep in sync with src/hooks/useTheme.js.
;(function () {
  var choice = 'system'
  try {
    var saved = localStorage.getItem('f1_theme')
    if (saved === 'light' || saved === 'dark' || saved === 'system') choice = saved
  } catch (e) {}
  var light =
    choice === 'light' ||
    (choice === 'system' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches)
  document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark')
})()
