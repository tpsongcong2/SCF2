const CACHE = 'scf-v382';
const ASSETS = [
  './',
  './index.html',
  './vendor/tabler-icons.min.css?v=358',
  './vendor/fonts/tabler-icons.ttf?v3.2.0',
  './vendor/fonts/tabler-icons.woff',
  './vendor/fonts/tabler-icons.woff2?v3.2.0',
  './vendor/supabase.min.js?v=358',
  './vendor/react.production.min.js?v=358',
  './vendor/react-dom.production.min.js?v=358',
  './styles.css?v=382',
  './runtime.js?v=311',
  './storage.js?v=366',
  './print-agent.js',
  './helpers.js',
  './defaults.js',
  './auth.js',
  './server-auth.js?v=365',
  './templates.js',
  './ui-common.js',
  './catalogs.js?v=341',
  './production-shifts.js?v=348',
  './organization.js',
  './notifications.js',
  './user-guide.js',
  './operations.js?v=352',
  './navigation-reports.js?v=363',
  './order-detail.js?v=347',
  './delivery-shifts.js',
  './auth-workforce.js?v=343',
  './quotations.js',
  './finance.js?v=347',
  './delivery-orders.js?v=347',
  './qrcode.min.js?v=357',
  './import-tools.js?v=360',
  './trips.js?v=382',
  './production.js?v=341',
  './permissions.js?v=352',
  './permission-settings.js?v=352',
  './app.js?v=382',
  './bootstrap.js?v=382',
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
  // Network first - luôn lấy bản mới nhất. Giới hạn thời gian chờ để kết nối
  // chập chờn không giữ ứng dụng ở màn hình trắng vô thời hạn.
  e.respondWith(
    fetchWithTimeout(e.request, 8000)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(async error => {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        throw error;
      })
  );
});

function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(request, {signal: controller.signal})
    .finally(() => clearTimeout(timeoutId));
}
