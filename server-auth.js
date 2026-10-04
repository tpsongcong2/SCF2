/* Supabase server authentication rollout.
   Keep disabled until the Edge Function and RLS migration are deployed. */
const SCF_SERVER_AUTH_ENABLED=true;
const SCF_AUTH_REQUEST_TIMEOUT_MS=30000;
function scfRecordAuthDiagnostic(entry){
  if(typeof window==='undefined')return;
  const actorId=String(entry?.actorId??window.__SCF_ACCESS_CONTEXT?.employeeId??'');
  if(actorId&&actorId!==String(window.__SCF_ACCESS_CONTEXT?.employeeId||''))return;
  let rows=window.__SCF_AUTH_DIAGNOSTICS;
  if(!rows)try{rows=JSON.parse(sessionStorage.getItem('scf_auth_diagnostics')||'[]');}catch{}
  if(!Array.isArray(rows))rows=[];
  window.__SCF_AUTH_DIAGNOSTICS=[{...entry,actorId},...rows].slice(0,40);
  try{sessionStorage.setItem('scf_auth_diagnostics',JSON.stringify(window.__SCF_AUTH_DIAGNOSTICS));}catch{}
}
async function scfMeasureAuthStage(stage,task){
  const start=Date.now();let ok=false;
  try{const result=await task();ok=!result?.error;return result;}
  finally{scfRecordAuthDiagnostic({stage,ms:Date.now()-start,ok,at:new Date().toISOString()});}
}
if(typeof window!=='undefined')window.scfDownloadAuthDiagnostics=()=>{
  let rows=window.__SCF_AUTH_DIAGNOSTICS;
  if(!rows)try{rows=JSON.parse(sessionStorage.getItem('scf_auth_diagnostics')||'[]');}catch{}
  const url=URL.createObjectURL(new Blob([JSON.stringify({version:typeof SCF_BUILD_VERSION==='undefined'?'':SCF_BUILD_VERSION,entries:rows||[]},null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='SCFOOD-kiem-tra-dang-nhap.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
};

// Supabase Functions supports AbortSignal. Always abort the underlying fetch
// when a request times out so a slow request cannot continue piling up behind
// newer retries in the browser and at the Edge Function.
async function invokeScfAuth(options,timeoutMs=SCF_AUTH_REQUEST_TIMEOUT_MS){
  // Startup owns retries for employee context; never multiply its three attempts.
  const readOnly=['load_permitted_collection','load_permitted_collection_versions'].includes(options?.body?.action);
  for(let attempt=0;;attempt++){
    try{
      const result=await invokeScfAuthOnce(options,timeoutMs);
      const status=Number(result?.error?.context?.status||0);
      const transient=result?.error&&(status===408||status===429||status>=500||(!status&&/fetch|network|send a request|load failed/i.test(result.error.message||'')));
      if(!readOnly||!transient||attempt>=1)return result;
    }catch(error){
      if(!readOnly||attempt>=1||!(error?.code==='SCF_REMOTE_TIMEOUT'||/fetch|network|load failed/i.test(error?.message||'')))throw error;
    }
    await new Promise(resolve=>setTimeout(resolve,700));
  }
}
async function invokeScfAuthOnce(options,timeoutMs=SCF_AUTH_REQUEST_TIMEOUT_MS){
  if(!sb)throw new Error('Chưa kết nối được máy chủ xác thực.');
  const controller=new AbortController();
  const started=Date.now(),action=String(options?.body?.action||'request');
  const actorId=String(typeof window==='undefined'?'':window.__SCF_ACCESS_CONTEXT?.employeeId||'');
  const diagnosticId='scf-'+started.toString(36)+'-'+Math.random().toString(36).slice(2,10);
  let timer,status=0,outcome='error',server;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();const error=new Error('Supabase timeout — '+action+' — mã '+diagnosticId);error.code='SCF_REMOTE_TIMEOUT';reject(error);},Math.max(1000,Number(timeoutMs)||SCF_AUTH_REQUEST_TIMEOUT_MS));});
  try{
    const result=await Promise.race([sb.functions.invoke('scf-auth',{...options,body:{...options.body,diagnosticId},signal:controller.signal}),timeout]);
    status=Number(result?.error?.context?.status||(!result?.error?200:0));
    server=result?.data?.diagnostic;
    if(!server&&result?.error?.context?.clone)try{server=(await result.error.context.clone().json())?.diagnostic;}catch{}
    if(result?.error&&controller.signal.aborted){
      const error=new Error('Supabase timeout');error.code='SCF_REMOTE_TIMEOUT';throw error;
    }
    outcome=result?.error?'error':'ok';return result;
  }catch(error){
    if(controller.signal.aborted||error?.name==='AbortError'){
      outcome='timeout';const timeoutError=new Error('Supabase timeout — '+action+' — mã '+diagnosticId);timeoutError.code='SCF_REMOTE_TIMEOUT';throw timeoutError;
    }
    throw error;
  }finally{
    clearTimeout(timer);
    scfRecordAuthDiagnostic({id:diagnosticId,actorId,stage:action,ms:Date.now()-started,status,outcome,at:new Date().toISOString(),server:server?{ms:server.ms,steps:(server.steps||[]).map(step=>({stage:step.stage,ms:step.ms,ok:step.ok,code:step.code}))}:undefined});
  }
}

