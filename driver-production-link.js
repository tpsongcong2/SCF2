/* Opt-in only. Capture quantities and schedule when loading; never edit production yields. */
function DeliveryTripSettings({uiSettings,setUiSettings,currentUser}){
 const [settingsTab,setSettingsTab]=useState('scf');const settingsId=React.useId();
 const [printers,setPrinters]=useState(()=>normalizeUiSettings(uiSettings).driverPrinters);
 useEffect(()=>setPrinters(normalizeUiSettings(uiSettings).driverPrinters),[uiSettings?.driverPrinters]);
 const [workflowRequired,setWorkflowRequired]=useState(uiSettings?.driverWorkflowRequired!==false);
 useEffect(()=>setWorkflowRequired(uiSettings?.driverWorkflowRequired!==false),[uiSettings?.driverWorkflowRequired]);
 const [enabled,setEnabled]=useState(uiSettings?.driverProductionLink===true),[busy,setBusy]=useState(false);
 const [pairAgent,setPairAgent]=useState(''),[pairingKey,setPairingKey]=useState(''),[lanMessage,setLanMessage]=useState('');
 useEffect(()=>setEnabled(uiSettings?.driverProductionLink===true),[uiSettings?.driverProductionLink]);
 if(!['admin','administrator'].includes(String(currentUser?.role||'').toLowerCase()))return null;
 const save=async()=>{
  if(busy)return;setBusy(true);
  try{
   const printerSettings=normalizeUiSettings({driverPrinters:printers}).driverPrinters;
   if(printerSettings.enabled&&[printerSettings.labelAgentId,printerSettings.a4AgentId].some(id=>! /^[A-Z0-9_-]{1,64}$/.test(id)))throw Error('Mã SCF chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới.');
   if(printerSettings.lanEnabled){if(!printerSettings.enabled)throw Error('Bật cấu hình máy in chung trước khi dùng Wi-Fi.');if(!printerSettings.labelAutoAddress&&(printerSettings.labelLanUrl||!printerSettings.autoRoute))printerSettings.labelLanUrl=scfLanPrintUrl(printerSettings.labelLanUrl);if(!printerSettings.a4AutoAddress&&(printerSettings.a4LanUrl||!printerSettings.autoRoute))printerSettings.a4LanUrl=scfLanPrintUrl(printerSettings.a4LanUrl);}
   printerSettings.androidPrinterIp='';
   let startedAt=uiSettings?.driverProductionLinkStartedAt||'';
   if(enabled&&uiSettings?.driverProductionLink!==true){if(!await window.scfConfirm('Từ thời điểm kết nối, khi lái xe tích đã xếp lên xe, nguồn đơn sẽ được xác nhận đã sản xuất xong. Các lần tích trước đây không áp dụng. Bạn xác nhận bật kết nối?','Kết nối kiểm hàng với sản xuất'))return;startedAt=new Date().toISOString();}
   setUiSettings(previous=>({...normalizeUiSettings(previous),driverProductionLink:enabled,driverProductionLinkStartedAt:startedAt,driverWorkflowRequired:workflowRequired,driverPrinters:printerSettings}));
   window.showToast('Đã ghi nhận cài đặt chuyến giao hàng; đang đồng bộ.','info');
  }catch(error){window.showToast(error.message||'Chưa lưu được cài đặt.','error');}finally{setBusy(false);}
 };
 const pair=async()=>{
  if(busy)return;setBusy(true);setLanMessage('');
  try{const agentId=pairAgent||printers.labelAgentId;const {data,error}=await invokeScfAuth({body:{action:'driver_lan_pair',agentId,pairingKey}});if(error||!data?.ok)throw Error(await serverFunctionErrorMessage(error,data,'Chưa ghép được máy in.'));setPairingKey('');setLanMessage('Đã ghép nối '+agentId+'. Mã ghép nối không lưu trên điện thoại.');}catch(error){setLanMessage(error.message);}finally{setBusy(false);}
 };
 const testLan=async()=>{
  if(busy)return;setBusy(true);setLanMessage('');
  try{const agentId=pairAgent||printers.labelAgentId,endpoint=agentId===printers.labelAgentId?printers.labelLanUrl:printers.a4LanUrl;const {data,error}=await invokeScfAuth({body:{action:'driver_lan_test',agentId}});if(error||!data?.ok)throw Error(await serverFunctionErrorMessage(error,data,'Chưa xác nhận được kết nối.'));const result=await scfLanRequest(data.endpoint||endpoint,'/health',{authorization:data.lanAuthorization});setLanMessage('Đã kết nối Wi-Fi tới '+result.agentId+' · '+result.version);}catch(error){setLanMessage(error.message);}finally{setBusy(false);}
 };
 const tabs=[['workflow','Quy trình lái xe','ti-list-check'],['scf','Máy in SCF','ti-printer'],['xp420','App XP420','ti-device-mobile'],['wifi','Wi-Fi Agent','ti-wifi']];
 const toggle=(text,checked,onChange,hint)=>h('label',{className:'trip-settings-toggle'},h('span',null,h('b',null,text),hint&&h('small',null,hint)),h('input',{type:'checkbox',role:'switch','aria-label':text,checked,disabled:busy,onChange:e=>onChange(e.target.checked)}));
 const field=(key,label,options={})=>h('label',{className:'trip-settings-field'},label,h('input',{'aria-label':label,value:printers[key]||'',disabled:busy||options.disabled,placeholder:options.placeholder||'',onChange:e=>setPrinters(p=>({...p,[key]:e.target.value,...(key==='labelLanUrl'?{labelAutoAddress:false}:key==='a4LanUrl'?{a4AutoAddress:false}:{})}))}));
 const base=normalizeUiSettings(uiSettings),dirty=JSON.stringify(printers)!==JSON.stringify(base.driverPrinters)||workflowRequired!==(uiSettings?.driverWorkflowRequired!==false)||enabled!==(uiSettings?.driverProductionLink===true);
 const reset=()=>{setPrinters(base.driverPrinters);setWorkflowRequired(uiSettings?.driverWorkflowRequired!==false);setEnabled(uiSettings?.driverProductionLink===true);setPairingKey('');setLanMessage('');};
 const panel=(id,children)=>h('section',{key:id,id:settingsId+'-'+id,role:'tabpanel','aria-labelledby':settingsId+'-tab-'+id,hidden:settingsTab!==id,className:'trip-settings-panel'},...children);
 return h('div',{className:'trip-settings-page'},
  h('div',{className:'trip-settings-heading'},h('div',null,h('h2',null,'Cài đặt chuyến giao hàng'),h('p',null,'Quy trình và máy in dùng chung')),h('small',null,h('i',{className:'ti ti-shield-check','aria-hidden':true}),' Chỉ Admin')),
  h('div',{className:'trip-settings-shell'},
   h('div',{className:'trip-settings-tabs',role:'tablist','aria-label':'Nhóm cài đặt chuyến',onKeyDown:e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=tabs.findIndex(t=>t[0]===settingsTab),next=tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length][0];setSettingsTab(next);document.getElementById(settingsId+'-tab-'+next)?.focus();}},tabs.map(([id,name,icon])=>h('button',{key:id,type:'button',id:settingsId+'-tab-'+id,role:'tab','aria-selected':settingsTab===id,'aria-controls':settingsId+'-'+id,onClick:()=>setSettingsTab(id)},h('i',{className:'ti '+icon,'aria-hidden':true}),name))),
   panel('workflow',[
    h('h3',null,'Quy trình lái xe'),toggle('Bắt buộc lái xe thực hiện đúng quy trình',workflowRequired,setWorkflowRequired,'Nhận đơn → Kiểm & xếp → Giao & về'),
    h('p',{className:'trip-settings-hint'},workflowRequired?'Thực hiện tuần tự từng bước. Chuyến đã khóa vẫn không được sửa.':'Cho phép thao tác tự do cả ba phần; chưa bắt buộc đủ nhận đơn, kiểm xếp, ảnh và công rổ. Chuyến đã khóa vẫn không được sửa.'),
    h('hr'),toggle('Kết nối kiểm hàng với đã sản xuất xong',enabled,setEnabled,'Tích đã xếp lên xe xác nhận nguồn đơn đã sản xuất xong.'),h('p',{className:'trip-settings-hint'},'Chỉ áp dụng cho lần tích mới sau khi bật và xác nhận lưu; các lần tích cũ không tự xác nhận.')]),
   panel('scf',[
    h('h3',null,'Máy in qua máy tính SCF'),h('p',{className:'trip-settings-hint'},'Cấu hình chung cho lái xe và kế toán được cấp quyền in.'),toggle('Dùng cấu hình máy in chung',printers.enabled,v=>setPrinters(p=>({...p,enabled:v}))),
    h('div',{className:'trip-settings-printer-grid'},
     h('section',null,h('h4',null,h('i',{className:'ti ti-tag','aria-hidden':true}),' In tem'),field('labelAgentId','Mã SCF máy in tem',{disabled:!printers.enabled}),h('label',{className:'trip-settings-field'},'Máy in tem',h('select',{'aria-label':'Máy in tem dùng chung',value:printers.labelPrinterRole,disabled:busy||!printers.enabled,onChange:e=>setPrinters(p=>({...p,labelPrinterRole:e.target.value}))},h('option',{value:'x350'},'X350B'),h('option',{value:'x420'},'X420B')))),
     h('section',null,h('h4',null,h('i',{className:'ti ti-file-invoice','aria-hidden':true}),' Phiếu giao & đơn tổng'),field('a4AgentId','Mã SCF máy in phiếu A4',{disabled:!printers.enabled}),h('label',{className:'trip-settings-field'},'Khổ giấy',h('input',{value:'A4',readOnly:true,'aria-label':'Khổ giấy A4'})),h('p',{className:'trip-settings-hint'},'Chọn máy in A4 cụ thể trong SCF Agent trên máy tính.'))),
    h('details',{className:'trip-settings-advanced'},h('summary',null,'Đăng ký Agent với tài khoản Admin'),h(AgentRegistrySettings,{printers,setPrinters,currentUser}))]),
   panel('xp420',[
    h('h3',null,'App XPRINTER 420'),h('p',{className:'trip-settings-hint'},'In tem trực tiếp tới máy in trong cùng mạng.'),toggle('Dùng app XPRINTER 420 để in tem Xprinter',printers.androidEnabled===true,v=>setPrinters(p=>({...p,androidEnabled:v,...(v?{labelPrinterRole:'x420'}:{})}))),
    h('div',{className:'trip-settings-two'},h('div',{className:'trip-settings-note'},'XP420 Android / iOS tự quét IP máy in trong cùng mạng. Không cần nhập IP trên SCFOOD.'),h('label',{className:'trip-settings-field'},'Hạn sử dụng tem mặc định',h('select',{'aria-label':'Hạn sử dụng tem Android mặc định',disabled:busy||!printers.androidEnabled,value:printers.androidShelfLifeHours===36?36:24,onChange:e=>setPrinters(p=>({...p,androidShelfLifeHours:Number(e.target.value)}))},h('option',{value:24},'24H'),h('option',{value:36},'36H')))),
    h('p',{className:'trip-settings-note'},'SCFOOD gửi nội dung tem và lưu người in, đơn, chuyến. Android cần APK XP420; iPhone cần app iOS đã ký. Phiếu giao và đơn tổng dùng SCF10.')]),
   panel('wifi',[
    h('h3',null,'Wi-Fi SCF Agent'),h('p',{className:'trip-settings-hint'},'Điện thoại và máy tính SCF10 cần cùng mạng nội bộ.'),toggle('Bật in nhanh qua Wi-Fi',printers.lanEnabled===true,v=>setPrinters(p=>({...p,lanEnabled:v}))),
    h('div',{className:'trip-settings-two'},field('labelLanUrl','Địa chỉ Wi-Fi máy in tem',{placeholder:'http://192.168.1.10:18786',disabled:!printers.lanEnabled}),field('a4LanUrl','Địa chỉ Wi-Fi máy in A4',{placeholder:'http://192.168.1.10:18786',disabled:!printers.lanEnabled})),
    h('p',{className:'trip-settings-hint'},'Khi chọn Wi-Fi SCF10 trên điện thoại, hệ thống không chuyển sang in từ xa nếu lỗi.'),
    h('details',{className:'trip-settings-advanced'},h('summary',null,'Ghép nối và tùy chọn nâng cao'),toggle('Tự chọn Wi-Fi hoặc Internet',printers.autoRoute===true,v=>setPrinters(p=>({...p,autoRoute:v})),'Áp dụng cho các luồng in tự động; lựa chọn trực tiếp trên điện thoại được ưu tiên.'),
     h('div',{className:'trip-settings-two'},h('label',{className:'trip-settings-field'},'Máy cần ghép',h('select',{'aria-label':'Máy cần ghép Wi-Fi',value:pairAgent||printers.labelAgentId,disabled:busy,onChange:e=>setPairAgent(e.target.value)},[...new Set([printers.labelAgentId,printers.a4AgentId])].map(id=>h('option',{key:id,value:id},id)))),h('label',{className:'trip-settings-field'},'Mã ghép nối từ SCF Agent',h('input',{type:'password',autoComplete:'off','aria-label':'Mã ghép nối Wi-Fi',value:pairingKey,disabled:busy,onChange:e=>setPairingKey(e.target.value)}))),
     h('div',{className:'trip-settings-actions'},h('button',{type:'button',disabled:busy,onClick:pair},'Ghép nối máy in Wi-Fi'),h('button',{type:'button',disabled:busy,onClick:testLan},'Kiểm tra Wi-Fi')),lanMessage&&h('p',{role:'status',className:'trip-settings-hint'},lanMessage))]),
   h('footer',{className:'trip-settings-footer'},h('span',{role:'status'},busy?'Đang xử lý…':dirty?'Có thay đổi chưa lưu':'Cài đặt đang dùng'),h('div',{className:'trip-settings-actions'},h('button',{type:'button',onClick:reset,disabled:busy||!dirty},'Hoàn tác'),h('button',{type:'button',className:'bp',disabled:busy||!dirty,onClick:save},busy?'Đang xác nhận…':'Lưu cài đặt')))));
}

