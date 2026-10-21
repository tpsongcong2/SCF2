const CACHE = 'scf-v601';
const ASSETS = [
  './',
  './index.html',
  './vendor/tabler-icons.min.css?v=394',
  './vendor/fonts/tabler-icons.woff2?v3.2.0',
  './vendor/supabase.min.js?v=358',
  './vendor/react.production.min.js?v=358',
  './vendor/react-dom.production.min.js?v=358',
  './styles.css?v=601',
  './runtime.js?v=457',
  './storage.js?v=585',
  './print-agent.js',
  './helpers.js?v=473',
  './defaults.js?v=218',
  './auth.js',
  './server-auth.js?v=577',
  './templates.js',
  './ui-common.js?v=569',
  './invoice-orientation.js?v=457',
  './invoice-orientation-store.js?v=460',
  './asset-documents.js?v=475',
  './catalogs.js?v=568',
  './production-shifts.js?v=592',
  './organization.js?v=568',
  './notifications.js?v=475',
  './user-guide.js?v=424',
  './attp-documents.js?v=547',
  './operations.js?v=591',
  './navigation-reports.js?v=572',
  './order-detail.js?v=576',
  './delivery-shifts.js?v=455',
  './auth-workforce.js?v=551',
  './quotations.js',
  './finance.js?v=347',
  './delivery-orders.js?v=600',
  './qrcode.min.js?v=357',
  './import-tools.js?v=592',
  './trips.js?v=579',
  './delivery-excel.js?v=557',
  './vendor/exceljs-4.4.0.min.js',
  './production-closing-domain.js?v=593',
  './production-closing.js?v=593',
  './production.js?v=593',
  './production-recipes.js?v=590',
  './production-assignments.js?v=537',
  './permissions.js?v=594',
  './permission-settings.js?v=592',
  './app.js?v=601',
  './bootstrap.js?v=601',
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
  './styles.css?v=601',
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
        // GitHub Pages có thể trả trang lỗi HTML cho đường dẫn JavaScript.
        // Chỉ lưu tài nguyên hợp lệ; dùng bản tốt trong cache khi mạng trả lỗi.
        if (!scfValidStaticResponse(res, url)) throw new Error('Invalid static asset: ' + url.pathname);
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return res;
      })
      .catch(async error => {
        const cached = await caches.match(e.request);
        if (cached && scfValidStaticResponse(cached, url)) return cached;
        throw error;
      })
  );
});

function scfValidStaticResponse(response, url) {
  if (!response || !response.ok) return false;
  const type = (response.headers.get('content-type') || '').toLowerCase();
  if (url.pathname.endsWith('.js')) return /(?:javascript|ecmascript)/.test(type);
  if (url.pathname.endsWith('.css')) return type.includes('text/css');
  return true;
}

function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(request, {signal: controller.signal})
    .finally(() => clearTimeout(timeoutId));
}
