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
let sb=null;
try{sb=window.supabase.createClient(SUPA_URL,SUPA_KEY);}catch(e){}
const DB_REMOTE_TIMEOUT_MS=10000;
const DB_REMOTE_MAX_TIMEOUT_MS=30000;
const SCF_SYNC_DEBOUNCE_MS=700;
const SCF_SYNC_QUEUE_KEY='scf_sync_queue_v1';
let scfMemorySyncQueue={};
let scfMemorySyncQueueReady=false;
const SCF_SENSITIVE_KEYS=new Set([
  'scf_employees','scf_privileged_employees','scf_orders','scf_trips','scf_attendance','scf_advances','scf_rewards','scf_employee_errors','scf_leaves',
  'scf_finance_entries','scf_finance_debts','scf_finance_openings','scf_internal_messages','scf_tasks','scf_notifications'
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
function setSyncState(status,detail=''){
  const pending=Object.keys(readSyncQueue()).length;
  if(pending&&(status==='idle'||status==='synced')){
    status='error';
    detail=detail||('Còn '+pending+' nhóm dữ liệu chờ đồng bộ');
  }
  window.__SCF_SYNC_STATE={status,detail,pending,updatedAt:new Date().toISOString()};
  window.dispatchEvent(new CustomEvent('scf-sync-state',{detail:window.__SCF_SYNC_STATE}));
}
function syncPayloadBytes(value){try{return new Blob([JSON.stringify(value??null)]).size;}catch{return 0;}}
function remoteTimeoutFor(value){return Math.min(DB_REMOTE_MAX_TIMEOUT_MS,DB_REMOTE_TIMEOUT_MS+Math.ceil(syncPayloadBytes(value)/65536)*750);}
function queueRemoteWrite(key,value,options={}){
  const queue=readSyncQueue();
  const updatedAt=options.updatedAt||new Date().toISOString();
  queue[key]={value,updatedAt,bytes:syncPayloadBytes(value),attempts:Number(options.attempts)||0};
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
    scf_customers:'Khách hàng',scf_products:'Sản phẩm',scf_materials:'Nguyên vật liệu',scf_quotes:'Báo giá'
  };
  return {
    ...window.scfGetSyncState(),
    online:navigator.onLine,
    serverReady:!!sb,
    items:Object.entries(queue).map(([key,item])=>({key,label:labels[key]||key.replace(/^scf_/,'').replaceAll('_',' '),updatedAt:item?.updatedAt||'',bytes:Number(item?.bytes)||syncPayloadBytes(item?.value),attempts:Number(item?.attempts)||0}))
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
async function dbGet(key,def){
  if(serverAuthEnabled()){
    if(!sb){setSyncState('error','Không kết nối được máy chủ');return def;}
    try{const{data}=await sb.auth.getSession();if(!data?.session)return def;}catch{setSyncState('error','Không kiểm tra được phiên đăng nhập');return def;}
  }
  if(serverAuthEnabled()&&(key==='scf_employees'||key==='scf_privileged_employees')){
    try{setSyncState('syncing','Đang nhận danh sách nhân viên');const employees=await serverLoadEmployees();setSyncState('synced');return employees;}
    catch(e){console.warn('serverLoadEmployees:',e.message);setSyncState('error','Không tải được danh sách nhân viên');return def;}
  }
  // Khi online thì ưu tiên dữ liệu mới từ Supabase để các máy đồng bộ với nhau.
  if(sb)try{
    setSyncState('syncing','Đang nhận dữ liệu');
    const{data,error}=await withRemoteTimeout(sb.from('kv_store').select('value').eq('key',key).maybeSingle());
    if(error)throw error;
    if(data&&Object.prototype.hasOwnProperty.call(data,'value')){
      if(allowPersistentLocalCache(key))try{localStorage.setItem(localCacheKey(key),JSON.stringify(data.value));}catch{}
      setSyncState('synced');return data.value;
    }
  }catch(e){console.warn('dbGet Supabase:',e.message);setSyncState(navigator.onLine?'error':'offline','Đang dùng dữ liệu trên máy');}
  // Mất mạng hoặc Supabase lỗi thì dùng dữ liệu lưu trên máy.
  if(allowPersistentLocalCache(key))try{const ls=localStorage.getItem(localCacheKey(key));if(ls)return JSON.parse(ls);}catch{}
  return def;
}
async function performDbSet(key,val,queuedAt=''){
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
function dbSet(key,val){
  if(allowPersistentLocalCache(key))try{localStorage.setItem(localCacheKey(key),JSON.stringify(val));}catch(e){console.warn('localStorage save:',e.message);}
  const queuedAt=queueRemoteWrite(key,val,{syncing:true,detail:'Đang chuẩn bị đồng bộ'});
  return new Promise(resolve=>{
    const pending=scfDebouncedWrites[key]||{timer:null,value:val,queuedAt,resolvers:[]};
    pending.value=val;pending.queuedAt=queuedAt;pending.resolvers.push(resolve);
    if(pending.timer)clearTimeout(pending.timer);
    pending.timer=setTimeout(()=>{
      delete scfDebouncedWrites[key];
      if(readSyncQueue()[key]?.updatedAt!==pending.queuedAt){pending.resolvers.forEach(done=>done(true));return;}
      const task=(scfWriteChains[key]||Promise.resolve()).catch(()=>false).then(()=>performDbSet(key,pending.value,pending.queuedAt));
      scfWriteChains[key]=task;
      task.then(ok=>pending.resolvers.forEach(done=>done(ok)));
    },SCF_SYNC_DEBOUNCE_MS);
    scfDebouncedWrites[key]=pending;
  });
}
let scfRetryTimer=null,scfRetryAttempt=0;
function scheduleSyncRetry(){
  if(scfRetryTimer||!navigator.onLine||!sb)return;
  const delays=[3000,10000,30000,60000];
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
    let waitingResolvers=[];
    try{
      const debounced=scfDebouncedWrites[key];
      if(debounced){clearTimeout(debounced.timer);waitingResolvers=debounced.resolvers||[];delete scfDebouncedWrites[key];}
      if(scfWriteChains[key])await scfWriteChains[key].catch(()=>false);
      const item=readSyncQueue()[key];if(!item){waitingResolvers.forEach(done=>done(true));continue;}
      if(serverAuthEnabled()&&(key==='scf_employees'||key==='scf_privileged_employees'))await withRemoteTimeout(serverSaveEmployees(item.value),remoteTimeoutFor(item.value));
      else{
        const{error}=await withRemoteTimeout(sb.from('kv_store').upsert({key,value:item.value,updated_at:item.updatedAt||new Date().toISOString()}),remoteTimeoutFor(item.value));
        if(error)throw error;
      }
      removeQueuedWrite(key,item.updatedAt||'');
      waitingResolvers.forEach(done=>done(true));
    }catch(e){
      console.warn('flushPendingWrites '+key+':',e?.message||e);
      waitingResolvers.forEach(done=>done(false));
      const latest=readSyncQueue();if(latest[key]){latest[key].attempts=(Number(latest[key].attempts)||0)+1;writeSyncQueue(latest);}
      setSyncState('error',e?.message||'Còn thay đổi chưa đồng bộ');scheduleSyncRetry();return false;
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
