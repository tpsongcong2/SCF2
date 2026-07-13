const SUPA_URL='https://ufhujngdhafcjyncslja.supabase.co';
const SUPA_KEY='sb_publishable_np2Cvhg6LaBFjx3MKeaCLw_E7UigTyP';
const SUPA_PHOTO_BUCKET='delivery-photos';
const W_LAT=21.5303,W_LON=105.8739,W_CITY='Sông Công, Thái Nguyên';

/* ─── Supabase ─── */
let sb=null;
try{sb=window.supabase.createClient(SUPA_URL,SUPA_KEY);}catch(e){}
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
  // Khi online thì ưu tiên dữ liệu mới từ Supabase để các máy đồng bộ với nhau.
  if(sb)try{const{data}=await sb.from('kv_store').select('value').eq('key',key).maybeSingle();if(data?.value){try{localStorage.setItem('scf_'+key.replace('scf_',''),JSON.stringify(data.value));}catch{}return data.value;}}catch(e){console.warn('dbGet Supabase:',e.message);}
  // Mất mạng hoặc Supabase lỗi thì dùng dữ liệu lưu trên máy.
  try{const ls=localStorage.getItem('scf_'+key.replace('scf_',''));if(ls)return JSON.parse(ls);}catch{}
  return def;
}
async function dbSet(key,val){
  // Lưu localStorage ngay lập tức
  try{localStorage.setItem('scf_'+key.replace('scf_',''),JSON.stringify(val));}catch(e){console.warn('localStorage save:',e.message);}
  // Sync lên Supabase nếu có
  if(sb)try{await sb.from('kv_store').upsert({key,value:val,updated_at:new Date().toISOString()});}catch(e){console.warn('dbSet Supabase:',e.message);}
}
function mkSet(key,setter){return valOrFn=>{
  const access=window.__SCF_ACCESS_CONTEXT;
  if(access?.readOnly){
    window.showToast&&window.showToast('Bạn đang ở chế độ Chỉ xem, không thể thay đổi dữ liệu.','warn');
    return;
  }
  setter(prev=>{const nextRaw=typeof valOrFn==='function'?valOrFn(prev):valOrFn;const next=key==='scf_orders'?normalizeOrdersForStorage(nextRaw):nextRaw;dbSet(key,next);return next;});
};}
function resizeImageFile(file,max=1600,quality=.82){
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
async function uploadPhoto(file,folder='delivery'){
  const img=await resizeImageFile(file);
  if(!sb)return img.dataUrl;
  const clean=(file.name||'photo.jpg').toLowerCase().replace(/[^a-z0-9.]+/g,'-').replace(/-+/g,'-');
  const path=folder+'/'+new Date().toISOString().slice(0,10)+'/'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)+'-'+clean.replace(/\.[^.]+$/,'')+'.jpg';
  try{
    const{error}=await sb.storage.from(SUPA_PHOTO_BUCKET).upload(path,img.blob,{contentType:'image/jpeg',upsert:false});
    if(error)throw error;
    const{data}=sb.storage.from(SUPA_PHOTO_BUCKET).getPublicUrl(path);
    return data?.publicUrl||img.dataUrl;
  }catch(e){
    console.warn('Upload Supabase Storage:',e.message||e);
    window.showToast('Chưa upload được ảnh lên Supabase Storage. App tạm lưu ảnh trên máy này. Kiểm tra bucket '+SUPA_PHOTO_BUCKET+' và policy upload/read.','error');
    return img.dataUrl;
  }
}

