const CACHE = 'scf-v485';
const ASSETS = [
  './',
  './index.html',
  './vendor/tabler-icons.min.css?v=394',
  './vendor/fonts/tabler-icons.woff2?v3.2.0',
  './vendor/supabase.min.js?v=358',
  './vendor/react.production.min.js?v=358',
  './vendor/react-dom.production.min.js?v=358',
  './styles.css?v=485',
  './runtime.js?v=457',
  './storage.js?v=476',
  './print-agent.js',
  './helpers.js?v=473',
  './defaults.js?v=218',
  './auth.js',
  './server-auth.js?v=464',
  './templates.js',
  './ui-common.js?v=460',
  './invoice-orientation.js?v=457',
  './invoice-orientation-store.js?v=460',
  './asset-documents.js?v=475',
  './catalogs.js?v=478',
  './production-shifts.js?v=469',
  './organization.js?v=424',
  './notifications.js?v=475',
  './user-guide.js?v=424',
  './operations.js?v=465',
  './navigation-reports.js?v=463',
  './order-detail.js?v=424',
  './delivery-shifts.js?v=455',
  './auth-workforce.js?v=448',
  './quotations.js',
  './finance.js?v=347',
  './delivery-orders.js?v=473',
  './qrcode.min.js?v=357',
  './import-tools.js?v=480',
  './trips.js?v=485',
  './production.js?v=448',
  './permissions.js?v=452',
  './permission-settings.js?v=452',
  './app.js?v=485',
  './bootstrap.js?v=448',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

// Chỉ lưu sẵn phần vỏ nhẹ. Các file nghiệp vụ sẽ được cache khi trình duyệt
// thật sự cần tới; tránh tải lặp toàn bộ ứng dụng và ba bản font ngay lần mở đầu.
const PRECACHE_ASSETS = [
  './index.html',
  './styles.css?v=485',
  './vendor/tabler-icons.min.css?v=394'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
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
