const CACHE = 'scf-v254';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './runtime.js',
  './storage.js',
  './print-agent.js',
  './helpers.js',
  './defaults.js',
  './auth.js',
  './server-auth.js',
  './templates.js',
  './ui-common.js',
  './catalogs.js',
  './production-shifts.js',
  './organization.js',
  './notifications.js',
  './user-guide.js',
  './operations.js',
  './navigation-reports.js',
  './order-detail.js',
  './delivery-shifts.js',
  './import-tools.js',
  './auth-workforce.js',
  './quotations.js',
  './finance.js',
  './delivery-orders.js',
  './trips.js',
  './production.js',
  './permissions.js',
  './app.js',
  './bootstrap.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Chỉ cache tài nguyên tĩnh cùng origin. Không cache API, Supabase hay CDN.
  if (url.origin !== self.location.origin) return;
  const isStaticAsset = ASSETS.some(asset => {
    const assetUrl = new URL(asset, self.location.href);
    return assetUrl.pathname === url.pathname;
  });
  if (!isStaticAsset) return;
  // Network first - luôn lấy bản mới nhất
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
