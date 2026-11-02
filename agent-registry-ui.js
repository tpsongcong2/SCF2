function AgentRegistrySettings({printers,setPrinters,currentUser}){
 const [devices,setDevices]=useState([]),[agentId,setAgentId]=useState(''),[code,setCode]=useState(null),[message,setMessage]=useState(''),[working,setWorking]=useState(false);
 const allowed=['admin','administrator'].includes(String(currentUser?.role||'').toLowerCase());
 const active=useRef(true);useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
 const call=async body=>{const {data,error}=await invokeScfAuth({body});if(error||!data?.ok)throw Error(await serverFunctionErrorMessage(error,data,'Chưa tải được danh sách máy in.'));return data;};
 const load=async()=>{try{const data=await call({action:'agent_registry_list'});if(active.current)setDevices(data.devices||[]);}catch(error){if(active.current)setMessage(error.message);}};
 useEffect(()=>{if(!allowed)return;load();const timer=setInterval(load,30000);return()=>clearInterval(timer);},[currentUser?.id,allowed]);
 if(!allowed)return null;
 const target=(agentId||printers.labelAgentId||'SCF10').trim().toUpperCase();
 const issue=async()=>{
  if(working)return;
  if(devices.some(d=>d.agentId===target)&&!await window.scfConfirm('Mã SCF này đã đăng ký. Khi máy mới nhập mã, thiết bị cũ sẽ bị thay thế. Bạn muốn tạo mã đăng ký lại?','Đăng ký lại máy in'))return;
  setWorking(true);setMessage('');try{const data=await call({action:'agent_registry_issue',agentId:target});if(active.current)setCode({agentId:target,...data});}catch(error){setMessage(error.message);}finally{setWorking(false);}
 };
 const choose=(device,role)=>{
  setPrinters(previous=>({...previous,enabled:true,lanEnabled:true,autoRoute:true,...(role==='a4'?{a4AgentId:device.agentId,a4AutoAddress:true,a4LanUrl:device.preferredUrl||''}:{labelAgentId:device.agentId,labelAutoAddress:true,labelLanUrl:device.preferredUrl||'',labelPrinterRole:device.printers?.[previous.labelPrinterRole]?previous.labelPrinterRole:device.printers?.x350?'x350':'x420'})}));
  setMessage('Đã chọn '+device.agentId+' cho '+(role==='a4'?'A4':'tem')+'. Bấm Lưu cài đặt để áp dụng.');
 };
 return h('section',{className:'trip-shared-printers'},h('h3',null,'Máy in tự báo kết nối'),h('p',null,'Đăng ký máy một lần; Agent tự báo địa chỉ khi bật, mỗi phút và khi IP thay đổi.'),
  h('div',{className:'g2'},h('label',{className:'dm-field'},'Mã SCF đăng ký',h('input',{'aria-label':'Mã SCF đăng ký',value:agentId||printers.labelAgentId||'',disabled:working,onChange:e=>{setAgentId(e.target.value);setCode(null);}})),h('div',{style:{display:'flex',gap:8,alignItems:'end',flexWrap:'wrap'}},h('button',{type:'button',disabled:working,onClick:issue},'Tạo mã đăng ký Agent'),h('button',{type:'button','data-scf-action':'view',onClick:load},'Tải lại máy in'))),
  code&&h('div',{role:'status'},h('p',null,'Nhập mã này trong Agent → Kết nối Wi-Fi → Đăng ký với Admin · Máy '+code.agentId),h('input',{'aria-label':'Mã đăng ký một lần',readOnly:true,value:code.code,onClick:e=>e.target.select(),style:{width:'100%',fontFamily:'monospace'}}),h('small',null,'Hết hạn: '+new Date(code.expiresAt).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'}))),
  message&&h('p',{role:'status'},message),
  devices.length===0?h('p',null,'Chưa có máy đăng ký.'):devices.map(device=>h('div',{key:device.agentId,style:{border:'1px solid var(--bd)',borderRadius:8,padding:12,marginTop:10}},
   h('b',null,device.agentId+' · '+(device.machineName||'Máy tính')),h('p',null,(device.preferredUrl||'Chưa có địa chỉ LAN')+' · '+(Date.now()-Date.parse(device.lastSeen)<180000?'Vừa báo kết nối':'Chưa báo gần đây')),h('small',null,'Lần báo cuối: '+new Date(device.lastSeen).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'})+' · '+device.version),
   h('div',{style:{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}},h('button',{type:'button',disabled:!device.printers?.x350&&!device.printers?.x420,onClick:()=>choose(device,'label')},'Dùng '+device.agentId+' cho tem'),h('button',{type:'button',disabled:!device.printers?.canon,onClick:()=>choose(device,'a4')},'Dùng '+device.agentId+' cho A4')))));
}
