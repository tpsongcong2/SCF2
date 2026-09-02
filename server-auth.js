/* Supabase server authentication rollout.
   Keep disabled until the Edge Function and RLS migration are deployed. */
const SCF_SERVER_AUTH_ENABLED=true;

async function serverFunctionErrorMessage(error,data,fallback){
  const messageFrom=body=>{
    if(!body)return'';
    if(typeof body==='string')return body.trim();
    if(body.error)return typeof body.error==='string'?body.error:(body.error.message||JSON.stringify(body.error));
    if(body.message)return String(body.message);
    if(Array.isArray(body.errors))return body.errors.map(item=>item?.message||item).filter(Boolean).join('; ');
    return'';
  };
  const direct=messageFrom(data);
  if(direct)return direct;
  try{
    const response=error?.context;
    if(response&&typeof response.clone==='function'){
      const copy=response.clone();
      try{
        const detail=messageFrom(await copy.json());
        if(detail)return detail;
      }catch{
        const detail=messageFrom(await response.clone().text());
        if(detail)return detail;
      }
    }
  }catch(e){console.warn('Không đọc được nội dung lỗi Edge Function:',e?.message||e);}
  return error?.message||fallback;
}

async function serverUsernameLogin(username,password){
  if(!sb)throw new Error('Chưa kết nối được máy chủ xác thực.');
  const{data,error}=await sb.functions.invoke('scf-auth',{
    body:{action:'login',username:String(username||'').trim(),password:String(password||'')}
  });
  if(error)throw new Error(await serverFunctionErrorMessage(error,data,'Không thể đăng nhập qua máy chủ.'));
  if(!data?.access_token||!data?.refresh_token||!data?.employee)throw new Error(data?.error||'Máy chủ trả về phiên đăng nhập không hợp lệ.');
  const{error:sessionError}=await sb.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
  if(sessionError)throw sessionError;
  return data.employee;
}

async function getServerAuthSession(){
  if(!SCF_SERVER_AUTH_ENABLED||!sb)return null;
  const{data,error}=await sb.auth.getSession();
  if(error)throw error;
  return data?.session||null;
}

async function serverLogout(){
  if(SCF_SERVER_AUTH_ENABLED&&sb)try{await sb.auth.signOut();}catch(e){console.warn('Server logout:',e.message);}
}

async function serverLoadEmployees(){
  if(!sb)throw new Error('Chưa kết nối được máy chủ nhân viên.');
  const{data,error}=await sb.functions.invoke('scf-auth',{body:{action:'load_employees',appVariant:window.SCF_APP_VARIANT||'scfood'}});
  if(error||!Array.isArray(data?.employees))throw new Error(await serverFunctionErrorMessage(error,data,'Không tải được danh sách nhân viên.'));
  window.__SCF_CURRENT_EMPLOYEE=data.currentEmployee||null;
  return data.employees;
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
async function serverSaveEmployees(employees){
  if(!sb)throw new Error('Chưa kết nối được máy chủ nhân viên.');
  const payload=sanitizeEmployeesForServer(employees);
  const{data,error}=await sb.functions.invoke('scf-auth',{body:{action:'save_employees',employees:payload,appVariant:window.SCF_APP_VARIANT||'scfood'}});
  if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Không lưu được danh sách nhân viên.'));
  return data.employees||employees;
}

async function serverChangePassword(employeeId,currentPassword,newPassword,adminReset=false){
  if(!sb)throw new Error('Chưa kết nối được máy chủ đổi mật khẩu.');
  const{data,error}=await sb.functions.invoke('scf-auth',{
    body:{action:'change_password',employeeId:String(employeeId||''),currentPassword:String(currentPassword||''),newPassword:String(newPassword||''),adminReset:!!adminReset}
  });
  if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Không đổi được mật khẩu.'));
  return data;
}

async function requestAdminPasswordReset(username){
  if(!sb)throw new Error('Chưa kết nối được máy chủ khôi phục mật khẩu.');
  const{data,error}=await sb.functions.invoke('scf-auth',{
    body:{action:'request_admin_reset',username:String(username||'').trim()}
  });
  if(error)throw new Error(await serverFunctionErrorMessage(error,data,'Không thể gửi mã khôi phục.'));
  if(!data?.ok)throw new Error(data?.error||'Không thể gửi mã khôi phục.');
  return data;
}

async function confirmAdminPasswordReset(username,code,newPassword){
  if(!sb)throw new Error('Chưa kết nối được máy chủ khôi phục mật khẩu.');
  const{data,error}=await sb.functions.invoke('scf-auth',{
    body:{action:'confirm_admin_reset',username:String(username||'').trim(),code:String(code||'').trim(),newPassword:String(newPassword||'')}
  });
  if(error)throw new Error(await serverFunctionErrorMessage(error,data,'Không thể đặt lại mật khẩu.'));
  if(!data?.ok)throw new Error(data?.error||'Không thể đặt lại mật khẩu.');
  return data;
}