async function serverFunctionErrorMessage(error,data,fallback){
  const finish=message=>{
    const raw=String(message||fallback);
    const text=/Failed to send a request to the Edge Function|Failed to fetch|NetworkError|Load failed/i.test(raw)
      ?'Không kết nối được máy chủ xác thực. Vui lòng kiểm tra mạng hoặc cập nhật Edge Function rồi thử lại.'
      :raw;
    if(text.includes('Phiên đăng nhập không hợp lệ')&&!window.__SCF_SESSION_REPLACEMENT_PENDING){
      window.__SCF_SESSION_REPLACEMENT_PENDING=true;
      setTimeout(()=>window.dispatchEvent(new CustomEvent('scf-session-replaced')),0);
    }
    return text;
  };
  const messageFrom=body=>{
    if(!body)return'';
    if(typeof body==='string')return body.trim();
    if(body.error)return typeof body.error==='string'?body.error:(body.error.message||JSON.stringify(body.error));
    if(body.message)return String(body.message);
    if(Array.isArray(body.errors))return body.errors.map(item=>item?.message||item).filter(Boolean).join('; ');
    return'';
  };
  const direct=messageFrom(data);
  if(direct)return finish(direct);
  try{
    const response=error?.context;
    if(response&&typeof response.clone==='function'){
      const copy=response.clone();
      try{
        const detail=messageFrom(await copy.json());
        if(detail)return finish(detail);
      }catch{
        const detail=messageFrom(await response.clone().text());
        if(detail)return finish(detail);
      }
    }
  }catch(e){console.warn('Không đọc được nội dung lỗi Edge Function:',e?.message||e);}
  return finish(error?.message||fallback);
}
async function scfServerSaveError(error,data,fallback){
  let body=data;
  if(error?.context?.clone)try{body=await error.context.clone().json();}catch{}
  const result=new Error(await serverFunctionErrorMessage(error,body,fallback));
  if(/^SCF_[A-Z_]+$/.test(String(body?.code||'')))result.code=body.code;
  result.diagnosticId=String(body?.diagnostic?.id||'');
  return result;
}

async function serverUsernameLogin(username,password,forceTakeover=false){
  if(!sb)throw new Error('Chưa kết nối được máy chủ xác thực.');
  const{data,error}=await invokeScfAuth({
    body:{action:'login',username:String(username||'').trim(),password:String(password||''),deviceId:window.scfDeviceId?.()||'',deviceLabel:window.scfDeviceLabel?.()||'',deviceType:window.scfDeviceType?.()||'desktop',forceTakeover:forceTakeover===true}
  });
  if(error)throw new Error(await serverFunctionErrorMessage(error,data,'Không thể đăng nhập qua máy chủ.'));
  if(data?.code==='SESSION_ACTIVE'){
    const activeError=new Error(data.error||'Tài khoản đã có máy đăng nhập.');
    activeError.code='SESSION_ACTIVE';activeError.activeDeviceLabel=data.activeDeviceLabel||'một thiết bị khác';
    throw activeError;
  }
  if(!data?.access_token||!data?.refresh_token||!data?.employee)throw new Error(data?.error||'Máy chủ trả về phiên đăng nhập không hợp lệ.');
  const{error:sessionError}=await scfMeasureAuthStage('install_session',()=>withRemoteTimeout(sb.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token}),12000));
  if(sessionError)throw sessionError;
  window.__SCF_SESSION_REPLACEMENT_PENDING=false;
  window.__SCF_SESSION_REPLACEMENT_HANDLED=false;
  return data.employee;
}