function scfDriverLoadProductionSnapshot(order,loaded,settings){
 if(!loaded||settings?.driverProductionLink!==true||!Number.isFinite(Date.parse(settings.driverProductionLinkStartedAt)))return {};
 const plans=prodShiftPlansForOrder(order,window.__SCF_PROD_SHIFTS||[],window.__SCF_PROD_SHIFT_RULES||[]);
 return {driverProductionLoadedAt:new Date().toISOString(),driverProductionLoadedLines:(order.lines||[]).map((line,index)=>{const plan=plans.find(p=>p.line===line||p.index===index)||{};return {productId:String(line.productId||''),qty:numFmt(line.qtyProd??0),prodDate:plan.prodDate||'',shiftId:plan.prodWorkShiftId||getProdWorkShiftRule(plan.prodTime||'',window.__SCF_PROD_SHIFT_RULES||[])?.id||''};})};
}
function scfEffectiveProductionSourceCheck(row,order,manual,settings){
 if(settings?.driverProductionLink!==true||!order)return manual;
 const since=Date.parse(settings.driverProductionLinkStartedAt),loaded=Date.parse(order.driverProductionLoadedAt);
 if(!Number.isFinite(since)||!Number.isFinite(loaded)||loaded<since)return manual;
 const qty=(order.driverProductionLoadedLines||[]).filter(l=>String(l.productId)===String(row.productId)&&l.prodDate===row.prodDate&&l.shiftId===row.shift).reduce((s,l)=>s+numFmt(l.qty),0);
 if(!(qty>0)||Math.abs(qty-Number(row.sourceQty?.[String(order.id)]||0))>1e-8)return manual;
 if(manual&&Date.parse(manual.checkedAt)>=loaded)return manual;
 return {completed:true,orderedQty:qty,checkedBy:order.driverLoadedBy||'Lái xe',checkedAt:order.driverProductionLoadedAt,source:'driver-load'};
}
