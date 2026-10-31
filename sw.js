const CACHE = 'scf-v749';
const ASSETS = [
  './',
  './index.html',
  './vendor/tabler-icons.min.css?v=394',
  './vendor/fonts/tabler-icons.woff2?v3.2.0',
  './vendor/supabase.min.js?v=358',
  './vendor/react.production.min.js?v=358',
  './vendor/react-dom.production.min.js?v=358',
  './styles.css?v=748',
  './runtime.js?v=457',
  './storage.js?v=719',
  './print-agent.js?v=718',
  './helpers.js?v=473',
  './warehouse-orders.js?v=711',
  './defaults.js?v=602',
  './auth.js',
  './server-auth.js?v=719',
  './templates.js?v=644',
  './ui-common.js?v=723',
  './invoice-orientation.js?v=737',
  './invoice-orientation-store.js?v=723',
  './invoice-orientation-background.js?v=722',
  './asset-documents.js?v=475',
  './catalogs.js?v=568',
  './production-shifts.js?v=720',
  './organization.js?v=568',
  './notifications.js?v=663',
  './user-guide.js?v=645',
  './attp-documents.js?v=638',
  './operations.js?v=707',
  './personnel.js?v=638',
  './goods-inventory.js?v=638',
  './navigation-reports.js?v=702',
  './order-detail.js?v=643',
  './delivery-shifts.js?v=455',
  './auth-workforce.js?v=551',
  './quotations.js',
  './finance.js?v=702',
  './delivery-orders.js?v=748',
  './delivery-fast-entry.js?v=749',
  './delivery-catalog-edit.js?v=733',
  './qrcode.min.js?v=357',
  './import-tools.js?v=702',
  './trips.js?v=744',
  './delivery-excel.js?v=718',
  './vendor/exceljs-4.4.0.min.js',
  './production-closing-domain.js?v=644',
  './production-closing.js?v=593',
  './summary-cache.js?v=638',
  './production-alerts.js?v=663',
  './production.js?v=747',
  './production-recipes.js?v=590',
  './production-assignments.js?v=644',
  './permissions.js?v=707',
  './permission-settings.js?v=707',
  './app.js?v=749',
  './bootstrap.js?v=645',
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
  './styles.css?v=748',
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
      keys.filter(k => k !== CACHE && k !== 'scf-production-push-state').map(k => caches.delete(k))
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

// Push identity is separate from static caches and contains no session/token.
const SCF_PUSH_STATE='scf-production-push-state';
const scfPushOwnerKey=new URL('./__production_push_owner',self.registration.scope).href;
let scfPushOwnerWrite=Promise.resolve();
self.addEventListener('message',event=>{
 if(event.data?.type!=='scf-production-push-owner')return;
 const owner=String(event.data.employeeId||'');
 scfPushOwnerWrite=scfPushOwnerWrite.catch(()=>{}).then(async()=>{const cache=await caches.open(SCF_PUSH_STATE);await cache.put(scfPushOwnerKey,new Response(owner));});
 event.waitUntil(scfPushOwnerWrite.then(()=>event.ports?.[0]?.postMessage({ok:true})));
});
self.addEventListener('push',event=>{
 event.waitUntil((async()=>{
  let data;try{data=event.data?.json();}catch{return;}
  if(data?.type!=='scf-production-change'||!data.eventId||!data.employeeId)return;
  await scfPushOwnerWrite;
  const owner=await (await (await caches.open(SCF_PUSH_STATE)).match(scfPushOwnerKey))?.text();
  if(owner!==String(data.employeeId))return;
  await self.registration.showNotification('SCFOOD · Đơn hàng thay đổi',{
   silent:true,
   body:String(data.body||'Mở KL sản xuất để kiểm tra.').slice(0,250),icon:new URL('./icon-192.png',self.registration.scope).href,
   badge:new URL('./icon-192.png',self.registration.scope).href,tag:'scf-production-'+String(data.eventId),
   data:{type:'scf-production-change',eventId:String(data.eventId),employeeId:owner}
  });
 })());
});
self.addEventListener('notificationclick',event=>{
 const data=event.notification.data;if(data?.type!=='scf-production-change')return;
 event.notification.close();event.waitUntil((async()=>{
  await scfPushOwnerWrite;
  const owner=await (await (await caches.open(SCF_PUSH_STATE)).match(scfPushOwnerKey))?.text();if(owner!==data.employeeId)return;
  const target=new URL('./',self.registration.scope);target.searchParams.set('scfProductionAlert',data.eventId);
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const client=windows.find(c=>new URL(c.url).origin===target.origin&&new URL(c.url).pathname.startsWith(new URL(self.registration.scope).pathname));
  if(client){await client.focus();client.postMessage({type:'scf-production-push-open',eventId:data.eventId});}
  else await self.clients.openWindow(target.href);
 })());
});