async function getServerAuthSession(){
  if(!SCF_SERVER_AUTH_ENABLED||!sb)return null;
  const{data,error}=await scfMeasureAuthStage('read_local_session',()=>withRemoteTimeout(sb.auth.getSession(),12000));
  if(error)throw error;
  return data?.session||null;
}

async function serverLogout(){
  if(SCF_SERVER_AUTH_ENABLED&&sb)try{await invokeScfAuth({body:{action:'release_session'}},10000);await sb.auth.signOut();}catch(e){console.warn('Server logout:',e.message);}
}
async function serverTouchSession(){
  if(!SCF_SERVER_AUTH_ENABLED||!sb)return false;
  const{data,error}=await invokeScfAuth({body:{action:'touch_session'}},10000);
  if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Không duy trì được phiên đăng nhập.'));
  return true;
}

async function serverLoadEmployeeContext(requestTimeoutMs=15000){
  if(!sb)throw new Error('Chưa kết nối được máy chủ nhân viên.');
  const{data,error}=await invokeScfAuth({body:{action:'load_employees',appVariant:window.SCF_APP_VARIANT||'scfood'}},requestTimeoutMs);
  if(error||!Array.isArray(data?.employees))throw new Error(await serverFunctionErrorMessage(error,data,'Không tải được danh sách nhân viên.'));
  return data;
}
async function serverLoadEmployees(){
  const data=await serverLoadEmployeeContext();
  window.__SCF_CURRENT_EMPLOYEE=data.currentEmployee||null;
  return data.employees;
}
async function serverRegisterOwnFace(faceTemplate){
  if(!sb)throw new Error('Chưa kết nối được máy chủ nhân viên.');
  const{data,error}=await invokeScfAuth({body:{action:'register_own_face',faceTemplate}},20000);
  if(error||!data?.ok||!data?.employee)throw new Error(await serverFunctionErrorMessage(error,data,'Không đăng ký được khuôn mặt.'));
  return data.employee;
}
async function serverLoadPermittedCollection(key){
  if(!sb)throw new Error('Chưa kết nối được máy chủ dữ liệu.');
  const{data,error}=await invokeScfAuth({body:{action:'load_permitted_collection',key:String(key||'')}});
  if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Không tải được dữ liệu.'));
  return{value:data.value,updatedAt:data.updatedAt||''};
}

async function serverLoadPermittedCollectionVersions(keys){
  if(!sb)throw new Error('Chưa kết nối được máy chủ dữ liệu.');
  const requested=[...new Set((keys||[]).map(String).filter(Boolean))];
  if(!requested.length)return[];
  const{data,error}=await invokeScfAuth({body:{action:'load_permitted_collection_versions',keys:requested}});
  if(error||!data?.ok||!Array.isArray(data?.versions))throw new Error(await serverFunctionErrorMessage(error,data,'Không kiểm tra được phiên bản dữ liệu.'));
  return data.versions;
}

async function serverLoadOrderSyncRecords(ids,requestTimeoutMs=15000){
  if(!sb)throw new Error('Chưa kết nối được máy chủ dữ liệu.');
  const requested=[...new Set((ids||[]).map(String).filter(Boolean))];
  if(!requested.length)return{items:[],updatedAt:''};
  const{data,error}=await invokeScfAuth({body:{action:'load_order_sync_records',ids:requested}},requestTimeoutMs);
  if(error||!data?.ok||!Array.isArray(data?.items))throw new Error(await serverFunctionErrorMessage(error,data,'Không kiểm tra được trạng thái lưu đơn hàng.'));
  return{items:data.items,updatedAt:data.updatedAt||''};
}

