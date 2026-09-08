const SUPA_URL='https://ufhujngdhafcjyncslja.supabase.co';
const SUPA_KEY='sb_publishable_np2Cvhg6LaBFjx3MKeaCLw_E7UigTyP';
const SUPA_PHOTO_BUCKET='delivery-photos';
const SUPA_PHOTO_SIGNED_URL_TTL=60*60*24*7;
function storagePhotoPathFromUrl(value){
  try{
    const url=new URL(String(value||''));
    const markers=['/storage/v1/object/public/'+SUPA_PHOTO_BUCKET+'/','/storage/v1/object/sign/'+SUPA_PHOTO_BUCKET+'/'];
    const marker=markers.find(item=>url.pathname.includes(item));
    if(!marker)return '';
    return decodeURIComponent(url.pathname.slice(url.pathname.indexOf(marker)+marker.length));
  }catch{return '';}
}
async function createPrivatePhotoUrl(path){
  if(!sb||!path)return '';
  const{data,error}=await sb.storage.from(SUPA_PHOTO_BUCKET).createSignedUrl(path,SUPA_PHOTO_SIGNED_URL_TTL);
  if(error)throw error;
  return data?.signedUrl||'';
}
// Tự phục hồi URL public cũ và URL có chữ ký đã hết hạn khi bucket chuyển sang private.
document.addEventListener('error',async event=>{
  const image=event.target;
  if(!(image instanceof HTMLImageElement)||image.dataset.scfPhotoRefreshing==='1')return;
  const path=storagePhotoPathFromUrl(image.currentSrc||image.src);
  if(!path)return;
  image.dataset.scfPhotoRefreshing='1';
  try{const signedUrl=await createPrivatePhotoUrl(path);if(signedUrl)image.src=signedUrl;}
  catch(error){console.warn('Không làm mới được đường dẫn ảnh bảo mật:',error?.message||error);}
  finally{delete image.dataset.scfPhotoRefreshing;}
},true);
const W_LAT=21.5303,W_LON=105.8739,W_CITY='Sông Công, Thái Nguyên';

