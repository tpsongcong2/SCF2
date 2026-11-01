/* Opt-in only. Capture quantities and schedule when loading; never edit production yields. */
function DeliveryTripSettings({uiSettings,setUiSettings,currentUser}){
 const [printers,setPrinters]=useState(()=>normalizeUiSettings(uiSettings).driverPrinters);
 useEffect(()=>setPrinters(normalizeUiSettings(uiSettings).driverPrinters),[uiSettings?.driverPrinters]);
 const [enabled,setEnabled]=useState(uiSettings?.driverProductionLink===true),[busy,setBusy]=useState(false);
 useEffect(()=>setEnabled(uiSettings?.driverProductionLink===true),[uiSettings?.driverProductionLink]);
 if(!['admin','administrator'].includes(String(currentUser?.role||'').toLowerCase()))return null;
 const save=async()=>{
  if(busy)return;setBusy(true);
  try{
   const printerSettings=normalizeUiSettings({driverPrinters:printers}).driverPrinters;
   if(printerSettings.enabled&&[printerSettings.labelAgentId,printerSettings.a4AgentId].some(id=>! /^[A-Z0-9_-]{1,64}$/.test(id)))throw Error('Mã SCF chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới.');
   let startedAt=uiSettings?.driverProductionLinkStartedAt||'';
   if(enabled&&uiSettings?.driverProductionLink!==true){if(!await window.scfConfirm('Từ thời điểm kết nối, khi lái xe tích đã xếp lên xe, nguồn đơn sẽ được xác nhận đã sản xuất xong. Các lần tích trước đây không áp dụng. Bạn xác nhận bật kết nối?','Kết nối kiểm hàng với sản xuất'))return;startedAt=new Date().toISOString();}
   setUiSettings(previous=>({...normalizeUiSettings(previous),driverProductionLink:enabled,driverProductionLinkStartedAt:startedAt,driverPrinters:printerSettings}));
   window.showToast('Đã ghi nhận cài đặt chuyến giao hàng; đang đồng bộ.','info');
  }catch(error){window.showToast(error.message||'Chưa lưu được cài đặt.','error');}finally{setBusy(false);}
 };
 return h('div',{className:'card'},h('h2',null,'Cài đặt chuyến giao hàng'),h('section',{className:'trip-shared-printers'},h('h3',null,'Máy in chung cho tất cả lái xe'),h('label',null,h('input',{type:'checkbox','aria-label':'Dùng máy in chung cho tất cả lái xe',checked:printers.enabled,disabled:busy,onChange:e=>setPrinters(p=>({...p,enabled:e.target.checked}))}),' Dùng cấu hình máy in chung'),h('div',{className:'g2'},h('label',{className:'dm-field'},'Mã SCF máy in tem',h('input',{'aria-label':'Mã SCF máy in tem',value:printers.labelAgentId,disabled:busy||!printers.enabled,onChange:e=>setPrinters(p=>({...p,labelAgentId:e.target.value}))})),h('label',{className:'dm-field'},'Máy in tem',h('select',{'aria-label':'Máy in tem dùng chung',value:printers.labelPrinterRole,disabled:busy||!printers.enabled,onChange:e=>setPrinters(p=>({...p,labelPrinterRole:e.target.value}))},h('option',{value:'x350'},'X350B'),h('option',{value:'x420'},'X420B'))),h('label',{className:'dm-field'},'Mã SCF máy in phiếu và đơn tổng (A4)',h('input',{'aria-label':'Mã SCF máy in phiếu A4',value:printers.a4AgentId,disabled:busy||!printers.enabled,onChange:e=>setPrinters(p=>({...p,a4AgentId:e.target.value}))}))),h('p',null,'Phiếu giao hàng và đơn tổng dùng máy A4 được chọn trong app Agent trên máy tính có mã SCF tương ứng. Lái xe dùng chung cài đặt này, không cần cài trên từng điện thoại.')),h('h3',null,'Kết nối kiểm hàng với sản xuất'),h('label',{style:{display:'flex',gap:10,alignItems:'center'}},h('input',{type:'checkbox','aria-label':'Kết nối kiểm hàng với đã sản xuất xong',checked:enabled,disabled:busy,onChange:e=>setEnabled(e.target.checked)}),' Tích đã xếp lên xe xác nhận nguồn đơn đã sản xuất xong'),h('p',null,'Mặc định tắt trong thời gian thử nghiệm. Sau khi bật và xác nhận lưu, chỉ các lần tích mới được kết nối. Không thay đổi sản lượng đã nhập; các lần tích cũ không tự xác nhận.'),h('b',{role:'status'},uiSettings?.driverProductionLink===true?'Hiện đang bật kết nối':'Hiện đang tắt kết nối'),h('div',{style:{marginTop:16}},h('button',{className:'bp',disabled:busy,onClick:save},busy?'Đang xác nhận…':'Lưu cài đặt')));
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