function serverEmployeeIsPrivileged(employee){
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const role=normalize(employee?.role).replace(/\s+/g,'');
  return role==='admin'||role==='administrator'||normalize(employee?.permissionProfileId)==='director'||normalize(employee?.dept)==='ban giam doc';
}
function sanitizeEmployeesForServer(employees){
  const source=Array.isArray(employees)?employees:[];
  const faceMask=window.SCF_APP_VARIANT==='face-mask';
  const scoped=source.filter(employee=>serverEmployeeIsPrivileged(employee)===faceMask);
  // Nếu đây là hàng đợi cũ chỉ chứa dữ liệu của app còn lại, giữ nguyên để Edge Function
  // nhận biết và bảo toàn vùng dữ liệu hiện tại thay vì hiểu nhầm là yêu cầu xóa sạch.
  if(source.length&&!scoped.length)return source;
  const ids=new Set(),usernames=new Set(),clean=[];
  for(const employee of scoped){
    const id=String(employee?.id||'').trim();
    const username=String(employee?.username||'').trim().toLowerCase();
    if(!id||!username||ids.has(id)||usernames.has(username))continue;
    ids.add(id);usernames.add(username);clean.push(employee);
  }
  return clean;
}
async function serverLoadInvoiceOrientations(items){
  const{data,error}=await invokeScfAuth({body:{action:'load_invoice_orientations',items}},12000);
  if(error||!data?.ok)throw await scfServerSaveError(error,data,'Chưa đọc được chiều ảnh trên máy chủ.');
  return data.items||[];
}
async function serverSaveInvoiceOrientation(item){
  const{data,error}=await invokeScfAuth({body:{action:'save_invoice_orientation',...item}},12000);
  if(error||(!data?.ok&&!data?.conflict))throw await scfServerSaveError(error,data,'Chưa lưu được chiều ảnh lên máy chủ.');
  return data;
}
async function serverSaveEmployees(employees,requestTimeoutMs=SCF_AUTH_REQUEST_TIMEOUT_MS){
  if(!sb)throw new Error('Chưa kết nối được máy chủ nhân viên.');
  const payload=sanitizeEmployeesForServer(employees);
  const{data,error}=await invokeScfAuth({body:{action:'save_employees',employees:payload,appVariant:window.SCF_APP_VARIANT||'scfood'}},requestTimeoutMs);
  if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Không lưu được danh sách nhân viên.'));
  return data.employees||employees;
}

async function serverSaveAutoTrips(trips,requestTimeoutMs=SCF_AUTH_REQUEST_TIMEOUT_MS){
  if(!sb)throw new Error('Chưa kết nối được máy chủ chuyến tự động.');
  const{data,error}=await invokeScfAuth({
    body:{action:'save_auto_trips',trips:Array.isArray(trips)?trips:[]}
  },requestTimeoutMs);
  if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Không lưu được chuyến tự động.'));
  return data.trips||trips;
}

async function serverSavePermittedCollection(key,value,expectedUpdatedAt='',baseValue,requestTimeoutMs=SCF_AUTH_REQUEST_TIMEOUT_MS){
  if(!sb)throw new Error('Chưa kết nối được máy chủ dữ liệu.');
  const{data,error}=await invokeScfAuth({
    body:{action:'save_permitted_collection',key:String(key||''),value:value===undefined?null:value,baseValue:baseValue===undefined?undefined:baseValue,enforceVersion:true,expectedUpdatedAt:String(expectedUpdatedAt||'')}
  },requestTimeoutMs);
  if(data?.conflict){
    const ids=Array.isArray(data.conflictIds)&&data.conflictIds.length?' Các mã đang bị sửa đồng thời: '+data.conflictIds.join(', ')+'.':'';
    const conflict=new Error('Dữ liệu trên máy chủ vừa thay đổi'+(data.actorName?' bởi '+data.actorName:'')+'. Thay đổi trên máy này vẫn được giữ để kiểm tra.'+ids);
    conflict.code='SCF_WRITE_CONFLICT';throw conflict;
  }
  if(data?.duplicateCode){
    const duplicate=new Error(data.error||'Mã đơn hàng bị trùng. Vui lòng nhập lại mã khác.');
    duplicate.code='SCF_DUPLICATE_ORDER_CODE';throw duplicate;
  }
  if(data?.duplicateOrder){
    const duplicate=new Error(data.error||'Đơn hàng này đã tồn tại trên máy chủ.');
    duplicate.code='SCF_DUPLICATE_DELIVERY_ORDER';throw duplicate;
  }
  if(error||!data?.ok)throw await scfServerSaveError(error,data,'Không đồng bộ được dữ liệu.');
  return{value:data.value||value,updatedAt:data.updatedAt||''};
}

