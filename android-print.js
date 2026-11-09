/* Explicit Android Intent launch: the user taps after the scoped job is ready. */
function scfAndroidPrintRows(){try{const key='scf_android_jobs_'+String(window.__SCF_ACCESS_CONTEXT?.employeeId||'');return {key,rows:(()=>{const rows=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows.filter(r=>r&&/^PJ[a-zA-Z0-9_-]{4,100}$/.test(r.jobId)&&/^[a-f0-9]{64}$/.test(r.token)):[];})()};}catch{return {key:'',rows:[]};}}
function scfAndroidIntent(row){
 if(!/^PJ[a-zA-Z0-9_-]{4,100}$/.test(row.jobId)||!/^[a-f0-9]{64}$/.test(row.token))throw Error('Lệnh mở app không hợp lệ.');
 if(typeof scfIsAppleMobilePrint==='function'&&scfIsAppleMobilePrint())return 'scftembridge://print?job='+encodeURIComponent(row.jobId)+'&token='+row.token;
 return 'intent://print?job='+encodeURIComponent(row.jobId)+'&token='+row.token+'#Intent;scheme=scftembridge;package=vn.scfood.tembridge;end';
}
function scfShowAndroidPrintJobs(){
 document.getElementById('scf-android-sheet')?.remove();const actor=String(window.__SCF_ACCESS_CONTEXT?.employeeId||''),stored=scfAndroidPrintRows();if(!actor||!stored.rows.length)return;
 const overlay=document.createElement('div');overlay.id='scf-android-sheet';overlay.className='overlay';overlay.style.zIndex='5000';overlay.dataset.actor=actor;
 const panel=document.createElement('section');panel.className='modal';panel.style.cssText='max-width:560px;width:calc(100% - 24px);padding:20px;max-height:85vh;overflow:auto';overlay.append(panel);
 const heading=document.createElement('h3');heading.textContent='Gửi tem sang app XPRINTER 420';panel.append(heading);
 const hint=document.createElement('p');hint.textContent='Lệnh tem đã sẵn sàng. Nếu XP420 chưa tự mở, bấm Mở XP420 bên dưới. App tự quét IP máy in; không tạo lệnh mới khi bấm mở lại.';panel.append(hint);
 for(const row of stored.rows){
  const card=document.createElement('div');card.style.cssText='padding:12px 0;border-bottom:1px solid var(--bd)';const text=document.createElement('p');text.textContent=row.title+' · '+row.count+' tem';card.append(text);
  if(Date.parse(row.expiresAt)>Date.now()){const link=document.createElement('a');link.className='bp';link.textContent='Mở XP420 để in';link.href='scftembridge://print?job='+encodeURIComponent(row.jobId)+'&token='+row.token;link.style.cssText='display:inline-block;padding:10px 14px;text-decoration:none;border-radius:8px';card.append(link);if(!(typeof scfIsAppleMobilePrint==='function'&&scfIsAppleMobilePrint())){const fallback=document.createElement('a');fallback.href=scfAndroidIntent(row);fallback.textContent='Không mở được? Thử cách Android';fallback.style.cssText='display:block;margin-top:12px;padding:10px 0';card.append(fallback);}}
  else {const expired=document.createElement('p');expired.textContent='Đã hết hạn mở lệnh. Kiểm tra lịch sử trước khi tạo lệnh khác.';card.append(expired);}panel.append(card);
 }
 const sync=document.createElement('button');sync.type='button';sync.textContent='Cập nhật kết quả';sync.onclick=async()=>{sync.disabled=true;try{const {data,error}=await invokeScfAuth({body:{action:'driver_android_status',jobIds:stored.rows.map(r=>r.jobId)}});if(error||!data?.ok)throw Error('Chưa cập nhật được trạng thái.');if(actor!==String(window.__SCF_ACCESS_CONTEXT?.employeeId||''))return;const ended=new Set((data.rows||[]).filter(r=>['done','error','uncertain','fallback'].includes(r.status)).map(r=>r.id));localStorage.setItem(stored.key,JSON.stringify(stored.rows.filter(r=>!ended.has(r.jobId))));scfShowAndroidPrintJobs();scfAndroidBadge();}catch(error){window.showToast(error.message,'warn');}finally{sync.disabled=false;}};
 const close=document.createElement('button');close.type='button';close.textContent='Đóng';close.onclick=()=>overlay.remove();const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;margin-top:16px';actions.append(sync,close);panel.append(actions);document.body.append(overlay);
}
function scfAndroidBadge(){
 const actor=String(window.__SCF_ACCESS_CONTEXT?.employeeId||'');const sheet=document.getElementById('scf-android-sheet');if(sheet&&sheet.dataset.actor!==actor)sheet.remove();document.getElementById('scf-android-badge')?.remove();
 const stored=scfAndroidPrintRows();if(!actor||!stored.rows.length)return;const badge=document.createElement('button');badge.type='button';badge.id='scf-android-badge';badge.className='bp';badge.textContent='Lệnh XPRINTER ('+stored.rows.length+')';badge.style.cssText='position:fixed;right:12px;bottom:86px;z-index:1700;padding:10px 14px';badge.onclick=scfShowAndroidPrintJobs;document.body.append(badge);
}
function scfQueueAndroidHandoff(access,title,count,{deferOpen=false}={}){const stored=scfAndroidPrintRows();if(stored.rows.length>=50)throw Error('Còn nhiều lệnh XP420 chờ đối chiếu. Cập nhật kết quả trước khi gửi thêm.');stored.rows.push({...access,title,count});localStorage.setItem(stored.key,JSON.stringify(stored.rows));scfAndroidBadge();if(!deferOpen)scfShowAndroidPrintJobs();}
function scfOpenX420PrintJob(access){
 const row=scfAndroidPrintRows().rows.find(item=>item.jobId===access?.jobId&&item.token===access?.token);
 if(!row||Date.parse(row.expiresAt)<=Date.now())throw Error('Lệnh mở XP420 đã hết hạn. Kiểm tra lịch sử trước khi gửi lại.');
 const href=scfAndroidIntent(row);
 // Keep the existing ticket visible when a browser requires another user tap.
 scfShowAndroidPrintJobs();
 try{window.location.assign(href);}catch{window.showToast('Bấm Mở app XPRINTER 420 để tiếp tục lệnh đã tạo.','warn');}
}
setInterval(scfAndroidBadge,5000);
