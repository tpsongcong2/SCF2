/* Direct LAN payloads; the server signs only scoped metadata + SHA-256, never the artwork. */
function scfLanPrintUrl(raw){
  let url;try{url=new URL(String(raw||'').trim());}catch{throw Error('Nhập địa chỉ Wi-Fi của máy tính, ví dụ http://192.168.1.10:18786');}
  const parts=url.hostname.split('.').map(Number),privateIp=parts.length===4&&parts.every(v=>Number.isInteger(v)&&v>=0&&v<=255)&&(parts[0]===10||parts[0]===192&&parts[1]===168||parts[0]===172&&parts[1]>=16&&parts[1]<=31);
  if(url.protocol!=='http:'||!privateIp||url.port!=='18786'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Địa chỉ phải là IP nội bộ của máy tính, cổng 18786; không thêm đường dẫn.');
  return url.origin;
}
async function scfLanRequest(endpoint,path,body,timeoutMs=12000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(scfLanPrintUrl(endpoint)+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal,credentials:'omit',cache:'no-store',targetAddressSpace:'local'});
    const data=await response.json();if(!response.ok||!data?.ok)throw Error(data?.error||'Máy tính chưa nhận lệnh in.');return data;
  }catch(error){if(error?.name==='AbortError'||error instanceof TypeError)throw Error('Chưa nhận được phản hồi Wi-Fi. Kiểm tra cùng mạng, Agent Wi-Fi và quyền mạng nội bộ của trình duyệt. Không tự gửi lại qua máy chủ.');throw error;}
  finally{clearTimeout(timer);}
}
async function scfSelectPrintRoute(settings,printerRole,strictLan=false){
  const manual=printerRole==='canon'?settings.a4LanUrl:settings.labelLanUrl;
  if(!settings.autoRoute)return {route:'lan',endpoint:strictLan?scfLanPrintUrl(manual):manual};
  const {data,error}=await invokeScfAuth({body:{action:'driver_print_route',agentId:printerRole==='canon'?settings.a4AgentId:settings.agentId,printerRole}});
  if(error||!data?.ok)throw Error(await serverFunctionErrorMessage(error,data,'Chưa kiểm tra được máy in.'));
  if(data.route!=='lan'){if(strictLan)throw Error('SCF10 chưa sẵn sàng qua Wi-Fi. Kiểm tra Agent và cùng mạng; chưa gửi in từ xa.');return {route:'cloud'};}
  try{const endpoints=(data.endpoints?.length?data.endpoints:[data.endpoint]).slice(0,3);const endpoint=await Promise.any(endpoints.map(async endpoint=>{await scfLanRequest(endpoint,'/health',{authorization:data.lanAuthorization},2000);return endpoint;}));return {route:'lan',endpoint};}
  catch{if(strictLan)throw Error('Chưa kết nối Wi-Fi SCF10. Kiểm tra cùng mạng và quyền mạng nội bộ. Chưa gửi in từ xa.');return {route:'cloud'};}
}
const scfLanActive=new Map();
function scfLanPendingKey(){return 'scf_lan_pending_'+String(window.__SCF_ACCESS_CONTEXT?.employeeId||'');}
function scfLanPending(){try{const rows=JSON.parse(localStorage.getItem(scfLanPendingKey())||'[]');return Array.isArray(rows)?rows.slice(0,50):[];}catch{return [];}}
function scfLanStorePending(row,remove=false){const rows=scfLanPending().filter(item=>item.id!==row.id);if(!remove){if(rows.length>=50)throw Error('Còn quá nhiều lệnh Wi-Fi chưa đối chiếu. Hãy kiểm tra các lệnh cũ trước khi gửi thêm.');rows.push(row);}localStorage.setItem(scfLanPendingKey(),JSON.stringify(rows));}
function scfLanFinishRetry(row,status){if(status==='done'){localStorage.removeItem(row.retryKey);localStorage.removeItem(row.retryKey+'_failed');}else localStorage.setItem(row.retryKey+'_failed',status);}
async function scfLanSaveReceipt(receipt){
  const {data,error}=await invokeScfAuth({body:{action:'driver_lan_receipt',receipt}});
  if(error||!data?.ok)throw Error(await serverFunctionErrorMessage(error,data,'Đang chờ cập nhật lịch sử in.'));
}
async function scfLanTrack(row,wait=false){
  if(scfLanActive.has(row.id))return scfLanActive.get(row.id);
  const task=(async()=>{
    const actor=String(window.__SCF_ACCESS_CONTEXT?.employeeId||'');
    if(row.receipt){
      const prior=JSON.parse(row.receipt.payload);
      if(['done','error','uncertain'].includes(prior.status)){
        await scfLanSaveReceipt(row.receipt);if(actor!==String(window.__SCF_ACCESS_CONTEXT?.employeeId||''))return;
        scfLanStorePending(row,true);scfLanFinishRetry(row,prior.status);if(prior.status!=='done')throw Error(prior.error||'Lệnh Wi-Fi bị gián đoạn. Kiểm tra giấy trước khi in lại.');return;
      }
    }
    for(let attempt=0;attempt<(wait?30:1);attempt++){
      if(actor!==String(window.__SCF_ACCESS_CONTEXT?.employeeId||''))return;
      if(Date.now()>row.expiresAt*1000){
        const {data,error}=await invokeScfAuth({body:{action:'driver_lan_resume',jobId:row.id}});
        if(error||!data?.ok)throw Error('Chưa đối chiếu được lệnh in Wi-Fi cũ.');
        row.authorization=data.lanAuthorization;row.expiresAt=JSON.parse(row.authorization.payload).expiresAt;
      }
      const result=await scfLanRequest(row.endpoint,'/status',{authorization:row.authorization});
      if(actor!==String(window.__SCF_ACCESS_CONTEXT?.employeeId||''))return;
      const status=JSON.parse(result.receipt.payload).status;
      // Only the server verifies receipts; never mark history done from an unsigned status.
      row.receipt=result.receipt;scfLanStorePending(row);
      await scfLanSaveReceipt(result.receipt);
      if(actor!==String(window.__SCF_ACCESS_CONTEXT?.employeeId||''))return;
      if(['done','error','uncertain'].includes(status)){scfLanStorePending(row,true);scfLanFinishRetry(row,status);if(status==='done')return;throw Error(status==='uncertain'?'Lệnh bị gián đoạn khi đang in. Kiểm tra giấy trước khi in lại.':JSON.parse(result.receipt.payload).error||'Máy in chưa in được.');}
      if(wait)await new Promise(resolve=>setTimeout(resolve,1000));
    }
  })().finally(()=>scfLanActive.delete(row.id));
  scfLanActive.set(row.id,task);return task;
}
async function scfSendLanPrint(artwork,tripContext,endpoint,beforeSend){
  endpoint=scfLanPrintUrl(endpoint);beforeSend?.();
  const actor=String(window.__SCF_ACCESS_CONTEXT?.employeeId||'');if(!actor)throw Error('Hãy đăng nhập SCFOOD để in.');
  const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(v=>v.toString(16).padStart(2,'0')).join('');
  const retryKey='scf_lan_retry_'+actor+'_'+await hash(JSON.stringify({artwork,tripContext}));
  if(localStorage.getItem(retryKey+'_failed')){
    if(!await window.scfConfirm('Lệnh trước đã lỗi hoặc bị gián đoạn. Bạn đã kiểm tra giấy và hàng đợi máy in, đồng ý gửi một lệnh in mới?','Xác nhận in lại'))throw Error('Đã giữ nguyên lệnh trước; chưa gửi in lại.');
    localStorage.removeItem(retryKey);localStorage.removeItem(retryKey+'_failed');
  }
  let id=localStorage.getItem(retryKey)||scfLanPending().find(row=>row.retryKey===retryKey)?.id;if(!id){id='PJ'+Date.now().toString(36)+crypto.randomUUID().replaceAll('-','').slice(0,12);localStorage.setItem(retryKey,id);}
  const job={...artwork,id},jobJson=JSON.stringify(job);
  if(new Blob([jobJson]).size>30*1024*1024)throw Error('Lệnh Wi-Fi vượt 30 MB. Chọn ít đơn hơn để in.');
  const metadata={...job,lanHash:await hash(jobJson),imageCount:job.images?.length||0};delete metadata.images;delete metadata.html;
  const {data,error}=await invokeScfAuth({body:{action:'driver_print',transport:'lan',job:metadata,tripContext}});
  if(error||!data?.ok||!data.lanAuthorization)throw Error(await serverFunctionErrorMessage(error,data,'Chưa xác nhận được quyền in Wi-Fi.'));
  beforeSend?.();if(actor!==String(window.__SCF_ACCESS_CONTEXT?.employeeId||''))throw Error('Tài khoản đã thay đổi.');
  const row={id,endpoint,authorization:data.lanAuthorization,expiresAt:JSON.parse(data.lanAuthorization.payload).expiresAt,retryKey};
  scfLanStorePending(row);
  const received=await scfLanRequest(endpoint,'/print',{jobJson,authorization:row.authorization},20000);
  if(actor!==String(window.__SCF_ACCESS_CONTEXT?.employeeId||''))throw Error('Tài khoản đã thay đổi.');
  row.receipt=received.receipt;scfLanStorePending(row);
  // Failure to save history never sends a second print job.
  try{await scfLanSaveReceipt(received.receipt);}catch{}
  const localStatus=JSON.parse(received.receipt.payload);
  if(['error','uncertain'].includes(localStatus.status)){scfLanFinishRetry(row,localStatus.status);throw Error(localStatus.error||'Lệnh trước chưa in được. Kiểm tra giấy trước khi in lại.');}
  window.showToast('Máy tính đã nhận lệnh in qua Wi-Fi.','success');
  scfLanTrack(row,true).catch(error=>window.showToast(error.message,'warn'));
  return {id,transport:'lan'};
}
window.scfSendLanPrint=scfSendLanPrint;
setInterval(()=>{
  if(!window.__SCF_ACCESS_CONTEXT?.employeeId)return;
  for(const row of scfLanPending())if(!scfLanActive.has(row.id))scfLanTrack(row).catch(()=>{});
},15000);