/* ─── Supabase ─── */
function scfDeviceId(){
  const key='scf_device_id_v1';
  try{let value=localStorage.getItem(key);if(!value){value=crypto.randomUUID?.()||('dev-'+Date.now().toString(36)+Math.random().toString(36).slice(2));localStorage.setItem(key,value);}return value;}catch{return 'device-unavailable';}
}
function scfDeviceLabel(){
  const ua=String(navigator.userAgent||'');
  const browser=ua.includes('Edg/')?'Edge':ua.includes('Chrome/')?'Chrome':ua.includes('Firefox/')?'Firefox':ua.includes('Safari/')?'Safari':'Trình duyệt';
  const system=ua.includes('Windows')?'Windows':ua.includes('Android')?'Android':/iPhone|iPad/.test(ua)?'iPhone/iPad':ua.includes('Mac OS')?'macOS':'Thiết bị';
  return system+' · '+browser;
}
window.scfDeviceId=scfDeviceId;window.scfDeviceLabel=scfDeviceLabel;
let sb=null;
try{sb=window.supabase.createClient(SUPA_URL,SUPA_KEY,{global:{headers:{'x-scf-device-id':scfDeviceId()}}});}catch(e){}
const DB_REMOTE_TIMEOUT_MS=10000;
const DB_REMOTE_MAX_TIMEOUT_MS=30000;
// Gom các thay đổi rất ngắn để tránh gửi cả danh sách nhiều lần khi người dùng
// vừa lưu đơn; vẫn đủ thời gian gom các trường được cập nhật liên tiếp.
const SCF_SYNC_DEBOUNCE_MS=300;
const SCF_SYNC_QUEUE_KEY='scf_sync_queue_v1';
const SCF_SYNC_LABELS={
  scf_employees:'Nhân viên SCFOOD',scf_privileged_employees:'Admin & Ban Giám Đốc',scf_orders:'Đơn giao hàng',scf_trips:'Chuyến giao hàng',scf_attendance:'Chấm công',
  scf_advances:'Ứng lương',scf_rewards:'Thưởng phạt',scf_employee_errors:'Lỗi nhân viên',scf_employee_uniforms:'Cấp đồng phục',scf_leaves:'Nghỉ phép',scf_finance_entries:'Dòng tiền',
  scf_finance_debts:'Công nợ',scf_finance_openings:'Số dư đầu kỳ',scf_internal_messages:'Tin nhắn nội bộ',scf_tasks:'Giao việc',scf_notifications:'Thông báo',
  scf_customers:'Khách hàng',scf_products:'Sản phẩm',scf_materials:'Nguyên vật liệu',scf_quotes:'Báo giá',scf_ncc_goods:'Nhà cung cấp hàng hóa',scf_goods_purchases:'Đơn mua hàng hóa'
};
let scfMemorySyncQueue={};
let scfMemorySyncQueueReady=false;
let scfLastSyncErrorNotice={message:'',at:0};
const SCF_SENSITIVE_KEYS=new Set([
  'scf_employees','scf_privileged_employees','scf_orders','scf_trips','scf_attendance','scf_advances','scf_rewards','scf_employee_errors','scf_leaves',
  'scf_finance_entries','scf_finance_debts','scf_finance_openings','scf_internal_messages','scf_tasks','scf_notifications'
]);
// Khi bật xác thực máy chủ, không cho trình duyệt ghi trực tiếp các collection
// nghiệp vụ. Edge Function sẽ đối chiếu quyền trang và mức r/rw/rwd của nhân viên.
const SCF_EDGE_WRITE_KEYS=new Set([
  'scf_company','scf_materials','scf_assets','scf_garages','scf_prodcats','scf_products',
  'scf_prod_shifts','scf_prod_shift_rules','scf_areas','scf_customers','scf_workcats','scf_depts',
  'scf_permission_profiles','scf_tasks','scf_nccs','scf_ncc_goods','scf_purchases','scf_goods_purchases',
  'scf_fuelpurchases','scf_material_month_openings','scf_shifts','scf_quotes','scf_orders','scf_trips',
  'scf_prodorders','scf_prod_actuals','scf_stock','scf_attendance','scf_advances','scf_rewards',
  'scf_employee_errors','scf_employee_uniforms','scf_leaves','scf_ui_settings','scf_print_template_settings',
  'scf_finance_entries','scf_finance_debts','scf_finance_openings','scf_company_news',
  'scf_internal_messages','scf_notifications','scf_delivery_rules','scf_process_posts_accounting',
  'scf_process_posts_bun','scf_process_posts_pho','scf_process_posts_banhcuon','scf_print_jobs',
  'scf_maint_vehicle','scf_maint_machine','scf_powdersales'
]);
function serverAuthEnabled(){return typeof SCF_SERVER_AUTH_ENABLED!=='undefined'&&SCF_SERVER_AUTH_ENABLED;}
function localCacheKey(key){return 'scf_'+String(key||'').replace('scf_','');}
function allowPersistentLocalCache(key){return !serverAuthEnabled()||!SCF_SENSITIVE_KEYS.has(key);}
function readSyncQueue(){
  if(scfMemorySyncQueueReady)return {...scfMemorySyncQueue};
  try{scfMemorySyncQueue=JSON.parse(sessionStorage.getItem(SCF_SYNC_QUEUE_KEY)||'{}')||{};}catch{scfMemorySyncQueue={};}
  scfMemorySyncQueueReady=true;return {...scfMemorySyncQueue};
}
function writeSyncQueue(queue){
  scfMemorySyncQueue={...queue};scfMemorySyncQueueReady=true;
  try{sessionStorage.setItem(SCF_SYNC_QUEUE_KEY,JSON.stringify(queue));}catch(e){console.warn('Sync queue only kept in memory:',e.message);}
  return Object.keys(queue).length;
}
let scfSyncedIdleTimer=null;
function setSyncState(status,detail=''){
  if(scfSyncedIdleTimer){clearTimeout(scfSyncedIdleTimer);scfSyncedIdleTimer=null;}
  const pending=Object.keys(readSyncQueue()).length;
  if(pending&&(status==='idle'||status==='synced')){
    status='error';
    detail=detail||('Còn '+pending+' nhóm dữ liệu chờ đồng bộ');
  }
  window.__SCF_SYNC_STATE={status,detail,pending,updatedAt:new Date().toISOString()};
  window.dispatchEvent(new CustomEvent('scf-sync-state',{detail:window.__SCF_SYNC_STATE}));
  if(status==='synced'&&!pending)scfSyncedIdleTimer=setTimeout(()=>{
    scfSyncedIdleTimer=null;
    if(window.__SCF_SYNC_STATE?.status==='synced'&&!Object.keys(readSyncQueue()).length)setSyncState(navigator.onLine?'idle':'offline');
  },5000);
}
function syncCollectionLabel(key){return SCF_SYNC_LABELS[key]||String(key||'').replace(/^scf_/,'').replaceAll('_',' ');}
function duplicateItemGroups(value){
  if(!Array.isArray(value))return [];
  const groups=new Map();
  value.forEach(item=>{const id=String(item?.id||'').trim();if(id)groups.set(id,[...(groups.get(id)||[]),item]);});
  return [...groups.entries()].filter(([,items])=>items.length>1).map(([id,items])=>({id,items}));
}
function syncOrderActor(order){
  const history=Array.isArray(order?.orderHistory)?order.orderHistory:[];
  return order?.updatedBy||order?.createdBy||history[history.length-1]?.by||'không rõ người tạo/cập nhật';
}
function duplicateOrderMessage(groups){
  const details=groups.slice(0,3).map(group=>{
    const records=group.items.slice(0,3).map((order,index)=>(index+1)+') ngày '+(order?.deliveryDate||'chưa có')+', địa điểm '+(order?.pointName||order?.address||order?.customer||'chưa có')+', người tạo/cập nhật '+syncOrderActor(order));
    return 'mã đơn hàng '+group.id+' bị trùng: '+records.join('; ');
  });
  return details.join(' | ')+(groups.length>3?' | …':'' );
}
function syncErrorMessage(key,error,value){
  const reason=String(error?.message||error||'Không đồng bộ được dữ liệu');
  const groups=/mã bị trùng/i.test(reason)?duplicateItemGroups(value):[];
  if(key==='scf_orders'&&groups.length)return syncCollectionLabel(key)+': '+duplicateOrderMessage(groups);
  const ids=groups.map(group=>group.id);
  return syncCollectionLabel(key)+': '+(ids.length?'trùng mã '+ids.slice(0,5).join(', ')+(ids.length>5?'…':''):reason);
}
function reportSyncError(key,error,value){
  const message=syncErrorMessage(key,error,value);setSyncState('error',message);
  const now=Date.now();
  if(window.showToast&&(scfLastSyncErrorNotice.message!==message||now-scfLastSyncErrorNotice.at>60000)){
    scfLastSyncErrorNotice={message,at:now};window.showToast(message,'error',12000);
  }
  if(key!=='scf_notifications'){
    let hash=0;for(let i=0;i<message.length;i++)hash=((hash<<5)-hash+message.charCodeAt(i))|0;
    const detail={key,message,fingerprint:'sync-'+key+'-'+Math.abs(hash)};
    window.__SCF_LAST_SYNC_ERROR=detail;
    window.dispatchEvent(new CustomEvent('scf-sync-error-notification',{detail}));
  }
}
function syncPayloadBytes(value){try{return new Blob([JSON.stringify(value??null)]).size;}catch{return 0;}}
function remoteTimeoutFor(value){return Math.min(DB_REMOTE_MAX_TIMEOUT_MS,DB_REMOTE_TIMEOUT_MS+Math.ceil(syncPayloadBytes(value)/65536)*750);}
function queueRemoteWrite(key,value,options={}){
  const queue=readSyncQueue();
  const updatedAt=options.updatedAt||new Date().toISOString();
  queue[key]={value,updatedAt,bytes:syncPayloadBytes(value),attempts:Number(options.attempts)||0,mode:options.mode||''};
  writeSyncQueue(queue);
  setSyncState(options.syncing?'syncing':(navigator.onLine?'error':'offline'),options.detail||(options.syncing?'Đang gộp thay đổi để đồng bộ':'Thay đổi đang chờ đồng bộ'));
  return updatedAt;
}
function removeQueuedWrite(key,updatedAt=''){
  const queue=readSyncQueue();
  if(updatedAt&&queue[key]?.updatedAt!==updatedAt)return false;
  delete queue[key];writeSyncQueue(queue);return true;
}
window.scfClearSensitiveLocalData=function(){
  SCF_SENSITIVE_KEYS.forEach(key=>{try{localStorage.removeItem(localCacheKey(key));}catch{}});
  scfMemorySyncQueue={};
  scfMemorySyncQueueReady=true;
  try{sessionStorage.removeItem(SCF_SYNC_QUEUE_KEY);}catch{}
  setSyncState(navigator.onLine?'idle':'offline');
};
window.scfGetSyncState=function(){return window.__SCF_SYNC_STATE||{status:navigator.onLine?'idle':'offline',pending:0};};
window.scfGetSyncReport=function(){
  const queue=readSyncQueue();
  const labels={
    scf_employees:'Nhân viên SCFOOD',scf_privileged_employees:'Admin & Ban Giám Đốc',scf_orders:'Đơn giao hàng',scf_trips:'Chuyến giao hàng',scf_attendance:'Chấm công',
    scf_advances:'Ứng lương',scf_rewards:'Thưởng phạt',scf_employee_errors:'Lỗi nhân viên',scf_employee_uniforms:'Cấp đồng phục',scf_leaves:'Nghỉ phép',scf_finance_entries:'Dòng tiền',
    scf_finance_debts:'Công nợ',scf_finance_openings:'Số dư đầu kỳ',scf_internal_messages:'Tin nhắn nội bộ',scf_tasks:'Giao việc',scf_notifications:'Thông báo',
    scf_customers:'Khách hàng',scf_products:'Sản phẩm',scf_materials:'Nguyên vật liệu',scf_quotes:'Báo giá',
    scf_ncc_goods:'Nhà cung cấp hàng hóa',scf_goods_purchases:'Đơn mua hàng hóa'
  };
  return {
    ...window.scfGetSyncState(),
    online:navigator.onLine,
    serverReady:!!sb,
    items:Object.entries(queue).map(([key,item])=>({key,label:labels[key]||key.replace(/^scf_/,'').replaceAll('_',' '),updatedAt:item?.updatedAt||'',bytes:Number(item?.bytes)||syncPayloadBytes(item?.value),recordCount:Array.isArray(item?.value)?item.value.length:(item?.value&&typeof item.value==='object'?Object.keys(item.value).length:1),attempts:Number(item?.attempts)||0,mode:item?.mode||''}))
  };
};
function withRemoteTimeout(promise,ms=DB_REMOTE_TIMEOUT_MS){
  let timer;
  const timeout=new Promise((_,reject)=>{
    timer=setTimeout(()=>{const error=new Error('Supabase timeout');error.code='SCF_REMOTE_TIMEOUT';reject(error);},ms);
  });
  return Promise.race([Promise.resolve(promise),timeout]).finally(()=>clearTimeout(timer));
}
function useLS(key,init){
  const[v,sv]=useState(()=>{try{const s=localStorage.getItem(key);return s?JSON.parse(s):init}catch{return init}});
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(v))}catch{}},[key,v]);
  return[v,sv];
}
function openNativeDatePicker(el){
  if(!el||el.type!=='date'||el.disabled||el.readOnly||el.dataset.noAutoPicker==='1') return;
  try{ if(typeof el.showPicker==='function') el.showPicker(); }catch{}
}
document.addEventListener('focusin',e=>{
  const el=e.target;
  if(el&&el.matches&&el.matches('input[type="date"]')) openNativeDatePicker(el);
},true);
document.addEventListener('click',e=>{
  const el=e.target;
  if(el&&el.matches&&el.matches('input[type="date"]')) openNativeDatePicker(el);
},true);
document.addEventListener('keydown',e=>{
  const el=e.target;
  if(!el||!el.matches||!el.matches('input[type="date"]')) return;
  if(e.key==='Enter'||e.key==='ArrowDown'||e.key===' '){
    e.preventDefault();
    openNativeDatePicker(el);
  }
},true);
// Startup/page loads must fail visibly, never treat a network error as an empty
// editable collection. Keep the legacy offline fallback for older standalone tabs.
const scfLocalWrites=new Map();
const scfRemoteVersions=new Map();
const scfRemoteSnapshots=new Map();
function syncSnapshot(value){try{return JSON.parse(JSON.stringify(value))}catch{return value}}
async function dbGetRequired(key,def){
  if(!serverAuthEnabled())return dbGet(key,def);
  if(!sb)throw new Error('Chưa kết nối được máy chủ dữ liệu.');
  const pending=readSyncQueue()[key];
  if(pending)return pending.value;
  if(SCF_EDGE_WRITE_KEYS.has(key)){
    try{
      setSyncState('syncing','Đang nhận '+syncCollectionLabel(key));
      const loaded=await serverLoadPermittedCollection(key);
      const value=loaded&&Object.prototype.hasOwnProperty.call(loaded,'value')&&loaded.value!==undefined?loaded.value:def;
      scfRemoteVersions.set(key,String(loaded?.updatedAt||''));
      scfRemoteSnapshots.set(key,syncSnapshot(value));setSyncState('synced');return value;
    }catch(error){setSyncState('error','Không tải được '+syncCollectionLabel(key));throw new Error('Không tải được '+key+': '+(error.message||'Lỗi kết nối'));}
  }
  const before=scfLocalWrites.get(key);
  try{
    const{data,error}=await withRemoteTimeout(sb.from('kv_store').select('value,updated_at').eq('key',key).maybeSingle());
    if(error)throw error;
    // An edit made while this request was in flight wins over its old snapshot,
    // including an edit whose queued write has already finished.
    const latest=scfLocalWrites.get(key),queued=readSyncQueue()[key];
    if(queued)return queued.value;
    if(latest!==before)return latest.value;
    const value=data&&Object.prototype.hasOwnProperty.call(data,'value')?data.value:def;
    scfRemoteVersions.set(key,String(data?.updated_at||''));
    if(Array.isArray(value))scfRemoteSnapshots.set(key,syncSnapshot(value));
    if(Array.isArray(def)&&!Array.isArray(value))throw new Error('Dữ liệu trả về không đúng định dạng.');
    return value;
  }catch(error){
    setSyncState(navigator.onLine?'error':'offline','Không tải được '+key);
    throw new Error('Không tải được '+key+': '+(error.message||'Lỗi kết nối'));
  }
}
async function dbGetChangedKeys(keys){
  const wanted=[...new Set((keys||[]).map(String).filter(Boolean))];
  if(!wanted.length||!sb)return[];
  const{data,error}=await withRemoteTimeout(sb.from('kv_store').select('key,updated_at').in('key',wanted),10000);
  if(error)throw error;
  return (data||[]).filter(row=>String(row?.updated_at||'')!==String(scfRemoteVersions.get(String(row?.key||''))||'')).map(row=>String(row.key));
}
async function dbGet(key,def){
  if(serverAuthEnabled()){
    if(!sb){setSyncState('error','Không kết nối được máy chủ');return def;}
    try{const{data}=await sb.auth.getSession();if(!data?.session)return def;}catch{setSyncState('error','Không kiểm tra được phiên đăng nhập');return def;}
  }
  if(serverAuthEnabled()&&(key==='scf_employees'||key==='scf_privileged_employees')){
    try{setSyncState('syncing','Đang nhận danh sách nhân viên');const employees=await serverLoadEmployees();setSyncState('synced');return employees;}
    catch(e){console.warn('serverLoadEmployees:',e.message);setSyncState('error','Không tải được danh sách nhân viên');return def;}
  }
  if(serverAuthEnabled()&&SCF_EDGE_WRITE_KEYS.has(key)){
    try{
      setSyncState('syncing','Đang nhận '+syncCollectionLabel(key));
      const loaded=await serverLoadPermittedCollection(key);
      const value=loaded&&Object.prototype.hasOwnProperty.call(loaded,'value')&&loaded.value!==undefined?loaded.value:def;
      scfRemoteVersions.set(key,String(loaded?.updatedAt||''));scfRemoteSnapshots.set(key,syncSnapshot(value));setSyncState('synced');return value;
    }catch(error){setSyncState('error','Không tải được '+syncCollectionLabel(key));return def;}
  }
  // Khi online thì ưu tiên dữ liệu mới từ Supabase để các máy đồng bộ với nhau.
  if(sb)try{
    setSyncState('syncing','Đang nhận dữ liệu');
    const{data,error}=await withRemoteTimeout(sb.from('kv_store').select('value,updated_at').eq('key',key).maybeSingle());
    if(error)throw error;
    if(data&&Object.prototype.hasOwnProperty.call(data,'value')){
      scfRemoteVersions.set(key,String(data.updated_at||''));
      if(Array.isArray(data.value))scfRemoteSnapshots.set(key,syncSnapshot(data.value));
      if(allowPersistentLocalCache(key))try{localStorage.setItem(localCacheKey(key),JSON.stringify(data.value));}catch{}
      setSyncState('synced');return data.value;
    }
  }catch(e){console.warn('dbGet Supabase:',e.message);setSyncState(navigator.onLine?'error':'offline','Đang dùng dữ liệu trên máy');}
  // Mất mạng hoặc Supabase lỗi thì dùng dữ liệu lưu trên máy.
  if(allowPersistentLocalCache(key))try{const ls=localStorage.getItem(localCacheKey(key));if(ls)return JSON.parse(ls);}catch{}
  return def;
}
async function performDbSet(key,val,queuedAt='',mode=''){
  if(serverAuthEnabled()){
    if(!sb){if(!readSyncQueue()[key])queueRemoteWrite(key,val,{updatedAt:queuedAt});return false;}
    try{
      const{data}=await sb.auth.getSession();
      if(!data?.session){window.showToast&&window.showToast('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.','warn');return false;}
    }catch{setSyncState('error','Không kiểm tra được phiên đăng nhập');return false;}
  }
  if(serverAuthEnabled()&&(key==='scf_employees'||key==='scf_privileged_employees')){
    try{setSyncState('syncing','Đang lưu danh sách nhân viên');await withRemoteTimeout(serverSaveEmployees(val),remoteTimeoutFor(val));removeQueuedWrite(key,queuedAt);setSyncState('synced');return true;}
    catch(e){console.warn('serverSaveEmployees:',e.message);setSyncState('error','Không lưu được danh sách nhân viên');window.showToast&&window.showToast(e.message||'Không lưu được danh sách nhân viên.','error');scheduleSyncRetry();return false;}
  }
  if(serverAuthEnabled()&&key==='scf_trips'&&mode==='auto-trips'){
    try{setSyncState('syncing','Đang lưu chuyến tự động');await withRemoteTimeout(serverSaveAutoTrips(val),remoteTimeoutFor(val));removeQueuedWrite(key,queuedAt);setSyncState('synced');return true;}
    catch(e){console.warn('serverSaveAutoTrips:',e.message);setSyncState('error',e.message||'Không lưu được chuyến tự động');window.showToast&&window.showToast(e.message||'Không lưu được chuyến tự động.','error');scheduleSyncRetry();return false;}
  }
  if(serverAuthEnabled()&&SCF_EDGE_WRITE_KEYS.has(key)){
    try{
      setSyncState('syncing','Đang kiểm tra quyền và đồng bộ');
      const saved=await withRemoteTimeout(serverSavePermittedCollection(key,val,scfRemoteVersions.get(key)||'',scfRemoteSnapshots.get(key)),remoteTimeoutFor(val));
      const merged=Array.isArray(saved?.value)&&JSON.stringify(saved.value)!==JSON.stringify(val);
      if(Array.isArray(saved?.value))scfRemoteSnapshots.set(key,syncSnapshot(saved.value));
      scfRemoteVersions.set(key,merged?'':String(saved?.updatedAt||''));removeQueuedWrite(key,queuedAt);setSyncState('synced');
      if(merged)setTimeout(()=>window.scfSyncNow?.(),100);return true;
    }catch(e){
      console.warn('serverSavePermittedCollection:',e.message);
      if(e?.code==='SCF_WRITE_CONFLICT'){
        // Xung đột do máy khác vừa lưu được giữ lại trong hàng đợi. Với các
        // đơn khác nhau, Edge Function sẽ ghép theo mã đơn ở lần thử lại;
        // người dùng không cần reset hoặc bấm lưu lại thủ công.
        setSyncState('syncing','Đang ghép thay đổi với máy khác rồi thử lại');
        window.showToast&&window.showToast('Máy khác vừa lưu dữ liệu. App đang tự ghép thay đổi và đồng bộ lại…','info',6000);
        scheduleSyncRetry();
        return false;
      }
      if(e?.code==='SCF_DUPLICATE_ORDER_CODE'){
        setSyncState('error','Mã đơn hàng bị trùng');
        window.showToast&&window.showToast(e.message||'Mã đơn hàng bị trùng. Vui lòng nhập lại mã khác.','error',10000);
        removeQueuedWrite(key,queuedAt);
        return false;
      }
      reportSyncError(key,e,val);scheduleSyncRetry();return false;
    }
  }
  // Chỉ giữ dữ liệu không nhạy cảm lâu dài khi đã bật xác thực máy chủ.
  if(allowPersistentLocalCache(key))try{localStorage.setItem(localCacheKey(key),JSON.stringify(val));}catch(e){console.warn('localStorage save:',e.message);}
  // Sync lên Supabase nếu có
  if(!sb){if(!readSyncQueue()[key])queueRemoteWrite(key,val,{updatedAt:queuedAt});return false;}
  try{
    setSyncState('syncing','Đang gửi thay đổi');
    const{error}=await withRemoteTimeout(sb.from('kv_store').upsert({key,value:val,updated_at:new Date().toISOString()}),remoteTimeoutFor(val));
    if(error)throw error;
    removeQueuedWrite(key,queuedAt);setSyncState('synced');return true;
  }catch(e){console.warn('dbSet Supabase:',e.message);if(!readSyncQueue()[key])queueRemoteWrite(key,val,{updatedAt:queuedAt});scheduleSyncRetry();return false;}
}
const scfWriteChains={};
const scfDebouncedWrites={};
function dbSetWithMode(key,val,mode=''){
  scfLocalWrites.set(key,{value:val});
  if(allowPersistentLocalCache(key))try{localStorage.setItem(localCacheKey(key),JSON.stringify(val));}catch(e){console.warn('localStorage save:',e.message);}
  const queuedAt=queueRemoteWrite(key,val,{syncing:true,detail:'Đang chuẩn bị đồng bộ',mode});
  return new Promise(resolve=>{
    const pending=scfDebouncedWrites[key]||{timer:null,value:val,queuedAt,mode,resolvers:[]};
    pending.value=val;pending.queuedAt=queuedAt;pending.mode=mode;pending.resolvers.push(resolve);
    if(pending.timer)clearTimeout(pending.timer);
    pending.timer=setTimeout(()=>{
      delete scfDebouncedWrites[key];
      if(readSyncQueue()[key]?.updatedAt!==pending.queuedAt){pending.resolvers.forEach(done=>done(true));return;}
      const task=(scfWriteChains[key]||Promise.resolve()).catch(()=>false).then(()=>performDbSet(key,pending.value,pending.queuedAt,pending.mode));
      scfWriteChains[key]=task;
      task.then(ok=>pending.resolvers.forEach(done=>done(ok)));
    },SCF_SYNC_DEBOUNCE_MS);
    scfDebouncedWrites[key]=pending;
  });
}
function dbSet(key,val){return dbSetWithMode(key,val,'');}
function dbSetAutoTrips(val){return dbSetWithMode('scf_trips',val,'auto-trips');}
let scfRetryTimer=null,scfRetryAttempt=0;
function scheduleSyncRetry(){
  if(scfRetryTimer||!navigator.onLine||!sb)return;
  const delays=[1500,5000,15000,30000];
  const delay=delays[Math.min(scfRetryAttempt,delays.length-1)];scfRetryAttempt++;
  scfRetryTimer=setTimeout(async()=>{scfRetryTimer=null;await flushPendingWrites();},delay);
}
async function flushPendingWrites(){
  if(!navigator.onLine||!sb)return false;
  if(serverAuthEnabled()){
    try{const{data}=await sb.auth.getSession();if(!data?.session)return false;}catch{return false;}
  }
  const queue=readSyncQueue();const entries=Object.entries(queue);
  if(!entries.length){setSyncState('synced');return true;}
  setSyncState('syncing','Đang gửi '+entries.length+' thay đổi');
  for(const[key]of entries){
    let waitingResolvers=[],item=null;
    try{
      const debounced=scfDebouncedWrites[key];
      if(debounced){clearTimeout(debounced.timer);waitingResolvers=debounced.resolvers||[];delete scfDebouncedWrites[key];}
      if(scfWriteChains[key])await scfWriteChains[key].catch(()=>false);
      item=readSyncQueue()[key];if(!item){waitingResolvers.forEach(done=>done(true));continue;}
      if(serverAuthEnabled()&&(key==='scf_employees'||key==='scf_privileged_employees'))await withRemoteTimeout(serverSaveEmployees(item.value),remoteTimeoutFor(item.value));
      else if(serverAuthEnabled()&&key==='scf_trips'&&(item.mode==='auto-trips'||(Array.isArray(item.value)&&item.value.some(trip=>trip?.autoCreated))))await withRemoteTimeout(serverSaveAutoTrips(item.value),remoteTimeoutFor(item.value));
      else if(serverAuthEnabled()&&SCF_EDGE_WRITE_KEYS.has(key)){
        const saved=await withRemoteTimeout(serverSavePermittedCollection(key,item.value,scfRemoteVersions.get(key)||'',scfRemoteSnapshots.get(key)),remoteTimeoutFor(item.value));
        const merged=Array.isArray(saved?.value)&&JSON.stringify(saved.value)!==JSON.stringify(item.value);
        if(Array.isArray(saved?.value))scfRemoteSnapshots.set(key,syncSnapshot(saved.value));
        scfRemoteVersions.set(key,merged?'':String(saved?.updatedAt||''));
        if(merged)setTimeout(()=>window.scfSyncNow?.(),100);
      }
      else{
        const{error}=await withRemoteTimeout(sb.from('kv_store').upsert({key,value:item.value,updated_at:item.updatedAt||new Date().toISOString()}),remoteTimeoutFor(item.value));
        if(error)throw error;
      }
      removeQueuedWrite(key,item.updatedAt||'');
      waitingResolvers.forEach(done=>done(true));
    }catch(e){
      console.warn('flushPendingWrites '+key+':',e?.message||e);
      waitingResolvers.forEach(done=>done(false));
      if(e?.code==='SCF_WRITE_CONFLICT'){
        setSyncState('syncing','Đang ghép thay đổi với máy khác rồi thử lại');
        window.showToast&&window.showToast('Máy khác vừa lưu dữ liệu. App đang tự ghép thay đổi và đồng bộ lại…','info',6000);
        scheduleSyncRetry();
        return false;
      }
      if(e?.code==='SCF_DUPLICATE_ORDER_CODE'){
        setSyncState('error','Mã đơn hàng bị trùng');
        window.showToast&&window.showToast(e.message||'Mã đơn hàng bị trùng. Vui lòng nhập lại mã khác.','error',10000);
        removeQueuedWrite(key,item?.updatedAt||'');
        return false;
      }
      const latest=readSyncQueue();if(latest[key]){latest[key].attempts=(Number(latest[key].attempts)||0)+1;writeSyncQueue(latest);}
      reportSyncError(key,e,item?.value);scheduleSyncRetry();return false;
    }
  }
  scfRetryAttempt=0;setSyncState('synced');return true;
}
window.scfFlushPendingWrites=flushPendingWrites;
window.addEventListener('online',()=>flushPendingWrites());
window.addEventListener('offline',()=>setSyncState('offline','Mất kết nối mạng'));
setSyncState(navigator.onLine?'idle':'offline');
if(navigator.onLine&&Object.keys(readSyncQueue()).length)setTimeout(()=>flushPendingWrites(),1500);
function mkSet(key,setter){return valOrFn=>{
  const access=window.__SCF_ACCESS_CONTEXT;
  if(access?.readOnly){
    return;
  }
  setter(prev=>{const nextRaw=typeof valOrFn==='function'?valOrFn(prev):valOrFn;const next=key==='scf_orders'?normalizeOrdersForStorage(nextRaw):nextRaw;dbSet(key,next);return next;});
};}
function resizeImageFile(file,max=1280,quality=.72){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        const scale=Math.min(1,max/Math.max(img.width,img.height));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
        canvas.toBlob(blob=>blob?resolve({blob,dataUrl:canvas.toDataURL('image/jpeg',quality)}):reject(new Error('Không nén được ảnh.')),'image/jpeg',quality);
      };
      img.onerror=()=>reject(new Error('Không đọc được ảnh.'));
      img.src=ev.target.result;
    };
    reader.onerror=()=>reject(new Error('Không đọc được file ảnh.'));
    reader.readAsDataURL(file);
  });
}
async function uploadPhoto(file,folder='delivery',options={}){
  const img=await resizeImageFile(file,options.max||1280,options.quality||.72);
  if(!sb)return img.dataUrl;
  const clean=(file.name||'photo.jpg').toLowerCase().replace(/[^a-z0-9.]+/g,'-').replace(/-+/g,'-');
  const path=folder+'/'+new Date().toISOString().slice(0,10)+'/'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)+'-'+clean.replace(/\.[^.]+$/,'')+'.jpg';
  try{
    const{error}=await sb.storage.from(SUPA_PHOTO_BUCKET).upload(path,img.blob,{contentType:'image/jpeg',upsert:false});
    if(error)throw error;
    const signedUrl=await createPrivatePhotoUrl(path);
    if(!signedUrl)throw new Error('Không tạo được đường dẫn ảnh bảo mật.');
    return signedUrl;
  }catch(e){
    console.warn('Upload Supabase Storage:',e.message||e);
    window.showToast('Chưa upload được ảnh lên Supabase Storage. App tạm lưu ảnh trên máy này. Kiểm tra bucket '+SUPA_PHOTO_BUCKET+' và policy upload/read.','error');
    return img.dataUrl;
  }
}
