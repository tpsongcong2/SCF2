/* Driver phone workflow. Existing trip/order records remain the source of truth. */
function scfPickDriverPhotos(callback){
 const input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=true;input.style.display='none';document.body.appendChild(input);
 const cleanup=()=>input.remove();input.addEventListener('change',()=>{const files=Array.from(input.files||[]);cleanup();if(files.length)callback(files);},{once:true});input.addEventListener('cancel',cleanup,{once:true});input.click();
}
function scfDriverWorkflowMembers(trip,orders){
  const ids=new Set((trip?.orderIds||[]).map(String));
  return (orders||[]).filter(order=>order.status!=='cancelled'&&(order.tripId?String(order.tripId)===String(trip?.id):order.tripAssignMode!=='manual'&&ids.has(String(order.id))));
}
function scfDriverPhotoList(record,kind){
  const values=kind==='summary'?[record?.summaryInvoiceImage,record?.summaryInvoiceBackImage,...(Array.isArray(record?.summaryInvoiceImages)?record.summaryInvoiceImages:[])]:[record?.driverInvoiceImage,...(Array.isArray(record?.driverInvoiceImages)?record.driverInvoiceImages:[])];
  return [...new Set(values.filter(value=>typeof value==='string'&&value))];
}
function scfDriverPsNorm(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
// V900: đơn gộp kho vận hiển thị và sửa SL giao theo từng địa điểm nguồn.
function scfDriverLineGroups(order){
  if(!order?.warehouseMerged)return [{key:'',label:'',time:'',source:null,lines:(order?.lines||[]).map((line,index)=>({line,index}))}];
  const groups=new Map();
  (order.lines||[]).forEach((line,index)=>{const key=String(line.warehouseSourceOrderId||line.warehouseSourcePointName||order.pointName||'');if(!groups.has(key))groups.set(key,{key,label:line.warehouseSourcePointName||order.pointName||'—',time:line.warehouseSourceDeliveryTime||'',source:line,lines:[]});groups.get(key).lines.push({line,index});});
  return [...groups.values()];
}
function scfDriverWorkflowRequired(settings=globalThis.window?.__SCF_UI_SETTINGS){return settings?.driverWorkflowRequired!==false;}
function scfDriverMobileStartIssues(trip,orders){
  const members=scfDriverWorkflowMembers(trip,orders),known=new Set((orders||[]).map(order=>String(order.id))),issues=[];
  if((trip.orderIds||[]).some(id=>!known.has(String(id))))issues.push('chưa tải đủ đơn trong chuyến');
  if(!members.length)issues.push('chuyến chưa có đơn');
  if(!scfDriverWorkflowRequired())return issues;
  if(members.some(order=>!order.driverLoadedAt))issues.push('chưa tích đủ đơn đã xếp lên xe');
  if(!Number.isInteger(trip.workOutTotal)||trip.workOutTotal<0)issues.push('chưa nhập công rổ mang đi');
  if(!trip.cargoBeforeImage)issues.push('chưa chụp thùng xe trước giao');
  return issues;
}
// Bảng đồng kiểm khi xếp xe: cộng SL đặt theo từng mã hàng và đơn vị.
function scfDriverLoadSummary(orders,products){
  const rows=new Map();
  for(const order of orders||[])for(const line of order.lines||[]){
    const product=(products||[]).find(p=>String(p.id)===String(line.productId))||{};
    const name=line.productName||product.name||'Sản phẩm',unit=String(line.unit||product.unit||'').trim();
    const key=(line.productId||name)+'|'+unit.toLowerCase();
    const qty=tripOrderedQty(line),kgUnit=/^(kg|kgs|kilogram)$/i.test(unit);
    const kg=qty*(kgUnit?1:numFmt(line.weightPerUnit||product.weightPerUnit||0));
    const row=rows.get(key)||{name,unit,qty:0,kg:0,orders:new Set(),kgUnit};
    row.qty+=qty;row.kg+=kg;row.orders.add(String(order.id));rows.set(key,row);
  }
  const list=[...rows.values()].map(row=>({...row,orders:row.orders.size})).sort((a,b)=>a.name.localeCompare(b.name,'vi',{numeric:true})||a.unit.localeCompare(b.unit,'vi'));
  return {rows:list,codes:list.length,packs:list.filter(row=>!row.kgUnit).reduce((sum,row)=>sum+row.qty,0),kg:list.reduce((sum,row)=>sum+row.kg,0)};
}
function scfDriverMobileCompletionIssues(trip,orders){
  // Không bắt buộc tuần tự: chỉ cần đã bấm Đã về và có hóa đơn tổng. Công rổ về, ảnh thùng xe khi về
  // vẫn nhập được (cả sau khi hoàn thành) nhưng không bắt buộc.
  if(!scfDriverWorkflowRequired()){
    const issues=[];
    if(!trip?.driverReturnedAt)issues.push('chưa bấm Đã về — Nộp hóa đơn');
    if(!scfDriverPhotoList(trip,'summary').length)issues.push('chưa chụp hóa đơn tổng');
    return issues;
  }
  if(trip?.driverMobileWorkflowVersion!==1)return [];
  const members=scfDriverWorkflowMembers(trip,orders),issues=[];
  if((trip.orderIds||[]).some(id=>!(orders||[]).some(order=>String(order.id)===String(id))))issues.push('chưa tải đủ đơn trong chuyến');
  if(members.some(order=>!order.driverDeliveredAt))issues.push('chưa tích đủ đơn đã giao');
  if(!trip.driverReturnedAt)issues.push('chưa xác nhận đã về');
  if(!Number.isInteger(trip.workReturnTotal)||trip.workReturnTotal<0)issues.push('chưa nhập công rổ mang về');
  if(!trip.cargoAfterImage)issues.push('chưa chụp thùng xe khi về');
  return issues;
}
const SCF_DRIVER_DOCUMENT_DAYS=10;
function scfDriverMobileChange({trip,orders,user,command,orderId,value,base,stamp=fmtDT()}){
  if(!trip||!scfTripBelongsToDriver(trip,user)||!scfTripImageDispatched(trip))throw Error('Chuyến chưa được giao cho bạn hoặc đã chuyển lái xe.');
  if(!canTripAction(user,'driverWorkflow')||!canMobileFeature(user,'tripUpdate'))throw Error('Bạn chưa được cấp quyền thao tác giao hàng trên điện thoại.');
  const key=scfTripDateKey(trip.deliveryDate),today=scfTripDateKey(fmtDate()),limit=tripActualQtyLimitDays(user);
  const day=raw=>raw?Date.UTC(+raw.slice(0,4),+raw.slice(4,6)-1,+raw.slice(6,8)):0;
  // Hóa đơn, công rổ về, ảnh thùng xe khi về: bổ sung trong 10 ngày kể từ ngày giao.
  // Các thao tác khác (gồm sửa SL giao) theo số ngày được sửa trong phân quyền như trước.
  const age=key?(day(today)-day(key))/86400000:Infinity,documentCommand=['invoice','summary','noInvoice','basketReturn','cargoAfter'].includes(command);
  if(!key||documentCommand&&age>SCF_DRIVER_DOCUMENT_DAYS)throw Error('Chỉ bổ sung hóa đơn, công rổ, ảnh thùng xe trong '+SCF_DRIVER_DOCUMENT_DAYS+' ngày kể từ ngày giao. Hãy liên hệ kế toán.');
  if(!documentCommand&&limit>0&&!trip.driverConfirmedAt&&age>=limit)throw Error('Chuyến đã ngoài thời hạn được sửa. Hãy liên hệ kế toán.');
  const members=scfDriverWorkflowMembers(trip,orders),order=members.find(row=>String(row.id)===String(orderId||''));
  const pending=trip.status==='completion_pending';
  const invoiceRetry=pending&&((command==='invoice'&&order?.driverInvoiceReviewStatus==='rejected')||(command==='summary'&&trip.summaryInvoiceReviewStatus==='rejected'));
  // Sau khi lái xe báo hoàn thành (chờ kế toán duyệt) vẫn được bổ sung hóa đơn, sửa SL giao, công rổ về, ảnh thùng xe khi về.
  const pendingEdit=pending&&['invoice','summary','quantity','basketReturn','cargoAfter','noInvoice','psProduct'].includes(command);
  if(!['assigned','active'].includes(trip.status)&&!invoiceRetry&&!pendingEdit)throw Error(pending?'Chuyến đã gửi kế toán duyệt; chỉ bổ sung hóa đơn, SL giao, công rổ về và ảnh thùng xe.':'Chuyến đã khóa vì kế toán đã duyệt.');
  const changes={trip:null,order:null};
  const patchTrip=patch=>{changes.trip={...trip,...patch,updatedAt:stamp,updatedBy:user.name||''};};
  const patchOrder=patch=>{if(!order)throw Error('Đơn không còn thuộc chuyến này.');changes.order={...order,...patch,updatedAt:stamp,updatedBy:user.name||''};};
  const required=scfDriverWorkflowRequired();
  const requirePhase=phase=>{if(pendingEdit)return;if(required&&trip.status!==phase)throw Error(phase==='active'?'Hãy bắt đầu giao trước.':'Chỉ sửa phần xếp xe trước khi bắt đầu giao.');};
  const remoteImage=url=>{if(typeof url!=='string'||!/^https:\/\//i.test(url))throw Error('Ảnh chưa được tải lên kho lưu trữ.');};
  if(command==='receive'){requirePhase('assigned');if(!trip.driverAcceptedAt)patchTrip({driverAcceptedAt:stamp,driverAcceptedBy:user.name||'',driverMobileWorkflowVersion:1});}
  else if(command==='load'){requirePhase('assigned');if(required&&!trip.driverAcceptedAt)throw Error('Hãy nhận đơn trước.');const production=scfDriverLoadProductionSnapshot(order,value,window.__SCF_UI_SETTINGS);patchOrder({driverLoadedAt:value?stamp:'',driverLoadedBy:user.name||'',...production});}
  else if(command==='basketOut'||command==='basketReturn'){
    requirePhase(command==='basketOut'?'assigned':'active');
    if(required&&command==='basketReturn'&&!trip.driverReturnedAt)throw Error('Hãy xác nhận đã về trước.');
    const raw=String(value??'').trim();if(!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw)))throw Error('Công rổ phải là số nguyên từ 0 trở lên.');
    patchTrip({[command==='basketOut'?'workOutTotal':'workReturnTotal']:Number(raw)});
  }
  else if(command==='return'){requirePhase('active');if(!trip.driverReturnedAt)patchTrip({driverReturnedAt:stamp,driverReturnedBy:user.name||'',driverMobileWorkflowVersion:1});}
  else if(command==='delivered'){requirePhase('active');patchOrder({driverDeliveredAt:value?stamp:'',driverDeliveredBy:user.name||''});}
  else if(command==='quantity'){
    requirePhase('active');if(!canTripAction(user,'actualQty'))throw Error('Bạn chưa được cấp quyền sửa SL giao.');
    if(!order||!base||String(order.id)!==String(base.id)||!Array.isArray(value)||value.length!==(base.lines||[]).length)throw Error('Đơn hoặc dòng sản phẩm đã thay đổi.');
    const entries=value.map((raw,index)=>{const text=String(raw).trim().replace(',','.');if(!/^\d+(?:\.\d+)?$/.test(text)||!Number.isFinite(Number(text)))throw Error('SL giao phải là số từ 0 trở lên.');return {line:base.lines[index],qty:Number(text)};});
    if((order.lines||[]).length!==entries.length)throw Error('Dòng sản phẩm vừa thay đổi. Hãy mở lại đơn.');
    const lines=(order.lines||[]).map((line,index)=>{const matches=entries.filter(entry=>entry.line.id?String(entry.line.id)===String(line.id):entry.line===base.lines[index]&&!line.id);if(matches.length!==1)throw Error('Không xác định được dòng sản phẩm.');const {line:old,qty}=matches[0];
      if(String(old.productId||old.productName)!==String(line.productId||line.productName)||tripDeliveredQty(line)!==tripDeliveredQty(old)&&tripDeliveredQty(line)!==qty)throw Error('SL giao hoặc sản phẩm đã được sửa ở nơi khác. Hãy mở lại đơn.');return Number(line.qtyDelivered)===qty&&line.deliveredAt?line:{...line,qtyDelivered:qty,deliveredAt:stamp,deliveredBy:user.name||''};});
    patchOrder({lines,driverDeliveredAt:order.driverDeliveredAt||stamp,driverDeliveredBy:user.name||'',orderHistory:[...(order.orderHistory||[]),{id:'LS'+uid(),action:'Lái xe cập nhật SL giao',at:stamp,by:user.name||'',byId:user.id,changes:entries.map(entry=>(entry.line.productName||'Sản phẩm')+': '+tripDeliveredQty(entry.line)+' → '+entry.qty)}]});
  }
  else if(command==='psProduct'){
    // V900: lái xe thêm sản phẩm phát sinh (PS) vào đơn đang sửa SL giao. Tính ngay vào SL giao / khối lượng / tiền công;
    // kế toán duyệt sau (không có từ chối — kế toán sửa SL giao, lưu vào lịch sửa của đơn).
    requirePhase('active');if(!canTripAction(user,'actualQty'))throw Error('Bạn chưa được cấp quyền sửa SL giao.');
    if(!order)throw Error('Đơn không còn thuộc chuyến này.');
    const product=value?.product,qty=Number(String(value?.qty??'').trim().replace(',','.'));
    if(!product?.id)throw Error('Hãy chọn sản phẩm PS.');
    if(!Number.isFinite(qty)||qty<=0)throw Error('SL giao sản phẩm PS phải lớn hơn 0.');
    const source=order.warehouseMerged?value?.sourceLine||null:null,pointOf=line=>String(line?.warehouseSourceOrderId||line?.warehouseSourcePointName||'');
    if(order.warehouseMerged&&!source)throw Error('Hãy chọn địa điểm trong đơn gộp.');
    if((order.lines||[]).some(line=>String(line.productId)===String(product.id)&&(!order.warehouseMerged||pointOf(line)===pointOf(source))))throw Error('Sản phẩm đã có trong đơn'+(order.warehouseMerged?' tại điểm này':'')+'. Hãy sửa SL giao ở dòng hiện có.');
    let line=typeof tripAdditionalProductLine==='function'?tripAdditionalProductLine(product,qty,user):{id:'PSL'+uid(),productId:product.id,productName:product.name||'',unit:product.unit||'',weightPerUnit:numFmt(product.weightPerUnit),qtyProd:qty,qtyInvoice:qty,qtyDelivered:qty,isAdditionalProduct:true,additionalProductAt:stamp,additionalProductBy:user.name||'',additionalProductById:user.id||''};
    line={...line,deliveredAt:stamp,deliveredBy:user.name||'',psApprovalStatus:'pending'};
    if(source)Object.keys(source).filter(key=>key.startsWith('warehouseSource')&&key!=='warehouseSourceLineId').forEach(key=>{line[key]=source[key];});
    if(value?.production!==false&&typeof scfCopyTripProductionLines==='function')try{line=scfCopyTripProductionLines(trip,orders,[line],order)[0]||line;}catch(error){/* chưa có lịch SX cùng sản phẩm: kế toán bổ sung khi duyệt */}
    const where=source?.warehouseSourcePointName?' · Điểm: '+source.warehouseSourcePointName:'';
    patchOrder({lines:[...(order.lines||[]),line],orderHistory:[...(order.orderHistory||[]),{id:'LS'+uid(),action:'Lái xe thêm sản phẩm PS',at:stamp,by:user.name||'',byId:user.id,changes:['Sản phẩm: '+(product.name||product.id)+where,'SL giao: '+qty+(product.unit?' '+product.unit:''),'Trạng thái: Chờ kế toán duyệt']}]});
  }
  else if(command==='noInvoice'){requirePhase('active');if(!order||scfDriverPhotoList(order,'driver').length)throw Error('Đơn đã có hóa đơn hoặc không còn trong chuyến.');const marked=value!==false;if(!!order.driverNoInvoiceAt!==marked)patchOrder({driverNoInvoiceAt:marked?stamp:'',driverNoInvoiceBy:marked?user.name||'':''});}
  else if(command==='cargoBefore'||command==='cargoAfter'){
    requirePhase(command==='cargoBefore'?'assigned':'active');
    if(required&&command==='cargoAfter'&&!trip.driverReturnedAt)throw Error('Ảnh thùng xe khi về chỉ chụp sau khi xác nhận đã về.');remoteImage(value);
    patchTrip(command==='cargoBefore'?{cargoBeforeImage:value,cargoBeforeUploadedAt:stamp,cargoBeforeUploadedBy:user.name||''}:{cargoAfterImage:value,cargoAfterUploadedAt:stamp,cargoAfterUploadedBy:user.name||''});
  }
  else if(command==='invoice'){
    if(!order)throw Error('Đơn không còn trong chuyến.');if(!invoiceRetry)requirePhase('active');remoteImage(value);const images=scfDriverPhotoList(order,'driver');if(images.length>=10&&order.driverInvoiceReviewStatus!=='rejected')throw Error('Mỗi đơn được lưu tối đa 10 ảnh hóa đơn.');
    patchOrder({driverInvoiceImage:order.driverInvoiceReviewStatus==='rejected'?value:images[0]||value,driverInvoiceImages:order.driverInvoiceReviewStatus==='rejected'?[value,...images].slice(0,10):[...images,value],driverInvoiceUploadedAt:stamp,driverInvoiceUploadedBy:user.name||'',driverInvoiceReviewStatus:'pending',driverInvoiceReviewReason:'',driverNoInvoiceAt:'',driverNoInvoiceBy:''});
  }
  else if(command==='summary'){
    if(!canTripAction(user,'summaryInvoice'))throw Error('Bạn chưa được cấp quyền chụp hóa đơn tổng.');
    if(!invoiceRetry)requirePhase('active');remoteImage(value);
    const images=scfDriverPhotoList(trip,'summary');if(images.length>=10&&trip.summaryInvoiceReviewStatus!=='rejected')throw Error('Mỗi chuyến được lưu tối đa 10 ảnh hóa đơn tổng.');
    const next=trip.summaryInvoiceReviewStatus==='rejected'?[value,...images].slice(0,10):[...images,value];patchTrip({summaryInvoiceImage:next[0],summaryInvoiceBackImage:next[1]||'',summaryInvoiceImages:next,summaryInvoiceUploadedAt:stamp,summaryInvoiceUploadedBy:user.name||'',summaryInvoiceReviewStatus:'pending',summaryInvoiceReviewReason:''});
  }
  else throw Error('Thao tác không hợp lệ.');
  return changes;
}
function DriverTripEvidence({trip,orders,showInvoices=true}){
  const members=scfDriverWorkflowMembers(trip,orders),missing=members.filter(order=>order.driverNoInvoiceAt&&!scfDriverPhotoList(order,'driver').length);
  if(trip.driverMobileWorkflowVersion!==1&&!trip.driverReturnedAt)return null;
  const photos=[{src:trip.cargoBeforeImage,label:'Thùng xe trước giao'},{src:trip.cargoAfterImage,label:'Thùng xe khi về'},...(showInvoices?scfDriverPhotoList(trip,'summary'):[]).slice(2).map((src,i)=>({src,label:'HĐ tổng bổ sung '+(i+3)})),...(showInvoices?members:[]).flatMap(order=>scfDriverPhotoList(order,'driver').slice(1).map((src,i)=>({src,label:(order.pointName||order.id)+' · HĐ bổ sung '+(i+2)})))].filter(row=>row.src);
  return h('section',{className:'driver-workflow-evidence'},h('b',null,'Hồ sơ lái xe'),h('p',null,'Công rổ đi / về: '+(trip.workOutTotal??'—')+' / '+(trip.workReturnTotal??'—')+' · Đã xếp: '+members.filter(o=>o.driverLoadedAt).length+'/'+members.length+' · Đã giao: '+members.filter(o=>o.driverDeliveredAt).length+'/'+members.length),missing.length>0&&h('p',{className:'driver-workflow-warning'},'Lái xe ghi nhận chưa có HĐ: '+missing.map(o=>(o.pointName||o.id)+' '+(o.deliveryTime||'')).join('; ')),h('div',{className:'driver-workflow-gallery'},photos.map((photo,index)=>h(TripInvoicePreview,{key:index,src:photo.src,size:'small',label:photo.label,landscape:true}))));
}
function DriverBasketField({tripId,label,value,disabled,onSave}){
  const [draft,setDraft]=useState(value==null?'':String(value));const focused=useRef(false);
  useEffect(()=>{if(!focused.current)setDraft(value==null?'':String(value));},[tripId,value]);
  return h('label',{className:'dm-field'},label,h('input',{type:'number',min:0,step:1,inputMode:'numeric',value:draft,disabled,'aria-label':label,onFocus:()=>focused.current=true,onChange:event=>setDraft(event.target.value),onBlur:()=>{focused.current=false;if(draft!==String(value??''))onSave(draft);}}));
}
function DriverOrdersMobile({trips,orders,products,prodCats=[],customers,shifts,company,user,setTrips,setOrders,date,onDateChange,tripId,onTripChange,onStart,onComplete,onSummary,onViewSummary,onPrintOrder,previewMode=false}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[editBase,setEditBase]=useState(null),[qtyDraft,setQtyDraft]=useState([]),[afterOrder,setAfterOrder]=useState(''),[printMode,setPrintMode]=useState(''),[printTool,setPrintTool]=useState(0),[gallery,setGallery]=useState(null);
  const context=useRef(null),working=useRef(false),loadJobs=useRef(new Map()),photoSerial=useRef(0);
  const [loadDraft,setLoadDraft]=useState({});
  // V900: + Sản phẩm PS (trong khung SL giao) và + Đơn PS (cho chuyến), kế toán duyệt sau.
  const [psLine,setPsLine]=useState(null),[psOrder,setPsOrder]=useState(null);
  context.current={trips,orders,user,setTrips,setOrders,onStart,onComplete};
  const own=trips.filter(trip=>scfTripBelongsToDriver(trip,user)&&scfTripImageDispatched(trip));
  const todayTrips=own.filter(trip=>scfTripDateKey(trip.deliveryDate)===String(date||'').replace(/-/g,''));
  const trip=todayTrips.find(trip=>String(trip.id)===String(tripId))||todayTrips[0]||null;
  useEffect(()=>{setPrintTool(0);setPrintMode('');},[trip?.id]);
  const members=trip?sortTripOrdersByDeliveryOrder(trip,scfDriverWorkflowMembers(trip,orders),customers).map(o=>{const draft=loadDraft[o.id];if(!draft)return o;return {...o,...('load' in draft?{driverLoadedAt:draft.load?'Đang lưu':''}:{}),...('delivered' in draft?{driverDeliveredAt:draft.delivered?'Đang lưu':''}:{}),...('noInvoice' in draft?{driverNoInvoiceAt:draft.noInvoice?'Đang lưu':''}:{})};}):[];
  const returned=!!trip?.driverReturnedAt,submitted=['completion_pending','completed'].includes(trip?.status),retry=submitted&&(trip?.summaryInvoiceReviewStatus==='rejected'||members.some(order=>order.driverInvoiceReviewStatus==='rejected'));
  const workflowRequired=scfDriverWorkflowRequired();
  const [workflowTab,setWorkflowTab]=useState(null);
  useEffect(()=>setWorkflowTab(null),[trip?.id,workflowRequired]);
  const pendingEditable=trip?.status==='completion_pending';
  const actualPhase=!trip?0:trip.status==='completed'?4:pendingEditable?3:trip.status==='active'||retry?returned||retry?3:2:trip.driverAcceptedAt?1:0;
  const phase=!workflowRequired&&workflowTab!==null&&!submitted?(workflowTab===2?(returned?3:2):workflowTab):actualPhase;
  const canWrite=!!trip&&!busy&&(!submitted||pendingEditable)&&canTripAction(user,'driverWorkflow')&&canMobileFeature(user,'tripUpdate')&&!window.__SCF_ACCESS_CONTEXT?.readOnly;
  const fmt=value=>Number(value||0).toLocaleString('vi-VN',{maximumFractionDigits:2});
  // V901: bỏ bước "1. Nhận đơn" — mở chuyến đã giao cho mình là tự ghi nhận đã nhận đơn, vào thẳng Kiểm & xếp.
  const autoReceive=()=>{if(trip&&trip.status==='assigned'&&!trip.driverAcceptedAt&&canWrite)try{execute('receive');}catch(error){}};
  useEffect(()=>{autoReceive();},[trip?.id,trip?.status,trip?.driverAcceptedAt,canWrite]);
  const weight=(order,delivered=false)=> (order.lines||[]).reduce((sum,line)=>{const product=products.find(p=>String(p.id)===String(line.productId)),unit=String(line.unit||product?.unit||'').toLowerCase();const qty=delivered?tripDeliveredQty(line):tripOrderedQty(line);return sum+qty*(/^(kg|kgs|kilogram)$/.test(unit)?1:numFmt(line.weightPerUnit||product?.weightPerUnit||0));},0);
  const guard=()=>{const latest=context.current,access=window.__SCF_ACCESS_CONTEXT;if(String(latest.user?.id)!==String(user.id)||!previewMode&&access?.employeeId&&String(access.employeeId)!==String(user.id)||access?.readOnly)throw Error('Tài khoản hoặc quyền đã thay đổi. Hãy mở lại chuyến.');return latest;};
  const execute=(command,value,orderId='',base=null,targetId=trip?.id)=>{
    const latest=guard();let failure=null;
    const orderCommand=['load','delivered','quantity','noInvoice','invoice','psProduct'].includes(command);let saved=null;
    ReactDOM.flushSync(()=>{const setter=orderCommand?latest.setOrders:latest.setTrips;setter(previous=>{
      try{const liveTrips=orderCommand?context.current.trips:previous,live=liveTrips.find(item=>String(item.id)===String(targetId));
        const change=scfDriverMobileChange({trip:live,orders:orderCommand?previous:context.current.orders,user:context.current.user,command,orderId,value,base});
        const record=orderCommand?change.order:change.trip;if(!record)return previous;saved=record;
        return previous.map(item=>String(item.id)===String(record.id)?record:item);
      }catch(error){failure=error;return previous;}
    });});
    if(failure)throw failure;
    return saved;
  };
  const act=(command,value,orderId='',base=null)=>{try{setError('');execute(command,value,orderId,base);return true;}catch(error){setError(error.message);return false;}};
  const checkOrder=(order,value,command)=>{
    if(command==='load')autoReceive();
    const target=trip.id,token={},key=String(order.id)+'|'+command;loadJobs.current.set(key,token);setLoadDraft(prev=>({...prev,[order.id]:{...prev[order.id],[command]:value}}));
    const persist=()=>setTimeout(()=>{if(loadJobs.current.get(key)!==token)return;try{execute(command,value,order.id,null,target);}catch(e){setError(e.message);}finally{if(loadJobs.current.get(key)===token){loadJobs.current.delete(key);setLoadDraft(prev=>{const next={...prev},draft={...next[order.id]};delete draft[command];if(Object.keys(draft).length)next[order.id]=draft;else delete next[order.id];return next;});}} },0);
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(persist);else persist();
  };
  const photo=(command,orderId='',source='camera')=>{
    const targetId=trip?.id,actor=String(user.id);if(busy)return;
    if(previewMode){act(command,'https://scfood.vn/icon-192.png?demo='+ ++photoSerial.current,orderId);return;}
    try{guard();if(!trip)throw Error('Chọn chuyến cần chụp.');if(scfDriverWorkflowRequired()&&command==='summary'&&!['active','completion_pending'].includes(trip.status))throw Error('Chụp hóa đơn tổng ở bước Giao & về.');
      const receive=async picked=>{const files=Array.isArray(picked)?picked:[picked];if(!files[0]||working.current)return;working.current=true;setBusy(true);setError('');let saved=0;
        try{for(const file of files){const latest=guard(),live=latest.trips.find(t=>String(t.id)===String(targetId)),record=command==='summary'?live:latest.orders.find(o=>String(o.id)===String(orderId));
          if(!live||!scfTripBelongsToDriver(live,latest.user)||orderId&&!scfDriverWorkflowMembers(live,latest.orders).some(o=>String(o.id)===String(orderId)))throw Error('Đơn hoặc chuyến đã chuyển khỏi tài khoản.');
          if(['summary','invoice'].includes(command)&&scfDriverPhotoList(record,command==='summary'?'summary':'driver').length>=10)throw Error('Tối đa 10 ảnh cho mỗi bộ hóa đơn.');
          const url=await uploadPhoto(file,'driver-workflow/'+targetId+'/'+command,{requireRemote:true,max:2000,quality:.9});
          if(String(context.current.user.id)!==actor)throw Error('Tài khoản đã thay đổi.');execute(command,url,orderId,null,targetId);saved++;
        }window.showToast('Đã lưu '+saved+' ảnh; đang đồng bộ hồ sơ chuyến.','info');
        }catch(error){setError((saved?'Đã lưu '+saved+' ảnh. ':'')+(error.message||'Không lưu được ảnh.'));}finally{working.current=false;setBusy(false);}
      };
      if(source==='files')scfPickDriverPhotos(receive);else scfPickPhoto(receive,'camera');
    }catch(error){setError(error.message);}
  };
  const openQty=order=>{setQtyDraft((order.lines||[]).map(line=>String(tripDeliveredQty(line))));setEditBase(order);setError('');};
  const saveQty=()=>{if(act('quantity',qtyDraft,editBase.id,editBase)){loadJobs.current.delete(String(editBase.id)+'|delivered');setLoadDraft(prev=>{const next={...prev},draft={...next[editBase.id]};delete draft.delivered;if(Object.keys(draft).length)next[editBase.id]=draft;else delete next[editBase.id];return next;});setAfterOrder(editBase.id);setEditBase(null);}};
  const viewPhotos=(record,kind,label)=>setGallery({images:scfDriverPhotoList(record,kind),label});
  const summaryImages=trip?scfDriverPhotoList(trip,'summary'):[];
  const loaded=members.filter(order=>!!order.driverLoadedAt),delivered=members.filter(order=>!!order.driverDeliveredAt);
  const readyStart=trip?scfDriverMobileStartIssues(trip,orders):[];
  const completeMissing=trip?[...scfDriverMobileCompletionIssues(trip,orders),...(workflowRequired&&!summaryImages.length?['chưa có ảnh hóa đơn tổng']:[])]:[];
  const start=()=>{try{if(loadJobs.current.size)throw Error('Đang lưu phần kiểm hàng, vui lòng chờ một chút.');const latest=guard(),live=latest.trips.find(item=>String(item.id)===String(trip.id));const issues=scfDriverMobileStartIssues(live,latest.orders);if(issues.length)throw Error(issues.join('; '));latest.onStart(live);}catch(error){setError(error.message);}};
  const finish=async()=>{try{if(loadJobs.current.size)throw Error('Đang lưu các đơn đã tích, vui lòng chờ một chút.');if(!await window.scfConfirm(scfDriverWorkflowRequired()?'Đã kiểm tra đủ đơn đã giao, hóa đơn, công rổ và ảnh thùng xe? Gửi chuyến cho kế toán duyệt.':'Quy trình đang không bắt buộc đủ bước. Gửi chuyến với thông tin hiện có cho kế toán duyệt?','Hoàn thành chuyến'))return;const latest=guard(),live=latest.trips.find(item=>String(item.id)===String(trip.id));latest.onComplete(live);}catch(error){setError(error.message);}};
  const invoiceAllowed=order=>!busy&&canMobileFeature(user,'tripUpdate')&&canTripAction(user,'driverWorkflow')&&!window.__SCF_ACCESS_CONTEXT?.readOnly&&(trip?.status==='active'||!workflowRequired&&trip?.status==='assigned'||trip?.status==='completion_pending');
  const photoControl=(command,label,src)=>h('div',{className:'dm-photo'},h('div',null,h('b',null,label),h('small',null,src?'Đã có ảnh':'Chưa chụp')),src&&h('button',{type:'button','data-scf-action':'view',onClick:()=>setGallery({images:[src],label})},'Xem'),h('button',{type:'button','data-scf-action':'write',disabled:!canWrite,onClick:()=>photo(command)},h('i',{className:'ti ti-camera'}),src?' Chụp lại':' Chụp ảnh'));
  const orderCard=(order,loading)=>{
    const checked=loading?!!order.driverLoadedAt:!!order.driverDeliveredAt,images=scfDriverPhotoList(order,'driver');
    return h('article',{key:order.id,className:'dm-order'+(checked?' checked':''),'data-driver-order-id':order.id},
      h('div',{className:'dm-order-head'},h('input',{type:'checkbox',checked,disabled:!canWrite||pendingEditable,'aria-label':(loading?'Đã xếp ':'Đã giao ')+(order.pointName||order.id)+' '+(order.deliveryTime||''),onChange:event=>checkOrder(order,event.target.checked,loading?'load':'delivered')}),
        loading?h('div',{className:'dm-order-name'},h('b',null,order.pointName||order.customer||order.id),h('small',null,(order.deliveryTime||'')+' · '+(checked?'Đã xếp lên xe':'Chưa xếp'))):h('div',{className:'dm-order-name'},h('b',null,order.pointName||order.customer||order.id),h('small',null,(order.deliveryTime||'')+' · '+(checked?'Đã giao':'Chưa giao'))),h('b',null,fmt(weight(order,!loading))+' kg')),
      order.isAdditionalTripOrder&&h('div',{className:'dm-ps-order '+(order.additionalApprovalStatus==='approved'?'approved':'pending')},order.additionalApprovalStatus==='approved'?'Đơn PS · Kế toán đã duyệt':'Đơn PS · Chờ kế toán duyệt'),
      scfDriverLineGroups(order).map(group=>h(React.Fragment,{key:'g'+group.key},order.warehouseMerged&&h('div',{className:'dm-point'},h('b',null,group.label),group.time&&h('small',null,' · '+group.time)),
        group.lines.map(({line,index})=>h('div',{key:line.id||index,className:'dm-product'},h('span',null,line.productName||'Sản phẩm',line.isAdditionalProduct&&h('span',{className:'dm-ps-badge'+(line.psApprovalStatus==='pending'?' pending':'')},line.psApprovalStatus==='pending'?'PS · chờ KT duyệt':'PS')),h('span',null,loading?fmt(tripOrderedQty(line))+' '+(line.unit||''):'Đặt '+fmt(tripOrderedQty(line))+' · Giao '+fmt(tripDeliveredQty(line))+' '+(line.unit||'')))))),
      !loading&&order.driverInvoiceReviewStatus==='rejected'&&h('p',{className:'dm-error'},'HĐ cần chụp lại: '+(order.driverInvoiceReviewReason||'Kế toán chưa duyệt ảnh')),
      !loading&&h('div',{className:'dm-order-docs'},h('small',null,images.length?images.length+' ảnh HĐ':'Chụp HĐ nếu có'),images.length>0&&canMobileFeature(user,'tripInvoices')&&h('button',{type:'button','data-scf-action':'view',onClick:()=>viewPhotos(order,'driver','HĐ '+(order.pointName||order.id))},'Xem'),h('div',{className:'dm-order-actions'},
        h('button',{type:'button','data-scf-action':'view',disabled:busy,'aria-label':'Thay đổi SL giao '+(order.pointName||order.id),onClick:()=>openQty(order)},h('i',{className:'ti ti-edit'}),' Thay đổi SL giao'),
        h('button',{type:'button','data-scf-action':'write',disabled:!invoiceAllowed(order),onClick:()=>photo('invoice',order.id)},h('i',{className:'ti ti-camera'}),images.length?' Chụp thêm':' Chụp HĐ'),
        h('button',{type:'button','data-scf-action':'write',disabled:!invoiceAllowed(order),'aria-label':'Tải ảnh HĐ có sẵn '+(order.pointName||order.id),onClick:()=>photo('invoice',order.id,'files')},h('i',{className:'ti ti-upload'}),' Tải HĐ')))
    );
  };
  const summaryAllowed=!!trip&&!busy&&canMobileFeature(user,'tripUpdate')&&canTripAction(user,'summaryInvoice')&&canTripAction(user,'driverWorkflow')&&!window.__SCF_ACCESS_CONTEXT?.readOnly&&(trip.status==='active'||!workflowRequired&&trip.status==='assigned'||trip.status==='completion_pending');
  const psOrderAllowed=!!trip&&canWrite&&canTripAction(user,'actualQty')&&['active','completion_pending'].includes(trip.status);
  const activeProducts=(products||[]).filter(product=>product.active!==false);
  const productMatches=query=>{const q=scfDriverPsNorm(query);return activeProducts.filter(product=>!q||scfDriverPsNorm((product.code||'')+' '+product.name).includes(q)).slice(0,30);};
  const isTp=product=>!(typeof isGoodsProduct==='function'&&isGoodsProduct(product,prodCats||[]));
  const pointChoices=React.useMemo(()=>!trip?[]:(customers||[]).flatMap(customer=>(customer.points||[]).filter(point=>typeof scfPointCoversOrder!=='function'||scfPointCoversOrder(point,{deliveryDate:trip.deliveryDate,deliveryTime:trip.deliveryTime})).map(point=>({key:String(customer.id)+'|'+String(point.id),customer,point,label:(point.name||'—')+' · '+(customer.name||'')}))),[customers,trip?.id,trip?.deliveryDate]);
  const addPsLine=group=>{
    try{
      setError('');const draft=psLine||{};const product=activeProducts.find(item=>String(item.id)===String(draft.productId));
      const saved=execute('psProduct',{product,qty:draft.qty,sourceLine:group.source,production:product?isTp(product):true},editBase.id,null);
      if(saved){setEditBase(saved);setQtyDraft(previous=>[...previous,String(tripDeliveredQty(saved.lines[saved.lines.length-1]))]);setPsLine(null);window.showToast?.('Đã thêm sản phẩm PS, chờ kế toán duyệt.','success');}
    }catch(error){setError(error.message);}
  };
  const createPsOrder=()=>{
    try{
      setError('');const latest=guard(),live=latest.trips.find(item=>String(item.id)===String(trip.id));
      if(!live||!scfTripBelongsToDriver(live,latest.user)||!['active','completion_pending'].includes(live.status))throw Error('Chuyến không còn ở trạng thái đang giao.');
      if(!canTripAction(user,'actualQty'))throw Error('Bạn chưa được cấp quyền sửa SL giao.');
      const choice=pointChoices.find(item=>item.key===psOrder.pointKey);if(!choice)throw Error('Hãy chọn địa điểm giao.');
      const product=activeProducts.find(item=>String(item.id)===String(psOrder.productId));if(!product)throw Error('Hãy chọn sản phẩm.');
      const qty=Number(String(psOrder.qty||'').trim().replace(',','.'));if(!Number.isFinite(qty)||qty<=0)throw Error('SL giao phải lớn hơn 0.');
      const stamp=fmtDT();
      let line={id:'L'+uid(),productId:product.id,productName:product.name||'',unit:product.unit||'',weightPerUnit:numFmt(product.weightPerUnit),qtyProd:qty,qtyInvoice:qty,qtyDelivered:qty,deliveredAt:stamp,deliveredBy:user.name||''};
      if(isTp(product)&&typeof scfCopyTripProductionLines==='function')try{line=scfCopyTripProductionLines(live,latest.orders,[line],null)[0]||line;}catch(error){}
      const idBase='PS'+new Date().toISOString().replace(/\D/g,'').slice(2)+uid();let id=idBase,suffix=1;while(latest.orders.some(order=>order.id===id))id=idBase+'-'+suffix++;
      const {customer,point}=choice,note=String(psOrder.note||'').trim();
      const order={id,deliveryDate:live.deliveryDate||fmtDate(),deliveryTime:live.deliveryTime||'',customerId:customer.id||'',customer:customer.name||'',pointId:point.id||'',pointName:point.name||'',address:point.address||'',area:point.area||'',lines:[line],tripId:live.id,status:live.status==='active'?'delivering':'done',tripAssignMode:'driver_additional',isAdditionalTripOrder:true,additionalSourceTripId:live.id,additionalApprovalStatus:'pending',additionalRequestedAt:stamp,additionalRequestedBy:user.name||'',additionalRequestedById:user.id||'',driverDeliveredAt:stamp,driverDeliveredBy:user.name||'',note:note?'Đơn PS · '+note:'Đơn PS',createdAt:stamp,createdBy:user.name||'',updatedAt:stamp,updatedBy:user.name||'',
        ...Object.fromEntries(['prodDate','prodTime','prodWorkShiftId','prodShiftId','labelDate','labelTime'].map(key=>[key,line[key]||''])),productionScheduleCopiedFromTripId:String(live.id),automaticPlanningPending:false,
        orderHistory:[{id:'LS'+uid(),action:'Lái xe tạo đơn phát sinh',changes:['Chuyến: '+(live.shiftName||live.id)+' - '+live.deliveryDate,'Địa điểm: '+(point.name||customer.name),'Hàng hóa: '+(product.name||product.id)+': '+qty+(product.unit?' '+product.unit:''),...(note?['Ghi chú: '+note]:[]),'Trạng thái: Chờ kế toán duyệt'],at:stamp,atIso:new Date().toISOString(),by:user.name||'',byId:user.id||''}]};
      ReactDOM.flushSync(()=>{latest.setOrders(previous=>[...previous,order]);latest.setTrips(previous=>previous.map(item=>String(item.id)===String(live.id)?{...item,orderIds:[...new Set([...(item.orderIds||[]),id])],updatedAt:stamp}:item));});
      setPsOrder(null);window.showToast?.('Đã tạo đơn PS trong chuyến, chờ kế toán duyệt. Có thể chụp / tải HĐ ở thẻ đơn.','success',8000);
    }catch(error){setError(error.message);}
  };
  const invoiceTotal=()=>h('section',{className:'dm-panel dm-total-invoice'},h('div',{className:'dm-row'},h('h3',null,'Hóa đơn tổng chuyến'),h('small',null,summaryImages.length?summaryImages.length+' ảnh':'Chưa chụp')),trip.summaryInvoiceReviewStatus==='rejected'&&h('p',{className:'dm-error'},'HĐ tổng cần chụp lại: '+(trip.summaryInvoiceReviewReason||'Kế toán chưa duyệt ảnh')),h('div',{className:'dm-total-actions'},
      h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:!summaryAllowed,onClick:()=>photo('summary')},h('i',{className:'ti ti-camera'}),summaryImages.length?' Chụp thêm HĐ tổng':' Chụp HĐ tổng'),
      h('button',{type:'button','data-scf-action':'write',disabled:!summaryAllowed,'aria-label':'Tải ảnh hóa đơn tổng có sẵn',onClick:()=>photo('summary','','files')},h('i',{className:'ti ti-upload'}),' Tải HĐ tổng'),
      h('button',{type:'button',className:'dm-ps-button','data-scf-action':'write',disabled:!psOrderAllowed,onClick:()=>{setError('');setPsOrder({pointKey:'',pointQuery:'',productId:'',productQuery:'',qty:'',note:''});}},h('i',{className:'ti ti-plus'}),' Đơn PS')),h('small',null,'Có thể chụp thêm ảnh đơn tổng · Tối đa 10 ảnh.'),summaryImages.length>0&&canMobileFeature(user,'tripInvoices')&&h('button',{type:'button','data-scf-action':'view',onClick:()=>viewPhotos(trip,'summary','Hóa đơn tổng chuyến')},'Xem ảnh hóa đơn tổng'));
  return h('div',{className:'driver-mobile-page'},
    h('div',{className:'dm-body'},h('label',{className:'dm-field'},'Ngày chuyến',h('input',{type:'date',value:date,disabled:busy,onChange:event=>{onDateChange(event.target.value);onTripChange('');}})),
      h('label',{className:'dm-field'},'Ca giao',h('select',{'aria-label':'Chuyến của tôi',value:trip?.id||'',disabled:busy,onChange:event=>{setError('');onTripChange(event.target.value);}},!todayTrips.length&&h('option',{value:''},'Không có chuyến được giao trong ngày'),todayTrips.map(row=>h('option',{key:row.id,value:row.id},(row.shiftName||row.id)+' · '+(row.status==='active'?'Đang giao':row.status==='completion_pending'?'Chờ kế toán':row.status==='completed'?'Đã hoàn thành':row.driverAcceptedAt?'Đang xếp':'Chờ nhận'))))),
      !trip?h('section',{className:'dm-panel'},'Chỉ hiển thị chuyến đã giao cho đúng tài khoản của bạn.'):h(React.Fragment,null,
        h('section',{className:'dm-panel'},h('div',{className:'dm-row'},h('h3',null,trip.shiftName||trip.id),h('small',null,['Đang xếp xe','Đang xếp xe','Đang giao','Khi về','Chờ kế toán'][phase])),h('p',null,members.length+' đơn · '+fmt(members.reduce((sum,order)=>sum+weight(order),0))+' kg đặt'),
          h('div',{className:'dm-tools'},(canMobileFeature(user,'tripSummary')||canMobileFeature(user,'tripPrint'))&&h('button',{type:'button','data-scf-action':'view',onClick:()=>setPrintMode('summary')},h('i',{className:'ti ti-file-search'}),' Đơn tổng'),canMobileFeature(user,'tripPrint')&&printTool===1&&h('button',{type:'button','data-scf-action':'view',onClick:()=>setPrintMode('labels')},h('i',{className:'ti ti-tags'}),' Tem giao'),canMobileFeature(user,'tripPrint')&&printTool===2&&h('button',{type:'button','data-scf-action':'view',onClick:()=>setPrintMode('delivery')},h('i',{className:'ti ti-printer'}),' Phiếu giao'),canMobileFeature(user,'tripPrint')&&h('button',{type:'button','data-scf-action':'view','aria-label':printTool===0?'Hiện Tem giao':printTool===1?'Hiện Phiếu giao':'Ẩn nút in',onClick:()=>{setPrintMode('');setPrintTool(value=>(value+1)%3);}},printTool===0?'>>':printTool===1?'>':'<<'))),
        h('div',{className:'dm-steps'},['Kiểm & xếp','Giao & về'].map((label,index)=>h(workflowRequired?'span':'button',{key:label,type:workflowRequired?undefined:'button',className:(phase<=1?0:1)===index?'on':'',disabled:!workflowRequired&&(busy||submitted),onClick:workflowRequired?undefined:()=>{setWorkflowTab(index+1);setError('');},'aria-label':workflowRequired?undefined:'Mở phần '+label},(index+1)+'. '+label))),
        (phase===0||phase===1)&&h(React.Fragment,null,h('h3',null,'Kiểm hàng trước khi giao · '+loaded.length+'/'+members.length),
          [...loaded,...members.filter(order=>!order.driverLoadedAt)].map(order=>orderCard(order,true)),
          members.length>0&&(()=>{const sum=scfDriverLoadSummary(members,products);return h('section',{className:'dm-panel dm-load-summary'},
            h('h3',null,'Tổng theo mã để đồng kiểm'),
            h('table',{className:'dm-sum-table'},h('thead',null,h('tr',null,h('th',null,'Mã hàng'),h('th',null,'Số lượng'),h('th',null,'Kg'))),
              h('tbody',null,sum.rows.map(row=>h('tr',{key:row.name+'|'+row.unit},h('td',null,row.name),h('td',null,fmt(row.qty)+' '+row.unit),h('td',null,fmt(row.kg))))),
              h('tfoot',null,h('tr',null,h('td',null,'Tổng '+sum.codes+' mã'),h('td',null,fmt(sum.packs)+' gói'),h('td',null,fmt(sum.kg))))));})(),
          (!workflowRequired||loaded.length===members.length)&&members.length>0&&h('section',{className:'dm-panel dm-form'},h(DriverBasketField,{tripId:trip.id,label:'Tổng công rổ mang đi',value:trip.workOutTotal,disabled:!canWrite,onSave:value=>act('basketOut',value)}),photoControl('cargoBefore','Thùng xe trước giao',trip.cargoBeforeImage)),
          readyStart.length>0&&h('p',{className:'dm-hint'},readyStart.join('; ')),h('button',{className:'bp',disabled:!canWrite||!!readyStart.length,onClick:start},'Bắt đầu giao')),
        (phase===2||phase===3)&&h(React.Fragment,null,invoiceTotal(),h('h3',null,'Giao từng đơn · '+delivered.length+'/'+members.length),h('p',{className:'dm-hint'},'Tích đơn đã giao; bấm Thay đổi SL giao để sửa số lượng hoặc thêm sản phẩm PS.'),[...delivered,...members.filter(order=>!order.driverDeliveredAt)].map(order=>orderCard(order,false)),
          (phase===3||phase===2&&!workflowRequired)&&h('section',{className:'dm-panel dm-form'},h(DriverBasketField,{tripId:trip.id,label:'Tổng công rổ mang về',value:trip.workReturnTotal,disabled:!canWrite,onSave:value=>act('basketReturn',value)}),h('p',null,'Mang đi '+(trip.workOutTotal??'—')+' · Mang về '+(trip.workReturnTotal??'—')),photoControl('cargoAfter','Thùng xe khi về',trip.cargoAfterImage)),
          phase===2&&h('button',{className:'bp',disabled:!canWrite,onClick:()=>act('return')},'Đã về — Nộp hóa đơn'),
          pendingEditable&&h('p',{className:'dm-hint'},'Đã báo hoàn thành · Chờ kế toán duyệt. Vẫn bổ sung được hóa đơn, SL giao, công rổ về và ảnh thùng xe đến khi kế toán duyệt.'),phase===3&&!pendingEditable&&completeMissing.length>0&&h('p',{className:'dm-hint'},completeMissing.join('; ')),phase===3&&!pendingEditable&&h('button',{className:'bp',disabled:!canWrite||!!completeMissing.length,onClick:finish},'Hoàn thành chuyến')),
        phase===4&&h('section',{className:'dm-panel'},h('h3',null,trip.status==='completed'?'Đã được kế toán duyệt':'Đã báo hoàn thành · Chờ kế toán'),h(DriverTripEvidence,{trip,orders,showInvoices:canMobileFeature(user,'tripInvoices')})),
        !canTripAction(user,'driverWorkflow')&&h('p',{className:'dm-hint'},'Tài khoản chưa có quyền nhận và hoàn thành chuyến.'),busy&&h('p',{role:'status'},'Đang tải ảnh…'),error&&h('p',{role:'alert',className:'dm-error'},error)
      )
    ),
    trip&&editBase&&h(Modal,{title:'Thay đổi SL giao · '+(editBase.warehouseMerged?'Đơn gộp kho vận':(editBase.pointName||editBase.id)),onClose:()=>{setEditBase(null);setPsLine(null);}},h('p',null,'SL giao mặc định theo SL đặt. Chỉ sửa sản phẩm có thay đổi.'),
      scfDriverLineGroups(editBase).map(group=>h('div',{key:'q'+group.key,className:'dm-qty-group'},
        editBase.warehouseMerged&&h('div',{className:'dm-point'},h('b',null,group.label),group.time&&h('small',null,' · '+group.time)),
        group.lines.map(({line,index})=>h('label',{key:line.id||index,className:'dm-field'},h('span',null,line.productName+' · Đặt '+fmt(tripOrderedQty(line))+' '+(line.unit||''),line.isAdditionalProduct&&h('span',{className:'dm-ps-badge'+(line.psApprovalStatus==='pending'?' pending':'')},line.psApprovalStatus==='pending'?'PS · chờ KT duyệt':'PS')),h('input',{type:'text',inputMode:'decimal',value:qtyDraft[index],disabled:!canWrite||!canTripAction(user,'actualQty'),'aria-label':'SL giao '+line.productName+(group.label?' '+group.label:''),onChange:event=>{const value=event.target.value;setQtyDraft(previous=>previous.map((item,i)=>i===index?value:item));}}))),
        psLine?.group===group.key?h('div',{className:'dm-ps-form'},
          h('input',{type:'search',placeholder:'Tìm sản phẩm PS…','aria-label':'Tìm sản phẩm PS',value:psLine.query||'',onChange:event=>setPsLine({...psLine,query:event.target.value,productId:''})}),
          h('select',{'aria-label':'Sản phẩm PS',value:psLine.productId||'',onChange:event=>setPsLine({...psLine,productId:event.target.value})},h('option',{value:''},'— Chọn sản phẩm —'),productMatches(psLine.query).map(product=>h('option',{key:product.id,value:product.id},(product.code?product.code+' - ':'')+product.name+(product.unit?' ('+product.unit+')':'')))),
          h('input',{type:'text',inputMode:'decimal',placeholder:'SL giao','aria-label':'SL giao sản phẩm PS',value:psLine.qty||'',onChange:event=>setPsLine({...psLine,qty:event.target.value})}),
          h('div',{className:'dm-row'},h('button',{type:'button',onClick:()=>setPsLine(null)},'Hủy'),h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:!canWrite||!canTripAction(user,'actualQty'),onClick:()=>addPsLine(group)},'Thêm sản phẩm PS')))
          :h('button',{type:'button',className:'dm-ps-button','data-scf-action':'write',disabled:!canWrite||!canTripAction(user,'actualQty')||!['active','completion_pending'].includes(trip.status),onClick:()=>setPsLine({group:group.key,query:'',productId:'',qty:''})},h('i',{className:'ti ti-plus'}),' Sản phẩm PS'+(editBase.warehouseMerged?' · '+group.label:'')))),
      h('p',{className:'dm-hint'},'Sản phẩm PS tính ngay vào SL giao và khối lượng chuyến; kế toán duyệt sau (kế toán có thể sửa lại SL giao).'),
      error&&h('p',{role:'alert',className:'dm-error'},error),h('button',{className:'bp',disabled:!canWrite||!canTripAction(user,'actualQty'),onClick:saveQty},'Xong')),
    trip&&psOrder&&h(Modal,{title:'+ Đơn phát sinh (PS)',onClose:()=>setPsOrder(null)},
      h('p',{className:'dm-hint'},'Đơn PS vào chuyến '+(trip.shiftName||trip.id)+', thuộc khách hàng của địa điểm chọn. Tính ngay vào chuyến; kế toán duyệt sau.'),
      h('label',{className:'dm-field'},'Tìm địa điểm',h('input',{type:'search',value:psOrder.pointQuery,'aria-label':'Tìm địa điểm đơn PS',onChange:event=>setPsOrder({...psOrder,pointQuery:event.target.value,pointKey:''})})),
      h('label',{className:'dm-field'},'Địa điểm giao *',h('select',{'aria-label':'Địa điểm đơn PS',value:psOrder.pointKey,onChange:event=>setPsOrder({...psOrder,pointKey:event.target.value})},h('option',{value:''},'— Chọn địa điểm —'),pointChoices.filter(item=>!psOrder.pointQuery||scfDriverPsNorm(item.label).includes(scfDriverPsNorm(psOrder.pointQuery))).slice(0,40).map(item=>h('option',{key:item.key,value:item.key},item.label)))),
      h('label',{className:'dm-field'},'Tìm sản phẩm',h('input',{type:'search',value:psOrder.productQuery,'aria-label':'Tìm sản phẩm đơn PS',onChange:event=>setPsOrder({...psOrder,productQuery:event.target.value,productId:''})})),
      h('label',{className:'dm-field'},'Sản phẩm *',h('select',{'aria-label':'Sản phẩm đơn PS',value:psOrder.productId,onChange:event=>setPsOrder({...psOrder,productId:event.target.value})},h('option',{value:''},'— Chọn sản phẩm —'),productMatches(psOrder.productQuery).map(product=>h('option',{key:product.id,value:product.id},(product.code?product.code+' - ':'')+product.name+(product.unit?' ('+product.unit+')':''))))),
      h('label',{className:'dm-field'},'SL giao *',h('input',{type:'text',inputMode:'decimal',value:psOrder.qty,'aria-label':'SL giao đơn PS',onChange:event=>setPsOrder({...psOrder,qty:event.target.value})})),
      h('label',{className:'dm-field'},'Ghi chú',h('input',{type:'text',value:psOrder.note,'aria-label':'Ghi chú đơn PS',placeholder:'VD: Bếp gọi thêm lúc 2:10',onChange:event=>setPsOrder({...psOrder,note:event.target.value})})),
      error&&h('p',{role:'alert',className:'dm-error'},error),
      h('button',{className:'bp','data-scf-action':'write',disabled:!psOrderAllowed,onClick:createPsOrder},h('i',{className:'ti ti-send'}),' Gửi kế toán duyệt')),
    afterOrder&&h(Modal,{title:'Đã ghi nhận giao đơn',onClose:()=>setAfterOrder('')},h('p',null,'Chụp hóa đơn nếu có, hoặc bổ sung sau.'),h(Row,null,h('button',{className:'bp',onClick:()=>{const id=afterOrder;setAfterOrder('');photo('invoice',id);}},'Chụp hóa đơn'),h('button',{onClick:()=>setAfterOrder('')},'Đóng'))),
    gallery&&h(Modal,{title:gallery.label,lg:true,onClose:()=>setGallery(null)},gallery.images.map((src,index)=>h(TripInvoicePreview,{key:src,src,landscape:true,label:gallery.label+' · '+(index+1)}))),
    trip&&printMode==='summary'&&h(Modal,{title:'Đơn tổng chuyến',onClose:()=>setPrintMode('')},canMobileFeature(user,'tripSummary')&&h('button',{onClick:()=>{setPrintMode('');onViewSummary(trip);}},'Xem ảnh đơn tổng'),canMobileFeature(user,'tripPrint')&&h('button',{className:'bp',onClick:()=>{setPrintMode('');onSummary(trip);}},'In đơn tổng chuyến')),
    trip&&printMode==='delivery'&&h(PrintByCustomerModal,{key:trip.id,tripOnlyId:trip.id,simulate:previewMode,orders:members,customers,products,company,trips:[trip],initialDate:trip.deliveryDate.split('/').reverse().join('-'),initialDateBasis:'trip',onClose:()=>setPrintMode('')}),
    trip&&printMode==='labels'&&h(DriverLabelPrintModal,{key:trip.id,trip,orders:members,products,prodCats,user,previewMode,onClose:()=>setPrintMode(''),getLatest:()=>{const latest=guard();return {...latest,trip:latest.trips.find(row=>String(row.id)===String(trip.id)),products};}})
  );
}
