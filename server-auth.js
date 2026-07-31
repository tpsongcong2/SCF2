/* Supabase server authentication rollout.
   Keep disabled until the Edge Function and RLS migration are deployed. */
const SCF_SERVER_AUTH_ENABLED=false;

async function serverUsernameLogin(username,password){
  if(!sb)throw new Error('Chưa kết nối được máy chủ xác thực.');
  const{data,error}=await sb.functions.invoke('scf-auth',{
    body:{action:'login',username:String(username||'').trim(),password:String(password||'')}
  });
  if(error)throw new Error(data?.error||error.message||'Không thể đăng nhập qua máy chủ.');
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
  const{data,error}=await sb.functions.invoke('scf-auth',{body:{action:'load_employees'}});
  if(error||!Array.isArray(data?.employees))throw new Error(data?.error||error?.message||'Không tải được danh sách nhân viên.');
  return data.employees;
}

async function serverSaveEmployees(employees){
  if(!sb)throw new Error('Chưa kết nối được máy chủ nhân viên.');
  const{data,error}=await sb.functions.invoke('scf-auth',{body:{action:'save_employees',employees}});
  if(error||!data?.ok)throw new Error(data?.error||error?.message||'Không lưu được danh sách nhân viên.');
  return data.employees||employees;
}

async function serverChangePassword(employeeId,currentPassword,newPassword,adminReset=false){
  if(!sb)throw new Error('Chưa kết nối được máy chủ đổi mật khẩu.');
  const{data,error}=await sb.functions.invoke('scf-auth',{
    body:{action:'change_password',employeeId:String(employeeId||''),currentPassword:String(currentPassword||''),newPassword:String(newPassword||''),adminReset:!!adminReset}
  });
  if(error||!data?.ok)throw new Error(data?.error||error?.message||'Không đổi được mật khẩu.');
  return data;
}

async function requestAdminPasswordReset(username){
  if(!sb)throw new Error('Chưa kết nối được máy chủ khôi phục mật khẩu.');
  const{data,error}=await sb.functions.invoke('scf-auth',{
    body:{action:'request_admin_reset',username:String(username||'').trim()}
  });
  if(error)throw new Error(data?.error||error.message||'Không thể gửi mã khôi phục.');
  if(!data?.ok)throw new Error(data?.error||'Không thể gửi mã khôi phục.');
  return data;
}

async function confirmAdminPasswordReset(username,code,newPassword){
  if(!sb)throw new Error('Chưa kết nối được máy chủ khôi phục mật khẩu.');
  const{data,error}=await sb.functions.invoke('scf-auth',{
    body:{action:'confirm_admin_reset',username:String(username||'').trim(),code:String(code||'').trim(),newPassword:String(newPassword||'')}
  });
  if(error)throw new Error(data?.error||error.message||'Không thể đặt lại mật khẩu.');
  if(!data?.ok)throw new Error(data?.error||'Không thể đặt lại mật khẩu.');
  return data;
}