async function serverPatchPermittedCollection(key,patches,expectedUpdatedAt='',requestTimeoutMs=SCF_AUTH_REQUEST_TIMEOUT_MS){
  if(!sb)throw new Error('Chưa kết nối được máy chủ dữ liệu.');
  const{data,error}=await invokeScfAuth({
    body:{action:'patch_permitted_collection',key:String(key||''),patches:Array.isArray(patches)?patches:[],enforceVersion:true,expectedUpdatedAt:String(expectedUpdatedAt||'')}
  },requestTimeoutMs);
  if(data?.conflict){
    const conflict=new Error('Dữ liệu trên máy chủ vừa thay đổi. App sẽ tự đồng bộ lại thay đổi này.');
    conflict.code='SCF_WRITE_CONFLICT';throw conflict;
  }
  if(data?.duplicateOrder){
    const duplicate=new Error(data.error||'Đơn hàng này đã tồn tại trên máy chủ.');
    duplicate.code='SCF_DUPLICATE_DELIVERY_ORDER';throw duplicate;
  }
  if(error||!data?.ok)throw await scfServerSaveError(error,data,'Không đồng bộ được thay đổi của đơn hàng.');
  return{items:Array.isArray(data.items)?data.items:[],updatedAt:data.updatedAt||'',patched:true};
}

async function serverLoadSupabaseUsage(){
  if(!sb)throw new Error('Chưa kết nối được máy chủ báo cáo dung lượng.');
  const{data,error}=await invokeScfAuth({body:{action:'load_supabase_usage'}});
  if(error||!data?.ok||!data?.usage)throw new Error(await serverFunctionErrorMessage(error,data,'Không tải được dung lượng Supabase.'));
  return data.usage;
}

async function serverChangePassword(employeeId,currentPassword,newPassword,adminReset=false){
  if(!sb)throw new Error('Chưa kết nối được máy chủ đổi mật khẩu.');
  const{data,error}=await invokeScfAuth({
    body:{action:'change_password',employeeId:String(employeeId||''),currentPassword:String(currentPassword||''),newPassword:String(newPassword||''),adminReset:!!adminReset}
  });
  if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Không đổi được mật khẩu.'));
  return data;
}

async function requestAdminPasswordReset(username){
  if(!sb)throw new Error('Chưa kết nối được máy chủ khôi phục mật khẩu.');
  const{data,error}=await invokeScfAuth({
    body:{action:'request_admin_reset',username:String(username||'').trim()}
  });
  if(error)throw new Error(await serverFunctionErrorMessage(error,data,'Không thể gửi mã khôi phục.'));
  if(!data?.ok)throw new Error(data?.error||'Không thể gửi mã khôi phục.');
  return data;
}

async function confirmAdminPasswordReset(username,code,newPassword){
  if(!sb)throw new Error('Chưa kết nối được máy chủ khôi phục mật khẩu.');
  const{data,error}=await invokeScfAuth({
    body:{action:'confirm_admin_reset',username:String(username||'').trim(),code:String(code||'').trim(),newPassword:String(newPassword||'')}
  });
  if(error)throw new Error(await serverFunctionErrorMessage(error,data,'Không thể đặt lại mật khẩu.'));
  if(!data?.ok)throw new Error(data?.error||'Không thể đặt lại mật khẩu.');
  return data;
}
