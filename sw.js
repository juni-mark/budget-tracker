/* Service worker: caches the app so it opens offline and installs like an app.
   Bump VERSION every time you publish a new release so people receive the update. */
const VERSION = 'bt-v8';
const SHELL = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png',
  'css/tokens.css', 'css/base.css', 'css/components.css', 'css/screens.css', 'css/cat.css',
  'js/core/utils.js', 'js/core/config.js', 'js/core/store.js', 'js/core/backup.js', 'js/core/sync.js', 'js/core/sample-data.js',
  'js/components/charts.js', 'js/components/cat.js', 'js/components/tabs.js', 'js/components/pwa.js', 'js/components/a11y.js',
  'js/screens/log.js', 'js/screens/stats.js', 'js/screens/daily-sheet.js', 'js/screens/wrapped.js', 'js/screens/settings.js', 'js/screens/onboarding.js', 'js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function keep(req, res) {
  if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const host = new URL(req.url).hostname;      // never cache cloud API calls (only same-site files and Google Fonts)
  if (host !== location.hostname && !/fonts\.(googleapis|gstatic)\.com$/.test(host)) return;
  if (req.mode === 'navigate') {   // pages: network first so updates arrive, cache as the offline fallback
    e.respondWith(fetch(req).then(res => keep(req, res)).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => keep(req, res))));   // files and fonts: cache first
});
