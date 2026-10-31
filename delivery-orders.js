/* ─── DELIVERY ORDERS ─── */
function deliveryOrderDuplicateKey(order){
  const date=String(order?.deliveryDate||'').trim(),time=normalizeTimeInput(order?.deliveryTime||'');
  const point=normalizeLookupText(order?.pointName||order?.address||'')||String(order?.pointId||'').trim();
  return date&&time&&point?[date,time,point].join('|'):'';
}
function findExistingDeliveryOrder(orders,candidate,excludeId=''){
  const key=deliveryOrderDuplicateKey(candidate);if(!key)return null;
  for(const order of orders||[]){
    if(String(order?.id||'')===String(excludeId||'')||order?.status==='cancelled')continue;
    if(deliveryOrderDuplicateKey(order)===key)return order;
    const source=(order.warehouseSourceOrders||[]).find(source=>deliveryOrderDuplicateKey(source)===key);
    if(source)return{...source,id:order.id,warehouseSourceOrderId:source.id};
  }
  return null;
}
function findExistingDeliveryOrderId(orders,id,excludeId=''){
  const target=String(id||'').trim();if(!target)return null;
  return (orders||[]).find(order=>String(order?.id||'')!==String(excludeId||'')&&(String(order?.id||'').trim()===target||(order.warehouseSourceOrders||[]).some(source=>String(source.id)===target)))||null;
}
function deliveryOrderFilterDate(order,basis,trip,plannedDate){
  return basis==='trip'?(trip?.deliveryDate||plannedDate||order?.deliveryDate||''):(order?.deliveryDate||'');
}
const DELIVERY_ORDER_COLUMNS=[['sequence','STT',105],['date','Ngày',160],['point','Địa điểm',175],['product','Sản phẩm',190],['qtyInvoice','SL HĐ',85],['qtyProd','SL Đặt',85],['qtyDelivered','SL giao',85],['time','Giờ',75],['invoice','HĐ',80],['note','Chú ý',220],['production','Ngày SX · Ca SX',210],['label','Tem',135],['status','Trạng thái',105],['actions','Tạo-sửa',205]];
function scfDeliveryColumnWidth(key,value){
  const minimum={sequence:90,date:150,point:90,product:120,qtyInvoice:65,qtyProd:65,qtyDelivered:65,time:65,invoice:50,note:90,production:210,label:135,status:85,actions:144};
  return Math.round(Math.max(minimum[key]||60,Math.min(1200,Number(value)||minimum[key]||60)));
}
function scfDeliveryReadColumnWidths(key){
  try{const saved=JSON.parse(localStorage.getItem(key)||'{}');return Object.fromEntries(DELIVERY_ORDER_COLUMNS.filter(([name])=>Number.isFinite(saved?.[name])&&saved[name]>0).map(([name])=>[name,scfDeliveryColumnWidth(name,saved[name])]));}catch(_){return {};}
}
function scfDeliveryLayoutWidths(columns,fitted,custom,available){
  const widths=Object.fromEntries(columns.map(([key,,fallback])=>[key,scfDeliveryColumnWidth(key,custom[key]??fitted[key]??fallback)]));
  const total=Object.values(widths).reduce((sum,width)=>sum+width,0),flex=['note','product','point'].find(key=>widths[key]&&!Object.prototype.hasOwnProperty.call(custom,key));
  if(flex&&available>total)widths[flex]+=Math.floor(available-total);
  return widths;
}
function DeliveryColumnResizeHandle({column,label,width,onResize}){
  const cleanup=useRef(null);
  useEffect(()=>()=>cleanup.current?.(),[]);
  const start=event=>{
    if(event.button!==0)return;event.preventDefault();event.stopPropagation();cleanup.current?.();
    const table=event.currentTarget.closest('table'),col=table?.querySelector('col[data-column="'+column+'"]');if(!table||!col)return;
    const x=event.clientX,oldWidth=col.style.width,tableStyle=table.style.width,tableMinimum=table.style.minWidth,initialWidth=event.currentTarget.closest('th').getBoundingClientRect().width,initialTable=table.getBoundingClientRect().width;
    const oldSelect=document.body.style.userSelect;document.body.style.userSelect='none';let nextWidth=initialWidth;
    const move=e=>{nextWidth=scfDeliveryColumnWidth(column,initialWidth+e.clientX-x);col.style.width=nextWidth+'px';table.style.width=table.style.minWidth=(initialTable+nextWidth-initialWidth)+'px';};
    const done=commit=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',cancel);window.removeEventListener('blur',cancel);document.body.style.userSelect=oldSelect;cleanup.current=null;col.style.width=oldWidth;table.style.width=tableStyle;table.style.minWidth=tableMinimum;if(commit)onResize(nextWidth);};
    const up=()=>done(true),cancel=()=>done(false);cleanup.current=cancel;
    document.addEventListener('pointermove',move);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',cancel);window.addEventListener('blur',cancel);
  };
  return h('span',{className:'delivery-column-resize',role:'separator',tabIndex:0,'aria-orientation':'vertical','aria-label':'Độ rộng cột '+label,'aria-valuenow':width,title:'Kéo để chỉnh độ rộng · Nhấp đúp để vừa nội dung',onPointerDown:start,onClick:event=>event.stopPropagation(),onDoubleClick:event=>{event.preventDefault();event.stopPropagation();onResize(null);},onKeyDown:event=>{if(['ArrowLeft','ArrowRight','Home'].includes(event.key)){event.preventDefault();event.stopPropagation();onResize(event.key==='Home'?null:width+(event.key==='ArrowLeft'?-10:10));}}});
}
function scfDeliveryShiftLabel(value){const name=String(value||'').trim().replace(/^ca\s+/i,'');return name?name[0].toLocaleUpperCase('vi-VN')+name.slice(1):'';}
function deliveryOrderQuantityTotals(orders){
  const totals={qtyInvoice:0,qtyProd:0,qtyDelivered:0};
  for(const order of orders||[])for(const line of order.lines||[]){
    for(const field of Object.keys(totals))totals[field]+=mobileDeliveryQty(line,field);
  }
  return totals;
}
function deliveryOrderCustomerEntries(order,catalog){
  const sources=order?.warehouseMerged&&order.warehouseSourceOrders?.length?order.warehouseSourceOrders:[order];
  const entries=new Map();
  for(const row of sources){
    const storedId=String(row?.customerId||row?.custId||'').trim(),storedName=String(row?.customer||row?.customerName||'').trim();
    const customer=catalog.byId.get(storedId)||(!storedId&&catalog.byName.get(normalizeLookupText(storedName)));
    const id=storedId||String(customer?.id||''),name=String(customer?.name||storedName||id||'Chưa xác định khách hàng');
    const key=id?'id:'+id:storedName?'name:'+normalizeLookupText(storedName):'__unknown';
    entries.set(key,{key,label:name});
  }
  return [...entries.values()];
}
function deliveryTripRecallChange(trip,currentUser,stamp=fmtDT()){
  if(!trip?.driverDispatchedAt||trip.status!=='assigned'||trip.startTime)throw new Error('Chỉ hủy giao được chuyến chưa bắt đầu giao.');
  return {...trip,driverDispatchedAt:'',driverDispatchedBy:'',driverDispatchCancelledAt:stamp,driverDispatchCancelledBy:currentUser?.name||'',driverAcknowledgedAt:'',startTime:'',driverNotificationSentAt:'',driverNotificationRecipientId:'',updatedAt:stamp,updatedBy:currentUser?.name||''};
}
function deliveryTripDispatchChange(trip,orders,employees,memberIds,currentUser,stamp=fmtDT()){
  if(!trip||trip.driverDispatchedAt||!['planning','assigned'].includes(trip.status))throw new Error('Chuyến đã giao lái xe hoặc không còn ở trạng thái có thể giao.');
  if(!trip.driverId&&!trip.driverName)throw new Error('Hãy chọn lái xe cho chuyến trước.');
  const byId=(employees||[]).find(e=>String(e.id)===String(trip.driverId||''));
  const matches=(employees||[]).filter(e=>normalizeLookupText(e.name)===normalizeLookupText(trip.driverName));
  const driver=byId||(matches.length===1?matches[0]:null);
  if(!driver||driver.active===false)throw new Error('Không tìm thấy tài khoản lái xe hợp lệ. Hãy chọn lại lái xe.');
  const ids=new Set(memberIds.map(String));
  const members=(orders||[]).filter(order=>ids.has(String(order.id))&&order.status!=='cancelled');
  if(!members.length)throw new Error('Chuyến chưa có đơn hợp lệ để giao lái xe.');
  const validIds=new Set(members.map(order=>String(order.id)));
  const nextTrip={...trip,driverId:driver.id,driverName:driver.name,orderIds:members.map(order=>order.id),status:'assigned',assignedAt:trip.assignedAt||stamp,
    driverDispatchedAt:stamp,driverDispatchedBy:currentUser?.name||'',driverNotificationSentAt:stamp,driverNotificationRecipientId:driver.id,updatedAt:stamp,updatedBy:currentUser?.name||''};
  const nextOrders=(orders||[]).map(order=>validIds.has(String(order.id))&&['pending','assigned','scheduled',''].includes(String(order.status||''))&&order.status!=='assigned'?{...order,status:'assigned'}:order);
  return{trip:nextTrip,orders:nextOrders,notification:{recipientId:driver.id,title:'Chuyến đã sẵn sàng giao',message:(trip.shiftName||trip.id)+' - '+trip.deliveryDate+' - '+members.length+' đơn',icon:'ti-bell-ringing',sourceType:'trip',sourceId:trip.id,targetPage:'trips'}};
}
function deliveryTripDriverEditable(trip){
  return !!trip&&!trip.driverDispatchedAt&&!['active','completion_pending','completed','cancelled'].includes(trip.status);
}
function scfDeliveryReorderTrip({trip,orders,customers,sourceId,targetId,currentUser}){
  if(!deliveryTripDriverEditable(trip))throw Error('Chỉ đổi thứ tự khi chuyến chưa giao lái xe.');
  if(String(sourceId)===String(targetId))return null;
  const ids=new Set((trip.orderIds||[]).map(String));
  const available=new Set((orders||[]).map(o=>String(o.id)));
  if([...ids].some(id=>!available.has(id)))throw Error('Chưa tải đủ đơn của chuyến. Hãy tải lại đủ dữ liệu trước khi đổi thứ tự.');
  const members=(orders||[]).filter(o=>o.status!=='cancelled'&&(o.tripId?String(o.tripId)===String(trip.id):ids.has(String(o.id))));
  if(new Set(members.map(o=>String(o.id))).size!==members.length)throw Error('Mã đơn bị trùng. Hãy kiểm tra trước khi đổi thứ tự.');
  const sorted=sortTripOrdersByDeliveryOrder(trip,members,customers||[]);
  const from=sorted.findIndex(o=>String(o.id)===String(sourceId)),to=sorted.findIndex(o=>String(o.id)===String(targetId));
  if(from<0||to<0)throw Error('Chỉ kéo thả giữa các đơn trong cùng chuyến.');
  [sorted[from],sorted[to]]=[sorted[to],sorted[from]];
  const ranks=new Map(sorted.map((o,i)=>[String(o.id),i+1])),stamp=fmtDT();
  return {trip:{...trip,deliveryOrderMode:'manual',updatedAt:stamp,updatedBy:currentUser?.name||''},orders:(orders||[]).map(o=>ranks.has(String(o.id))?{...o,deliveryOrder:ranks.get(String(o.id)),deliverySeq:ranks.get(String(o.id)),updatedAt:stamp,updatedBy:currentUser?.name||''}:o)};
}
function deliveryTripDriverChange(trip,driver,orders,memberIds,currentUser){
  if(!deliveryTripDriverEditable(trip))throw new Error('Chuyến đã giao lái xe hoặc đã kết thúc. Hãy thu hồi chuyến trước khi đổi lái xe.');
  if(!driver||(!driver.id&&driver.name))throw new Error('Lái xe không hợp lệ.');
  const members=new Set((memberIds||[]).map(String)),stamp=fmtDT(),entry=()=>deliveryOrderAuditEntry('Đổi lái xe chuyến bằng tay',currentUser,
    ['Chuyến: '+trip.id,'Lái xe: '+(trip.driverName||'Chưa có lái')+' → '+(driver.name||'Chưa có lái xe'),'Cách xếp: Bằng tay']);
  const nextOrders=(orders||[]).map(order=>{
    if(!members.has(String(order.id||''))||order.status==='cancelled')return order;
    return {...order,tripId:trip.id,tripAssignMode:'manual',updatedAt:stamp,updatedBy:currentUser?.name||'',orderHistory:[...(order.orderHistory||[]),entry()]};
  });
  const orderIds=nextOrders.filter(order=>String(order.tripId||'')===String(trip.id)).map(order=>order.id);
  return {orders:nextOrders,trip:{...trip,driverId:driver.id,driverName:driver.name,driverAssignMode:'manual',orderIds,
    status:trip.status==='planning'&&driver.id?'assigned':trip.status,updatedAt:stamp,updatedBy:currentUser?.name||'',tripHistory:[...(trip.tripHistory||[]),entry()]}};
}
const deliveryTripDriverSyncNotices=new Map();
function deliverySyncTripDriverInBackground(trip,driver,memberIds){
  const token={},key=String(trip.id),actorId=window.__SCF_ACCESS_CONTEXT?.employeeId;
  deliveryTripDriverSyncNotices.set(key,token);
  const report=(message,type)=>{
    if(deliveryTripDriverSyncNotices.get(key)!==token)return;
    deliveryTripDriverSyncNotices.delete(key);
    if(actorId&&String(window.__SCF_ACCESS_CONTEXT?.employeeId||'')!==String(actorId))return;
    window.showToast(message,type,8000);
  };
  // Trả quyền thao tác ngay; kết quả máy chủ được thông báo riêng.
  return Promise.resolve().then(()=>window.scfWaitForTripDriverSync?.(trip.id,driver.id,memberIds,35000)).then(confirmed=>{
    report(confirmed?'Máy chủ đã xác nhận '+(driver.name?'lái xe '+driver.name:'bỏ gán lái xe')+' và '+memberIds.length+' đơn Bằng tay của chuyến '+(trip.shiftName||trip.id)+'.'
      :'Chuyến '+(trip.shiftName||trip.id)+' '+(driver.name?'đổi sang '+driver.name:'bỏ gán lái xe')+' vẫn đang chờ đồng bộ. Xem trạng thái đồng bộ để kiểm tra.',confirmed?'success':'warn');
    return !!confirmed;
  }).catch(error=>{report('Chưa đồng bộ được lái xe chuyến '+(trip.shiftName||trip.id)+': '+(error?.message||'Lỗi kết nối'),'warn');return false;});
}
function DeliveryTripDriverModal({trip,employees,onSave,onClose}){
  const drivers=(employees||[]).filter(emp=>emp.role==='driver'||employeeHasDepartment(emp,'Lái xe'));
  const [driverId,setDriverId]=useState(()=>String(drivers.find(emp=>String(emp.id)===String(trip.driverId))?.id||
    drivers.find(emp=>normalizeLookupText(emp.name)===normalizeLookupText(trip.driverName)&&trip.driverName)?.id||'')),
    [query,setQuery]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const active=useRef(true),inFlight=useRef(false);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  const close=()=>{active.current=false;onClose();};
  const options=drivers.filter(emp=>String(emp.id)===String(driverId)||normalizeLookupText(emp.name+' '+emp.id).includes(normalizeLookupText(query))).sort((a,b)=>String(a.name).localeCompare(String(b.name),'vi'));
  const save=async()=>{
    if(inFlight.current)return;
    const driver=driverId?drivers.find(emp=>String(emp.id)===String(driverId)):{id:'',name:''};
    if(!driver){setError('Lái xe không còn trong danh sách. Hãy chọn lại.');return;}
    inFlight.current=true;setSaving(true);setError('');
    // Cho trình duyệt vẽ trạng thái đang lưu trước khi xử lý danh sách đơn.
    await new Promise(resolve=>setTimeout(resolve,0));
    try{
      const result=await onSave(trip.id,driver);
      if(active.current){if(result===true||result?.queued)close();else setError('Chưa ghi được thay đổi. Hãy kiểm tra trạng thái đồng bộ rồi thử lại.');}
    }catch(e){if(active.current)setError(e?.message||'Chưa đổi được lái xe.');}
    finally{inFlight.current=false;if(active.current)setSaving(false);}
  };
  return h(Modal,{title:'Đổi lái xe — '+(trip.shiftName||trip.id),onClose:close},
    h('p',null,trip.deliveryDate+' · '+(trip.driverName||'Chưa có lái')),
    h(F,{label:'Tìm lái xe'},h('input',{value:query,disabled:saving,placeholder:'Gõ tên hoặc mã lái xe',onChange:e=>setQuery(e.target.value)})),
    h(F,{label:'Lái xe mới'},h('select',{'aria-label':'Lái xe mới',value:driverId,disabled:saving,onChange:e=>{setDriverId(e.target.value);setError('');}},
      h('option',{value:''},'Chưa có lái'),options.map(emp=>h('option',{key:emp.id,value:emp.id},emp.name)))),
    h('p',{style:{fontSize:13,color:'var(--tx2)'}},'Có thể chọn Chưa có lái xe để bỏ gán. Đơn vẫn giữ trong chuyến và chuyển sang Bằng tay.'),
    saving&&h('p',{role:'status'},'Đang gửi thay đổi… Bạn có thể đóng cửa sổ; việc đồng bộ vẫn tiếp tục.'),
    error&&h('p',{role:'alert',style:{color:'#A32D2D'}},error),
    h(Row,null,h('button',{onClick:close},saving||error?'Đóng':'Hủy'),h('button',{className:'bp',disabled:saving,onClick:save},saving?'Đang lưu…':'Lưu lái xe')));
}
function DeliveryOrderGroupHeader({group,count,weight,onEditDriver,mobile=false,tone='green',summaryInvoiceButton,dispatchButton,printButton,onToggleDetails,detailsHidden=false}){
  const isTrip=group?.mode==='trip';
  return h('div',{className:'delivery-group-header'+(mobile?' delivery-group-header-mobile delivery-trip-tone-'+tone:'')},
    onToggleDetails&&h('button',{type:'button',className:'delivery-group-toggle','data-scf-action':'view','aria-expanded':!detailsHidden,'aria-label':(detailsHidden?'Hiện':'Ẩn')+' đơn chi tiết chuyến '+group.label,title:detailsHidden?'Hiện đơn chi tiết':'Ẩn đơn chi tiết',onClick:event=>{event.stopPropagation();onToggleDetails();}},h('i',{className:detailsHidden?'ti ti-chevron-right':'ti ti-chevron-down','aria-hidden':true})),
    h('span',{className:'delivery-group-title'},(group?.mode==='unassigned'?'⚠ ':isTrip?'🚚 Chuyến: ':'📍 Khu vực: ')+(group?.label||'')),
    isTrip&&h('span',{className:'delivery-group-driver'},h('span',null,group?.driverName?'Lái xe: '+group.driverName:'Chưa có lái'),
      onEditDriver&&h('button',{type:'button',className:'delivery-group-driver-edit','data-scf-action':'write',title:'Đổi lái xe chuyến','aria-label':'Đổi lái xe chuyến '+group.label,onClick:()=>onEditDriver(group.tripId)},h('i',{className:'ti ti-pencil'}))),
    h('span',{className:'delivery-group-summary',title:'Tổng khối lượng đặt'},count+' đơn — '+weight.toFixed(1)+' kg đặt'),
    dispatchButton,
    summaryInvoiceButton,printButton
  );
}
function deliveryOrderCreator(order){
  const history=Array.isArray(order?.orderHistory)?order.orderHistory:[];
  return order?.createdBy||history[0]?.by||order?.updatedBy||'không rõ người tạo';
}
function deliveryOrderAuditEntry(action,currentUser,changes=[]){
  return {id:'LS'+uid(),action,changes,at:fmtDT(),atIso:new Date().toISOString(),by:currentUser?.name||'Hệ thống',byId:currentUser?.id||''};
}
function deliveryOrderWithImportAudit(order,currentUser,source){
  const importedAt=fmtDT(),importedBy=currentUser?.name||'Hệ thống';
  return {...order,warehouseMergePending:true,createdBy:order?.createdBy||importedBy,importSource:source||'Import dữ liệu',importedAt,importedBy,orderHistory:[...(order?.orderHistory||[]),deliveryOrderAuditEntry('Import đơn hàng',currentUser,['Nguồn: '+(source||'Import dữ liệu'),'Địa điểm: '+(order?.pointName||order?.customer||'—')])]};
}
function deliveryOrderHistoryItems(order){
  const history=Array.isArray(order?.orderHistory)?order.orderHistory:[];
  const by=order?.importedBy||order?.createdBy||order?.updatedBy||'';
  if(!by||history.some(item=>/^(Import đơn hàng|Tạo đơn hàng|Tạo đơn từ bản sao|Thông tin tạo\/import đơn hàng)/i.test(String(item?.action||''))))return history;
  const imported=!!(order?.importedBy||order?.importSource||/^Nhập từ/i.test(String(order?.note||'')));
  return [{id:'legacy-'+String(order?.id||''),action:imported?'Import đơn hàng':'Thông tin tạo/import đơn hàng (dữ liệu cũ)',changes:order?.importSource?['Nguồn: '+order.importSource]:[],at:order?.importedAt||order?.createdAt||order?.updatedAt||'',by,byId:''},...history];
}
function duplicateDeliveryOrderMessage(candidate,existing){
  return 'Đơn ngày '+(candidate?.deliveryDate||'chưa có')+', giờ '+(normalizeTimeInput(candidate?.deliveryTime||'')||'chưa có')+', địa điểm '+(candidate?.pointName||candidate?.address||'chưa có')+' đã tồn tại. Người tạo trước đó: '+deliveryOrderCreator(existing)+'.';
}
function manualTripDateToISO(value){
  const raw=String(value||'').trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;
  const match=raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  return match?match[3]+'-'+match[2].padStart(2,'0')+'-'+match[1].padStart(2,'0'):'';
}
function manualTripText(trip){
  if(!trip)return 'Chưa có chuyến phù hợp';
  return [trip.shiftName||'Chưa có ca',trip.driverName||'Chưa có lái xe'].join(' · ');
}
const DELIVERY_TRIP_INDEX_CACHE=new WeakMap();
function deliveryTripIndex(trips){
  if(DELIVERY_TRIP_INDEX_CACHE.has(trips))return DELIVERY_TRIP_INDEX_CACHE.get(trips);
  const byId=new Map(),byDate=new Map(),automatic=new Map(),legacyOrder=new Map(),search=new Map();
  const automaticKey=(date,shiftId)=>JSON.stringify([date,String(shiftId||'').trim()]);
  (trips||[]).forEach(trip=>{
    byId.set(String(trip.id||''),trip);
    const date=manualTripDateToISO(trip.deliveryDate),items=byDate.get(date)||[];
    items.push(trip);byDate.set(date,items);
    (trip.orderIds||[]).forEach(id=>{if(!legacyOrder.has(String(id)))legacyOrder.set(String(id),trip);});
    if(!trip.driverDispatchedAt&&!['active','completion_pending','completed','cancelled'].includes(trip.status)){
      const key=automaticKey(date,trip.shiftId),candidates=automatic.get(key)||[];
      candidates.push(trip);automatic.set(key,candidates);
    }
  });
  automatic.forEach(items=>items.sort((a,b)=>String(a.id||'').localeCompare(String(b.id||''),'vi')));
  const index={byId,byDate,legacyOrder,
    candidates:(date,shiftId)=>automatic.get(automaticKey(manualTripDateToISO(date),shiftId))||[],
    filter(date,query){
      const day=manualTripDateToISO(date),text=normalizeLookupText(query||'');
      const candidates=day?(byDate.get(day)||[]):(trips||[]);
      if(!text)return candidates;
      return candidates.filter(trip=>{
        if(!search.has(trip))search.set(trip,normalizeLookupText([trip.deliveryDate,trip.shiftName,trip.driverName,trip.area,trip.id].filter(Boolean).join(' ')));
        return search.get(trip).includes(text);
      });
    }};
  if(Array.isArray(trips))DELIVERY_TRIP_INDEX_CACHE.set(trips,index);return index;
}
function filterManualTripOptions(trips,date,query){
  return deliveryTripIndex(trips).filter(date,query);
}
function manualTripForOrder(trips,order){
  const index=deliveryTripIndex(trips);
  const tripId=String(order?.tripId||'');
  if(tripId)return index.byId.get(tripId)||null;
  if(order?.tripAssignMode==='manual')return null;
  return index.legacyOrder.get(String(order?.id||''))||null;
}
function DeliveryTripModeSwitch({mode,disabled,title,onChange}){
  return h('button',{type:'button',className:'delivery-trip-mode-switch','data-scf-action':'write','data-mode':mode,
    role:'switch','aria-label':'Xếp chuyến tự động','aria-checked':mode!=='manual',disabled,
    title:title||(mode==='manual'?'Bằng tay · Bấm để chuyển về tự động':'Tự động · Bấm để chọn chuyến bằng tay'),onClick:onChange
  },mode==='manual'?'BT':'TĐ');
}
function DeliveryAutomaticTripFields({trip,defaultDate,compact=false}){
  const date=manualTripDateToISO(trip?.deliveryDate||defaultDate);
  const dateText=date?date.split('-').reverse().join('/'):'—';
  return h('div',{className:'delivery-trip-auto-fields'+(compact?' compact':'')},
    h('span',{className:'delivery-trip-date-display',title:'Ngày chuyến tự động','aria-label':'Ngày chuyến giao hàng: '+dateText},dateText),
    h('select',{className:'delivery-trip-choice',value:trip?.id||'',disabled:true,title:manualTripText(trip),'aria-label':'Ca giao và lái xe'},
      h('option',{value:trip?.id||''},manualTripText(trip)))
  );
}
function ManualTripPicker({trips,selectedTripId,defaultDate,disabled,title,onConfirm,compact=false}){
  const selectedTrip=deliveryTripIndex(trips).byId.get(String(selectedTripId||''))||null;
  const initialDate=manualTripDateToISO(selectedTrip?.deliveryDate||defaultDate||(trips||[])[0]?.deliveryDate||'');
  const [date,setDate]=useState(initialDate);
  const [draftTripId,setDraftTripId]=useState(selectedTripId||'');
  const [saving,setSaving]=useState(false);
  const [saveState,setSaveState]=useState('');
  useEffect(()=>{
    const next=manualTripDateToISO(selectedTrip?.deliveryDate||defaultDate||'');
    if(next&&next!==date)setDate(next);
    setDraftTripId(selectedTripId||'');
  },[selectedTripId,defaultDate]);
  const filtered=React.useMemo(()=>filterManualTripOptions(trips,date,''),[trips,date]);
  const selectedVisible=filtered.some(trip=>String(trip?.id||'')===String(draftTripId||''));
  const hasChange=String(draftTripId||'')!==String(selectedTripId||'');
  const confirm=async()=>{
    if(disabled||saving||(!hasChange&&saveState!=='error'))return;
    setSaving(true);setSaveState('');
    try{setSaveState(await onConfirm(draftTripId)?'confirmed':'error');}
    catch(error){setSaveState('error');window.showToast(error?.message||'Chưa lưu được chuyến đã chọn.','error');}
    finally{setSaving(false);}
  };
  const needsConfirmation=hasChange||saving||saveState==='error';
  return h('div',{className:'manual-trip-picker'+(compact?' compact':'')},
    h('input',{className:'delivery-trip-date',type:'date',value:date,disabled:disabled||saving,title:'Gõ hoặc chọn ngày chuyến',onChange:e=>setDate(e.target.value),'aria-label':'Ngày chuyến giao hàng'}),
    h('select',{
      className:'delivery-trip-choice','aria-label':'Ca giao và lái xe',
      value:selectedVisible?draftTripId:'',
      disabled:disabled||saving,
      title:title||manualTripText(deliveryTripIndex(trips).byId.get(String(draftTripId||''))),
      onChange:e=>{setDraftTripId(e.target.value);setSaveState('')},
      style:{color:draftTripId?'var(--pri)':'var(--tx2)'}
    },
      h('option',{value:''},filtered.length?'— Chọn chuyến trong ngày —':'— Không có chuyến phù hợp —'),
      filtered.map(trip=>h('option',{key:trip.id,value:trip.id},manualTripText(trip)))
    ),
    needsConfirmation&&h('button',{type:'button',className:'bp delivery-trip-confirm',disabled:disabled||saving,onClick:confirm,
      title:saving?'Đang xác nhận trên máy chủ…':saveState==='error'?'Máy chủ chưa xác nhận. Bấm để thử xác nhận lại.':'Xác nhận chuyển xong',
      'aria-label':saving?'Đang xác nhận trên máy chủ':saveState==='error'?'Thử xác nhận lại':'Xác nhận chuyển xong'
    },h('i',{className:saving?'ti ti-loader-2 spin':saveState==='error'?'ti ti-refresh':'ti ti-check','aria-hidden':true})),
    saveState==='error'&&h('span',{role:'alert',className:'delivery-trip-status'},'Máy chủ chưa xác nhận. Chuyến đang chờ đồng bộ; vui lòng thử lại.')
  );
}
function OrderDetailLine({line,products,prodCats,prodShifts,deliveryDate,deliveryTime,pointName,area,inheritedShift,inheritedTiming,inheritedMode,onChange,onRemove}){
  const prod=products.find(p=>p.id===line.productId)||{};
  const showPurchasePrice=isGoodsProduct(prod,prodCats||[]);
  const pickProduct=p=>{
    onChange({...line,productId:p?.id||'',productName:p?.name||'',unit:p?.unit||'',weightPerUnit:p?.weightPerUnit||0});
  };
  // Tự động tính ca SX từ giờ giao
  const autoShift=getProdShiftForOrder({deliveryTime,area,pointName,address:pointName,customer:''},prodShifts||[],window.__SCF_CUSTOMERS||[]);
  const followShift=inheritedShift||autoShift||inheritedTiming?.shift;
  const followTiming=inheritedTiming||scfTripProductionPlan({deliveryDate,deliveryTime,area,pointName},followShift)||{};
  const dispShift=followShift?{
    name:(window.__SCF_PROD_SHIFT_RULES||[]).find(r=>String(r.id)===String(followTiming.prodWorkShiftId||''))?.name||getProdWorkShiftRule(followTiming.prodTime)?.name||followShift.name||'',
    prodWorkShiftId:followTiming.prodWorkShiftId||'',
    prodTime:followTiming.prodTime||'',prodDate:followTiming.prodDate||'',
    labelTime:followTiming.labelTime||'',labelDate:followTiming.labelDate||'',
  }:null;
  // override: nếu line.shiftOverride=true thì dùng giá trị tay
  const isOverride=!!line.shiftOverride;
  const manualShift=isOverride?getProdShiftByProdTime(line.prodTime,prodShifts||[]):null;
  const setManualProdTime=v=>{
    const sh=getProdShiftByProdTime(v,prodShifts||[]);
    onChange({
      ...line,
      prodTime:v,
      prodDate:sh?addDaysVN(deliveryDate,sh.prodDateOffset||0):(line.prodDate||''),
      labelTime:sh?.labelPrintTime||line.labelTime||'',
      labelDate:sh?addDaysVN(deliveryDate,sh.labelPrintDateOffset||0):(line.labelDate||'')
    });
  };
  const toggleOverride=()=>onChange({...line,shiftOverride:!isOverride,
    prodTime:dispShift?.prodTime||'',
    prodDate:dispShift?.prodDate||'',
    labelTime:dispShift?.labelTime||'',
    labelDate:dispShift?.labelDate||'',
  });
  return h('div',{className:'order-detail-line-grid'+(showPurchasePrice?' has-purchase-price':''),style:{display:'grid',gridTemplateColumns:showPurchasePrice?'minmax(140px,1.4fr) 66px 66px 76px 54px minmax(125px,1.2fr) minmax(155px,1.4fr)':'minmax(170px,1.4fr) 72px 72px 60px minmax(150px,1.2fr) minmax(175px,1.4fr)',gap:6,alignItems:'end',marginBottom:6,padding:'8px 44px 8px 10px',background:'var(--bg2)',borderRadius:'var(--r)'}},
    // Sản phẩm — thu nhỏ
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'Sản phẩm'),
      h(ImportProductSearch,{
        products:products||[],
        prodCats:prodCats||[],
        value:line.productId||'',
        onChange:productId=>pickProduct((products||[]).find(p=>String(p.id)===String(productId))||null),
        showCategoryFilters:true,
        compact:true
      })
    ),
    // SL Dat
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'SL Đặt'),
      h('input',{type:'number',min:0,value:line.qtyProd,onChange:e=>onChange({...line,qtyProd:numFmt(e.target.value)}),style:{fontSize:13}})
    ),
    // SL HĐ
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'SL HĐ'),
      h('input',{type:'number',min:0,value:line.qtyInvoice,onChange:e=>onChange({...line,qtyInvoice:numFmt(e.target.value)}),style:{fontSize:13}})
    ),
    // Giá mua
    showPurchasePrice&&h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'Giá mua'),
      h(NumInput,{value:line.purchasePrice||line.price||0,onChange:v=>onChange({...line,purchasePrice:v,price:v}),placeholder:'0',style:{fontSize:13}})
    ),
    // ĐVT
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'ĐVT'),
      h('input',{value:prod.unit||line.unit||'',readOnly:true,style:{fontSize:13,background:'var(--card)',cursor:'default',textAlign:'center'}})
    ),
    h('div',{className:'order-line-note'},
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'Ghi chú dòng'),
      h('input',{value:line.note||'',onChange:e=>onChange({...line,note:e.target.value}),placeholder:'Ghi chú riêng cho sản phẩm này...',style:{fontSize:12,width:'100%'}})
    ),
    // Ca SX — hiển thị tự động hoặc cho nhập tay
    h('div',{style:{padding:'6px 8px',background:isOverride?'#FFF8E1':'var(--card)',borderRadius:'var(--r)',border:'1px solid '+(isOverride?'#f8c30f':'var(--bd)')}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}},
        h('div',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},isOverride?'Ca SX (tay)':(inheritedMode==='manual'?'Ca SX (tay theo đơn)':'Ca SX (tự động)')),
        h('button',{type:'button',onClick:toggleOverride,title:isOverride?'Dùng tự động cho dòng này':'Nhập tay riêng cho dòng này',
          style:{fontSize:10,padding:'1px 6px',borderRadius:10,background:isOverride?'#f8c30f':'var(--bg2)',color:isOverride?'#5a3e00':'var(--tx2)',border:'none',cursor:'pointer',fontWeight:500}
        },isOverride?'↺ Tự động':'✎ Tay riêng')
      ),
      !isOverride&&dispShift?h('div',null,
        h('div',{style:{fontSize:12,fontWeight:600,color:'var(--pri3)',marginBottom:2}},dispShift.name||'—'),
        h('div',{style:{fontSize:11,color:'var(--tx2)'}},
          h('span',{style:{marginRight:6}},dispShift.prodWorkShiftId?'Ngày SX: '+(dispShift.prodDate||'—'):'⚙ SX: '+dispShift.prodTime+(dispShift.prodDate?' ('+dispShift.prodDate+')':''))
        ),
        h('div',{style:{fontSize:11,color:'var(--tx2)'}},
          h('span',null,'🏷 Tem: '+dispShift.labelTime+(dispShift.labelDate?' ('+dispShift.labelDate+')':''))
        )
      ):!isOverride?h('div',{style:{fontSize:11,color:'#A32D2D'}},'⚠ Không tìm thấy ca'):null,
      isOverride&&manualShift&&h('div',{style:{fontSize:11,fontWeight:600,color:manualShift.textColor||'var(--pri3)',marginBottom:3}},
        manualShift.name||'—'
      ),
      isOverride&&h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1.1fr 1fr 1.1fr',gap:4,marginTop:2}},
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'⚙ Giờ SX thực tế'),
          h('input',{value:line.prodTime||'',onChange:e=>setManualProdTime(e.target.value),placeholder:'07:00',style:{fontSize:12,padding:'3px 6px'}})
        ),
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'Ngày SX'),
          h('input',{value:line.prodDate||dispShift?.prodDate||'',onChange:e=>onChange({...line,prodDate:e.target.value}),placeholder:'DD/MM/YYYY',style:{fontSize:12,padding:'3px 6px'}})
        ),
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'🏷 Giờ in tem'),
          h('input',{value:line.labelTime||'',onChange:e=>onChange({...line,labelTime:e.target.value}),placeholder:'06:00',style:{fontSize:12,padding:'3px 6px'}})
        ),
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'Ngày in tem'),
          h('input',{value:line.labelDate||dispShift?.labelDate||'',onChange:e=>onChange({...line,labelDate:e.target.value}),placeholder:'DD/MM/YYYY',style:{fontSize:12,padding:'3px 6px'}})
        )
      )
    ),
    // Nút xóa
    h('button',{type:'button',className:'bi order-line-remove',onClick:onRemove,title:'Xóa dòng sản phẩm','aria-label':'Xóa dòng sản phẩm'},h('i',{className:'ti ti-trash',style:{fontSize:16}}))
  );
}

function PrintModal({order,company,onClose}){
  const displayOrder=order,displayCompany=company;
  order=scfEscapePrintData(order||{});
  company=scfEscapePrintData(company||{});
  return h('div',{className:'overlay',onClick:e=>{if(e.target===e.currentTarget)onClose()}},
    h('div',{style:{background:'#fff',borderRadius:'var(--rl)',width:700,maxWidth:'95vw',maxHeight:'92vh',overflow:'auto',padding:'2rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem'}},
        h('div',{style:{display:'flex',alignItems:'center',gap:12}},
          h('img',{src:LOGO_SRC,style:{width:50,height:50}}),
          h('div',null,
            h('div',{style:{fontSize:16,fontWeight:700,color:'var(--pri3)'}},displayCompany&&displayCompany.name||'Công ty SCF'),
            displayCompany&&displayCompany.address&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},displayCompany.address),
            displayCompany&&displayCompany.phone&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},'ĐT: '+displayCompany.phone)
          )
        ),
        h('div',{style:{textAlign:'right'}},
          h('div',{style:{fontSize:20,fontWeight:700,color:'var(--pri3)'}},'HÓA ĐƠN GIAO HÀNG'),
          h('div',{style:{fontSize:13,color:'var(--tx2)'}},displayOrder.id),
          displayOrder.invoiceNo&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Số HĐ: '+displayOrder.invoiceNo)
        )
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,background:'var(--bg2)',padding:'12px 16px',borderRadius:'var(--r)',marginBottom:'1.5rem',fontSize:13}},
        h('div',null,h('b',null,'Khách hàng: '),displayOrder.customer),
        h('div',null,h('b',null,'Ngày giao: '),displayOrder.deliveryDate+(displayOrder.deliveryTime?' lúc '+displayOrder.deliveryTime:'')),
        h('div',{style:{gridColumn:'1/-1'}},h('b',null,'Địa chỉ: '),displayOrder.address||displayOrder.pointName||'—')
      ),
      h('table',{style:{width:'100%',borderCollapse:'collapse',marginBottom:'1rem',fontSize:13}},
        h('thead',null,h('tr',{style:{background:'var(--pri3)',color:'#fff'}},
          ...[['STT','40px'],['Tên sản phẩm',''],['Đơn vị','80px'],['SL Đặt','100px'],['SL hóa đơn','100px'],['Ca SX','80px']].map(([c,w])=>h('th',{key:c,style:{padding:'8px 10px',textAlign:'left',width:w||'auto'}},c))
        )),
        h('tbody',null,(displayOrder.lines||[]).map((l,i)=>h('tr',{key:l.id,style:{borderBottom:'.5px solid var(--bd)',background:i%2?'var(--bg2)':'#fff'}},
          h('td',{style:{padding:'7px 10px'}},(i+1)),
          h('td',{style:{padding:'7px 10px',fontWeight:500}},l.productName||'—'),
          h('td',{style:{padding:'7px 10px'}},l.unit||'—'),
          h('td',{style:{padding:'7px 10px',textAlign:'center'}},l.qtyProd||0),
          h('td',{style:{padding:'7px 10px',textAlign:'center'}},l.qtyInvoice||0),
          h('td',{style:{padding:'7px 10px'}},l.shift==='night'?'Ca đêm':'Ca sáng')
        )))
      ),
      displayOrder.note&&h('div',{style:{fontSize:13,marginBottom:'1rem'}},h('b',null,'Ghi chú: '),displayOrder.note),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,marginTop:'2rem',fontSize:12,textAlign:'center'}},
        h('div',null,h('div',{style:{borderTop:'.5px solid #333',paddingTop:8,fontWeight:500}},'Người giao hàng'),h('div',{style:{color:'var(--tx2)'}},'(Ký và ghi rõ họ tên)')),
        h('div',null,h('div',{style:{borderTop:'.5px solid #333',paddingTop:8,fontWeight:500}},'Người nhận hàng'),h('div',{style:{color:'var(--tx2)'}},'(Ký và ghi rõ họ tên)')),
        h('div',null,h('div',{style:{borderTop:'.5px solid #333',paddingTop:8,fontWeight:500}},'Xác nhận công ty'),h('div',{style:{color:'var(--tx2)'}},'(Ký tên và đóng dấu)'))
      ),
      h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'1.5rem'}},
        window.scfShouldUsePrintAgent?.()&&h('button',{className:'bp',onClick:function(){
          var html=buildPrintHTML('welstory',displayOrder,displayCompany);
          window.scfQueueA4Print(html,{title:'Phiếu giao hàng · '+(displayOrder.pointName||displayOrder.customer||displayOrder.id||'SCF')})
            .then(function(){window.showToast('Đã gửi đơn tới Canon 2900.','success');})
            .catch(function(error){window.showToast(error&&error.message||'Chưa gửi được lệnh in tới Canon 2900.','error');});
        }},h('i',{className:'ti ti-printer',style:{fontSize:14}}),'Gửi Canon 2900'),
        h('button',{onClick:function(){var html=buildPrintHTML('welstory',displayOrder,displayCompany);var w=window.open('','_blank');if(!w){window.showToast('Trình duyệt đang chặn popup in. Hãy cho phép popup.','warn');return;}w.document.write(html);w.document.close();setTimeout(function(){w.print();},500);}},h('i',{className:'ti ti-printer',style:{fontSize:14}}),'In ngay'),
        h('button',{className:'bp',onClick:onClose},'Đóng')
      )
    )
  );
}
function OrderForm({order,copyMode=false,customers,products,quotes,employees,currentUser,prodShifts,prodCats,trips=[],resolveAutomaticTrip,onSave,onClose,lockStatus=false,lockedTripLabel='',saving=false}){
  const[f,sf]=useState(order?{...order,prodShiftAssignMode:order.prodShiftAssignMode==='manual'?'manual':'auto'}:{orderId:'',customerId:'',customer:'',pointId:'',pointName:'',address:'',deliveryDate:fmtDate(),deliveryTime:'08:00',tripAssignMode:'auto',tripId:null,prodShiftAssignMode:'auto',note:'',status:'pending',invoiceNo:'',workOut:'',workReturn:'',lines:[]});
  const identityLocked=!!order&&!copyMode;
  const s=(k,v)=>{if(identityLocked&&['deliveryDate','pointId','pointName','customerId','customer'].includes(k))return;sf(p=>({...p,[k]:v}));};
  const [tripDate,setTripDate]=useState(()=>manualTripDateToISO(trips.find(t=>String(t.id)===String(order?.tripId))?.deliveryDate||order?.deliveryDate||fmtDate()));
  const formTripOptions=React.useMemo(()=>filterManualTripOptions(trips.filter(t=>!['completion_pending','completed','cancelled'].includes(t.status)),tripDate,''),[trips,tripDate]);
  const selCust=customers.find(c=>c.id===f.customerId);
  const matchedPoint=(f.pointId?(selCust?.points||[]).find(x=>x.id===f.pointId):null)||findOrderPointMatch(f,customers||[])?.point||null;
  const matchedPointArea=matchedPoint?.area||f.area||'';
  const predictedTrip=f.tripAssignMode!=='manual'?resolveAutomaticTrip?.({...f,area:matchedPointArea,pointName:matchedPoint?.name||f.pointName||''}):null;
  const displayedTripDate=predictedTrip?manualTripDateToISO(predictedTrip.deliveryDate):tripDate;
  const displayedTripOptions=predictedTrip?filterManualTripOptions(trips.filter(t=>!['completion_pending','completed','cancelled'].includes(t.status)),displayedTripDate,''):formTripOptions;
  const resolvedPointName=matchedPoint?.name||f.pointName||f.address||'';
  const normPoint=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ');
  const allPoints=customers.flatMap(c=>(c.points||[]).filter(pt=>pt&&String(pt.name||'').trim()&&scfPointCoversOrder(pt,f)).map((pt,index)=>({...pt,
    customerId:c.id,customerName:c.name,
    pointKey:String(c.id||'')+'\u001f'+String(pt.id||('name_'+index+'_'+pt.name)),
    searchLabel:pt.name+(c.name?' - '+c.name:'')
  }))).sort((a,b)=>String(a.customerName||'').localeCompare(String(b.customerName||''),'vi')||String(a.name||'').localeCompare(String(b.name||''),'vi'));
  const pointById=allPoints.find(pt=>f.pointId&&String(pt.id||'')===String(f.pointId)&&(!f.customerId||String(pt.customerId||'')===String(f.customerId)));
  const pointNameMatches=allPoints.filter(pt=>normPoint(pt.name)===normPoint(f.pointName));
  const selectedPointOption=pointById||(pointNameMatches.length===1?pointNameMatches[0]:null);
  const [pointAreaFilter,setPointAreaFilter]=useState(()=>selectedPointOption?.area||f.area||'');
  const [pointQuery,setPointQuery]=useState(()=>selectedPointOption?.name||f.pointName||'');
  const [pointSearchOpen,setPointSearchOpen]=useState(false);
  const pointAreas=[...new Set(allPoints.map(pt=>String(pt.area||'').trim()).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'vi'));
  const pointSearchNeedle=normPoint(pointQuery);
  const matchingPointOptions=allPoints.filter(pt=>{
    if(pointAreaFilter&&normPoint(pt.area)!==normPoint(pointAreaFilter))return false;
    if(!pointSearchNeedle)return true;
    return normPoint([pt.name,pt.customerName,pt.address,pt.area].join(' ')).includes(pointSearchNeedle);
  });
  const visiblePointOptions=matchingPointOptions.slice(0,40);
  const pickPoint=pt=>{
    if(identityLocked)return;
    sf(p=>({...p,pointId:pt?.id||'',pointName:pt?.name||'',address:pt?.address||'',area:pt?.area||'',customerId:pt?.customerId||'',customer:pt?.customerName||''}));
  };
  const choosePoint=pt=>{
    pickPoint(pt);
    setPointAreaFilter(pt?.area||'');
    setPointQuery(pt?.name||'');
    setPointSearchOpen(false);
  };
  useEffect(()=>{
    if(!selectedPointOption)return;
    setPointAreaFilter(selectedPointOption.area||'');
    setPointQuery(selectedPointOption.name||'');
    if(String(f.pointId||'')===String(selectedPointOption.id||'')&&String(f.customerId||'')===String(selectedPointOption.customerId||''))return;
    pickPoint(selectedPointOption);
  },[selectedPointOption?.pointKey]);
  const addLine=()=>sf(p=>({...p,lines:[...p.lines,{id:uid(),productId:'',productName:'',unit:'',weightPerUnit:0,qtyProd:0,qtyInvoice:0,shift:'day',price:0,note:''}]}));
  const updLine=(id,data)=>sf(p=>({...p,lines:p.lines.map(l=>l.id===id?data:l)}));
  const delLine=id=>sf(p=>({...p,lines:p.lines.filter(l=>l.id!==id)}));
  const lineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const lineWeight=l=>{const p=products.find(x=>x.id===l.productId);const unit=String(l.unit||p?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');const qty=lineQty(l);if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;return (p?.weightPerUnit||numFmt(l.weightPerUnit)||0)*qty;};
  const totalWeight=f.lines.reduce((s,l)=>s+lineWeight(l),0);
  const totalPurchase=f.lines.reduce((s,l)=>{
    const p=products.find(x=>x.id===l.productId)||{};
    return s+(isGoodsProduct(p,prodCats||[])?lineQty(l)*numFmt(l.purchasePrice||l.price):0);
  },0);
  const hasLineOverrides=(f.lines||[]).some(line=>!!line.shiftOverride);
  // Tự động lấy ca SX từ giờ giao
  const autoShift=getProdShiftForOrder({...f,deliveryTime:f.deliveryTime,area:matchedPointArea||f.area||'',pointName:resolvedPointName||f.pointName||'',address:f.address||''},prodShifts||[],customers||[]);
  const prodShiftMode=f.prodShiftAssignMode==='manual'?'manual':'auto';
  const manualShift=prodShiftMode==='manual'?(prodShifts||[]).find(shift=>shift.id===f.prodShiftId)||null:null;
  const effectiveShift=prodShiftMode==='manual'?manualShift:(autoShift||scfTripProductionPlan(f,null)?.shift);
  const timingForShift=shift=>prodShiftMode==='auto'?(scfTripProductionPlan(f,shift)||{prodTime:'',prodDate:'',labelTime:'',labelDate:''}):({
    prodTime:shift?.actualProdTime||shift?.endTime||'',
    prodDate:shift?addDaysVN(f.deliveryDate,shift.prodDateOffset||0):'',
    labelTime:shift?.labelPrintTime||'',
    labelDate:shift?addDaysVN(f.deliveryDate,shift.labelPrintDateOffset||0):''
  });
  const defaultTiming=timingForShift(effectiveShift);
  const effectiveTiming=prodShiftMode==='manual'?{
    prodTime:normalizeTimeInput(f.prodTime||defaultTiming.prodTime),
    prodDate:f.prodDate||defaultTiming.prodDate,
    labelTime:normalizeTimeInput(f.labelTime||defaultTiming.labelTime),
    labelDate:f.labelDate||defaultTiming.labelDate
  }:defaultTiming;
  const submit=()=>{
    if(saving)return;
    if(!f.customerId){window.showToast('Vui lòng chọn khách hàng!','warn');return;}
    if(!lockStatus&&f.tripAssignMode==='manual'&&(!f.tripId||!formTripOptions.some(t=>String(t.id)===String(f.tripId)))){window.showToast('Vui lòng chọn ca giao trong ngày chuyến đã chọn!','warn');return;}
    const prodShiftAssignMode=hasLineOverrides?'auto':(f.prodShiftAssignMode==='manual'?'manual':'auto');
    const selectedShift=prodShiftAssignMode==='manual'?manualShift:autoShift;
    if(prodShiftAssignMode==='manual'&&!selectedShift){window.showToast('Vui lòng chọn Ca SX khi dùng chế độ chọn tay!','warn');return;}
    const prodShiftId=selectedShift?.id||'';
    const selectedDefaultTiming=timingForShift(selectedShift);
    const selectedTiming=prodShiftAssignMode==='manual'?{
      prodTime:normalizeTimeInput(f.prodTime||selectedDefaultTiming.prodTime),
      prodDate:f.prodDate||selectedDefaultTiming.prodDate,
      labelTime:normalizeTimeInput(f.labelTime||selectedDefaultTiming.labelTime),
      labelDate:f.labelDate||selectedDefaultTiming.labelDate
    }:selectedDefaultTiming;
    const lines=(f.lines||[]).map(line=>f.warehouseMerged||line.productionScheduleCopiedFromTripId||line.shiftOverride?line:{
      ...line,
      prodTime:selectedTiming.prodTime,
      prodDate:selectedTiming.prodDate,
      labelTime:selectedTiming.labelTime,
      labelDate:selectedTiming.labelDate
    });
    onSave({...f,area:matchedPointArea,prodShiftAssignMode,prodShiftId,
      prodTime:prodShiftAssignMode==='manual'?selectedTiming.prodTime:'',
      prodDate:prodShiftAssignMode==='manual'?selectedTiming.prodDate:'',
      labelTime:prodShiftAssignMode==='manual'?selectedTiming.labelTime:'',
      labelDate:prodShiftAssignMode==='manual'?selectedTiming.labelDate:'',
      lines,updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:copyMode?'Tạo đơn từ bản sao'+(order?.copySourceId?' · '+order.copySourceId:''):(order?'Sửa đơn '+order.id:'Tạo đơn giao hàng mới'),onClose,lg:true},
    lockedTripLabel&&h('div',{className:'order-copy-notice'},h('i',{className:'ti ti-truck-delivery'}),' Đơn thuộc chuyến '+lockedTripLabel+'. Khi lưu, app giữ nguyên chuyến và trạng thái giao.'),
    copyMode&&h('div',{className:'order-copy-notice'},h('i',{className:'ti ti-copy'}),' Nội dung đã được sao chép từ đơn cũ. Kiểm tra ngày giao, số lượng rồi lưu để tạo mã đơn mới.'),
    h(F,{label:(f.warehouseMerged?'Địa điểm chung của đơn KHO VẬN * (':'Địa điểm giao * (')+customers.reduce((n,c)=>n+(c.points||[]).length,0)+' điểm)'},h('div',null,
      h('div',{className:'order-point-picker'},
        h('select',{className:'order-point-area',value:pointAreaFilter,disabled:identityLocked,onChange:e=>{setPointAreaFilter(e.target.value);setPointQuery('');setPointSearchOpen(true);},title:'Lọc địa điểm theo khu vực'},
          h('option',{value:''},'Tất cả khu vực'),
          pointAreas.map(area=>h('option',{key:area,value:area},area))
        ),
        h('div',{className:'order-point-search'},
          h('div',{className:'order-point-input-wrap'},
            h('i',{className:'fas fa-search','aria-hidden':'true'}),
            h('input',{value:pointQuery,disabled:identityLocked,onChange:e=>{setPointQuery(e.target.value);setPointSearchOpen(true);},onFocus:e=>{setPointSearchOpen(true);e.target.select();},onBlur:()=>setTimeout(()=>setPointSearchOpen(false),150),placeholder:'Gõ tên điểm giao hoặc khách hàng...',role:'combobox','aria-expanded':pointSearchOpen,'aria-autocomplete':'list'}),
            !identityLocked&&pointQuery&&h('button',{type:'button',className:'order-point-clear',title:'Xóa từ khóa',onMouseDown:e=>e.preventDefault(),onClick:()=>{setPointQuery('');setPointSearchOpen(true);}},'×')
          ),
          pointSearchOpen&&h('div',{className:'order-point-results',role:'listbox'},
            visiblePointOptions.length?visiblePointOptions.map(pt=>h('button',{type:'button',className:'order-point-option'+(pt.pointKey===selectedPointOption?.pointKey?' active':''),key:pt.pointKey,onMouseDown:e=>{e.preventDefault();choosePoint(pt);},role:'option','aria-selected':pt.pointKey===selectedPointOption?.pointKey},
              h('b',null,pt.name),
              h('small',null,[pt.customerName,pt.area,pt.address].filter(Boolean).join(' · '))
            )):h('div',{className:'order-point-empty'},'Không tìm thấy địa điểm phù hợp'),
            matchingPointOptions.length>40&&h('div',{className:'order-point-more'},'Có '+matchingPointOptions.length+' kết quả — hãy gõ thêm để thu hẹp')
          )
        )
      ),
      (f.pointName||f.customerId)&&h('div',{className:'order-point-current'},'Đã chọn: '+(f.pointName||'—')+(f.customer?' · '+f.customer:'')+(f.area?' · Khu vực: '+f.area:''))
    )),
    h('div',{className:'order-form-main-grid',style:{display:'grid',gridTemplateColumns:order&&!copyMode?'140px 100px 100px 90px 90px 1fr':'140px 100px 100px 1fr',gap:'0 8px'}},
      h(F,{label:'Ngày giao'},h('input',{type:'date',value:toIsoDate(f.deliveryDate),disabled:identityLocked,onChange:e=>s('deliveryDate',e.target.value?vnDateFromISO(e.target.value):''),title:'Chọn ngày giao'})),
      h(F,{label:'Giờ giao'},h('input',{value:f.deliveryTime,onChange:e=>s('deliveryTime',e.target.value),placeholder:'08:00'})),
      h(F,{label:'Trạng thái'},h('select',{value:f.status,disabled:lockStatus,onChange:e=>s('status',e.target.value),style:{fontSize:12}},
        [['pending','Chờ xếp'],['assigned','Đã xếp'],['delivering','Đang giao'],['done','Đã giao'],['failed','Giao lỗi'],['cancelled','Hủy']].map(([v,l])=>h('option',{key:v,value:v},l))
      )),
      order&&!copyMode&&h(F,{label:'Công đi'},h('input',{type:'number',min:0,step:.5,value:f.workOut,onChange:e=>s('workOut',e.target.value),placeholder:'0'})),
      order&&!copyMode&&h(F,{label:'Công về'},h('input',{type:'number',min:0,step:.5,value:f.workReturn,onChange:e=>s('workReturn',e.target.value),placeholder:'0'})),
      h(F,{label:'Ghi chú chung'},h('input',{value:f.note,onChange:e=>s('note',e.target.value),placeholder:'Ghi chú cho toàn đơn...'})),
    ),
    (!order||copyMode)&&h('div',{style:{display:'grid',gridTemplateColumns:'minmax(140px,1fr) minmax(200px,2fr)',gap:8,marginBottom:8}},
      h(F,{label:'Ngày chuyến'},h('input',{type:'date','aria-label':'Ngày chuyến tạo đơn',value:displayedTripDate,disabled:saving,onChange:e=>{setTripDate(e.target.value);sf(prev=>({...prev,tripId:null,tripAssignMode:'manual',status:'pending'}));}})),
      h(F,{label:'Ca giao – Người giao'},h('select',{'aria-label':'Ca giao tạo đơn',value:f.tripId||'',disabled:saving,onChange:e=>{
        const id=e.target.value,trip=trips.find(t=>String(t.id)===id);
        if(id)setTripDate(displayedTripDate);
        sf(prev=>{const next={...prev,tripId:id||null,tripAssignMode:id?'manual':'auto',status:trip?(trip.status==='active'?'delivering':'assigned'):'pending'};return id&&prev.prodShiftAssignMode!=='manual'?scfRequestTripProduction(next,trips):next;});
      }},h('option',{value:''},predictedTrip?manualTripText(predictedTrip)+' · Tự động':f.tripAssignMode==='manual'?'Chọn ca giao':'Chưa tìm thấy chuyến phù hợp'),displayedTripOptions.map(t=>h('option',{key:t.id,value:String(t.id)},manualTripText(t))))),
      !displayedTripOptions.length&&h('small',{style:{gridColumn:'1/-1',color:'var(--tx2)'}},'Chưa có chuyến khả dụng trong ngày này.')
    ),
    !hasLineOverrides?h('div',{className:'order-form-production-compact',style:{padding:'6px 10px',background:prodShiftMode==='manual'?'#FFF8E1':'#E6F1FB',borderRadius:'var(--r)',marginBottom:8}},
      h('div',{className:'order-form-shift-grid',style:{display:'grid',gridTemplateColumns:'170px minmax(180px,250px) 1fr',gap:8,alignItems:'center'}},
        h(F,{label:'Cách xếp Ca SX'},h('select',{value:prodShiftMode,onChange:e=>{
          const mode=e.target.value;
          sf(prev=>mode==='auto'?scfRequestTripProduction({...prev,prodShiftAssignMode:'auto'},window.__SCF_TRIPS||[]):({...prev,prodShiftAssignMode:'manual',prodShiftId:prev.prodShiftId||autoShift?.id||''}));
        }},
          h('option',{value:'auto'},'Tự động'),
          h('option',{value:'manual'},'Chọn tay')
        )),
        prodShiftMode==='manual'
          ?h(F,{label:'Ca SX chọn tay *'},h('select',{value:f.prodShiftId||'',onChange:e=>sf(prev=>({...prev,prodShiftId:e.target.value,prodTime:'',prodDate:'',labelTime:'',labelDate:''}))},
            h('option',{value:''},'— Chọn Ca SX —'),
            (prodShifts||[]).map(shift=>h('option',{key:shift.id,value:shift.id},shift.name||shift.id))
          ))
          :h(F,{label:'Ca SX theo chuyến'},h('div',{style:{display:'flex',alignItems:'center',gap:4}},h('input',{value:(window.__SCF_PROD_SHIFT_RULES||[]).find(r=>String(r.id)===String(effectiveTiming.prodWorkShiftId||''))?.name||getProdWorkShiftRule(effectiveTiming.prodTime)?.name||'Chưa có lịch SX cho chuyến',readOnly:true,style:{background:'#fff',minWidth:0,flex:1}}),h('button',{type:'button',title:'Cập nhật Ca SX theo chuyến','aria-label':'Cập nhật Ca SX theo chuyến',onClick:()=>sf(prev=>scfRequestTripProduction(prev,trips)),style:{padding:'6px 8px',flexShrink:0}},h('i',{className:'ti ti-refresh','aria-hidden':true})))),
        effectiveShift?h('div',{style:{alignSelf:'center',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',color:prodShiftMode==='manual'?'#8A5A00':'#185FA5'}},
          h('span',{className:'badge',style:{background:prodShiftMode==='manual'?'#FFF3CD':'#E8F5E9',color:prodShiftMode==='manual'?'#8A5A00':'#1B5E20'}},prodShiftMode==='manual'?'Đ.Tay':'T.Đ'),
          h('span',null,'Ngày SX: '+(effectiveTiming.prodDate||'—')),
          !effectiveTiming.prodWorkShiftId&&h('span',null,'Giờ SX: '+(effectiveTiming.prodTime||'—')),
          h('span',null,'In tem: '+(effectiveTiming.labelTime||'—')+' · '+(effectiveTiming.labelDate||'—'))
        ):h('div',{style:{alignSelf:'center',color:'#A32D2D'}},
          h('i',{className:'ti ti-alert-triangle',style:{marginRight:5}}),'Chưa tìm thấy Ca SX phù hợp.'
        )
      ),
      prodShiftMode==='manual'&&effectiveShift&&h('div',{className:'order-form-timing-grid',style:{display:'grid',gridTemplateColumns:'repeat(4,minmax(120px,1fr))',gap:8,marginTop:4}},
        h(F,{label:'Ngày SX *'},h('input',{type:'date',value:toIsoDate(effectiveTiming.prodDate),onChange:e=>s('prodDate',e.target.value?vnDateFromISO(e.target.value):'')})),
        h(F,{label:'Giờ SX *'},h('input',{type:'time',value:effectiveTiming.prodTime,onChange:e=>s('prodTime',e.target.value)})),
        h(F,{label:'Ngày in tem *'},h('input',{type:'date',value:toIsoDate(effectiveTiming.labelDate),onChange:e=>s('labelDate',e.target.value?vnDateFromISO(e.target.value):'')})),
        h(F,{label:'Giờ in tem *'},h('input',{type:'time',value:effectiveTiming.labelTime,onChange:e=>s('labelTime',e.target.value)}))
      )
    ):h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'#FFF3CD',color:'#7A4E00',border:'1px solid #F4C95D',borderRadius:'var(--r)',marginBottom:8,fontSize:12}},
      h('i',{className:'ti ti-lock',style:{fontSize:16}}),
      h('span',null,h('b',null,'Ca SX cấp đơn đang khóa. '),'Đơn có sản phẩm chỉnh tay nên kế hoạch SX được tính riêng theo từng dòng. Chuyển tất cả dòng về Tự động để mở lại phần cấp đơn.')
    ),
    h('div',{className:'divider'}),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},
      h('div',{style:{fontWeight:500,fontSize:13,color:'var(--pri3)'}},'Chi tiết hàng hóa'),
      h('div',{style:{fontSize:12,color:(totalWeight>0||totalPurchase>0)?'var(--pri)':'var(--tx2)'}},
        [totalWeight>0?'Tổng KL hóa đơn: '+totalWeight.toFixed(2)+' kg':'',totalPurchase>0?'Giá mua: '+moneyFmt(totalPurchase):''].filter(Boolean).join(' · ')
      )
    ),
      f.lines.map(l=>h('div',{key:l.id},
        f.warehouseMerged&&h('div',{className:'warehouse-line-point',style:{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,padding:'8px 10px',background:'#fff'}},
          h('label',{htmlFor:'warehouse-point-'+l.id,style:{fontWeight:400}},'Địa điểm dòng PAC'),
          h('select',{id:'warehouse-point-'+l.id,'aria-label':'Địa điểm dòng PAC '+l.id,disabled:identityLocked,value:allPoints.find(pt=>l.warehouseSourcePointId?String(pt.id)===String(l.warehouseSourcePointId)&&(!l.warehouseSourceCustomerId||String(pt.customerId)===String(l.warehouseSourceCustomerId)):normPoint(pt.name)===normPoint(l.warehouseSourcePointName)&&(!l.warehouseSourceCustomerId||String(pt.customerId)===String(l.warehouseSourceCustomerId)))?.pointKey||'',onChange:e=>{
            if(identityLocked)return;const pt=allPoints.find(pt=>pt.pointKey===e.target.value);if(!pt)return;
            updLine(l.id,{...l,warehouseSourcePointId:pt.id||'',warehouseSourcePointName:pt.name,warehouseSourceCustomerId:pt.customerId,warehouseSourceCustomer:pt.customerName,warehouseSourceAddress:pt.address||'',warehouseSourceArea:pt.area||''});
          },style:{flex:'1 1 220px',maxWidth:440}},
            h('option',{value:'',disabled:true},l.warehouseSourcePointName||'Chọn địa điểm dòng PAC'),
            allPoints.map(pt=>h('option',{key:pt.pointKey,value:pt.pointKey},pt.searchLabel))
          ),
          h('span',{style:{fontSize:12}},(l.warehouseSourceDeliveryDate||f.deliveryDate||'')+' · '+(l.warehouseSourceDeliveryTime||f.deliveryTime||''))
        ),
        h(OrderDetailLine,{line:l,products,prodCats:prodCats||[],prodShifts:prodShifts||[],deliveryDate:l.warehouseSourceDeliveryDate||f.deliveryDate,deliveryTime:l.warehouseSourceDeliveryTime||f.deliveryTime,pointName:l.warehouseSourcePointName||resolvedPointName,area:l.warehouseSourceArea||matchedPointArea,
        inheritedShift:hasLineOverrides?autoShift:effectiveShift,
        inheritedTiming:f.warehouseMerged||l.productionScheduleCopiedFromTripId?{prodTime:l.prodTime||'',prodDate:l.prodDate||'',labelTime:l.labelTime||'',labelDate:l.labelDate||'',prodWorkShiftId:l.prodWorkShiftId||''}:hasLineOverrides?timingForShift(autoShift):effectiveTiming,
        inheritedMode:hasLineOverrides?'auto':prodShiftMode,
        onChange:data=>updLine(l.id,data),onRemove:()=>delLine(l.id)}))),
    h('button',{onClick:addLine,style:{fontSize:12,padding:'5px 12px',marginBottom:8}},h('i',{className:'ti ti-plus',style:{fontSize:13,marginRight:4}}),'Thêm hàng hóa'),
    h('div',{className:'form-actions order-form-actions'},h('button',{onClick:onClose,disabled:saving},'Hủy'),h('button',{className:'bp',onClick:submit,disabled:saving,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),saving?'Đang lưu…':'Lưu đơn hàng'))
  );
}


function isValidCustomerImportDate(value){
  const m=String(value??'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m)return false;
  const day=Number(m[1]),month=Number(m[2]),year=Number(m[3]);
  const date=new Date(year,month-1,day);
  return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day;
}
function isPlausibleCustomerImportYear(value,referenceDate=new Date()){
  const match=String(value??'').trim().match(/^\d{1,2}\/\d{1,2}\/(\d{4})$/);
  if(!match)return false;
  const year=Number(match[1]),currentYear=referenceDate.getFullYear();
  return year>=currentYear-1&&year<=currentYear+1;
}
function ensureUniqueDeliveryOrderIds(rows){
  const source=Array.isArray(rows)?rows:[],used=new Set(),nextByDate=new Map();
  const datePrefix=value=>{const m=String(value||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?'D'+m[3].slice(-2)+m[1].padStart(2,'0')+m[2].padStart(2,'0'):'D000000';};
  source.forEach(order=>{const id=String(order?.id||'').trim();if(!id||used.has(id))return;used.add(id);const prefix=datePrefix(order?.deliveryDate);const match=id.match(new RegExp('^'+prefix+'(\\d+)$'));if(match)nextByDate.set(prefix,Math.max(nextByDate.get(prefix)||1,Number(match[1])+1));});
  const seen=new Set();
  return source.map(order=>{
    const current=String(order?.id||'').trim();
    if(current&&!seen.has(current)){seen.add(current);return order;}
    const prefix=datePrefix(order?.deliveryDate);let seq=Math.max(1,nextByDate.get(prefix)||1),id='';
    do{id=prefix+String(seq++).padStart(3,'0');}while(used.has(id));
    nextByDate.set(prefix,seq);used.add(id);seen.add(id);
    return {...order,id,legacyOrderId:current||undefined,updatedAt:fmtDT(),updatedBy:order?.updatedBy||order?.createdBy||'Hệ thống sửa mã trùng'};
  });
}
function allocateImportedDeliveryOrderIds(existingOrders,importedOrders,currentUser){
  const reserved=new Set((existingOrders||[]).flatMap(order=>[order.id,...(order.warehouseSourceOrderIds||[])]).map(id=>String(id||'').trim()).filter(Boolean));
  const creatorCode=String(currentUser?.id||currentUser?.username||'NV').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(-10)||'NV';
  const nextByPrefix=new Map();
  return (importedOrders||[]).map(order=>{
    const match=String(order?.deliveryDate||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const dateCode=match?match[3].slice(-2)+match[1].padStart(2,'0')+match[2].padStart(2,'0'):'000000';
    const prefix='DGH'+dateCode+'-'+creatorCode+'-';
    let sequence=nextByPrefix.get(prefix)||1,id='';
    do{id=prefix+String(sequence++).padStart(3,'0');}while(reserved.has(id));
    nextByPrefix.set(prefix,sequence);reserved.add(id);
    const oldId=String(order?.id||'').trim();
    return {...order,id,...(oldId&&oldId!==id?{legacyOrderId:oldId}:{})};
  });
}
function customerImportLineNote(row,rawRows,columnOffset){
  const columns=new Set();
  for(const header of (rawRows||[]).slice(0,30)){
    (header||[]).forEach((cell,index)=>{if(/^(chu y|ghi chu|note)(\s|$)/.test(normalizeLookupText(cell)))columns.add(index);});
    if(columns.size)break;
  }
  if(!columns.size)columns.add(columnOffset+6);
  return [...columns].map(index=>String(row?.[index]??'').trim()).filter(Boolean).join(' · ');
}
function customerImportColumnOffset(rawRows){
  const rows=(rawRows||[]).slice(0,100);
  const maxColumns=Math.min(12,Math.max(0,...rows.map(row=>(row||[]).length)));
  const hasText=value=>value!==null&&value!==undefined&&String(value).trim()!=='';
  const looksDate=value=>{
    if(value instanceof Date)return !Number.isNaN(value.getTime());
    if(typeof value==='number')return value>=20000&&value<=80000;
    const text=String(value??'').trim();
    return isValidCustomerImportDate(text)||/^\d{4}-\d{1,2}-\d{1,2}$/.test(text);
  };
  const looksQty=value=>{
    const text=String(value??'').trim().replace(',','.');
    return text!==''&&Number.isFinite(Number(text));
  };
  const looksTime=value=>/^(?:\d{1,2}\s*[hH](?:\s*\d{1,2})?|\d{1,2}[:.]\d{1,2})$/.test(String(value??'').trim());
  let bestOffset=0,bestScore=-1;
  for(let offset=0;offset<Math.max(1,maxColumns-3);offset++){
    let score=0,matchingRows=0;
    rows.forEach(row=>{
      const cells=(row||[]).slice(offset);
      if(!looksDate(cells[0])||!hasText(cells[1])||!hasText(cells[2])||!looksQty(cells[3]))return;
      matchingRows++;
      score+=8;
      if(looksTime(cells[4])||looksTime(cells[5]))score+=2;
    });
    if(matchingRows>0&&(score>bestScore||(score===bestScore&&offset<bestOffset))){bestOffset=offset;bestScore=score;}
  }
  return bestScore>=0?bestOffset:0;
}
function excelColumnName(index){
  let value=Math.max(0,Number(index)||0)+1,name='';
  while(value>0){value--;name=String.fromCharCode(65+(value%26))+name;value=Math.floor(value/26);}
  return name;
}
function customerImportOrderIssues(order){
  const issues=[];
  if(!isValidCustomerImportDate(order?.deliveryDate))issues.push('Ngày giao');
  const time=String(order?.deliveryTime??'').trim();
  const timeMatch=time.match(/^(\d{1,2}):(\d{2})$/);
  if(!timeMatch||Number(timeMatch[1])>23||Number(timeMatch[2])>59)issues.push('Giờ giao');
  const lines=Array.isArray(order?.lines)?order.lines:[];
  if(!lines.length)issues.push('Sản phẩm');
  lines.forEach((line,index)=>{
    const suffix=lines.length>1?' dòng '+(index+1):'';
    if(!String(line?.productName??'').trim())issues.push('Sản phẩm'+suffix);
    if(!(Number(line?.qtyProd)>0))issues.push('Số lượng đặt'+suffix);
    if(!(Number(line?.qtyInvoice)>0))issues.push('SL HĐ'+suffix);
  });
  return [...new Set(issues)];
}

function ImportProductSearch({products,value,onChange,suggestions=[],prodCats=[],showCategoryFilters=true,compact=false}){
  const normalize=value=>String(value||'').trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ');
  const label=product=>[product?.code||product?.id,product?.name].filter(Boolean).join(' - ');
  const selected=products.find(product=>String(product.id)===String(value));
  const selectedType=selected?(isGoodsProduct(selected,prodCats||[])?'HH':'TP'):'';
  const [productType,setProductType]=useState(selectedType);
  const [goodsGroup,setGoodsGroup]=useState(selected?.goodsGroup||'');
  const[query,setQuery]=useState(selected?label(selected):'');
  const[searchText,setSearchText]=useState(selected?label(selected):'');
  const[open,setOpen]=useState(false);
  useEffect(()=>{
    if(!selected)return;
    const text=label(selected);
    setQuery(text);
    setSearchText(text);
    if(selected){
      setProductType(isGoodsProduct(selected,prodCats||[])?'HH':'TP');
      setGoodsGroup(selected.goodsGroup||'');
    }
  },[value,selected?.id]);
  useEffect(()=>{
    const timer=setTimeout(()=>setSearchText(query),180);
    return()=>clearTimeout(timer);
  },[query]);
  const score=(product,text)=>{
    const needle=normalize(text);
    if(!needle)return suggestions.findIndex(item=>String(item.product?.id)===String(product.id))>=0?2:1;
    const name=normalize(product.name),code=normalize(product.code||product.id),haystack=(code+' '+name).trim();
    if(code===needle||name===needle)return 100;
    if(name.startsWith(needle)||code.startsWith(needle))return 90;
    if(haystack.includes(needle))return 80;
    const tokens=needle.split(' ').filter(Boolean);
    const matched=tokens.filter(token=>haystack.includes(token)).length;
    if(matched)return 50+(matched/tokens.length)*20;
    let common=0;
    for(let i=0;i<needle.length-1;i++)if(haystack.includes(needle.slice(i,i+2)))common++;
    return needle.length>1?(common/(needle.length-1))*40:0;
  };
  const goodsGroups=React.useMemo(()=>[...new Set(products
    .filter(product=>isGoodsProduct(product,prodCats||[]))
    .map(product=>String(product.goodsGroup||'').trim())
    .filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi',{numeric:true})),[products,prodCats]);
  const filteredProducts=React.useMemo(()=>products.filter(product=>{
    if(!showCategoryFilters)return true;
    if(productType==='TP'&&isGoodsProduct(product,prodCats||[]))return false;
    if(productType==='HH'&&!isGoodsProduct(product,prodCats||[]))return false;
    if(productType==='HH'&&goodsGroup&&String(product.goodsGroup||'')!==goodsGroup)return false;
    return true;
  }),[products,prodCats,productType,goodsGroup,showCategoryFilters]);
  const options=React.useMemo(()=>{
    if(!open)return [];
    return filteredProducts.map(product=>({product,score:score(product,searchText)}))
      .filter(item=>!searchText.trim()||item.score>10)
      .sort((a,b)=>b.score-a.score||label(a.product).localeCompare(label(b.product),'vi',{numeric:true}))
      .slice(0,30);
  },[open,searchText,filteredProducts]);
  const choose=product=>{
    setQuery(label(product));
    setOpen(false);
    // Đóng danh sách và phản hồi ngay trên màn hình trước khi cập nhật modal lớn.
    requestAnimationFrame(()=>onChange(product.id));
  };
  return h('div',{style:{position:'relative',width:'100%',minWidth:0}},
    showCategoryFilters&&h('div',{style:{display:'grid',gridTemplateColumns:compact?'minmax(0,1fr)':productType==='HH'?'72px minmax(100px,1fr)':'1fr',gap:4,marginBottom:4}},
      h('select',{
        value:productType,
        onChange:e=>{
          setProductType(e.target.value);
          setGoodsGroup('');
          setQuery('');
          setSearchText('');
          if(value)onChange('');
        },
        style:{fontSize:compact?11:12,padding:compact?'3px 5px':'5px 7px',minWidth:0,maxWidth:'100%'}
      },
        h('option',{value:''},'TP / HH'),
        h('option',{value:'TP'},'TP'),
        h('option',{value:'HH'},'HH')
      ),
      productType==='HH'&&h('select',{
        value:goodsGroup,
        onChange:e=>{setGoodsGroup(e.target.value);setQuery('');setSearchText('');if(value)onChange('');},
        style:{fontSize:compact?11:12,padding:compact?'3px 5px':'5px 7px',minWidth:0,maxWidth:'100%'}
      },
        h('option',{value:''},'Tất cả nhóm HH'),
        goodsGroups.map(group=>h('option',{key:group,value:group},group))
      )
    ),
    h('input',{
      value:query,
      onFocus:()=>setOpen(true),
      onChange:e=>{setQuery(e.target.value);if(value)onChange('');setOpen(true);},
      onBlur:()=>setTimeout(()=>setOpen(false),150),
      placeholder:!showCategoryFilters||productType?'Gõ tên hoặc mã sản phẩm...':'Chọn TP hoặc HH trước...',
      disabled:showCategoryFilters&&!productType,
      autoComplete:'off',
      role:'combobox',
      'aria-expanded':open,
      style:{width:'100%',fontSize:compact?12:13,borderColor:value?'#52b788':'#D9534F'}
    }),
    open&&h('div',{style:{position:'absolute',left:0,right:0,top:'calc(100% + 3px)',zIndex:80,maxHeight:260,overflowY:'auto',background:'#fff',border:'1px solid var(--bd)',borderRadius:'var(--r)',boxShadow:'0 8px 24px rgba(0,0,0,.18)'}},
      options.length
        ?options.map(({product,score},optionIndex)=>h('button',{
          key:String(product.id||product.code||'SP')+'-'+optionIndex,
          type:'button',
          onMouseDown:e=>{e.preventDefault();choose(product);},
          style:{display:'block',width:'100%',padding:'8px 10px',textAlign:'left',background:String(product.id)===String(value)?'#EAF3DE':'#fff',border:'none',borderBottom:'1px solid #eee',cursor:'pointer',fontSize:13}
        },
          h('div',{style:{fontWeight:600}},label(product)),
          searchText.trim()&&h('div',{style:{fontSize:10,color:'var(--tx2)'}},'Độ phù hợp '+Math.round(Math.min(100,score))+'%')
        ))
        :h('div',{style:{padding:'10px',fontSize:12,color:'var(--tx2)'}},'Không tìm thấy sản phẩm gần giống')
    )
  );
}
const MemoImportProductSearch=React.memo(ImportProductSearch,(prev,next)=>
  prev.products===next.products&&
  prev.prodCats===next.prodCats&&
  String(prev.value||'')===String(next.value||'')&&
  prev.suggestions===next.suggestions&&
  prev.showCategoryFilters===next.showCategoryFilters&&
  prev.compact===next.compact
);

/* ─── IMPORT PREVIEW MODAL ─── */
function ImportPreviewModal({data, customers, setCustomers, orders, setOrders, products=[], prodCats=[], prodShifts, currentUser, onLocateExisting, onClose}) {
  const {newOrders=[], dupOrders:rawDupOrders=[], unknownPts=[], incompleteOrders=[], suspiciousDateRows=[], columnOffset=0} = data||{};
  const dupOrders=rawDupOrders.filter(order=>typeof scfWarehouseOrders==='undefined'||!(order.lines||[]).some(line=>scfWarehouseOrders.pac(line,products)));
  const [includeIncomplete, setIncludeIncomplete] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [submittedOrders,setSubmittedOrders]=React.useState(null);
  const [ptAssign, setPtAssign] = React.useState({}); // pointName -> customerId
  const [addToCustomer, setAddToCustomer] = React.useState({}); // pointName -> bool
  const [ptArea, setPtArea] = React.useState({}); // pointName -> area
  const [ptMerge, setPtMerge] = React.useState({}); // pointName -> existingPointId (gộp vào điểm có sẵn)
  const [skipPoint, setSkipPoint] = React.useState({}); // pointName -> bỏ qua toàn bộ đơn thuộc địa điểm
  const [productAssign, setProductAssign] = React.useState({}); // tên SP import -> productId trong danh mục

  // Hàm tính độ tương đồng tên (Levenshtein đơn giản)
  const similarity = (a, b) => {
    const s1 = (a||'').trim().toLowerCase().replace(/\s+/g,' ');
    const s2 = (b||'').trim().toLowerCase().replace(/\s+/g,' ');
    if(s1===s2) return 1;
    if(!s1||!s2) return 0;
    const longer = s1.length>s2.length?s1:s2;
    const shorter = s1.length>s2.length?s2:s1;
    if(longer.includes(shorter)) return shorter.length/longer.length;
    // Levenshtein
    const dp=Array.from({length:shorter.length+1},(_,i)=>i);
    for(let i=1;i<=longer.length;i++){
      let prev=i;
      for(let j=1;j<=shorter.length;j++){
        const val=longer[i-1]===shorter[j-1]?dp[j-1]:1+Math.min(dp[j-1],dp[j],prev);
        dp[j-1]=prev; prev=val;
      }
      dp[shorter.length]=prev;
    }
    return 1-dp[shorter.length]/longer.length;
  };

  // Mọi sản phẩm từ file KH bắt buộc phải khớp với một sản phẩm trong danh mục.
  const normalizeProductKey=value=>String(value||'').trim().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d')
    .replace(/\s+/g,' ').toUpperCase();
  const productById=id=>products.find(p=>String(p.id)===String(id));
  const productGroupKeyForLine=line=>normalizeProductKey(line?.productName)||('__EMPTY__'+String(line?.id||''));
  const unknownProductMap=new Map();
  newOrders.forEach(order=>(order.lines||[]).forEach(line=>{
    if(line.productId&&productById(line.productId))return;
    const rawName=String(line.productName||'').trim();
    const key=productGroupKeyForLine(line);
    const current=unknownProductMap.get(key)||{key,rawName:rawName||'Chưa có tên sản phẩm',count:0,rows:new Set()};
    current.count++;
    current.rows.add(order._importRow||'?');
    unknownProductMap.set(key,current);
  }));
  const unknownProductGroups=[...unknownProductMap.values()];
  const unresolvedProductGroups=unknownProductGroups.filter(group=>!productById(productAssign[group.key]));
  const sortedProducts=React.useMemo(
    ()=>[...products].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi')),
    [products]
  );
  const productSuggestions=React.useMemo(()=>{
    const result={};
    unknownProductGroups.forEach(group=>{
      result[group.key]=sortedProducts.map(product=>({product,score:similarity(group.rawName,product.name)}))
        .sort((a,b)=>b.score-a.score).slice(0,3);
    });
    return result;
  },[newOrders,sortedProducts]);

  // Tìm địa điểm gần giống (>= 75%) trong tất cả khách hàng
  const allExistingPts = customers.flatMap(c=>(c.points||[]).filter(p=>!p.customerStoppedAt).map(p=>({...p, custId:c.id, custName:c.name})));
  const similarMap = {}; // ptName -> [{pt, score}]
  unknownPts.forEach(pt=>{
    const matches = allExistingPts
      .map(ep=>({ep, score:similarity(pt, ep.name)}))
      .filter(x=>x.score>=0.75)
      .sort((a,b)=>b.score-a.score)
      .slice(0,3);
    if(matches.length>0) similarMap[pt]=matches;
  });

  const incompleteIssueMap=new Map(incompleteOrders.map(item=>[item.order.id,item.issues]));
  const candidateOrders=includeIncomplete?newOrders:newOrders.filter(o=>!incompleteIssueMap.has(o.id));
  const lineCheck=typeof scfWarehouseOrders!=='undefined'?scfWarehouseOrders.importRows(orders,candidateOrders,products):{orders:candidateOrders,skipped:[],conflicts:[]};
  const toImport = lineCheck.orders.filter(o=>o.warehouseImportLineChecked||!findExistingDeliveryOrder(orders,o));
  const resolvedProductForLine=line=>productById(line?.productId)||productById(productAssign[productGroupKeyForLine(line)]);
  const importableOrders=toImport.filter(order=>!skipPoint[order.pointName]).map(order=>({
    ...order,
    lines:(order.lines||[]).filter(line=>!!resolvedProductForLine(line))
  })).filter(order=>order.lines.length>0);
  const unresolvedPoints=unknownPts.filter(pt=>!skipPoint[pt]&&(
    !ptAssign[pt]||
    (!ptMerge[pt]&&!addToCustomer[pt])||
    (addToCustomer[pt]&&!ptArea[pt])
  ));
  const previewOrders=saving&&submittedOrders?submittedOrders:importableOrders;

  const doImport = async () => {
    if(saving)return;
    if(suspiciousDateRows.length){window.showToast('File có năm giao bất thường. Hãy sửa đúng năm trong Excel rồi import lại; app chưa lưu đơn nào.','error',12000);return;}
    if(unresolvedProductGroups.length){
      if(!confirm('Bạn vẫn bỏ qua các dòng thiếu sản phẩm ở trên?'))return;
    }
    if(!importableOrders.length){window.showToast('Không có dòng nào đã chọn được sản phẩm tương ứng để import.','warn');return;}
    if(unresolvedPoints.length){
      window.showToast('Vui lòng chọn khách hàng và địa điểm cho '+unresolvedPoints.length+' địa điểm mới.','warn');
      return;
    }
    const selectedIncomplete=importableOrders.filter(o=>incompleteIssueMap.has(o.id));
    if(selectedIncomplete.length){
      const detail=selectedIncomplete.slice(0,8).map(o=>'• Dòng '+(o._importRow||'?')+' - '+(o.pointName||'Chưa có địa điểm')+': '+incompleteIssueMap.get(o.id).join(', ')).join('\n');
      const more=selectedIncomplete.length>8?'\n... và '+(selectedIncomplete.length-8)+' đơn khác.':'';
      if(!confirm('Có '+selectedIncomplete.length+' đơn đang thiếu dữ liệu bắt buộc:\n'+detail+more+'\n\nBạn có chắc vẫn muốn import các đơn này không?'))return;
    }
    // Xử lý từng địa điểm mới
    Object.entries(ptAssign).forEach(([pt, custId]) => {
      if(!custId) return;
      const mergeIntoId = ptMerge[pt]; // gộp vào điểm đã có
      let resolvedPointId='', resolvedPointName='', resolvedPointArea='', resolvedPointAddress='';
      if(mergeIntoId) {
        // Gộp: dùng điểm đã có, không tạo mới
        const existing = allExistingPts.find(p=>String(p.id)===String(mergeIntoId)&&String(p.custId)===String(custId));
        if(existing){
          resolvedPointId=existing.id;
          resolvedPointName=existing.name;
          resolvedPointArea=existing.area||'';
          resolvedPointAddress=existing.address||'';
        }
      } else if(addToCustomer[pt]) {
        // Tạo mới
        const newId='PT'+uid();
        resolvedPointId=newId; resolvedPointName=pt;
        resolvedPointArea=ptArea[pt]||'';
        setCustomers(prev => prev.map(c => {
          if(String(c.id) !== String(custId)) return c;
          const pts = c.points||[];
          if(pts.find(p=>p.name.trim().toUpperCase()===pt.toUpperCase())) return c;
          return {...c, points:[...pts,{id:newId,name:pt,area:resolvedPointArea,address:''}]};
        }));
      }
      // Cập nhật đơn hàng với thông tin khách hàng & điểm giao
      const cust = customers.find(c=>String(c.id)===String(custId));
      if(cust) importableOrders.forEach(o=>{
        if(o.pointName.trim().toUpperCase()===pt.toUpperCase()){
          o.customerId=cust.id; o.customer=cust.name;
          if(resolvedPointId){
            o.pointId=resolvedPointId;
            o.pointName=resolvedPointName||pt;
            o.area=resolvedPointArea;
            o.address=resolvedPointAddress;
          }
        }
      });
    });
    const preparedDrafts=importableOrders.map(o=>{
      const {_importRow,...clean}=o;
      return deliveryOrderWithImportAudit({...clean,createdAt:clean.createdAt||fmtDate(),createdBy:clean.createdBy||currentUser?.name||'',updatedAt:fmtDT(),updatedBy:currentUser?.name||'',lines:(o.lines||[]).map(line=>{
        const mapped=resolvedProductForLine(line);
        return {...line,productId:mapped.id,productName:mapped.name,unit:mapped.unit||line.unit,weightPerUnit:mapped.weightPerUnit||0};
      })},currentUser,'File Excel khách hàng');
    });
    // Mã trong file xem trước chỉ là mã tạm. Khi nhập thật, tạo mã có ngày
    // và mã nhân viên để hai kế toán hoặc hai lần import không đụng nhau.
    const finalLineCheck=typeof scfWarehouseOrders!=='undefined'?scfWarehouseOrders.importRows(orders,preparedDrafts,products):{orders:preparedDrafts,skipped:[],conflicts:[]};
    if(finalLineCheck.skipped.length)window.showToast('Bỏ qua '+finalLineCheck.skipped.length+' dòng đã có theo ngày, địa điểm, giờ và sản phẩm.'+(finalLineCheck.conflicts.length?' Có '+finalLineCheck.conflicts.length+' dòng khác SL: giữ số cũ, cần đối chiếu.':''),'warn',12000);
    const preparedOrders=allocateImportedDeliveryOrderIds(orders,finalLineCheck.orders,currentUser);
    const codeCounts=new Map();
    preparedOrders.forEach(order=>{const code=String(order?.id||'').trim();if(code)codeCounts.set(code,(codeCounts.get(code)||0)+1);});
    const duplicateCodes=[...codeCounts.entries()].filter(([code,count])=>count>1||findExistingDeliveryOrderId(orders,code));
    if(duplicateCodes.length){
      const codes=duplicateCodes.slice(0,8).map(([code])=>code).join(', ');
      window.showToast('Mã đơn hàng bị trùng: '+codes+'. Vui lòng đổi mã rồi nhập lại; chưa có đơn nào được import.','error',10000);
      return;
    }
    const blockedDuplicates=preparedOrders.filter(order=>!order.warehouseImportLineChecked&&findExistingDeliveryOrder(orders,order));
    if(blockedDuplicates.length){const first=blockedDuplicates[0];window.showToast(duplicateDeliveryOrderMessage(first,findExistingDeliveryOrder(orders,first))+(blockedDuplicates.length>1?' Và '+(blockedDuplicates.length-1)+' đơn trùng khác đã bị bỏ qua.':''),'warn',10000);}
    const cleanOrders=preparedOrders.filter(order=>!blockedDuplicates.includes(order));
    if(!cleanOrders.length){window.showToast('Không còn đơn hàng mới để import.','info');return;}
    setSubmittedOrders(cleanOrders);
    setSaving(true);
    setOrders(p=>ensureUniqueDeliveryOrderIds([...p,...cleanOrders]));
    window.showToast('Đang lưu '+cleanOrders.length+' đơn lên máy chủ…','info',5000);
    const confirmed=await(window.scfWaitForCollectionSync?.('scf_orders',35000)??Promise.resolve(false));
    if(confirmed){
      window.showToast('Máy chủ đã xác nhận import '+cleanOrders.length+' đơn hàng ('+cleanOrders.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng sản phẩm).','success',8000);
      onClose();
      return;
    }
    const stillPending=(window.scfGetSyncReport?.().items||[]).some(item=>item.key==='scf_orders');
    if(stillPending){
      window.showToast('Đơn đã được giữ trong hàng chờ nhưng máy chủ chưa xác nhận. Không import lại file; hãy bấm trạng thái đồng bộ để kiểm tra.','warn',12000);
      onClose();
      return;
    }
    setSaving(false);
    window.showToast('Máy chủ không chấp nhận lần import này. Trang sẽ tải lại dữ liệu đã được máy chủ xác nhận.','error',10000);
    setTimeout(()=>location.reload(),1200);
  };

  return h(Modal,{title:'Xem trước import đơn hàng',lg:true,onClose},
    columnOffset>0&&h('div',{style:{background:'#EAF3DE',border:'1px solid #52b788',borderRadius:'var(--r)',padding:'8px 12px',marginBottom:'1rem',fontSize:12,color:'#2D5A0E'}},
      'Đã tự nhận dạng dữ liệu bắt đầu từ cột '+excelColumnName(columnOffset)+'; các cột trống bên trái đã được bỏ qua.'
    ),
    // Summary
    h('div',{style:{display:'flex',gap:10,marginBottom:'1rem',flexWrap:'wrap'}},
      h('div',{style:{background:'#EAF3DE',border:'1px solid #52b788',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#2D5A0E'}},previewOrders.length+(saving?' đơn đang chờ xác nhận':' đơn có thể import')),
        h('div',{style:{color:'#555'}},previewOrders.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng sản phẩm')
      ),
      lineCheck.skipped.length>0&&h('div',{role:'status',style:{background:'#fff3cd',padding:10}},'Bỏ qua '+lineCheck.skipped.length+' dòng đã có theo ngày + địa điểm + giờ + sản phẩm.'+(lineCheck.conflicts.length?' '+lineCheck.conflicts.length+' dòng khác SL: giữ số cũ, cần kiểm tra trước khi sửa.':'')),
      dupOrders.length>0&&h('div',{style:{background:'#FFF3CD',border:'1px solid #FFC107',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#856404'}},dupOrders.length+' đơn trùng'),
        h('div',{style:{color:'#555'}},'Cùng địa điểm + ngày + giờ')
      ),
      unknownPts.length>0&&h('div',{style:{background:'#FEE8E8',border:'1px solid #E06060',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#A32D2D'}},unknownPts.length+' địa điểm mới'),
        h('div',{style:{color:'#555'}},'Chưa có trong danh sách KH')
      ),
      unknownProductGroups.length>0&&h('div',{style:{background:'#FEE8E8',border:'1px solid #E06060',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#A32D2D'}},unknownProductGroups.length+' sản phẩm chưa khớp'),
        h('div',{style:{color:'#555'}},'Dòng không chọn được sản phẩm sẽ được bỏ qua')
      ),
      incompleteOrders.length>0&&h('div',{style:{background:'#FDECEC',border:'1px solid #D9534F',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#A32D2D'}},incompleteOrders.length+' đơn thiếu dữ liệu'),
        h('div',{style:{color:'#555'}},'Cần xác nhận trước khi import')
      )
    ),

    suspiciousDateRows.length>0&&h('div',{style:{background:'#FDECEC',border:'2px solid #D9534F',borderRadius:'var(--r)',padding:'12px',marginBottom:'1rem',color:'#8B1E1E'}},
      h('div',{style:{fontWeight:700,marginBottom:6}},'⛔ Chưa thể import: năm giao bất thường'),
      h('div',{style:{fontSize:12,lineHeight:1.5}},'Các dòng '+suspiciousDateRows.slice(0,20).map(item=>item.row+' ('+item.date+')').join(', ')+(suspiciousDateRows.length>20?'…':'')+'. Năm giao chỉ được nằm trong khoảng '+(new Date().getFullYear()-1)+'–'+(new Date().getFullYear()+1)+'. Hãy sửa năm trong file Excel rồi chọn import lại.'),
      h('div',{style:{fontSize:12,fontWeight:700,marginTop:6}},'App sẽ không tự đổi năm để tránh lưu nhầm đơn sang năm khác.')
    ),

    unknownProductGroups.length>0&&h('div',{style:{background:'#FFF5F5',border:'1px solid #D9534F',borderRadius:'var(--r)',padding:'12px',marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:4,fontSize:14,color:'#A32D2D'}},'Đối chiếu sản phẩm chưa có trong danh mục'),
      h('div',{style:{fontSize:12,color:'#6B1F1F',marginBottom:10}},'Dòng chọn được sản phẩm tương ứng sẽ được import và đổi sang đúng tên trong danh mục. Dòng không tìm được sản phẩm sẽ tự động bỏ qua.'),
      unknownProductGroups.map(group=>{
        const suggestions=productSuggestions[group.key]||[];
        return h('div',{key:group.key,style:{display:'grid',gridTemplateColumns:'minmax(180px,1fr) minmax(260px,1.5fr)',gap:10,alignItems:'center',padding:'8px 0',borderTop:'1px solid #f5c6c6'}},
          h('div',null,
            h('div',{style:{fontWeight:600,fontSize:13}},group.rawName),
            h('div',{style:{fontSize:11,color:'var(--tx2)'}},group.count+' dòng · dòng Excel '+[...group.rows].join(', ')),
            suggestions[0]&&suggestions[0].score>=0.45&&h('div',{style:{fontSize:11,color:'#856404',marginTop:2}},'Gợi ý gần nhất: '+suggestions[0].product.name+' ('+Math.round(suggestions[0].score*100)+'%)')
          ),
          h(MemoImportProductSearch,{
            products:sortedProducts,
            prodCats,
            value:productAssign[group.key]||'',
            suggestions,
            onChange:productId=>setProductAssign(prev=>({...prev,[group.key]:productId}))
          })
        );
      })
    ),

    incompleteOrders.length>0&&h('div',{style:{background:'#FFF5F5',border:'1px solid #D9534F',borderRadius:'var(--r)',padding:'12px',marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:8,fontSize:14,color:'#A32D2D'}},'⚠ Đơn chưa đủ thông tin bắt buộc:'),
      incompleteOrders.map(({order,issues})=>h('div',{key:order.id,style:{fontSize:12,padding:'3px 0',color:'#6B1F1F'}},
        '• Dòng '+(order._importRow||'?')+' — '+(order.pointName||'Chưa có địa điểm')+': thiếu '+issues.join(', ')
      )),
      h('div',{style:{marginTop:10,display:'flex',gap:16,flexWrap:'wrap'}},
        h('label',{style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}},
          h('input',{type:'radio',checked:!includeIncomplete,onChange:()=>setIncludeIncomplete(false)}),
          'Không import các đơn thiếu'
        ),
        h('label',{style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}},
          h('input',{type:'radio',checked:includeIncomplete,onChange:()=>setIncludeIncomplete(true)}),
          'Vẫn import — hỏi xác nhận lần cuối'
        )
      )
    ),

    // Duplicate handling
    dupOrders.length>0&&h('div',{style:{background:'#FFFBF0',border:'1px solid #FFC107',borderRadius:'var(--r)',padding:'12px',marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:8,fontSize:14}},'⚠️ Các đơn trùng:'),
      h('div',{style:{fontSize:12,color:'#856404',marginBottom:6}},'Các đơn dưới đây có thật trong dữ liệu nhưng có thể đang bị ẩn bởi bộ lọc ngày, trạng thái, khu vực hoặc phân trang.'),
      dupOrders.map(o=>{
        const existing=findExistingDeliveryOrder(orders,o);
        const statusText=({pending:'Chờ xếp',assigned:'Đã xếp',delivering:'Đang giao',done:'Đã giao',failed:'Giao lỗi',cancelled:'Hủy'})[existing?.status]||existing?.status||'Chưa có trạng thái';
        return h('div',{key:o.id,style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,fontSize:12,padding:'6px 0',color:'#666',borderTop:'1px solid rgba(133,100,4,.15)'}},
          h('div',{style:{minWidth:0}},
            h('div',null,'• '+duplicateDeliveryOrderMessage(o,existing)),
            existing&&h('div',{style:{marginTop:2,color:'#856404',fontWeight:600}},'Mã đơn: '+(existing.id||'—')+' · '+statusText+(existing.area?' · '+existing.area:''))
          ),
          existing&&onLocateExisting&&h('button',{type:'button',onClick:()=>onLocateExisting(existing),style:{flex:'0 0 auto',padding:'4px 8px',fontSize:11,border:'1px solid #B8860B',borderRadius:'var(--r)',background:'#fff',color:'#6B5200',fontWeight:600,cursor:'pointer'}},'Mở đơn')
        );
      }),
      h('div',{style:{marginTop:10,fontSize:12,fontWeight:600,color:'#856404'}},'Các đơn này sẽ không được import thêm để tránh nhân đôi dữ liệu.')
    ),

    // Unknown points handling
    unknownPts.length>0&&h('div',{style:{background:'#FEF6F6',border:'1px solid #E06060',borderRadius:'var(--r)',padding:'12px',marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:8,fontSize:14}},'🆕 Địa điểm giao mới — chưa có trong danh mục:'),
      unknownPts.map(pt=>{
        const similar = similarMap[pt]||[];
        const isMerging = !!ptMerge[pt];
        const isSkipped=!!skipPoint[pt];
        const selectedCustomer=customers.find(c=>String(c.id)===String(ptAssign[pt]||''));
        const customerPoints=selectedCustomer?.points||[];
        return h('div',{key:pt,style:{padding:'8px 0',borderBottom:'1px solid #f5c6c6',opacity:isSkipped?0.7:1}},
          // Tên địa điểm + badge gần giống
          h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:6}},
            h('span',{style:{fontWeight:600,fontSize:13}},pt),
            similar.length>0&&h('span',{style:{fontSize:11,background:'#FFF3CD',color:'#856404',
              border:'1px solid #FFC107',borderRadius:10,padding:'1px 8px'}},
              '⚠ có '+similar.length+' địa điểm gần giống'
            ),
            h('button',{
              type:'button',
              onClick:()=>setSkipPoint(prev=>({...prev,[pt]:!prev[pt]})),
              style:{marginLeft:'auto',padding:'4px 9px',fontSize:11,borderRadius:'var(--r)',border:'1px solid '+(isSkipped?'#52b788':'#D9534F'),background:isSkipped?'#EAF3DE':'#fff',color:isSkipped?'#216E4E':'#A32D2D',fontWeight:600}
            },isSkipped?'↩ Chọn lại':'⊘ Bỏ qua địa điểm này')
          ),
          isSkipped&&h('div',{style:{padding:'8px 10px',background:'#F2F4F3',borderRadius:'var(--r)',fontSize:12,color:'var(--tx2)'}},
            'Các đơn thuộc địa điểm này sẽ không được import.'
          ),
          // Gợi ý gần giống chỉ để tham khảo, không tự chọn/gộp.
          !isSkipped&&similar.length>0&&h('div',{style:{background:'#FFFBF0',border:'1px solid #FFC107',
            borderRadius:'var(--r)',padding:'8px 10px',marginBottom:6}},
            h('div',{style:{fontSize:12,fontWeight:600,color:'#856404',marginBottom:6}},
              '🔍 Địa điểm gần giống để tham khảo:'
            ),
            similar.map(({ep,score})=>h('div',{key:ep.id,
              style:{display:'flex',alignItems:'center',gap:8,padding:'4px 6px',borderRadius:4,marginBottom:2}
            },
              h('div',{style:{flex:1}},
                h('span',{style:{fontWeight:500,fontSize:12}},ep.name),
                h('span',{style:{fontSize:11,color:'var(--tx2)',marginLeft:6}},'('+ep.custName+')'),
                ep.area&&h('span',{style:{fontSize:11,background:'var(--bg2)',
                  padding:'0 5px',borderRadius:8,marginLeft:4}},ep.area)
              ),
              h('span',{style:{fontSize:11,color:'#856404',fontWeight:600}},
                Math.round(score*100)+'% giống'
              )
            ))
          ),
          // Bước 1: chọn khách hàng. Bước 2: chọn địa điểm của khách hàng hoặc tạo mới.
          !isSkipped&&h('div',{style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}},
            h('select',{
              value:ptAssign[pt]||'',
              onChange:e=>{
                setPtAssign(p=>({...p,[pt]:e.target.value}));
                setPtMerge(p=>{const n={...p};delete n[pt];return n;});
                setAddToCustomer(p=>({...p,[pt]:false}));
              },
              style:{padding:'4px 8px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',minWidth:160}
            },
              h('option',{value:''},'1. Chọn khách hàng...'),
              customers.map(c=>h('option',{key:c.id,value:c.id},c.name))
            ),
            h('select',{
              value:isMerging?ptMerge[pt]:(addToCustomer[pt]?'__new__':''),
              disabled:!selectedCustomer,
              onChange:e=>{
                const value=e.target.value;
                if(value==='__new__'){
                  setPtMerge(p=>{const n={...p};delete n[pt];return n;});
                  setAddToCustomer(p=>({...p,[pt]:true}));
                  return;
                }
                setPtMerge(p=>{
                  const n={...p};
                  if(value)n[pt]=value;
                  else delete n[pt];
                  return n;
                });
                setAddToCustomer(p=>({...p,[pt]:false}));
              },
              style:{padding:'4px 8px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',minWidth:210}
            },
              h('option',{value:''},selectedCustomer?'2. Chọn địa điểm...':'2. Chọn khách hàng trước'),
              customerPoints.map(point=>h('option',{key:point.id,value:point.id},point.name+(point.area?' · '+point.area:''))),
              h('option',{value:'__new__'},'+ Tạo địa điểm mới "'+pt+'"')
            ),
            !isMerging&&h('select',{
              value:ptArea[pt]||'',
              onChange:e=>setPtArea(p=>({...p,[pt]:e.target.value})),
              disabled:!addToCustomer[pt],
              style:{padding:'4px 8px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',minWidth:110}
            },
              h('option',{value:''},'— Khu vực —'),
              [...new Set(customers.flatMap(c=>(c.points||[]).map(p=>p.area)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi')).map(a=>h('option',{key:a,value:a},a))
            ),
            isMerging&&h('span',{style:{fontSize:12,color:'#856404',fontWeight:500}},
              '↪ Dùng địa điểm: "'+(customerPoints.find(p=>String(p.id)===String(ptMerge[pt]))?.name||'')+'"'
            ),
            addToCustomer[pt]&&h('span',{style:{fontSize:12,color:'var(--pri)',fontWeight:500}},
              '＋ Sẽ tạo địa điểm mới trong khách hàng '+(selectedCustomer?.name||'')
            )
          )
        );
      })
    ),

    // Orders preview table
    h('div',{style:{maxHeight:200,overflowY:'auto',marginBottom:'1rem'}},
      h('table',{style:{width:'100%',fontSize:12,borderCollapse:'collapse'}},
        h('thead',null,h('tr',{style:{background:'var(--bg2)'}},
          ['Ngày','Địa điểm','Giờ','Khách hàng','Sản phẩm','SL đặt','SL HĐ','Chú ý','Trạng thái'].map(c=>
            h('th',{key:c,style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)',fontWeight:600}},c)
          )
        )),
        h('tbody',null,previewOrders.map(o=>h('tr',{key:o.id},
          h('td',{style:{padding:'4px 8px'}},o.deliveryDate),
          h('td',{style:{padding:'4px 8px',fontWeight:500}},o.pointName),
          h('td',{style:{padding:'4px 8px'}},o.deliveryTime),
          h('td',{style:{padding:'4px 8px',color:'var(--tx2)'}},o.customer||h('span',{style:{color:'#E06060'}},'Chưa gán')),
          h('td',{style:{padding:'4px 8px',minWidth:150}},(o.lines||[]).map((line,index)=>
            h('div',{key:line.id||index,style:{whiteSpace:'nowrap',lineHeight:1.5}},(index+1)+'. '+(line.productName||'—'))
          )),
          h('td',{style:{padding:'4px 8px'}},(o.lines||[]).reduce((sum,line)=>sum+(Number(line.qtyProd)||0),0)),
          h('td',{style:{padding:'4px 8px'}},(o.lines||[]).reduce((sum,line)=>sum+(Number(line.qtyInvoice)||0),0)),
          h('td',{className:'import-preview-notes',style:{padding:'4px 8px',minWidth:140,maxWidth:240,verticalAlign:'top'}},(o.lines||[]).map((line,index)=>
            h('div',{key:line.id||index,style:{lineHeight:1.5,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}},(o.lines.length>1?(index+1)+'. ':'')+(line.note||'—'))
          )),
          h('td',{style:{padding:'4px 8px'}},
            incompleteIssueMap.has(o.id)?h('span',{style:{color:'#A32D2D',fontSize:11}},'⚠ thiếu: '+incompleteIssueMap.get(o.id).join(', ')):
            dupOrders.includes(o)?h('span',{style:{color:'#856404',fontSize:11}},'⚠️ trùng'):
            h('span',{style:{color:'#2D5A0E',fontSize:11}},'✓ mới')
          )
        )))
      )
    ),

    h(Row,null,
      h('button',{onClick:onClose,disabled:saving},'Hủy'),
      h('button',{className:'bp',onClick:doImport,disabled:saving||!toImport.length||suspiciousDateRows.length>0,style:{padding:'8px 20px'}},
        h('i',{className:'ti '+(saving?'ti-loader-2 spin':'ti-file-import'),style:{fontSize:14}}),
        saving?' Đang chờ máy chủ xác nhận…':' Import '+importableOrders.length+' đơn'
      )
    )
  );
}

function scfOrderImageProductKey(value){
 return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toUpperCase().trim().replace(/[,;]\s*(KG|KGS)\s*$/,'').replace(/\s+/g,' ');
}
async function scfOrderImageDeadline(work){
 const controller=new AbortController();let timer;
 try{return await Promise.race([Promise.resolve().then(()=>work(controller.signal)),new Promise((_,reject)=>{timer=setTimeout(()=>{reject(Error('AI chưa trả kết quả sau 60 giây. Hãy thử lại hoặc nhập đơn bằng tay.'));controller.abort();},60000);})]);}
 finally{clearTimeout(timer);}
}
async function scfPrepareOrderImage(file){
 // Preserve screenshot text: keep supported original files within the server limit.
 if(file.size<=8*1024*1024)return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({dataUrl:r.result});r.onerror=()=>reject(Error('Không đọc được ảnh.'));r.readAsDataURL(file);});
 return resizeImageFile(file,2600,.98);
}
function ImageOrderImportModal({customers,products,orders,setOrders,prodShifts,currentUser,onClose}) {
  const[file,setFile]=useState(null);
  const[img,setImg]=useState('');
  const[text,setText]=useState('');
  const[rows,setRows]=useState([]);
  const[busy,setBusy]=useState(false);
  const[progress,setProgress]=useState('');
  const inputRef=useRef(null);
  const norm=s=>String(s||'').trim().replace(/\s+/g,' ');
  const shiftTimes={'SANG':'03:00','SÁNG':'03:00','TRUA':'08:00','TRƯA':'08:00','CHIEU':'14:00','CHIỀU':'14:00','DEM':'20:00','ĐÊM':'20:00'};
  const noAccent=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').toUpperCase();
  const findPoint=line=>{
    const src=norm(line).toUpperCase();
    const plain=noAccent(src);
    let best=null;
    customers.forEach(c=>(c.points||[]).forEach(pt=>{
      const pn=norm(pt.name).toUpperCase();
      const pp=noAccent(pn);
      if(!pn)return;
      if(src.includes(pn)||pn.includes(src)||plain.includes(pp)||pp.includes(plain)||((plain.includes('DBG')||plain.includes('TANG 1'))&&pp.includes('DBG'))||(plain.includes('TRINA')&&pp.includes('TRINA'))){
        const score=Math.min(src.length,pn.length)/Math.max(src.length,pn.length);
        if(!best||score>best.score)best={cust:c,pt,score};
      }
    }));
    return best;
  };
  const findProduct=line=>{
    const src=norm(line).toUpperCase();
    let best=null;
    products.forEach(p=>{
      const pn=norm(p.name).toUpperCase();
      if(!pn)return;
      if(src.includes(pn)||pn.includes(src)){
        const score=Math.min(src.length,pn.length)/Math.max(src.length,pn.length);
        if(!best||score>best.score)best={prod:p,score};
      }
    });
    return best;
  };
  const readDate=line=>{
    const src=String(line||'');
    const hasDateContext=/\b(NGAY|NGÀY|DATE)\b/i.test(noAccent(src));
    const m=src.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?|\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/);
    if(!m)return '';
    const a=Number(m[1]||m[4]),b=Number(m[2]||m[5]);
    const yy=m[3]||m[6]||'';
    if(!yy&&!hasDateContext&&src.trim().length>12)return '';
    const y=yy?String(yy).padStart(4,'20'):String(new Date().getFullYear());
    if(a<=12&&b>12)return pad2(b)+'/'+pad2(a)+'/'+y;
    return pad2(a)+'/'+pad2(b)+'/'+y;
  };
  const readTime=line=>{
    const m=String(line||'').match(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/);
    return m?pad2(m[1])+':'+pad2(m[2]):'';
  };
  const findYoungsunCustomer=()=>customers.find(c=>noAccent(c.name).includes('YOUNG')||noAccent(c.name).includes('YOUNGSUN'))||{};
  const excelOrderId=(date,index)=>{
    const p=String(date||fmtDate()).split('/');
    const dd=pad2(p[0]),mm=pad2(p[1]),yy=String(p[2]||new Date().getFullYear()).slice(-2);
    return 'D'+yy+dd+mm+String(index).padStart(3,'0');
  };
  const dateFromShort=(s,baseDate)=>{
    const src=noAccent(s);
    const shift='SANG|TRUA|CHIEU|DEM';
    const m=src.match(new RegExp('(?:'+shift+')\\s*(\\d{1,2})[\\/\\-.](\\d{1,2})\\b|\\b(\\d{1,2})[\\/\\-.](\\d{1,2})\\s*(?:'+shift+')'));
    if(!m)return '';
    const y=(baseDate&&baseDate.split('/')[2])||String(new Date().getFullYear());
    return pad2(m[1]||m[3])+'/'+pad2(m[2]||m[4])+'/'+y;
  };
  const guessShiftItems=(note,totalQty,baseDate)=>{
    const src=noAccent(note);
    const parts=src.split(/[\/;,]+/).map(x=>x.trim()).filter(Boolean);
    const detailed=[];
    parts.forEach(part=>{
      const k=Object.keys(shiftTimes).find(x=>part.includes(x));
      if(!k)return;
      const dt=dateFromShort(part,baseDate);
      const noDate=part.replace(/\b\d{1,2}[\/\-.]\d{1,2}\b/g,' ');
      const nums=[...noDate.matchAll(/(\d+(?:[,.]\d+)?)(?=\s*(KG|K|$))/g)].map(m=>numFmt(m[1])).filter(Boolean);
      detailed.push({key:k,time:shiftTimes[k],date:dt||baseDate,qty:nums.length?nums[nums.length-1]:totalQty});
    });
    if(detailed.length)return detailed;
    const found=Object.keys(shiftTimes).filter(k=>src.includes(k)).map(k=>({key:k,time:shiftTimes[k],date:dateFromShort(src,baseDate)||baseDate}));
    const uniq=[];found.forEach(x=>{if(!uniq.some(u=>u.time===x.time))uniq.push(x);});
    const hourOnly=src.match(/\b([01]?\d|2[0-3])\s*H\b/);
    if(!uniq.length)return [{time:hourOnly?pad2(hourOnly[1])+':00':'08:00',date:dateFromShort(src,baseDate)||baseDate,qty:totalQty,shift:''}];
    if(uniq.length===1)return [{time:uniq[0].time,date:uniq[0].date,qty:totalQty,shift:uniq[0].key}];
    return uniq.map((x,i)=>{
      const tail=src.slice(src.indexOf(x.key)+x.key.length);
      const m=tail.match(/(\d+(?:[,.]\d+)?)/);
      return {time:x.time,date:x.date,qty:m?numFmt(m[1]):(i===0?totalQty:0),shift:x.key};
    }).filter(x=>x.qty>0);
  };
  const parseYoungsunText=raw=>{
    const lines=String(raw||'').replace(/\r/g,'\n').split('\n').map(norm).filter(Boolean);
    const joined=lines.join(' ');
    if(!/(?:[BTK8]\d{3,})/i.test(joined)||!/SC/i.test(joined))return [];
    let curDate=readDate(joined)||'';let curPoint='';
    lines.forEach(line=>{
      const d=readDate(line);if(d)curDate=d;
      const plain=noAccent(line);
      if(plain.includes('TRINA'))curPoint='TRINA';
      if(plain.includes('DBG'))curPoint=plain.includes('TANG')?'DBG tầng 1':'DBG';
    });
    const cust=findYoungsunCustomer();
    const resultMap={};
    const ensureOrder=(point,time,date)=>{
      const ptMatch=findPoint(point);
      const pt=ptMatch?.pt||{};
      const c=ptMatch?.cust||cust;
      const d=date||curDate||fmtDate();
      const key=(point||'')+'|'+d+'|'+time;
      if(!resultMap[key])resultMap[key]={id:excelOrderId(d,Object.keys(resultMap).length+1),deliveryDate:d,deliveryTime:time,pointId:pt.id||'',pointName:pt.name||point,customerId:c.id||'',customer:c.name||'YOUNGSUN',address:pt.address||'',area:pt.area||'',status:'pending',note:'Nhập từ ảnh Youngsun OCR',workOut:0,workReturn:0,prodShiftId:(getProdShiftForOrder({deliveryDate:d,deliveryTime:time,pointId:pt.id||'',pointName:pt.name||point,customerId:c.id||'',customer:c.name||'YOUNGSUN',address:pt.address||'',area:pt.area||''},prodShifts||[],customers||[])||{}).id||'',lines:[],createdAt:fmtDate(),updatedAt:fmtDT()};
      return resultMap[key];
    };
    lines.forEach(line=>{
      const plain=noAccent(line);
      if(/^(BEP|NGAY|MA\b|TEN\b|NCC\b|DVT\b|GHI CHU\b|SL\b)/.test(plain))return;
      if(!/\bSC\b/i.test(line))return;
      let m=line.match(/\b([BTK8]\d{3,})\b[\s.,;:-]+(.+?)\s+SC\s+([A-ZÀ-Ỹa-zà-ỹ]+)\s+(\d+(?:[,.]\d+)?)(?:\s+(.+))?$/i);
      if(!m){
        const loose=line.match(/\b([BTK8]\d{3,})\b[\s.,;:-]+(.+?)\s+SC\s+([A-ZÀ-Ỹa-zà-ỹ]{1,5})\s+(\d+(?:[,.]\d+)?)(.*)$/i);
        if(loose)m=loose;
      }
      if(!m){
        const simple=line.match(/\b([BTK8]\d{3,})\b[\s.,;:-]+(.+?)\s+(\d+(?:[,.]\d+)?)(?:\s+(.+))?$/i);
        if(simple){
          const rawTail=norm(simple[2]).replace(/\bSC\b/ig,'').trim();
          const unitMatch=rawTail.match(/\b(KG|K|G|CAI|CÁI|GOI|GÓI|THUNG|THÙNG|HOP|HỘP|BAO|BO|BỘ|LIT|LÍT)\b$/i);
          const rawUnit=unitMatch?unitMatch[1]:'KG';
          m=[null,simple[1],unitMatch?rawTail.replace(unitMatch[0],'').trim():rawTail,rawUnit,simple[3],simple[4]||''];
        }
      }
      if(!m)return;
      let code=m[1].toUpperCase();
      if(/^8\d{4}$/.test(code))code='B'+code.slice(1);
      let rawName=norm(m[2])
        .replace(/~?SL\s*D[ẠA]T|DAT\s*HA|ĐẠT\s*HÀ|DAT|H[Il]GHICHU|GHI\s*CHU/ig,'')
        .replace(/\bNCC\b|\bDVT\b/ig,'')
        .trim();
      if(!rawName||/^(TEN|TÊN)$/i.test(rawName))return;
      const unit=(m[3]||'KG').toUpperCase(), total=numFmt(m[4]), note=m[5]||'';
      const prodMatch=findProduct(rawName);
      const prod=prodMatch?.prod||products.find(p=>noAccent(p.name)===noAccent(rawName))||{};
      const lineDate=dateFromShort(note,curDate)||curDate;
      const items=guessShiftItems(note,total,lineDate);
      items.forEach(it=>{
        const o=ensureOrder(curPoint||'YOUNGSUN',it.time,it.date||lineDate);
        o.lines.push({id:uid(),productId:prod.id||'',productName:prod.name||rawName,customerCode:code,unit,weightPerUnit:prod.weightPerUnit||0,qtyProd:it.qty,qtyInvoice:it.qty,shift:it.time==='20:00'?'night':'day',note:note});
      });
    });
    return Object.values(resultMap).filter(o=>o.lines.length);
  };
  const parseText=raw=>{
    const youngsun=parseYoungsunText(raw);
    if(youngsun.length)return youngsun;
    const clean=String(raw||'').replace(/\r/g,'\n').replace(/[|]/g,' ').split('\n').map(norm).filter(Boolean);
    const result=[];let cur=null;let curDate='';
    const flush=()=>{if(cur&&cur.lines.length)result.push(cur);cur=null;};
    clean.forEach(line=>{
      const d=readDate(line);if(d)curDate=d;
      const t=readTime(line);
      const ptMatch=findPoint(line);
      if(ptMatch||t){
        if(ptMatch||(!cur&&t)){
          if(cur&&cur.lines.length)flush();
          const pt=ptMatch?.pt||{};
          const cust=ptMatch?.cust||{};
          const od=d||curDate||fmtDate();
          cur={id:excelOrderId(od,result.length+1),deliveryDate:od,deliveryTime:t||'08:00',pointId:pt.id||'',pointName:pt.name||line.replace(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/g,'').trim(),customerId:cust.id||'',customer:cust.name||'',address:pt.address||'',area:pt.area||'',status:'pending',note:'Nhập từ ảnh OCR',workOut:0,workReturn:0,prodShiftId:(getProdShiftForOrder({deliveryDate:od,deliveryTime:t||'08:00',pointId:pt.id||'',pointName:pt.name||line.replace(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/g,'').trim(),customerId:cust.id||'',customer:cust.name||'',address:pt.address||'',area:pt.area||''},prodShifts||[],customers||[])||{}).id||'',lines:[],createdAt:fmtDate(),updatedAt:fmtDT()};
        } else if(cur&&t) cur.deliveryTime=t;
      }
      if(!cur)return;
      const qtyMatch=line.match(/(\d+(?:[,.]\d+)?)\s*(kg|kgs|gói|goi|cái|cai|thùng|thung|túi|tui|hộp|hop|bao|bộ|bo|lít|lit)?\s*$/i);
      const prodMatch=findProduct(line);
      if(qtyMatch&&(prodMatch||!ptMatch)){
        const qty=numFmt(qtyMatch[1]);
        let name=line.replace(qtyMatch[0],'').replace(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/g,'').trim();
        if(prodMatch)name=prodMatch.prod.name;
        if(name&&name.length>1){
          const prod=prodMatch?.prod||products.find(p=>norm(p.name).toUpperCase()===name.toUpperCase())||{};
          const unit=qtyMatch[2]||prod.unit||'Kg';
          cur.lines.push({id:uid(),productId:prod.id||'',productName:name,unit,weightPerUnit:prod.weightPerUnit||0,qtyProd:qty,qtyInvoice:qty,shift:'day',note:''});
        }
      }
    });
    flush();
    return result.filter(o=>o.lines.length);
  };
  const imageLoadRef=useRef(0);
  const activeRef=useRef(true);
  const readingRef=useRef(false);
  const readImageRef=useRef(null);
  const setImageFile=f=>{
    if(!f||readingRef.current)return;
    if(!/^image\/(png|jpeg|webp)$/i.test(f.type||'')){window.showToast('Hãy chọn ảnh PNG, JPG hoặc WebP.','warn');return;}
    if(f.size>20*1024*1024){window.showToast('Ảnh quá lớn. Hãy chọn ảnh dưới 20 MB.','warn');return;}
    const version=++imageLoadRef.current;
    setFile(null);setImg('');setRows([]);setText('');setProgress('');
    const r=new FileReader();
    r.onload=e=>{if(activeRef.current&&version===imageLoadRef.current){setImg(e.target.result);setFile(f);readImageRef.current(f);}};
    r.onerror=()=>{if(activeRef.current)window.showToast('Không mở được ảnh.','error');};
    r.readAsDataURL(f);
  };
  useEffect(()=>{
    activeRef.current=true;
    const paste=e=>{
      const f=Array.from(e.clipboardData?.items||[]).find(item=>item.kind==='file'&&item.type.startsWith('image/'))?.getAsFile();
      if(f){e.preventDefault();setImageFile(f);}
    };
    window.addEventListener('paste',paste);
    return()=>{activeRef.current=false;++imageLoadRef.current;window.removeEventListener('paste',paste);};
  },[]);
  const runOcr=async imageFile=>{
    if(!imageFile||readingRef.current){if(!imageFile)window.showToast('Hãy dán, kéo thả hoặc chọn ảnh trước.','warn');return;}
    readingRef.current=true;setBusy(true);setRows([]);setText('');setProgress('AI đang đọc đơn hàng, tối đa 60 giây...');
    try{
      if(!sb)throw Error('Chưa kết nối máy chủ.');
      const data=await scfOrderImageDeadline(async signal=>{
        const prepared=await scfPrepareOrderImage(imageFile);
        if(signal.aborted)throw Error('Đã hết thời gian đọc ảnh.');
        const {data,error}=await sb.functions.invoke('scf-order-vision',{body:{imageDataUrl:prepared.dataUrl},signal});
        if(error){let details;try{details=await error.context?.json();}catch{}throw Error(details?.error||'Chưa gọi được AI. Kiểm tra chức năng scf-order-vision trên máy chủ.');}
        return data;
      });
      if(!data?.ok||!Array.isArray(data.orders))throw Error(data?.error||'AI trả dữ liệu không hợp lệ.');
      if(!activeRef.current)return;
      const parsed=data.orders.map(raw=>{
        const matches=customers.flatMap(c=>(c.points||[]).filter(pt=>noAccent(norm(pt.name))===noAccent(norm(raw.pointName))).map(pt=>({c,pt})));
        const match=matches.length===1?matches[0]:null;
        return {id:uid(),deliveryDate:String(raw.deliveryDate||''),deliveryTime:String(raw.deliveryTime||''),pointId:match?.pt.id||'',pointName:String(raw.pointName||''),customerId:match?.c.id||'',customer:match?.c.name||'',address:match?.pt.address||'',area:match?.pt.area||'',status:'pending',note:String(raw.note||''),lines:(Array.isArray(raw.lines)?raw.lines:[]).map(line=>{
          const candidates=products.filter(p=>scfOrderImageProductKey(p.name)===scfOrderImageProductKey(line.productName));
          const product=candidates.length===1?candidates[0]:null;
          const qty=typeof line.quantity==='number'&&Number.isFinite(line.quantity)&&line.quantity>=0?line.quantity:'';
          return{id:uid(),productId:product?.id||'',productName:String(line.productName||''),customerCode:String(line.customerCode||''),unit:product?.unit||String(line.unit||''),weightPerUnit:product?.weightPerUnit||0,qtyProd:qty,qtyInvoice:qty,note:String(line.note||'')};
        })};
      }).filter(o=>o.lines.length);
      setRows(parsed);
      setText(parsed.map(o=>[o.pointName+' '+o.deliveryDate+' '+o.deliveryTime,...o.lines.map(l=>l.productName+' '+l.qtyProd)].join('\n')).join('\n\n'));
      const missingPoints=parsed.filter(o=>!o.pointId).length;
      setProgress(parsed.length?(missingPoints?'Đã đọc dòng hàng. Có '+missingPoints+' bản nháp cần chọn địa điểm bên dưới. ':'AI đã đọc '+parsed.length+' đơn. ')+'Kiểm tra sản phẩm, ngày, giờ và số lượng trước khi nhập.':'AI chưa đọc được đơn. Hãy thử ảnh rõ hơn.');
    }catch(e){if(activeRef.current){setProgress(e.message||'Chưa đọc được ảnh.');window.showToast(e.message||String(e),'error');}}
    finally{readingRef.current=false;if(activeRef.current)setBusy(false);}
  };
  readImageRef.current=runOcr;
  const updateOrder=(id,data)=>setRows(p=>p.map(o=>o.id===id?{...o,...data}:o));
  const updateLine=(oid,lid,data)=>setRows(p=>p.map(o=>o.id===oid?{...o,lines:o.lines.map(l=>l.id===lid?{...l,...data}:l)}:o));
  const allPoints=(customers||[]).flatMap(c=>(c.points||[]).filter(pt=>!pt.customerStoppedAt).map(pt=>({...pt,customerId:c.id,customerName:c.name})));
  const updatePointName=(id,value)=>{
    const m=findPoint(value);
    updateOrder(id,{pointName:value,pointId:m?.pt?.id||'',address:m?.pt?.address||'',area:m?.pt?.area||'',customerId:m?.cust?.id||'',customer:m?.cust?.name||''});
  };
  const setPointById=(id,pointId)=>{
    if(!pointId){updateOrder(id,{pointId:'',pointName:'',address:'',area:'',customerId:'',customer:''});return;}
    const pt=allPoints.find(x=>x.id===pointId)||{};
    updateOrder(id,{pointId:pt.id||'',pointName:pt.name||'',address:pt.address||'',area:pt.area||'',customerId:pt.customerId||'',customer:pt.customerName||''});
  };
  const setProductById=(oid,lid,productId)=>{
    if(!productId){updateLine(oid,lid,{productId:'',productName:'',unit:'',weightPerUnit:0});return;}
    const p=(products||[]).find(x=>x.id===productId)||{};
    updateLine(oid,lid,{productId:p.id||'',productName:p.name||'',unit:p.unit||'',weightPerUnit:p.weightPerUnit||0});
  };
  const importRows=()=>{
    if(busy)return;
    if(!rows.length){window.showToast('Chưa có đơn hàng nào để nhập.','warn');return;}
    if(rows.some(o=>!o.pointId||!/^\d{2}\/\d{2}\/\d{4}$/.test(o.deliveryDate)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(o.deliveryTime)||(o.lines||[]).some(l=>l.qtyProd===''||!Number.isFinite(Number(l.qtyProd))||Number(l.qtyProd)<0))){window.showToast('Hãy kiểm tra đủ địa điểm, ngày, giờ và số lượng của từng đơn trước khi nhập.','warn');return;}
    const unmatchedLines=rows.flatMap(order=>(order.lines||[]).filter(line=>!line.productId||!(products||[]).some(product=>String(product.id)===String(line.productId))));
    if(unmatchedLines.length){
      window.showToast('Còn '+unmatchedLines.length+' dòng sản phẩm chưa khớp danh mục. Hãy chọn sản phẩm tương ứng trước khi nhập.','warn');
      return;
    }
    const imageLineCheck=typeof scfWarehouseOrders!=='undefined'?scfWarehouseOrders.importRows(orders,rows,products):{orders:rows,skipped:[],conflicts:[]};
    if(imageLineCheck.skipped.length)window.showToast('Bỏ qua '+imageLineCheck.skipped.length+' dòng PAC trùng; dòng khác số lượng cần đối chiếu với đơn đã lưu.','warn',10000);
    const dup=imageLineCheck.orders.filter(o=>!o.warehouseImportLineChecked&&findExistingDeliveryOrder(orders,o));
    if(dup.length){const first=dup[0],existing=findExistingDeliveryOrder(orders,first);window.showToast(duplicateDeliveryOrderMessage(first,existing)+(dup.length>1?' Và '+(dup.length-1)+' đơn trùng khác đã bị bỏ qua.':''),'warn',10000);}
    const finalRows=imageLineCheck.orders.filter(o=>!dup.includes(o)).map(o=>deliveryOrderWithImportAudit({...o,createdAt:o.createdAt||fmtDate(),createdBy:o.createdBy||currentUser?.name||'',updatedAt:fmtDT(),updatedBy:currentUser?.name||''},currentUser,'Ảnh đơn hàng'));
    if(!finalRows.length){window.showToast('Không còn đơn hàng mới để nhập.','info');return;}
    setOrders(p=>[...p,...finalRows]);
    window.showToast('Đã nhập '+finalRows.length+' đơn hàng từ ảnh.','success');
    onClose();
  };
  return ReactDOM.createPortal(h(Modal,{title:'Lấy đơn từ ảnh — bản nháp',lg:true,className:'order-image-import-modal',overlayClassName:'order-image-import-overlay',onClose},
    h('div',{className:'order-image-import-top'},
      h('div',null,
        h('div',{
          onDragOver:e=>{e.preventDefault();},
          onDrop:e=>{e.preventDefault();setImageFile(Array.from(e.dataTransfer.files||[]).find(f=>f.type.startsWith('image/')));},
          onClick:()=>inputRef.current&&inputRef.current.click(),
          style:{border:'1.5px dashed var(--pri)',borderRadius:'var(--rl)',padding:'1.25rem',minHeight:220,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',cursor:'pointer',background:'#f7fbf8',overflow:'hidden'}
        },
          img?h('img',{src:img,style:{maxWidth:'100%',maxHeight:260,objectFit:'contain'}})
          :h('div',null,h('i',{className:'ti ti-photo-scan',style:{fontSize:44,color:'var(--pri)',display:'block',marginBottom:8}}),'Dán ảnh bằng Ctrl+V, kéo thả ảnh vào đây hoặc bấm để chọn ảnh')
        ),
        h('input',{ref:inputRef,type:'file',accept:'image/*',style:{display:'none'},onChange:e=>setImageFile(e.target.files&&e.target.files[0])}),
        progress&&h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:8}},progress)
      ),
      h('div',{className:'order-image-import-help'},'Dán, kéo thả hoặc chọn ảnh để AI tự đọc và tạo đơn nháp. Kiểm tra, sửa dữ liệu trong bảng bên dưới, rồi bấm Nhập đơn hàng để lưu chính thức.')
    ),
    h('div',{style:{marginTop:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:8,color:'var(--pri3)'}},'Đơn nháp ('+rows.length+' đơn, '+rows.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng hàng)'),
      h('div',{className:'tw',style:{maxHeight:260}},
        h('table',null,
          h('thead',null,h('tr',null,...['Thông tin đơn','Dòng hàng trong đơn'].map(c=>h('th',{key:c},c)))),
          h('tbody',null,rows.length?rows.map(o=>h('tr',{key:o.id},
            h('td',null,
              h('div',{style:{display:'grid',gridTemplateColumns:'92px 70px',gap:5,marginBottom:5}},
                h('input',{value:o.deliveryDate,onChange:e=>updateOrder(o.id,{deliveryDate:e.target.value}),style:{fontSize:12,padding:'5px 6px'}}),
                h('input',{value:o.deliveryTime,onChange:e=>updateOrder(o.id,{deliveryTime:e.target.value,prodShiftId:(getProdShiftForOrder({...o,deliveryTime:e.target.value},prodShifts||[],customers||[])||{}).id||''}),style:{fontSize:12,padding:'5px 6px'}})
              ),
              h('select',{value:o.pointId||'__current__',onChange:e=>e.target.value==='__current__'?null:setPointById(o.id,e.target.value),style:{width:'100%',fontSize:12,padding:'5px 6px',fontWeight:600,marginBottom:4}},
                !o.pointId&&h('option',{value:'__current__'},(o.pointName||'— Chọn địa điểm —')+' (chưa khớp)'),
                h('option',{value:''},'— Chọn địa điểm —'),
                allPoints.map(pt=>h('option',{key:pt.id,value:pt.id},pt.customerName+' - '+pt.name))
              ),
              h('input',{value:o.customer||'',readOnly:true,style:{width:'100%',fontSize:12,padding:'5px 6px',background:'#f7faf8'}}),
              !o.pointId&&h('div',{style:{fontSize:11,color:'#A32D2D',marginTop:2}},'Cần chọn địa điểm trước khi nhập đơn')
            ),
            h('td',null,
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:5}},(o.lines||[]).length+' dòng hàng'),
              (o.lines||[]).map(l=>h('div',{key:l.id,style:{display:'grid',gridTemplateColumns:'70px minmax(180px,1fr) 64px 58px',gap:5,marginBottom:5,alignItems:'center'}},
                h('input',{value:l.customerCode||'',onChange:e=>updateLine(o.id,l.id,{customerCode:e.target.value}),placeholder:'Mã',style:{fontSize:12,padding:'4px 5px'}}),
                h('select',{value:l.productId||'__current__',onChange:e=>e.target.value==='__current__'?null:setProductById(o.id,l.id,e.target.value),style:{fontSize:12,padding:'4px 5px'}},
                  !l.productId&&h('option',{value:'__current__'},(l.productName||'— Chọn sản phẩm —')+' (chưa khớp)'),
                  h('option',{value:''},'— Chọn sản phẩm —'),
                  (products||[]).map(p=>h('option',{key:p.id,value:p.id},(p.code?p.code+' - ':'')+p.name))
                ),
                h('input',{value:l.qtyInvoice,onChange:e=>updateLine(o.id,l.id,{qtyInvoice:numFmt(e.target.value),qtyProd:numFmt(e.target.value)}),placeholder:'SL',style:{fontSize:12,padding:'4px 5px'}}),
                h('input',{value:l.unit||'',onChange:e=>updateLine(o.id,l.id,{unit:e.target.value}),placeholder:'ĐVT',style:{fontSize:12,padding:'4px 5px'}})
              ))
            )
          )):h('tr',null,h('td',{colSpan:2,className:'empty-st'},'Chưa có dữ liệu xem trước.')))
        )
      )
    ),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:importRows,disabled:busy||!rows.length},h('i',{className:'ti ti-file-import',style:{fontSize:14}}),'Nhập đơn hàng'))
  ),document.body);}

function deliveryPrintInitialDates(mode,day,to,week,month){
  if(mode==='day')return {initialDate:day,initialDateTo:day};
  if(mode==='range')return {initialDate:day,initialDateTo:to};
  if(mode==='week'){
    const keys=isoWeekDateKeyRange(week),iso=key=>String(key).replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3');
    if(keys)return {initialDate:iso(keys[0]),initialDateTo:iso(keys[1])};
  }
  if(mode==='month'&&/^\d{4}-\d{2}$/.test(month||'')){
    const [year,n]=month.split('-').map(Number);
    return {initialDate:month+'-01',initialDateTo:month+'-'+new Date(year,n,0).getDate()};
  }
  return {initialDate:'',initialDateTo:''};
}
function deliveryPrintScope({orders=[],customers=[],trips=[],from='',to='',dateBasis='trip',customerId='',area='',shiftId='',tripId='',pointKey='',group=''}){
  const customerFor=o=>customers.find(c=>(o.customerId||o.custId)?String(c.id)===String(o.customerId||o.custId):c.name===o.customer);
  const pointFor=o=>(customerFor(o)?.points||[]).find(p=>(o.pointId||o.ptId)?String(p.id)===String(o.pointId||o.ptId):p.name===o.pointName);
  const identity=o=>JSON.stringify([customerFor(o)?.id||o.customerId||o.custId||o.customer||'',pointFor(o)?.id||o.pointId||o.ptId||o.pointName||o.address||'']);
  const areaFor=o=>String(pointFor(o)?.area||o.area||'').trim();
  const tripFor=o=>manualTripForOrder(trips,o);
  const dateFor=o=>manualTripDateToISO((dateBasis==='trip'&&tripFor(o)?.deliveryDate)||o.deliveryDate||o.date||o.ngayGiao);
  const shiftFor=t=>String(t?.shiftId||t?.shiftName||'');
  const base=orders.filter(o=>o.status!=='cancelled'&&(!group||deliveryMatchesTripGroup(tripFor(o),group))&&
    (!customerId||String(o.customerId||o.custId||customerFor(o)?.id||'')===String(customerId))&&
    (!from||dateFor(o)>=from)&&(!to||dateFor(o)<=to)&&!!dateFor(o));
  const tripOptions=[...new Map(base.map(tripFor).filter(Boolean).map(t=>[String(t.id),t])).values()]
    .sort((a,b)=>manualTripDateToISO(a.deliveryDate).localeCompare(manualTripDateToISO(b.deliveryDate))||manualTripText(a).localeCompare(manualTripText(b),'vi'));
  const shiftOptions=[...new Map(tripOptions.map(t=>[shiftFor(t),{id:shiftFor(t),name:t.shiftName||'Chưa có ca'}])).values()];
  const byTrip=base.filter(o=>(!shiftId||shiftFor(tripFor(o))===shiftId)&&(!tripId||String(tripFor(o)?.id||'')===tripId));
  const areaOptions=[...new Set(byTrip.map(areaFor).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const byArea=byTrip.filter(o=>!area||areaFor(o)===area);
  const pointOptions=[...new Map(byArea.map(o=>[identity(o),{key:identity(o),label:(o.pointName||o.address||'Chưa có địa điểm')+(customerId?'':' · '+(o.customer||customerFor(o)?.name||''))}])).values()].sort((a,b)=>a.label.localeCompare(b.label,'vi'));
  const filtered=byArea.filter(o=>!pointKey||identity(o)===pointKey).sort((a,b)=>dateFor(a).localeCompare(dateFor(b))||String(a.deliveryTime||'').localeCompare(String(b.deliveryTime||'')));
  return {filtered,dateFor,tripOptions:tripOptions.filter(t=>!shiftId||shiftFor(t)===shiftId),shiftOptions,areaOptions,pointOptions};
}
function DeliveryTripGroupSwitch({value,onChange,exclusive=false}){
  return h('div',{className:'delivery-trip-group-filter',role:'group','aria-label':'Lọc nhóm chuyến',style:{display:'inline-flex',gap:4}},
    [['samsung','Samsung'],['dt','Điềm Thụy']].filter(([key])=>!exclusive||key!==value).map(([key,label])=>h('button',{key,type:'button',role:'switch','aria-label':label,'aria-checked':value===key,
      title:exclusive?(value===key?'Đang xem '+label:'Chuyển sang '+label):(value===key?'Bấm để xem tất cả nhóm':'Chỉ xem '+label),onClick:()=>onChange(exclusive?key:value===key?'':key),
      style:{padding:'6px 10px',fontSize:12,whiteSpace:'nowrap',background:(exclusive?value!==key:value===key)?'var(--pri)':'var(--bg)',color:(exclusive?value!==key:value===key)?'#fff':'var(--tx2)',boxShadow:exclusive&&value!==key?'0 2px 5px #0003':'none'}},h('span',{'aria-hidden':true,style:{display:'inline-block',width:26,height:15,borderRadius:20,background:value===key?'#bce4d5':'#c8d1ce',position:'relative'}},h('span',{style:{position:'absolute',width:11,height:11,top:2,left:value===key?13:2,borderRadius:'50%',background:'#fff'}})),label)));
}
function useDeliveryPrintFilters({orders,customers,trips,initialDate,initialDateTo,initialDateBasis,initialGroup}){
  const[custId,sCust]=useState(''),[df,sdf]=useState(initialDate||''),[dt,sdt]=useState(initialDateTo===undefined?(initialDate||''):initialDateTo);
  const[dateBasis,setDateBasis]=useState(initialDateBasis||'trip'),[shiftId,setShift]=useState(''),[tripId,setTrip]=useState('');
  const[area,setArea]=useState(''),[pointKey,setPoint]=useState(''),[group,setGroup]=useState(initialGroup||'');
  const resetPoint=()=>{setArea('');setPoint('');};
  const resetTrip=()=>{setShift('');setTrip('');resetPoint();};
  const scope=deliveryPrintScope({orders,customers,trips,from:df,to:dt,dateBasis,customerId:custId,area,shiftId,tripId,pointKey,group});
  const select=(label,value,onChange,options,empty)=>h(F,{label},h('select',{'aria-label':label,value,onChange:e=>onChange(e.target.value)},h('option',{value:''},empty||'— Tất cả —'),options.map(o=>h('option',{key:o.id,value:o.id},o.name))));
  const fields=onCustomerChange=>h('div',{className:'delivery-print-filters',style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(210px,100%),1fr))',gap:12}},
    h(F,{label:'Lọc theo ngày'},h('select',{'aria-label':'Lọc theo ngày',value:dateBasis,onChange:e=>{setDateBasis(e.target.value);resetTrip();}},h('option',{value:'trip'},'Ngày chuyến'),h('option',{value:'order'},'Ngày giao'))),
    h(F,{label:'Từ ngày'},h('input',{'aria-label':'Từ ngày',type:'date',value:df,onChange:e=>{sdf(e.target.value);resetTrip();}})),
    h(F,{label:'Đến ngày'},h('input',{'aria-label':'Đến ngày',type:'date',value:dt,onChange:e=>{sdt(e.target.value);resetTrip();}})),
    h(F,{label:'Chuyến giao theo nhóm'},h(DeliveryTripGroupSwitch,{value:group,onChange:v=>{setGroup(v);resetTrip();}})),
    select('Ca giao',shiftId,v=>{setShift(v);setTrip('');resetPoint();},scope.shiftOptions),
    select('Chuyến giao',tripId,v=>{setTrip(v);resetPoint();},scope.tripOptions.map(t=>({id:String(t.id),name:[t.deliveryDate,manualTripText(t)].filter(Boolean).join(' · ')}))),
    select('Khách hàng',custId,v=>{sCust(v);resetTrip();onCustomerChange?.(v);},customers.map(c=>({id:String(c.id),name:c.name}))),
    select('Khu vực',area,v=>{setArea(v);setPoint('');},scope.areaOptions.map(a=>({id:a,name:a}))),
    select('Địa điểm',pointKey,setPoint,scope.pointOptions.map(p=>({id:p.key,name:p.label})))
  );
  return {...scope,fields,orderDate:o=>o.deliveryDate||o.date||o.ngayGiao||''};
}

function PrintByCustomerModal({orders,customers,products,company,trips=[],initialDate,initialDateTo,initialDateBasis,initialGroup,onClose}) {
  const [tpl,setTpl]=useState('welstory');
  const [selected,setSelected]=useState({});
  const {filtered,fields,orderDate}=useDeliveryPrintFilters({orders,customers,trips,initialDate,initialDateTo,initialDateBasis,initialGroup});
  const selectedOrders=filtered.filter(o=>selected[o.id]!==false);
  const allChecked=filtered.length>0&&selectedOrders.length===filtered.length;
  const toggleAll=checked=>setSelected(p=>{const n={...p};filtered.forEach(o=>{n[o.id]=checked;});return n;});
  const toggleOne=(id,checked)=>setSelected(p=>({...p,[id]:checked}));

  const doPrint=()=>{
    if(!selectedOrders.length){window.showToast('Chọn ít nhất 1 đơn để in!','warn');return;}
    const extractPart=(html,tag)=>{
      const m=String(html||'').match(new RegExp('<'+tag+'[^>]*>([\\s\\S]*?)<\\/'+tag+'>','i'));
      return m?m[1]:'';
    };
    const docs=selectedOrders.map(o=>buildPrintHTML(tpl,o,company));
    const style=extractPart(docs[0],'style');
    const bodyParts=docs.map((html,idx)=>{
      const body=extractPart(html,'body')||html;
      return idx<docs.length-1?body+'<div style="page-break-after:always"></div>':body;
    }).join('');
    const printHtml='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Phieu giao hang</title><style>'+style+'<\/style><\/head><body>'+bodyParts+'<\/body><\/html>';
    if(window.scfShouldUsePrintAgent?.()){
      window.scfQueueA4Print(printHtml,{title:'Phiếu giao hàng · '+selectedOrders.length+' đơn'})
        .then(()=>window.showToast('Đã gửi '+selectedOrders.length+' đơn tới Canon 2900.','success'))
        .catch(error=>window.showToast(error?.message||'Chưa gửi được lệnh in tới Canon 2900.','error'));
      return;
    }
    const win=window.open('','_blank');
    win.document.write(printHtml);
    win.document.close();
    setTimeout(function(){win.print();},500);
  };

  return h(Modal,{title:'In phiếu giao hàng theo khách hàng',lg:true,onClose},
    fields(id=>{const customer=customers.find(c=>String(c.id)===id);if(customer)setTpl(resolveOrderPrintTemplate({},customer));}),
    h(F,{label:'Mẫu in'},h('select',{'aria-label':'Mẫu in',value:tpl,onChange:e=>setTpl(e.target.value)},PRINT_TEMPLATES.map(t=>h('option',{key:t.id,value:t.id},t.name)))),
    tpl==='youngsun'&&h('div',{style:{fontSize:12,color:'var(--tx2)',margin:'0 0 10px'}},
      'YOUGSUN tự lấy bếp từ địa điểm giao và xác định ca: 02:00 Sáng · 07:00 Trưa · 13:00 Chiều · 19:00 Đêm.'
    ),
    filtered.length>0?h('div',null,
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:'1rem',fontSize:13}},
        h('i',{className:'ti ti-file-invoice',style:{color:'var(--pri)',marginRight:6}}),
        h('strong',null,selectedOrders.length+'/'+filtered.length+' phiếu đã chọn'),
        ' — '+selectedOrders.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng sản phẩm'
      ),
      h('div',{style:{maxHeight:200,overflowY:'auto',marginBottom:'1rem'}},
        h('table',{style:{width:'100%',fontSize:12,borderCollapse:'collapse'}},
          h('thead',null,h('tr',{style:{background:'var(--bg2)'}},
            h('th',{style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)',width:34}},
              h('input',{type:'checkbox',checked:allChecked,onChange:e=>toggleAll(e.target.checked),style:{width:'auto'}})
            ),
            ['Ngày','Địa điểm','Giờ','SP'].map(c=>h('th',{key:c,style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)'}},c))
          )),
          h('tbody',null,filtered.map(o=>h('tr',{key:o.id},
            h('td',{style:{padding:'4px 8px'}},h('input',{type:'checkbox',checked:selected[o.id]!==false,onChange:e=>toggleOne(o.id,e.target.checked),style:{width:'auto'}})),
            h('td',{style:{padding:'4px 8px'}},orderDate(o)),
            h('td',{style:{padding:'4px 8px',fontWeight:500}},o.pointName||'—'),
            h('td',{style:{padding:'4px 8px'}},o.deliveryTime||'—'),
            h('td',{style:{padding:'4px 8px'}},(o.lines||[]).length)
          )))
        )
      ),
      h(Row,null,
        h('button',{onClick:onClose},'Hủy'),
        h('button',{className:'bp',onClick:doPrint,disabled:!selectedOrders.length,style:{padding:'8px 20px'}},h('i',{className:'ti ti-printer',style:{fontSize:15}}),' In '+selectedOrders.length+' phiếu')
      )
    ):h('div',null,
      h('div',{style:{textAlign:'center',padding:'2rem',color:'var(--tx2)',fontSize:13}},'Không có đơn hàng. Chọn khách hàng hoặc điều chỉnh khoảng ngày.'),
      h(Row,null,h('button',{onClick:onClose},'Đóng'))
    )
  );
}

function PrintLabelsMultiModal({orders,customers,trips=[],initialDate,initialDateTo,initialDateBasis,initialGroup,onClose,onPrint}) {
  const [selected,setSelected]=useState({});
  const [labelMode,setLabelMode]=useState('auto');
  const {filtered,fields,orderDate}=useDeliveryPrintFilters({orders,customers,trips,initialDate,initialDateTo,initialDateBasis,initialGroup});
  const selectedOrders=filtered.filter(o=>selected[o.id]!==false);
  const allChecked=filtered.length>0&&selectedOrders.length===filtered.length;
  const toggleAll=checked=>setSelected(p=>{const n={...p};filtered.forEach(o=>{n[o.id]=checked;});return n;});
  const toggleOne=(id,checked)=>setSelected(p=>({...p,[id]:checked}));
  const doPrint=()=>{
    if(!selectedOrders.length){window.showToast('Chọn ít nhất 1 đơn để in tem!','warn');return;}
    onPrint(selectedOrders,labelMode);
  };
  return h(Modal,{title:'In tem cho nhiều đơn hàng',lg:true,onClose},
    fields(),
    h(F,{label:'Mẫu in'},h('select',{'aria-label':'Mẫu in',value:labelMode,onChange:e=>setLabelMode(e.target.value)},
      h('option',{value:'auto'},'Tự động theo sản phẩm (tem thường / PAC)'),h('option',{value:'classic'},'Tem thường'),h('option',{value:'pac'},'Tem PAC 10 × 10 cm'))),
    filtered.length>0?h('div',null,
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:'1rem',fontSize:13}},
        h('i',{className:'ti ti-tag',style:{color:'var(--pri)',marginRight:6}}),
        h('strong',null,selectedOrders.length+'/'+filtered.length+' đơn đã chọn'),
        ' — '+selectedOrders.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng sản phẩm'
      ),
      h('div',{style:{maxHeight:200,overflowY:'auto',marginBottom:'1rem'}},
        h('table',{style:{width:'100%',fontSize:12,borderCollapse:'collapse'}},
          h('thead',null,h('tr',{style:{background:'var(--bg2)'}},
            h('th',{style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)',width:34}},
              h('input',{type:'checkbox',checked:allChecked,onChange:e=>toggleAll(e.target.checked),style:{width:'auto'}})
            ),
            ['Ngày','Địa điểm','Giờ','SP'].map(c=>h('th',{key:c,style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)'}},c))
          )),
          h('tbody',null,filtered.map(o=>h('tr',{key:o.id},
            h('td',{style:{padding:'4px 8px'}},h('input',{type:'checkbox',checked:selected[o.id]!==false,onChange:e=>toggleOne(o.id,e.target.checked),style:{width:'auto'}})),
            h('td',{style:{padding:'4px 8px'}},orderDate(o)),
            h('td',{style:{padding:'4px 8px',fontWeight:500}},o.pointName||'—'),
            h('td',{style:{padding:'4px 8px'}},o.deliveryTime||'—'),
            h('td',{style:{padding:'4px 8px'}},(o.lines||[]).length)
          )))
        )
      ),
      h(Row,null,
        h('button',{onClick:onClose},'Hủy'),
        h('button',{className:'bp',onClick:doPrint,disabled:!selectedOrders.length,style:{padding:'8px 20px'}},h('i',{className:'ti ti-printer',style:{fontSize:15}}),' In tem '+selectedOrders.length+' đơn')
      )
    ):h('div',null,
      h('div',{style:{textAlign:'center',padding:'2rem',color:'var(--tx2)',fontSize:13}},'Không có đơn hàng. Điều chỉnh khách hàng, địa điểm hoặc khoảng ngày.'),
      h(Row,null,h('button',{onClick:onClose},'Đóng'))
    )
  );
}

function IntemTab({products,company}){
  const printableProducts=(products||[]).filter(Boolean).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));
  const [productId,setProductId]=useState(printableProducts[0]?.id||'');
  const [productGroup,setProductGroup]=useState('all');
  const [goodsGroupFilter,setGoodsGroupFilter]=useState('all');
  const [productSearch,setProductSearch]=useState('');
  const [templateType,setTemplateType]=useState('58x40');
  const [prodDate,setProdDate]=useState(isoDate());
  const [prodTime,setProdTime]=useState(shortTime(timeNow()));
  const [totalKg,setTotalKg]=useState('');
  const [packQty,setPackQty]=useState(1);
  const [packWeight,setPackWeight]=useState('');
  const [printAgentId,setPrintAgentId]=useState(()=>window.scfPrintAgentSettings?.().agentId||'SCF-PC-01');
  const [printAgentPrinter,setPrintAgentPrinter]=useState(()=>window.scfPrintAgentSettings?.().printerRole||'x350');
  const [sendingToAgent,setSendingToAgent]=useState(false);
  useEffect(()=>{if(!productId&&printableProducts[0]?.id)setProductId(printableProducts[0].id);},[productId,printableProducts]);
  const selectedProduct=printableProducts.find(p=>String(p.id||'')===String(productId||''))||null;
  const productGroupOf=product=>{
    const code=String(product?.code||'').trim().toUpperCase();
    if(code.startsWith('TP'))return 'TP';
    if(code.startsWith('HH'))return 'HH';
    return 'OTHER';
  };
  const productSearchTerms=normalizeLookupText(productSearch).split(/\s+/).filter(Boolean);
  const goodsGroupOptions=[...new Set(printableProducts.filter(product=>productGroupOf(product)==='HH').map(product=>String(product?.goodsGroup||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const filteredPrintableProducts=printableProducts.filter(product=>{
    if(productGroup!=='all'&&productGroupOf(product)!==productGroup)return false;
    if(productGroup==='HH'&&goodsGroupFilter!=='all'){
      const group=String(product?.goodsGroup||'').trim();
      if(goodsGroupFilter==='__ungrouped__'?!!group:normalizeLookupText(group)!==normalizeLookupText(goodsGroupFilter))return false;
    }
    const haystack=normalizeLookupText([product.code,product.name,product.custName,product.unit].filter(Boolean).join(' '));
    return productSearchTerms.every(term=>haystack.includes(term));
  });
  const selectedOutsideFilter=!!selectedProduct&&!filteredPrintableProducts.some(product=>String(product.id||'')===String(productId||''));
  const chooseProductGroup=group=>{
    setProductGroup(group);
    setGoodsGroupFilter('all');
    setProductSearch('');
    const first=printableProducts.find(product=>group==='all'||productGroupOf(product)===group);
    setProductId(first?.id||'');
  };
  const chooseGoodsGroup=group=>{
    setGoodsGroupFilter(group);
    setProductSearch('');
    const first=printableProducts.find(product=>productGroupOf(product)==='HH'&&(group==='all'||(group==='__ungrouped__'?!String(product?.goodsGroup||'').trim():normalizeLookupText(product?.goodsGroup||'')===normalizeLookupText(group))));
    setProductId(first?.id||'');
  };
  const selectedProductText=[selectedProduct?.name,selectedProduct?.custName,selectedProduct?.unit].filter(Boolean).join(' ').toUpperCase();
  const isPacProduct=selectedProductText.includes('/PAC')||selectedProductText.includes('KG/PAC')||(/\bPAC\b/i.test(selectedProductText)&&/GÓI|GOI/i.test(selectedProductText));
  const labelRule=resolveProductLabelPackRule(selectedProduct,selectedProduct?.name||'');
  // Thành phẩm TP dùng tem theo quy tắc đóng gói, kể cả dữ liệu cũ còn lưu nhầm cờ "không in tem".
  const productNeedsLabel=labelRule.enabled||/^TP\d+/i.test(String(selectedProduct?.code||''));
  const defaultPackWeight=numFmt(selectedProduct?.weightPerUnit)||0;
  useEffect(()=>{
    if(templateType==='100x100'&&defaultPackWeight>0&&!numFmt(packWeight))setPackWeight(String(defaultPackWeight));
  },[templateType,defaultPackWeight]);
  useEffect(()=>{
    if(!selectedProduct)return;
    setTemplateType(isPacProduct?'100x100':'58x40');
  },[productId,isPacProduct]);
  useEffect(()=>{
    if(templateType==='100x100')setPrintAgentPrinter('x420');
  },[templateType]);
  const toVnDate=value=>vnDateFromISO(value)||fmtAnyDate(value)||value||'';
  // In qua hộp in hệ điều hành; trình duyệt không thể chọn máy in trực tiếp.
  const printerIp='';
  const splitClassicWeights=kg=>{
    if(!productNeedsLabel)return [];
    const total=Number(numFmt(kg)||0);
    if(!(total>0))return [];
    const pack=Number(labelRule.pack||10);
    const full=Math.floor(total/pack);
    const remain=Number((total-full*pack).toFixed(2));
    const parts=Array.from({length:full},()=>pack);
    if(remain>0){
      if(labelRule.mergeSmallRemainder&&remain<2&&parts.length)parts[parts.length-1]=Number((parts[parts.length-1]+remain).toFixed(2));
      else parts.push(remain);
    }
    return parts;
  };
  const buildPackWeights=()=>{
    if(!productNeedsLabel)return [];
    const count=Math.max(0,Math.round(numFmt(packQty)||0));
    const each=Number(numFmt(packWeight)||defaultPackWeight||0);
    if(!(count>0) || !(each>0))return [];
    return Array.from({length:count},()=>each);
  };
  const labelWeights=templateType==='58x40'?splitClassicWeights(totalKg):buildPackWeights();
  const formatKg=kg=>Number(numFmt(kg)||0).toLocaleString('vi-VN',{maximumFractionDigits:2});
  const summaryLine=labelWeights.length
    ?labelWeights.map((kg,idx)=>formatKg(kg)+'kg').join(' | ')
    :'Chưa có tem để in';
  const classicSvg=kg=>{
    const product=String(selectedProduct?.name||'').trim()||'SẢN PHẨM';
    const nsx=toVnDate(prodDate);
    const gioSx=String(prodTime||'').trim().replace(':','H').replace(/H00$/,'H');
    const directUse=product.toUpperCase().includes('BÚN LÁ')||product.toUpperCase().includes('BUN LA')||product.toUpperCase().includes('BÁNH CUỐN')||product.toUpperCase().includes('BANH CUON')||product.toUpperCase().includes('BÁNH PHỞ CUỐN')||product.toUpperCase().includes('BANH PHO CUON');
    const hdsd=directUse?'Ăn trực tiếp':'Trần qua nước sôi trước khi ăn.';
    return '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"580\" height=\"400\" viewBox=\"0 0 580 400\">'
      +'<rect width=\"580\" height=\"400\" fill=\"white\"/>'
      +'<rect x=\"10\" y=\"10\" width=\"560\" height=\"380\" fill=\"white\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<text x=\"160\" y=\"68\" font-family=\"Arial,sans-serif\" font-size=\"54\" font-weight=\"700\" text-anchor=\"middle\" lengthAdjust=\"spacingAndGlyphs\" textLength=\"270\">'+String(product).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"425\" y=\"68\" font-family=\"Arial,sans-serif\" font-size=\"52\" font-weight=\"700\" text-anchor=\"middle\">'+formatKg(kg)+'</text>'
      +'<text x=\"520\" y=\"68\" font-family=\"Arial,sans-serif\" font-size=\"38\" font-weight=\"700\" text-anchor=\"middle\">KG</text>'
      +'<text x=\"22\" y=\"112\" font-family=\"Arial,sans-serif\"><tspan font-size=\"22\">SP CỦA: C.TY TNHH </tspan><tspan font-size=\"23\" font-weight=\"700\">THỰC PHẨM SÔNG CÔNG</tspan></text>'
      +'<text x=\"22\" y=\"154\" font-family=\"Arial,sans-serif\" font-size=\"23\">ĐC: Tổ 1, Phường Bá Xuyên, Tỉnh Thái Nguyên</text>'
      +'<text x=\"22\" y=\"196\" font-family=\"Arial,sans-serif\" font-size=\"23\" font-weight=\"700\">SĐT : 0969709878</text>'
      +'<text x=\"258\" y=\"196\" font-family=\"Arial,sans-serif\" font-size=\"23\">THÀNH PHẦN: Bột gạo, nước</text>'
      +'<text x=\"22\" y=\"238\" font-family=\"Arial,sans-serif\" font-size=\"23\">HDSD: '+hdsd.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"512\" y=\"238\" font-family=\"Arial,sans-serif\" font-size=\"25\" text-anchor=\"end\"><tspan font-weight=\"700\">PH</tspan> 5-8</text>'
      +'<text x=\"22\" y=\"280\" font-family=\"Arial,sans-serif\" font-size=\"23\">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'
      +'<text x=\"22\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\">NSX:</text>'
      +'<text x=\"132\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\">'+nsx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"342\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\">GIỜ SX:</text>'
      +'<text x=\"512\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\" text-anchor=\"end\">'+gioSx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"28\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\">HSD: 24H</text>'
      +'<text x=\"170\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\">FORMOL: 0</text>'
      +'<text x=\"302\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\">HÀN THE: 0</text>'
      +'<text x=\"552\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\" text-anchor=\"end\">BQ: 0-10°C</text>'
      +'</svg>';
  };
  const legacyPacSvg=kg=>{
    const product=String(selectedProduct?.name||'').trim().toUpperCase()||'SẢN PHẨM';
    const nsx=toVnDate(prodDate);
    const gioSx=String(prodTime||'').trim().replace(':','H').replace(/H00$/,'H');
    return '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1000\" height=\"1000\" viewBox=\"0 0 1000 1000\">'
      +'<rect width=\"1000\" height=\"1000\" fill=\"white\"/>'
      +'<rect x=\"56\" y=\"56\" width=\"888\" height=\"888\" fill=\"white\" stroke=\"#111\" stroke-width=\"5\"/>'
      +'<line x1=\"86\" y1=\"152\" x2=\"914\" y2=\"152\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<line x1=\"760\" y1=\"56\" x2=\"760\" y2=\"152\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<line x1=\"844\" y1=\"56\" x2=\"844\" y2=\"152\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<text x=\"414\" y=\"118\" font-family=\"Times New Roman,serif\" font-size=\"62\" font-weight=\"700\" text-anchor=\"middle\">'+product.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"802\" y=\"118\" font-family=\"Times New Roman,serif\" font-size=\"58\" font-weight=\"700\" text-anchor=\"middle\">'+formatKg(kg)+'</text>'
      +'<text x=\"886\" y=\"118\" font-family=\"Times New Roman,serif\" font-size=\"46\" text-anchor=\"middle\">KG</text>'
      +'<text x=\"88\" y=\"214\" font-family=\"Times New Roman,serif\" font-size=\"28\" font-weight=\"700\">SP CỦA: CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG</text>'
      +'<text x=\"88\" y=\"294\" font-family=\"Times New Roman,serif\" font-size=\"28\" font-weight=\"700\">ĐC: Tổ 1, Phường Bá Xuyên, Tỉnh Thái Nguyên</text>'
      +'<line x1=\"86\" y1=\"332\" x2=\"914\" y2=\"332\" stroke=\"#bbb\" stroke-width=\"1\"/>'
      +'<line x1=\"352\" y1=\"332\" x2=\"352\" y2=\"408\" stroke=\"#bbb\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"386\" font-family=\"Times New Roman,serif\" font-size=\"32\" font-weight=\"700\">SĐT : 0969709878</text>'
      +'<text x=\"372\" y=\"386\" font-family=\"Times New Roman,serif\" font-size=\"32\" font-weight=\"700\">TP: Bột gạo, nước</text>'
      +'<line x1=\"86\" y1=\"412\" x2=\"914\" y2=\"412\" stroke=\"#bbb\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"500\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 15°C-20°C. Đóng gói hở. HSD 12h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"526\" x2=\"914\" y2=\"526\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"610\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 10°C-15°C. Đóng gói hở. HSD 24h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"636\" x2=\"914\" y2=\"636\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"720\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 5°C-10°C. Đóng gói hở. HSD 36h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"746\" x2=\"914\" y2=\"746\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"830\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 0°C-5°C. Đóng gói kín. HSD 72h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"856\" x2=\"914\" y2=\"856\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"904\" font-family=\"Times New Roman,serif\" font-size=\"28\" font-weight=\"700\">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'
      +'<line x1=\"86\" y1=\"936\" x2=\"914\" y2=\"936\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<line x1=\"260\" y1=\"936\" x2=\"260\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"442\" y1=\"936\" x2=\"442\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"608\" y1=\"936\" x2=\"608\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"732\" y1=\"936\" x2=\"732\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"816\" y1=\"936\" x2=\"816\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<text x=\"110\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\">FORMOL</text>'
      +'<text x=\"352\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">0</text>'
      +'<text x=\"525\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">PH:5-8</text>'
      +'<text x=\"670\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">HÀN THE</text>'
      +'<text x=\"774\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">0</text>'
      +'<text x=\"864\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">BQ</text>'
      +'<text x=\"928\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">0-10°C</text>'
      +'<text x=\"120\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\">NSX:</text>'
      +'<text x=\"360\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">'+nsx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"650\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\">GIỜ SX:</text>'
      +'<text x=\"866\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">'+gioSx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'</svg>';
  };
  const warehousePacSvg=kg=>{
    const escapeSvg=value=>String(value||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const product=String(selectedProduct?.name||'')
      .replace(/\s+/g,' ')
      .replace(/\s*,\s*\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'')
      .replace(/\s+\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'')
      .replace(/\s*,\s*PAC\b/ig,'')
      .trim().toUpperCase()||'SẢN PHẨM';
    const kgNum=formatKg(kg);
    const nsx=toVnDate(prodDate);
    const gioSx=String(prodTime||'').trim().replace(':','H').replace(/H00$/,'H');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">'
      +'<rect width="1000" height="1000" fill="white"/>'
      +'<g transform="translate(28 41) scale(0.95)">'
      +'<rect x="0" y="0" width="1000" height="1006" fill="white" stroke="#111" stroke-width="6"/>'
      +'<text x="430" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+escapeSvg(product)+'</text>'
      +'<text x="804" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+escapeSvg(kgNum)+'</text>'
      +'<text x="922" y="143" font-family="Times New Roman,serif" font-size="52" font-weight="700" text-anchor="middle">KG</text>'
      +'<text x="72" y="245" font-family="Times New Roman,serif" font-size="32" font-weight="700">SP CỦA: CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG</text>'
      +'<text x="72" y="329" font-family="Times New Roman,serif" font-size="32" font-weight="700">ĐC: Tổ 1, Phường Bá Xuyên, Tỉnh Thái Nguyên</text>'
      +'<text x="72" y="413" font-family="Times New Roman,serif" font-size="32" font-weight="700">SĐT : 0969709878</text>'
      +'<text x="510" y="413" font-family="Times New Roman,serif" font-size="32" font-weight="700">TP: Bột gạo, nước</text>'
      +'<text x="72" y="497" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 15°C-20°C. Đóng gói hở. HSD 12h trần nước sôi trước khi dùng.</text>'
      +'<text x="72" y="581" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 10°C-15°C. Đóng gói hở. HSD 24h trần nước sôi trước khi dùng.</text>'
      +'<text x="72" y="665" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 5°C-10°C. Đóng gói hở. HSD 36h trần nước sôi trước khi dùng.</text>'
      +'<text x="72" y="749" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 0°C-5°C. Đóng gói kín. HSD 72h trần nước sôi trước khi dùng.</text>'
      +'<text x="72" y="833" font-family="Times New Roman,serif" font-size="31" font-weight="700">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'
      +'<text x="105" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">Formol:</text>'
      +'<text x="292" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">0</text>'
      +'<text x="448" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">PH:</text>'
      +'<text x="560" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">5-8</text>'
      +'<text x="634" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">Hàn the:</text>'
      +'<text x="846" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">0</text>'
      +'<text x="140" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">NSX:</text>'
      +'<text x="335" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">'+escapeSvg(nsx)+'</text>'
      +'<text x="620" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">GIỜ SX:</text>'
      +'<text x="860" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">'+escapeSvg(gioSx)+'</text>'
      +'</g></svg>';
  };
  const sendToPrintAgent=async()=>{
    if(!selectedProduct){window.showToast('Chọn sản phẩm trước khi in tem','warn');return;}
    if(!productNeedsLabel){window.showToast('Sản phẩm này đang để không in tem trong danh mục sản phẩm','warn');return;}
    if(templateType==='100x100'&&!isPacProduct){window.showToast('Mẫu tem 100×100 chỉ áp dụng cho sản phẩm PAC','warn');return;}
    if(!labelWeights.length){
      window.showToast(templateType==='58x40'?'Nhập tổng kg cần in để tách tem':'Nhập số gói/số tem và kg mỗi tem để in','warn');
      return;
    }
    try{
      setSendingToAgent(true);
      const svgs=labelWeights.map(kg=>templateType==='100x100'?warehousePacSvg(kg):classicSvg(kg));
      await window.scfQueueLabelPrint({
        agentId:printAgentId,
        printerRole:printAgentPrinter,
        label:(selectedProduct?.name||'Sản phẩm')+' · '+labelWeights.length+' tem',
        title:'Tem '+(selectedProduct?.name||'SCF'),
        paperWidthMm:templateType==='100x100'?100:58,
        paperHeightMm:templateType==='100x100'?100:40,
        svgs,
        rotate180:templateType==='58x40'
      });
      window.scfSavePrintAgentSettings?.({agentId:printAgentId,printerRole:printAgentPrinter});
      window.showToast('Đã gửi '+labelWeights.length+' tem tới '+String(printAgentPrinter||'x350').toUpperCase()+' trên '+String(printAgentId||'SCF-PC-01').toUpperCase()+'.','success');
    }catch(error){
      console.error('SCF Print Agent:',error);
      window.showToast(error?.message||'Chưa gửi được lệnh in tới máy tính.','error');
    }finally{
      setSendingToAgent(false);
    }
  };
  const openLabelWindow=()=>{
    if(!selectedProduct){window.showToast('Chọn sản phẩm trước khi in tem','warn');return;}
    if(!productNeedsLabel){window.showToast('Sản phẩm này đang để không in tem trong danh mục sản phẩm','warn');return;}
    if(templateType==='100x100'&&!isPacProduct){window.showToast('Mẫu tem 100×100 chỉ áp dụng cho sản phẩm PAC','warn');return;}
    if(!labelWeights.length){
      window.showToast(templateType==='58x40'?'Nhập tổng kg cần in để tách tem':'Nhập số gói/số tem và kg mỗi tem để in','warn');
      return;
    }
    const isClassic58=templateType==='58x40';
    const width=templateType==='100x100'?'100mm':'58mm';
    const height=templateType==='100x100'?'100mm':'40mm';
    const contentWidth=templateType==='100x100'?'100mm':'58mm';
    const contentHeight=templateType==='100x100'?'100mm':'40mm';
    const labels=labelWeights.map((kg,idx)=>{
      const svg=templateType==='100x100'?warehousePacSvg(kg):classicSvg(kg);
      const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
      return '<section class=\"label'+(isClassic58?' classic58':'')+'\"><img class=\"label-img'+(isClassic58?' classic58-img':'')+'\" alt=\"Tem '+(idx+1)+'\" src=\"'+src+'\"></section>';
    }).join('');
    const popup=window.open('','_blank','width=1200,height=850');
    if(!popup){window.showToast('Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup.','warn');return;}
    popup.document.write('<html><head><title>In tem '+scfEscapePrintHtml(selectedProduct.name||'')+'</title><style>'
      +'@page{size:'+width+' '+height+';margin:0}'
      +'html,body{margin:0;padding:0;font-family:Arial,sans-serif;background:#eef3f0}'
      +'body{display:flex;min-height:100vh}'
      +'.summary{width:320px;box-sizing:border-box;padding:18px;background:#f6fbf8;border-right:1px solid #d8e4dc}'
      +'.summary h2{margin:0 0 10px;font-size:24px;color:#1f5134}'
      +'.summary .meta{font-size:13px;line-height:1.6;color:#23402f}'
      +'.summary .chips{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px}'
      +'.summary .chip{display:inline-flex;padding:4px 10px;border-radius:999px;background:#fff;border:1px solid #c9dbcf;font-size:12px;font-weight:600;color:#23402f}'
      +'.summary .note{margin-top:10px;font-size:12px;color:#56705f}'
      +'.labels{flex:1;display:flex;flex-direction:column;gap:0;padding:0}'
      +'.label{position:relative;display:block;width:'+width+';height:'+height+';overflow:hidden;break-after:page;page-break-after:always}'
      +'.label:last-child{break-after:auto;page-break-after:auto}'
      +'.label-img{display:block;width:'+width+';height:'+height+'}'
      +'.label.classic58{width:58mm;height:40mm}'
      +'.label-img.classic58-img{position:static;width:58mm;height:40mm;transform:none}'
      +'@media print{body{display:block;background:#fff}.summary{display:none}.labels{display:block}.label.classic58{width:58mm;height:40mm}.label-img.classic58-img{position:static;width:'+contentWidth+';height:'+contentHeight+';transform:rotate(180deg);transform-origin:center center}}'
      +'</style></head><body>'
      +'<aside class=\"summary\"><h2>Intem 420B</h2>'
      +'<div class=\"meta\"><b>Sản phẩm:</b> '+scfEscapePrintHtml(selectedProduct.name||'')+'<br><b>Mẫu tem:</b> '+scfEscapePrintHtml(templateType)+'<br><b>Ngày SX:</b> '+scfEscapePrintHtml(toVnDate(prodDate))+'<br><b>Giờ SX:</b> '+scfEscapePrintHtml(prodTime||'—')+'<br><b>Tổng số tem:</b> '+labelWeights.length+'<br><b>IP máy in:</b> '+scfEscapePrintHtml(printerIp||'Chưa lưu')+'</div>'
      +'<div class=\"chips\">'+labelWeights.map((kg,idx)=>'<span class=\"chip\">Tem '+(idx+1)+': '+formatKg(kg)+'kg</span>').join('')+'</div>'
      +'<div class=\"note\">Trình duyệt sẽ mở hộp in. Nếu máy 420B đã cài trên Windows, chọn đúng máy in trong hộp in để in ra tem.</div>'
      +'</aside><main class=\"labels\">'+labels+'</main></body></html>');
    popup.document.close();
    setTimeout(()=>popup.print(),350);
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-printer',style:{fontSize:20}}),'Intem'),
    false&&h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:14,flexWrap:'wrap',marginBottom:14}},
        h('div',null,
          h('div',{style:{fontSize:16,fontWeight:700,color:'var(--pri3)',marginBottom:4}},'Kết nối máy in nhiệt 420B qua Wi‑Fi'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',maxWidth:760}},'App sẽ quét nhanh các IP nội bộ thường dùng để tìm máy in có phản hồi. Nếu máy in không mở web nội bộ thì có thể không quét thấy, khi đó mình nhập IP tay rồi lưu lại.')
        ),
        h('div',{style:{background:'var(--bg2)',padding:'10px 12px',borderRadius:'var(--r)',minWidth:220}},
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:4}},'Máy in đang chọn'),
          h('div',{style:{fontWeight:700,color:'var(--pri3)'}},printerIp||'Chưa có IP'),
          printerState?.lastScanAt&&h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:4}},'Lần quét: '+printerState.lastScanAt)
        )
      ),
      h('div',{className:'g3'},
        h(F,{label:'IP máy in 420B'},
          h('input',{value:printerIp,onChange:e=>setPrinterIp(e.target.value),placeholder:'Ví dụ: 192.168.1.120'})
        ),
        h(F,{label:'IP tìm thấy'},
          h('select',{value:printerIp,onChange:e=>setPrinterIp(e.target.value)},
            h('option',{value:''},foundIps.length?'— Chọn IP đã quét —':'— Chưa có IP quét thấy —'),
            foundIps.map(ip=>h('option',{key:ip,value:ip},ip))
          )
        ),
        h(F,{label:'Trạng thái quét'},
          h('div',{style:{minHeight:40,padding:'8px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'#fff',fontSize:12,color:'var(--tx2)',lineHeight:1.45}},scanMsg)
        )
      ),
      h(Row,null,
        h('button',{onClick:scanPrinterIps,disabled:scanLoading,style:{padding:'8px 14px'}},h('i',{className:'ti ti-wifi',style:{fontSize:14}}),scanLoading?'Đang quét...':'Quét IP máy in'),
        h('button',{onClick:savePrinterIp,style:{padding:'8px 14px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu IP'),
        h('button',{onClick:openPrinterPage,disabled:!printerIp,style:{padding:'8px 14px'}},h('i',{className:'ti ti-world-www',style:{fontSize:14}}),'Mở trang máy in')
      )
    ),
    h('div',{className:'card'},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:14,flexWrap:'wrap',marginBottom:14}},
        h('div',null,
          h('div',{style:{fontSize:16,fontWeight:700,color:'var(--pri3)',marginBottom:4}},'Tạo tem thủ công'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',maxWidth:760}},'Chọn sản phẩm, nhập ngày SX, giờ SX và mẫu tem. Với tem 58x40, app sẽ tự tách số tem theo quy tắc của sản phẩm. Với tem 100x100, mình nhập số gói/số tem và kg mỗi tem.')
        ),
        h('div',{style:{background:'var(--bg2)',padding:'10px 12px',borderRadius:'var(--r)',minWidth:250}},
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:4}},'Tóm tắt nhanh'),
          h('div',{style:{fontWeight:700,color:'var(--pri3)'}},selectedProduct?.name||'Chưa chọn sản phẩm'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:4}},'Mẫu '+templateType+' · '+labelWeights.length+' tem')
        )
      ),
      h('div',{className:'g2'},
        h(F,{label:'Sản phẩm'},
          h('div',{style:{display:'flex',gap:6,marginBottom:7,flexWrap:'wrap'}},
            [['all','Tất cả'],['TP','TP'],['HH','HH']].map(([value,label])=>h('button',{key:value,type:'button',onClick:()=>chooseProductGroup(value),style:{padding:'5px 12px',borderRadius:999,border:'1px solid '+(productGroup===value?'var(--pri)':'var(--bd)'),background:productGroup===value?'var(--pri)':'#fff',color:productGroup===value?'#fff':'var(--tx)',fontWeight:600,cursor:'pointer'}},label))
          ),
          productGroup==='HH'&&h('select',{value:goodsGroupFilter,onChange:e=>chooseGoodsGroup(e.target.value),style:{marginBottom:7}},
            h('option',{value:'all'},'— Tất cả nhóm HH —'),
            goodsGroupOptions.map(group=>h('option',{key:group,value:group},group)),
            h('option',{value:'__ungrouped__'},'Chưa phân nhóm')
          ),
          h('input',{value:productSearch,onChange:e=>setProductSearch(e.target.value),onKeyDown:e=>{if(e.key==='Enter'&&filteredPrintableProducts[0]){e.preventDefault();setProductId(filteredPrintableProducts[0].id);}},placeholder:'Gõ mã hoặc tên sản phẩm...',style:{marginBottom:7}}),
          h('select',{value:productId,onChange:e=>setProductId(e.target.value)},
            h('option',{value:''},filteredPrintableProducts.length?'— Chọn sản phẩm —':'— Không tìm thấy sản phẩm —'),
            selectedOutsideFilter&&selectedProduct&&h('option',{value:selectedProduct.id},(selectedProduct.code?selectedProduct.code+' - ':'')+selectedProduct.name+' (đang chọn)'),
            filteredPrintableProducts.map(p=>h('option',{key:p.id,value:p.id},p.code?(p.code+' - '+p.name):p.name))
          ),
          h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:5}},filteredPrintableProducts.length+' sản phẩm phù hợp · Nhấn Enter để chọn kết quả đầu tiên')
        ),
        h(F,{label:'Mẫu tem'},
          h('select',{value:templateType,onChange:e=>setTemplateType(e.target.value)},
            h('option',{value:'58x40'},'58 x 40 mm'),
            h('option',{value:'100x100',disabled:!isPacProduct},'100 x 100 mm · PAC kho vận')
          )
        )
      ),
      h('div',{className:'g2'},
        h(F,{label:'Ngày sản xuất'},h('input',{type:'date',value:prodDate,onChange:e=>setProdDate(e.target.value)})),
        h(F,{label:'Giờ sản xuất'},h('input',{type:'time',value:prodTime,onChange:e=>setProdTime(e.target.value)}))
      ),
      !productNeedsLabel&&selectedProduct&&h('div',{style:{background:'#fff7ed',padding:'10px 12px',borderRadius:'var(--r)',fontSize:12,color:'#9A3412',marginBottom:'1rem'}},'Sản phẩm này đang để trạng thái Không in tem trong danh mục sản phẩm. Nếu muốn in, cần bật lại cờ in tem ở danh mục sản phẩm.'),
      templateType==='58x40'
        ?h('div',{className:'g2'},
          h(F,{label:'Tổng kg cần in'},h('input',{type:'number',min:0,step:'0.01',value:totalKg,onChange:e=>setTotalKg(e.target.value),disabled:!productNeedsLabel,placeholder:labelRule.pack?('Ví dụ: '+labelRule.pack*5+7):'Ví dụ: 57'})),
          h(F,{label:'Quy tắc tem đang áp dụng'},
            h('div',{style:{minHeight:40,padding:'8px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'#fff',fontSize:12,color:'var(--tx2)',lineHeight:1.45}},
              productNeedsLabel?(labelRule.pack+'kg/tem'+(labelRule.mergeSmallRemainder?' · gộp phần lẻ nhỏ':' · tách riêng phần lẻ')):'Sản phẩm không in tem'
            )
          )
        )
        :h('div',{className:'g2'},
          h(F,{label:'Số gói / số tem'},h('input',{type:'number',min:1,step:1,value:packQty,onChange:e=>setPackQty(e.target.value),disabled:!productNeedsLabel,placeholder:'Ví dụ: 14'})),
          h(F,{label:'Kg mỗi gói / tem'},h('input',{type:'number',min:0,step:'0.01',value:packWeight,onChange:e=>setPackWeight(e.target.value),disabled:!productNeedsLabel,placeholder:defaultPackWeight?String(defaultPackWeight):'Ví dụ: 5'}))
        ),
      h('div',{style:{background:'var(--bg2)',padding:'10px 12px',borderRadius:'var(--r)',fontSize:12,color:'var(--tx2)',marginBottom:'1rem'}},
        h('div',{style:{fontWeight:600,color:'var(--pri3)',marginBottom:6}},'Kết quả tách tem'),
        h('div',null,summaryLine),
        templateType==='100x100'&&defaultPackWeight>0&&h('div',{style:{marginTop:6}},'Khối lượng mặc định của sản phẩm: ',h('b',null,formatKg(defaultPackWeight)),'kg / ',selectedProduct?.unit||'gói')
      ),
      h('div',{className:'g2',style:{alignItems:'end'}},
        h(F,{label:'Mã SCF Print Agent trên máy tính'},
          h('input',{
            value:printAgentId,
            onChange:e=>setPrintAgentId(String(e.target.value||'').toUpperCase()),
            onBlur:()=>window.scfSavePrintAgentSettings?.({agentId:printAgentId}),
            placeholder:'SCF-PC-01'
          })
        ),
        h(F,{label:'Máy in nhận lệnh'},
          h('select',{
            value:printAgentPrinter,
            onChange:e=>{
              const value=e.target.value;
              setPrintAgentPrinter(value);
              window.scfSavePrintAgentSettings?.({agentId:printAgentId,printerRole:value});
            }
          },
            h('option',{value:'x350',disabled:templateType==='100x100'},'X350B · tem 58×40'),
            h('option',{value:'x420'},templateType==='100x100'?'X420B · tem 100×100':'X420B · tem 58×40'),
            h('option',{value:'canon',disabled:true},'Canon 2900 · giấy A4')
          )
        )
      ),
      h(Row,null,
        h('button',{className:'bp',onClick:sendToPrintAgent,disabled:sendingToAgent,style:{padding:'8px 20px'}},
          h('i',{className:'ti ti-device-desktop-up',style:{fontSize:15}}),
          sendingToAgent?'Đang gửi tem...':'Gửi in qua máy tính'
        ),
        h('button',{onClick:openLabelWindow,disabled:sendingToAgent,style:{padding:'8px 20px'}},
          h('i',{className:'ti ti-printer',style:{fontSize:15}}),'In trên thiết bị này'
        )
      )
    )
  );
}

function deliveryOrderDateKey(value){
  const raw=String(value??'').trim();
  let year,month,day;
  let m=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m){day=Number(m[1]);month=Number(m[2]);year=Number(m[3]);}
  else{
    m=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(!m)return null;
    year=Number(m[1]);month=Number(m[2]);day=Number(m[3]);
  }
  const date=new Date(year,month-1,day);
  if(date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day)return null;
  return year*10000+month*100+day;
}
function deliveryOrderRecordKeys(items,identityCache){
  const seen=new Map();
  return (items||[]).map(order=>{
    let identity=identityCache?.get(order);
    if(identity===undefined){identity=[
      order?.id,
      order?.deliveryDate,
      order?.deliveryTime,
      order?.pointId||order?.pointName||order?.address,
      order?.customerId||order?.customer,
      order?.createdAt
    ].map(value=>String(value??'').trim()).join('\u001f');
    if(order&&typeof order==='object')identityCache?.set(order,identity);}
    const occurrence=(seen.get(identity)||0)+1;
    seen.set(identity,occurrence);
    return 'delivery-order\u001f'+identity+'\u001f'+occurrence;
  });
}
function cleanDeliveryOrderRecord(order){
  const clean={};
  Object.entries(order||{}).forEach(([key,value])=>{if(!String(key).startsWith('_'))clean[key]=value;});
  return clean;
}
function deliveryOrderStatusForTrip(order,trip){
  if(!trip||String(order?.tripId||'')!==String(trip.id||'')||order?.status!=='pending')return order?.status;
  return trip.status==='active'?'delivering':'assigned';
}
function deliveryProductTextWidth(text){
  const value=String(text||'');
  const fallback=Array.from(value).reduce((width,char)=>width+(/[MWĐƯƠÔ]/i.test(char)?10:/[il1.,' ]/i.test(char)?4.5:7.5),0);
  try{
    if(typeof document==='undefined'||typeof getComputedStyle!=='function')return fallback;
    const canvas=deliveryProductTextWidth._canvas||(deliveryProductTextWidth._canvas=document.createElement('canvas'));
    const context=canvas.getContext('2d');
    if(!context)return fallback;
    const rootStyle=getComputedStyle(document.documentElement);
    const fontStyle=rootStyle.getPropertyValue('--ui-table-style').trim()||'normal';
    const fontWeight=rootStyle.getPropertyValue('--ui-table-weight').trim()||'400';
    const fontSize=rootStyle.getPropertyValue('--ui-table-size').trim()||'13px';
    const fontFamily=rootStyle.getPropertyValue('--ui-font-family').trim()||'sans-serif';
    context.font=[fontStyle,fontWeight,fontSize,fontFamily].join(' ');
    return context.measureText(value).width;
  }catch(_err){return fallback;}
}
function currentISOWeekInput(date=new Date()){
  const target=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const day=target.getDay()||7;
  target.setDate(target.getDate()+4-day);
  const weekYear=target.getFullYear();
  const yearStart=new Date(weekYear,0,1);
  const week=Math.ceil((((target-yearStart)/86400000)+1)/7);
  return weekYear+'-W'+String(week).padStart(2,'0');
}
function isoWeekDateKeyRange(value){
  const m=String(value??'').match(/^(\d{4})-W(\d{2})$/);
  if(!m)return null;
  const year=Number(m[1]),week=Number(m[2]);
  if(week<1||week>53)return null;
  const jan4=new Date(year,0,4);
  const jan4Day=jan4.getDay()||7;
  const monday=new Date(year,0,4-(jan4Day-1)+(week-1)*7);
  const sunday=new Date(monday);sunday.setDate(monday.getDate()+6);
  const key=d=>d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
  return [key(monday),key(sunday)];
}

function mobileDeliveryQty(line,field){
  if(field==='qtyProd')return numFmt(line?.qtyProd??line?.qty??line?.quantity??0);
  if(field==='qtyInvoice')return numFmt(line?.qtyInvoice??line?.qtyProd??line?.qty??line?.quantity??0);
  return numFmt(line?.qtyDelivered!==undefined&&line?.qtyDelivered!==null&&line?.qtyDelivered!==''?line.qtyDelivered:(line?.qtyProd??line?.qty??line?.quantity??line?.qtyInvoice??0));
}
function deliveryMatchesTripGroup(trip,group){
  return !group||group==='all'||!!trip&&scfTripImageGroup(trip)===group;
}
function mergeDeliveryLineQuantity(live,base,lineIndex,field,raw,allowDelivered=false){
  const label={qtyProd:'SL đặt',qtyInvoice:'SL HĐ',...(allowDelivered?{qtyDelivered:'SL giao'}:{})}[field];
  if(!label)throw new Error('Không được sửa cột số lượng này.');
  const input=String(raw??'').trim().replace(',','.');
  if(!/^\d+(?:\.\d+)?$/.test(input)||!Number.isFinite(Number(input)))throw new Error(label+' phải là số từ 0 trở lên.');
  if(!live||String(live.id)!==String(base.id))throw new Error('Đơn không còn tồn tại. Hãy tải lại danh sách.');
  const old=base.lines?.[lineIndex];
  if(!old)throw new Error('Không tìm thấy dòng sản phẩm.');
  const matches=(live.lines||[]).map((line,index)=>({line,index})).filter(({line,index})=>old.id?String(line.id)===String(old.id):index===lineIndex&&!line.id);
  if(matches.length!==1)throw new Error('Dòng sản phẩm đã thay đổi. Hãy mở lại ô số lượng.');
  const {line,index}=matches[0];
  if(String(line.productId||'')!==String(old.productId||'')||String(line.productName||'')!==String(old.productName||''))throw new Error('Sản phẩm đã thay đổi. Hãy mở lại ô số lượng.');
  const value=Number(input),before=mobileDeliveryQty(old,field),current=mobileDeliveryQty(line,field);
  if(current===value)return {order:live,changes:[]};
  if(current!==before)throw new Error('Số lượng đã được sửa ở nơi khác. Hãy mở lại ô số lượng trước khi lưu.');
  return {order:{...live,lines:live.lines.map((item,i)=>i===index?{...item,[field]:value}:item)},changes:[(line.productName||'Sản phẩm')+' · '+label+': '+before+' → '+value]};
}
function mergeDeliveryLineNote(live,base,lineIndex,raw){
  if(!live||String(live.id)!==String(base.id))throw new Error('Đơn không còn tồn tại. Hãy tải lại danh sách.');
  const note=String(raw??'').trim();
  let old=base,line=live,index=-1;
  if(lineIndex!==null){
    old=base.lines?.[lineIndex];
    if(!old)throw new Error('Không tìm thấy dòng sản phẩm.');
    const matches=(live.lines||[]).map((line,index)=>({line,index})).filter(({line,index})=>old.id?String(line.id)===String(old.id):index===lineIndex&&!line.id);
    if(matches.length!==1)throw new Error('Dòng sản phẩm đã thay đổi. Hãy mở lại ô chú ý.');
    ({line,index}=matches[0]);
    if(String(line.productId||'')!==String(old.productId||'')||String(line.productName||'')!==String(old.productName||''))throw new Error('Sản phẩm đã thay đổi. Hãy mở lại ô chú ý.');
  }
  const before=String(old.note||''),current=String(line.note||'');
  if(current===note)return {order:live,changes:[]};
  if(current!==before)throw new Error('Chú ý đã được sửa ở nơi khác. Hãy mở lại ô trước khi lưu.');
  const order=lineIndex===null?{...live,note}:{...live,lines:live.lines.map((item,i)=>i===index?{...item,note}:item)};
  return {order,changes:[(lineIndex===null?'Đơn hàng':line.productName||'Sản phẩm')+' · Chú ý: '+(before||'—')+' → '+(note||'—')]};
}
// Move only between visible, permitted editable cells; use stable line identities.
function scfDeliveryGridMove(input,key,reverse=false){
  const table=input?.closest?.('.delivery-orders-table');if(!table)return;
  const cells=[...table.querySelectorAll('input[data-grid-field]')].filter(node=>!node.disabled&&node.getClientRects().length);
  const index=cells.indexOf(input),field=input.dataset.gridField;
  const next=key==='Enter'?cells.slice(index+1).find(node=>node.dataset.gridField===field):cells[index+(reverse?-1:1)];
  if(!next)return;
  const identity=next.dataset.gridIdentity;
  requestAnimationFrame(()=>{const target=[...table.querySelectorAll('input[data-grid-identity]')].find(node=>node.dataset.gridIdentity===identity);target?.focus();target?.select();});
}
function deliveryQuantityIcon(kind){
  const paths={pencil:'M16 4l4 4M4 20l4-1L20 7a2.83 2.83 0 0 0-4-4L4 15z',check:'M5 12l4 4L19 6'};
  return h('svg',{viewBox:'0 0 24 24',width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true,focusable:'false'},h('path',{d:paths[kind]}));
}
function DeliveryGridCell({order,lineIndex,field,canEdit,onSave,note=false}){
  const line=lineIndex===null?order:order.lines?.[lineIndex];
  const timeCell=field==='deliveryTime';
  const current=timeCell?String(order.deliveryTime||''):note?String(line?.note||''):String(mobileDeliveryQty(line,field));
  const [editing,setEditing]=useState(false),[error,setError]=useState('');
  const inputRef=useRef(null),baseRef=useRef(null),busy=useRef(false),draft=useRef(current);
  useEffect(()=>{if(!baseRef.current&&inputRef.current)inputRef.current.value=current;},[current]);
  const begin=()=>{if(!canEdit||!line||baseRef.current)return;baseRef.current={...order,lines:(order.lines||[]).map(item=>({...item}))};draft.current=current;setEditing(true);setError('');};
  const cancel=()=>{baseRef.current=null;draft.current=current;if(inputRef.current)inputRef.current.value=current;setEditing(false);setError('');};
  const commit=()=>{
    if(!baseRef.current||busy.current)return true;
    busy.current=true;
    try{const base=baseRef.current,value=inputRef.current?.value??draft.current;if(note)onSave(base,lineIndex,value);else onSave(base,lineIndex,field,value);baseRef.current=null;setEditing(false);setError('');return true;}
    catch(error){setError(error.message||'Chưa lưu được ô.');return false;}finally{busy.current=false;}
  };
  const label=timeCell?'Giờ giao':note?'Chú ý':field==='qtyProd'?'SL đặt':field==='qtyDelivered'?'SL giao':'SL HĐ';
  return h('div',{className:note?'delivery-line-note-editor':'delivery-quantity-cell'},
    h('input',{ref:inputRef,type:'text',inputMode:note||timeCell?undefined:'decimal',defaultValue:current,readOnly:!canEdit,
      className:'delivery-grid-input'+(editing?' editing':''),'data-grid-field':canEdit?(note?'note':field):undefined,
      'data-grid-identity':JSON.stringify([order.id,line?.id??lineIndex,note?'note':field]),
      'aria-label':label+' '+(line?.productName||order.pointName||order.id),'aria-invalid':!!error,
      'data-scf-action':canEdit?'write':'view',title:canEdit?'Nhập trực tiếp · Enter xuống dòng · Tab sang ô · Esc bỏ sửa':label,
      onFocus:begin,onClick:begin,onChange:event=>{draft.current=event.target.value;},onBlur:()=>{commit();},
      onKeyDown:event=>{if(event.isComposing||event.nativeEvent?.isComposing)return;
        if(event.key==='Escape'){event.preventDefault();cancel();event.target.blur();}
        else if(event.key==='Enter'||event.key==='Tab'){event.preventDefault();const input=event.target;if(commit())scfDeliveryGridMove(input,event.key,event.shiftKey);}
      }}),
    error&&h('small',{role:'alert',className:'delivery-quantity-error'},error));
}
function DeliveryLineNoteCell(props){return h(DeliveryGridCell,{...props,note:true,field:'note'});}
function DeliveryQuantityCell(props){return h(DeliveryGridCell,props);}
function mobileDeliveryDate(value){
  const parts=String(value||'').split('/');return parts.length===3?parts.slice(0,2).join('/'):value||'—';
}
function mobileDeliveryTime(value){
  const raw=String(value||'').trim(),normalized=/^\d{1,2}:\d{2}$/.test(raw)?raw:normalizeTimeInput(raw),match=String(normalized).match(/^(\d{1,2}):(\d{2})$/);
  return match&&Number(match[1])<24&&Number(match[2])<60?match[1].padStart(2,'0')+':'+match[2]:'';
}
function scfDeliveryLineFill(trip,order,line,product,prodCats){
  const row=['','',line?.productName||product?.name||'',0,'',order?.deliveryTime||'',''];
  row.isGoods=isGoodsProduct(product||line,prodCats||[]);
  const fill=scfTripSummaryRowFill(trip,row,'#ffffff');
  return fill==='#ffff00'?'#ffeca6':fill==='#f4af86'?'#f8cfaf':'#ffffff';
}

const scfDeliveryHoverRows=new WeakMap();
function scfDeliveryOrderLineFill({trip,date,time,productName,tone,goods,baseFill}){
  if(scfTripProductTone(productName)==='yellow')return '#ffff00';
  const name=normalizeLookupText(productName).replace(/[^a-z0-9]+/g,' ').trim();
  let emphasized=/(?:^|\s)(?:banh\s+)?pho\s+cuon(?:\s|$)/.test(name);
  const clock=mobileDeliveryTime(time),shift=scfTripImageShiftName(trip||{});
  if(clock&&trip){
    const [hour,minute]=clock.split(':').map(Number),minutes=hour*60+minute;
    const day=value=>{const key=scfTripDateKey(value);return key?Date.UTC(+key.slice(0,4),+key.slice(4,6)-1,+key.slice(6,8))/86400000:null;};
    const orderDay=day(date),tripDay=day(trip.deliveryDate);
    const relative=orderDay!==null&&tripDay!==null?(orderDay-tripDay)*1440+minutes:minutes>=720&&['SST1','VPDEM'].includes(shift)?minutes-1440:minutes;
    if(shift==='SST1')emphasized=emphasized||relative< -120||relative>270;
    if(shift==='VPDEM')emphasized=emphasized||relative< -90;
    if(['SSS1','SSS2','VPNGAY'].includes(shift))emphasized=emphasized||relative<540;
  }
  if(emphasized)return tone==='gray'?'#78acd8':'#ea946a';
  return goods?(tone==='gray'?'#9bc2e6':'#f4b084'):baseFill;
}
function scfMarkDeliveryOrder(event,active){
  const row=event.currentTarget,key=row.dataset.deliveryOrderKey;
  if(!active&&event.relatedTarget?.closest?.('[data-delivery-order-key]')?.dataset.deliveryOrderKey===key)return;
  const body=row.closest('tbody');
  if(!body)return;
  const previous=scfDeliveryHoverRows.get(body)||[];
  if(!active&&previous.length&&previous[0].dataset.deliveryOrderKey!==key)return;
  previous.forEach(item=>item.classList.toggle('delivery-order-hover',false));
  const marked=[];
  if(active){
    let first=row;
    while(first.previousElementSibling?.dataset.deliveryOrderKey===key)first=first.previousElementSibling;
    for(let item=first;item&&item.dataset.deliveryOrderKey===key;item=item.nextElementSibling){item.classList.toggle('delivery-order-hover',true);marked.push(item);}
  }
  scfDeliveryHoverRows.set(body,marked);
}
function DeliveryMobileEditableField({label,value,type='time',disabled,onConfirm}){
  const [editing,setEditing]=useState(false),[draft,setDraft]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState(''),[commit,setCommit]=useState(null);
  const begin=()=>{setCommit(()=>onConfirm);setDraft(type==='date'?toIsoDate(value):mobileDeliveryTime(value));setError('');setEditing(true);};
  const confirm=async()=>{
    if(disabled||saving)return;
    if(!draft){setError('Hãy nhập '+label.toLowerCase()+'.');return;}
    setSaving(true);setError('');
    try{if(await (commit||onConfirm)(type==='date'?vnDateFromISO(draft):draft)!==false)setEditing(false);else setError('Chưa xác nhận được. Bấm tích xanh để thử lại.');}
    catch(error){setError(error.message||'Chưa lưu được thông tin.');}finally{setSaving(false);}
  };
  return h('div',{className:'delivery-card-field'},h('span',null,label),h('div',{className:'delivery-mobile-edit-value'},
    editing?h('input',{type,value:draft,disabled:disabled||saving,'aria-label':label,onChange:e=>setDraft(e.target.value),onKeyDown:e=>{if(e.key==='Enter'){e.preventDefault();confirm();}if(e.key==='Escape'&&!saving)setEditing(false);}}):h('b',null,type==='date'?mobileDeliveryDate(value):value||'—'),
    !disabled&&h('button',{type:'button',className:editing?'delivery-mobile-confirm':'bi','aria-label':(editing?'Xác nhận ':'Sửa ')+label,disabled:saving,onClick:editing?confirm:begin},h('i',{className:saving?'ti ti-loader-2 spin':editing?'ti ti-check':'ti ti-pencil'})),
    editing&&h('button',{type:'button',className:'bi',disabled:saving,'aria-label':'Hủy sửa '+label,onClick:()=>{setEditing(false);setError('');}},'×')),
    error&&h('small',{role:'alert',className:'delivery-editor-error'},error));
}
function DeliveryMobileTripControls({trips,trip,mode,defaultDate,disabled,modeDisabled,onModeChange,onConfirm}){
  const [editing,setEditing]=useState(''),[date,setDate]=useState(manualTripDateToISO(trip?.deliveryDate||defaultDate)),[tripId,setTripId]=useState(trip?.id||''),[saving,setSaving]=useState(false),[error,setError]=useState('');
  useEffect(()=>{if(!editing&&!saving){setDate(manualTripDateToISO(trip?.deliveryDate||defaultDate));setTripId(trip?.id||'');}},[trip?.id,trip?.deliveryDate,defaultDate,editing,saving]);
  const options=filterManualTripOptions(trips,date,'');
  const begin=field=>{setDate(manualTripDateToISO(trip?.deliveryDate||defaultDate));setTripId(trip?.id||'');setError('');setEditing(field);};
  const confirm=async()=>{
    if(disabled||saving)return;
    if(!date||!options.some(trip=>String(trip.id)===String(tripId))){setError('Hãy chọn ngày chuyến và ca giao trong ngày đó.');return;}
    setSaving(true);setError('');
    try{if(await onConfirm(tripId)){setEditing('');}else setError('Máy chủ chưa xác nhận. Bấm tích xanh để thử lại.');}catch(error){setError(error.message||'Chưa đổi được chuyến.');}finally{setSaving(false);}
  };
  const action=field=>!disabled&&h('button',{type:'button',className:editing===field?'delivery-mobile-confirm':'bi',disabled:saving,'aria-label':(editing===field?'Xác nhận ':'Sửa ')+(field==='date'?'ngày chuyến':'ca giao và người giao'),onClick:editing===field?confirm:()=>begin(field)},h('i',{className:saving&&editing===field?'ti ti-loader-2 spin':editing===field?'ti ti-check':'ti ti-pencil'}));
  return h('div',{className:'delivery-mobile-trip-editor'},
    h('div',{className:'delivery-mobile-mode'},h('span',null,'Cách xếp chuyến'),h(DeliveryTripModeSwitch,{mode,disabled:disabled||modeDisabled||saving||!!editing,onChange:onModeChange})),
    h('div',{className:'delivery-card-field'},h('span',null,'Ngày chuyến'),h('div',{className:'delivery-mobile-edit-value'},editing?h('input',{type:'date',value:date,disabled:saving,'aria-label':'Ngày chuyến giao hàng',onChange:e=>{setDate(e.target.value);setTripId('');setError('');}}):h('b',null,mobileDeliveryDate(trip?.deliveryDate||defaultDate)),action('date'))),
    h('div',{className:'delivery-card-field'},h('span',null,'Ca giao – Người giao'),h('div',{className:'delivery-mobile-edit-value'},editing?h('select',{value:tripId,disabled:saving,'aria-label':'Ca giao và lái xe',onChange:e=>{setTripId(e.target.value);setError('');}},h('option',{value:''},'Chọn chuyến trong ngày'),options.map(trip=>h('option',{key:trip.id,value:trip.id},manualTripText(trip)))):h('b',null,manualTripText(trip)),action('trip'))),
    editing&&h('button',{type:'button',className:'bi',disabled:saving,onClick:()=>{setEditing('');setError('');}},'Hủy sửa'),error&&h('div',{role:'alert',className:'delivery-editor-error'},error));
}
function DeliveryMobileProductionRow({order,plan,index,canEdit,onSave}){
  const [saving,setSaving]=useState(false),[error,setError]=useState(''),[pendingMode,setPendingMode]=useState('');
  const manual=!!plan.manual||!!plan.line?.shiftOverride||order.prodShiftAssignMode==='manual';
  const disabled=!canEdit||saving||!onSave;
  const toggle=async()=>{if(disabled)return;setSaving(true);setError('');try{const desired=pendingMode||(manual?'auto':'manual');if(await onSave(order,index,plan,'mode',desired)===false){setPendingMode(desired);setError('Chưa xác nhận được thay đổi. Bấm lại để thử.');}else setPendingMode('');}catch(error){setError(error.message);}finally{setSaving(false);}};
  return h('div',{className:'delivery-card-production-row'},
    h('div',{className:'delivery-mobile-mode'},h('b',null,plan.productName||plan.line?.productName||'Thông tin SX'),h('button',{type:'button',className:'delivery-trip-mode-switch','data-mode':manual?'manual':'auto',role:'switch','aria-label':'Sản xuất tự động '+(plan.productName||''),'aria-checked':!manual,disabled,onClick:toggle},saving?'…':manual?'BT':'TĐ')),
    h('div',{className:'delivery-card-info-grid'},... [['prodDate','Ngày SX','date'],['prodTime','Giờ SX','time'],['labelDate','Ngày tem','date'],['labelTime','Giờ tem','time']].map(([field,label,type])=>field==='prodTime'&&plan.prodWorkShiftId?h('div',{key:field},h('b',null,'Ca SX'),h('span',null,scfDeliveryShiftLabel(plan.shift?.name)||'—')):h(DeliveryMobileEditableField,{key:field,label,type,value:plan[field]||'',disabled,onConfirm:value=>onSave(order,index,plan,field,value)}))),error&&h('div',{role:'alert',className:'delivery-editor-error'},error));
}
function scfMergeMobileProduction(live,base,index,plan,field,value,livePlans,automatic){
  if(!live||String(live.id)!==String(base.id))throw new Error('Đơn không còn tồn tại.');
  const before=base.lines?.[index];
  const target=(live.lines||[]).findIndex((line,i)=>before?.id?String(line.id)===String(before.id):i===index);
  if(!before||target<0||String(live.lines[target].productId||'')!==String(before.productId||''))throw new Error('Dòng sản phẩm đã thay đổi. Hãy mở lại đơn.');
  const timing=['prodDate','prodTime','labelDate','labelTime'];
  if(field!=='mode'&&!timing.includes(field))throw new Error('Thông tin SX không hợp lệ.');
  if(field==='mode'&&!['auto','manual'].includes(value))throw new Error('Chế độ SX không hợp lệ.');
  if(field!=='mode'){
    if(field.endsWith('Date')){
      const match=String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/),date=match&&new Date(+match[3],+match[2]-1,+match[1]);
      if(!match||date.getFullYear()!==+match[3]||date.getMonth()!==+match[2]-1||date.getDate()!==+match[1])throw new Error('Ngày không hợp lệ.');
    }else{value=mobileDeliveryTime(value);if(!value)throw new Error('Giờ không hợp lệ.');}
    if(String(live.lines[target][field]||'')!==String(before[field]||'')&&String(live.lines[target][field]||'')!==String(value))throw new Error('Thông tin này vừa được sửa ở nơi khác. Hãy mở lại trước khi lưu.');
  }
  const currentPlan=livePlans.find(item=>item.line?.id?String(item.line.id)===String(live.lines[target].id):item.index===target)||plan;
  const sameMode=(field==='mode'&&(value==='manual')===(!!live.lines[target].shiftOverride||live.prodShiftAssignMode==='manual'));
  if(sameMode)return live;
  let lines=live.lines;
  if(live.prodShiftAssignMode==='manual')lines=live.lines.map((line,i)=>{const current=livePlans.find(item=>item.line?.id?String(item.line.id)===String(line.id):item.index===i)||{};return {...line,shiftOverride:true,...Object.fromEntries(timing.map(key=>[key,current[key]||line[key]||'']))};});
  const old=lines[target];
  const next=field==='mode'&&value==='auto'?{...old,shiftOverride:false,...automatic,productionScheduleResetAt:new Date().toISOString()}:{...old,...(!old.shiftOverride?Object.fromEntries(timing.map(key=>[key,currentPlan[key]||''])):{}),shiftOverride:true,...(field==='mode'?{}:{[field]:value})};
  if(live.prodShiftAssignMode!=='manual'&&JSON.stringify(next)===JSON.stringify(old))return live;
  return {...live,...(live.prodShiftAssignMode==='manual'?{prodShiftAssignMode:'auto',prodShiftId:'',prodDate:'',prodTime:'',labelDate:'',labelTime:'',productionScheduleResetAt:new Date().toISOString()}:{}),lines:lines.map((line,i)=>i===target?next:line)};
}

function DeliveryMobileOrderCard({order,rowKey,trip,tripMode,preferredTripDate,preferredTripShiftName,plans,firstPlan,canEdit,onEdit,onSaveQuantity,onSaveProduction,productionLocked,renderTripControls,selection,canEditDelivered=false,catalogOrder,onSaveCatalog,pointChoices=[],productChoices=[],catalogEditable=false}){
  const[tripOpen,setTripOpen]=useState(false),[productionOpen,setProductionOpen]=useState(false);
  const field=(label,value)=>h('div',{className:'delivery-card-field'},h('span',null,label),h('b',null,value||'—'));
  const timingRows=plans?.length?plans:(firstPlan?[firstPlan]:[{}]);
  const sectionId=encodeURIComponent(String(rowKey||order.id));
  const tripControls=tripOpen?renderTripControls?.():null;
  const toggle=(section,label,isOpen,setOpen)=>h('button',{type:'button',className:'delivery-card-toggle','data-scf-action':'view','aria-expanded':isOpen,'aria-controls':'delivery-'+section+'-'+sectionId,onClick:()=>setOpen(value=>!value)},
    h('span',null,label),h('span',null,isOpen?'Ẩn':'Hiện',h('i',{className:'ti ti-chevron-'+(isOpen?'up':'down'),'aria-hidden':true}))
  );
  return h('article',{className:'delivery-order-mobile-card','aria-label':'Đơn giao '+(order.pointName||order.customer||'')+' '+(order.deliveryDate||'')+' '+(order.deliveryTime||'')},
    h('section',{className:'delivery-card-primary'},
      h('div',{className:'delivery-card-section-head'},h('h3',null,'1. Thông tin đơn hàng'),canEdit&&h('button',{type:'button',className:'delivery-card-edit','data-scf-action':'write',onClick:onEdit,'aria-label':'Sửa thông tin đơn hàng '+(order.pointName||'')},h('i',{className:'ti ti-pencil'}),' Sửa')),
      h('div',{className:'delivery-card-location'},selection,order.warehouseMerged?h('b',null,order.pointName||order.customer||'—'):h(DeliveryCatalogCell,{order:catalogOrder||order,lineIndex:0,kind:'point',label:order.pointName||order.customer||'—',choices:pointChoices,canEdit:false,onSave:onSaveCatalog})),
      h('div',{className:'delivery-card-dates'},field('Ngày giao',mobileDeliveryDate(order.deliveryDate)),field('Giờ giao',order.deliveryTime)),
      h('div',{className:'delivery-card-products'},(order.lines||[]).length?(order.lines||[]).map((line,index)=>h('div',{key:line.id||index,className:'delivery-card-product'},
        order.warehouseMerged&&h(DeliveryCatalogCell,{order:catalogOrder||order,lineIndex:index,kind:'point',label:line.warehouseSourcePointName||order.pointName||'—',choices:pointChoices,canEdit:false,onSave:onSaveCatalog}),
        h('div',{className:'delivery-card-product-name'},h(DeliveryCatalogCell,{order:catalogOrder||order,lineIndex:index,kind:'product',label:line.productName||'Sản phẩm',choices:productChoices,canEdit:catalogEditable,onSave:onSaveCatalog}),line.unit&&h('span',null,' ('+line.unit+')')),
        h('div',{className:'delivery-card-quantities'},... [['qtyProd','SL đặt'],['qtyInvoice','SL HĐ'],['qtyDelivered','SL giao']].map(([key,label])=>key==='qtyDelivered'&&!canEditDelivered?field(label,mobileDeliveryQty(line,key).toLocaleString('vi-VN',{maximumFractionDigits:2})):h('div',{key,className:'delivery-card-field'},h('span',null,label),h(DeliveryQuantityCell,{order,lineIndex:index,field:key,canEdit:canEdit&&!window.__SCF_ACCESS_CONTEXT?.readOnly,onSave:onSaveQuantity})))),
        h('div',{className:'delivery-card-field',style:{marginTop:8,whiteSpace:'pre-wrap'}},h('span',null,'Chú ý'),h('b',null,String(line.note||'').trim()||'—'))
      )):h('div',{className:'delivery-card-empty'},'Chưa có sản phẩm')),
      String(order.note||'').trim()&&h('div',{className:'delivery-card-field',style:{marginTop:10,whiteSpace:'pre-wrap'}},h('span',null,'Chú ý đơn hàng'),h('b',null,order.note))
    ),
    h('section',{className:'delivery-card-secondary'},toggle('trip','2. Thông tin chuyến giao',tripOpen,setTripOpen),
      tripOpen&&h('div',{id:'delivery-trip-'+sectionId,className:'delivery-card-section-body'},
        !tripControls&&h('div',{className:'delivery-card-info-grid'},field('Ngày chuyến',mobileDeliveryDate(trip?.deliveryDate||preferredTripDate)),field('Ca giao',trip?.shiftName||preferredTripShiftName),field('Người giao',trip?.driverName||'Chưa có lái xe'),field('Cách xếp',tripMode==='manual'?'BT · Bằng tay':'TĐ · Tự động')),
        tripControls
      )
    ),
    h('section',{className:'delivery-card-secondary'},toggle('production','3. Thông tin sản xuất',productionOpen,setProductionOpen),
      productionOpen&&h('div',{id:'delivery-production-'+sectionId,className:'delivery-card-section-body'},timingRows.map((plan,index)=>h(DeliveryMobileProductionRow,{key:plan.line?.id||index,order,plan,index:plan.line?.id?(order.lines||[]).findIndex(line=>String(line.id)===String(plan.line.id)):index,canEdit:canEdit&&!productionLocked&&!window.__SCF_ACCESS_CONTEXT?.readOnly,onSave:onSaveProduction})))
    )
  );
}
function mobileDeliveryOrderDraft(order){
  return {...order,deliveryTime:mobileDeliveryTime(order.deliveryTime),lines:(order.lines||[]).map(line=>({...line,qtyProd:String(mobileDeliveryQty(line,'qtyProd')),qtyInvoice:String(mobileDeliveryQty(line,'qtyInvoice')),qtyDelivered:String(mobileDeliveryQty(line,'qtyDelivered'))}))};
}
function mergeMobileDeliveryOrder(live,base,draft,canEditDelivered){
  if(!live||String(live.id)!==String(base.id))throw new Error('Đơn không còn tồn tại. Hãy tải lại danh sách.');
  scfAssertDeliveryIdentityLocked(base,draft);
  const fields=['deliveryTime'];
  const changes=[],next={...live};let scheduleChanged=false;
  fields.forEach(key=>{
    const before=key==='deliveryTime'?mobileDeliveryTime(base[key]):String(base[key]??'');
    const after=key==='deliveryTime'?mobileDeliveryTime(draft[key]):String(draft[key]??'');
    if(after===before)return;
    const current=key==='deliveryTime'?mobileDeliveryTime(live[key]):String(live[key]??'');
    if(current!==before)throw new Error('Thông tin đơn đã được sửa ở nơi khác. Hãy mở lại trước khi lưu.');
    next[key]=after;scheduleChanged=true;changes.push(key+': '+(before||'—')+' → '+(after||'—'));
  });
  const dateIso=toIsoDate(next.deliveryDate),dateParts=dateIso.split('-').map(Number),dateCheck=new Date(dateParts[0],dateParts[1]-1,dateParts[2]);
  const validDate=dateIso&&dateCheck.getFullYear()===dateParts[0]&&dateCheck.getMonth()===dateParts[1]-1&&dateCheck.getDate()===dateParts[2];
  if(!validDate||!mobileDeliveryTime(next.deliveryTime)||!next.customerId||!next.pointName)throw new Error('Hãy chọn ngày, địa điểm và giờ giao hợp lệ.');
  const labels={qtyProd:'SL đặt',qtyInvoice:'SL HĐ',qtyDelivered:'SL giao'};
  next.lines=(live.lines||[]).map((line,index)=>{
    const baseIndex=(base.lines||[]).findIndex((item,i)=>line.id?String(item.id)===String(line.id):i===index&&!item.id);
    if(baseIndex<0)return line;
    const old=base.lines[baseIndex],edited=draft.lines?.[baseIndex];if(!edited)return line;
    let output=line;
    ['qtyProd','qtyInvoice','qtyDelivered'].forEach(key=>{
      const raw=String(edited[key]??'').trim(),normalized=raw.replace(',','.');
      if(!/^\d+(?:\.\d+)?$/.test(normalized)||!Number.isFinite(Number(normalized)))throw new Error(labels[key]+' phải là số từ 0 trở lên.');
      const value=Number(normalized),before=mobileDeliveryQty(old,key);
      if(value===before)return;
      if(key==='qtyDelivered'&&!canEditDelivered)throw new Error('Tài khoản chưa có quyền nhập số lượng thực giao.');
      if(mobileDeliveryQty(line,key)!==before||String(line.productId||'')!==String(old.productId||''))throw new Error('Số lượng đã được sửa ở nơi khác. Hãy mở lại đơn trước khi lưu.');
      output={...output,[key]:value};changes.push((line.productName||'Sản phẩm')+' · '+labels[key]+': '+before+' → '+value);
    });
    return output;
  });
  // A removed line may not silently discard edits made in the open form.
  (base.lines||[]).forEach((line,index)=>{
    const exists=(live.lines||[]).some((item,i)=>line.id?String(item.id)===String(line.id):i===index&&!item.id);
    if(!exists&&['qtyProd','qtyInvoice','qtyDelivered'].some(key=>numFmt(draft.lines?.[index]?.[key])!==mobileDeliveryQty(line,key)))throw new Error('Một sản phẩm đã bị bỏ khỏi đơn. Hãy mở lại trước khi lưu.');
  });
  return {order:next,changes,scheduleChanged};
}
function DeliveryMobileOrderEditor({order,customers,canEditDelivered,onSave,onClose}){
  const[draft,setDraft]=useState(()=>mobileDeliveryOrderDraft(order));
  const[query,setQuery]=useState(order.pointName||'');const[searchOpen,setSearchOpen]=useState(false);const[saving,setSaving]=useState(false);const[error,setError]=useState('');
  const points=React.useMemo(()=>(customers||[]).flatMap(customer=>(customer.points||[]).filter(point=>point.name&&!point.customerStoppedAt).map(point=>({...point,customerId:customer.id,customerName:customer.name}))),[customers]);
  const matches=points.filter(point=>normalizeLookupText(point.name+' '+point.customerName).includes(normalizeLookupText(query))).slice(0,25);
  const set=(key,value)=>setDraft(previous=>({...previous,[key]:value}));
  const choose=point=>{setDraft(previous=>({...previous,pointId:point.id||'',pointName:point.name,customerId:point.customerId,customer:point.customerName,address:point.address||'',area:point.area||''}));setQuery(point.name);setSearchOpen(false);};
  const submit=async()=>{
    if(saving)return;
    if(query!==draft.pointName){setError('Hãy chọn địa điểm trong kết quả tìm kiếm.');return;}
    setError('');setSaving(true);
    try{await onSave(order,draft);onClose();}catch(error){setError(error.message||'Chưa lưu được đơn.');}finally{setSaving(false);}
  };
  return h(Modal,{title:'Sửa thông tin đơn hàng',className:'delivery-mobile-editor',onClose:()=>{if(!saving)onClose();}},
    h('div',{className:'delivery-mobile-editor-body'},
      h(F,{label:'Địa điểm giao'},h('div',{className:'delivery-editor-point'},
        h('input',{value:query,disabled:true,onChange:e=>{setQuery(e.target.value);setSearchOpen(true);},onFocus:()=>setSearchOpen(true),placeholder:'Gõ tên địa điểm…',role:'combobox','aria-label':'Địa điểm giao','aria-expanded':searchOpen,'aria-controls':'delivery-editor-points','aria-autocomplete':'list'}),
        searchOpen&&h('div',{className:'delivery-editor-point-results',id:'delivery-editor-points',role:'listbox'},matches.length?matches.map((point,index)=>h('button',{type:'button',key:String(point.customerId)+'-'+String(point.id||index),role:'option','aria-selected':String(draft.pointId)===String(point.id)&&String(draft.customerId)===String(point.customerId),onClick:()=>choose(point),disabled:saving},h('b',null,point.name),h('small',null,point.customerName))):h('div',null,'Không tìm thấy địa điểm'))
      )),
      h('div',{className:'delivery-editor-date-time'},
        h(F,{label:'Ngày giao'},h('input',{type:'date','aria-label':'Ngày giao',value:toIsoDate(draft.deliveryDate),disabled:true,onChange:e=>set('deliveryDate',e.target.value?vnDateFromISO(e.target.value):'')})),
        h(F,{label:'Giờ giao'},h('input',{type:'time','aria-label':'Giờ giao',value:draft.deliveryTime,disabled:saving,onChange:e=>set('deliveryTime',e.target.value)}))
      ),
      (draft.lines||[]).map((line,index)=>h('div',{key:line.id||index,className:'delivery-editor-product'},
        h('b',null,(line.productName||'Sản phẩm')+(line.unit?' ('+line.unit+')':'')),
        h('div',{className:'delivery-editor-quantities'},... [['qtyProd','SL đặt'],['qtyInvoice','SL HĐ'],['qtyDelivered','SL giao']].map(([key,label])=>h(F,{label},h('input',{type:'text',inputMode:'decimal',value:line[key],disabled:saving,readOnly:key==='qtyDelivered'&&!canEditDelivered,'aria-label':label+' '+(line.productName||''),onChange:e=>setDraft(previous=>({...previous,lines:previous.lines.map((item,i)=>i===index?{...item,[key]:e.target.value}:item)}))}))))
      )),
      error&&h('div',{role:'alert',className:'delivery-editor-error'},error)
    ),
    h(Row,null,h('button',{type:'button',disabled:saving,'data-scf-action':'view',onClick:onClose},'Hủy'),h('button',{type:'button',className:'bp',disabled:saving,'data-scf-action':'write',onClick:submit},saving?'Đang lưu…':'Lưu đơn'))
  );
}

function scfInlineCopyDraft(source){
  const draft=cleanDeliveryOrderRecord(source);
  return {...draft,id:'',copySourceId:source.id||'',_draftKey:uid(),status:source.tripId?'assigned':'pending',tripId:source.tripId||'',tripAssignMode:source.tripAssignMode==='manual'?'manual':'auto',
    prodShiftAssignMode:'auto',prodShiftId:'',prodTime:'',prodDate:'',labelTime:'',labelDate:'',
    invoiceNo:'',invoiceImage:'',invoiceImageName:'',invoiceUploadedAt:'',invoiceUploadedBy:'',
    createdAt:'',createdBy:'',updatedAt:'',updatedBy:'',orderHistory:[],workOut:'',workReturn:'',
    lines:(source.lines||[]).map(line=>({...line,id:uid(),shiftOverride:false,prodShiftId:'',prodTime:'',prodDate:'',labelTime:'',labelDate:'',qtyProd:String(mobileDeliveryQty(line,'qtyProd')),qtyInvoice:String(mobileDeliveryQty(line,'qtyInvoice')),qtyDelivered:''}))};
}
function scfPickInlineProduct(line,product){
  return {id:line.id,productId:product?.id||'',productName:product?.name||'',unit:product?.unit||'',weightPerUnit:product?.weightPerUnit||0,qtyInvoice:line.qtyInvoice,qtyProd:line.qtyProd,qtyDelivered:'',note:line.note||'',price:0,purchasePrice:0,shiftOverride:false};
}
function scfValidateInlineLines(lines,products){
  if(!lines?.length)throw new Error('Đơn cần có ít nhất một sản phẩm.');
  return lines.map(line=>{
    if(products&&!products.some(product=>String(product.id)===String(line.productId)))throw new Error('Hãy chọn sản phẩm trong danh mục cho tất cả các dòng.');
    const next={...line};
    for(const field of ['qtyInvoice','qtyProd']){
      const raw=String(line[field]??'').trim().replace(',','.');
      if(!/^\d+(?:\.\d+)?$/.test(raw)||!Number.isFinite(Number(raw)))throw new Error('Số lượng phải là số từ 0 trở lên.');
      next[field]=Number(raw);
    }
    next.qtyDelivered=next.qtyProd;return next;
  });
}
function scfAppendDeliveryLines(live,lines){
  if(!live)throw new Error('Đơn không còn tồn tại. Hãy tải lại danh sách.');
  const ids=new Set((live.lines||[]).map(line=>String(line.id)));
  const exists=lines.filter(line=>ids.has(String(line.id)));
  if(exists.length===lines.length)return live;
  if(exists.length)throw new Error('Một số dòng đã được thêm. Hãy mở lại đơn để kiểm tra.');
  return {...live,lines:[...(live.lines||[]),...lines]};
}
function scfValidateInlineCopy(draft,points,pointKey,products){
  const point=points.find(point=>point.key===pointKey);
  const iso=toIsoDate(draft.deliveryDate),parts=iso.split('-').map(Number),date=new Date(parts[0],parts[1]-1,parts[2]);
  if(!iso||date.getFullYear()!==parts[0]||date.getMonth()!==parts[1]-1||date.getDate()!==parts[2]||!mobileDeliveryTime(draft.deliveryTime))throw new Error('Hãy chọn ngày và giờ giao hợp lệ.');
  if(!point)throw new Error('Hãy chọn địa điểm giao trong danh mục.');
  const lines=scfValidateInlineLines(draft.lines,products);
  return {...draft,customerId:point.customerId,customer:point.customerName,pointId:point.id||'',pointName:point.name,address:point.address||'',area:point.area||'',deliveryTime:mobileDeliveryTime(draft.deliveryTime),lines};
}
function DeliveryInlineCopyRows({draft:initial,customers,products=[],prodCats=[],detailColumnsHidden,productColumnWidth,layoutColumns,onSave,onClose,canEdit}){
  const [draft,setDraft]=useState(()=>({...initial,lines:initial.lines.map(line=>({...line}))}));
  const [error,setError]=useState(''),[saving,setSaving]=useState(false);
  const points=React.useMemo(()=>(customers||[]).flatMap(customer=>(customer.points||[]).filter(point=>point.name).map((point,index)=>({...point,customerId:customer.id,customerName:customer.name,key:String(customer.id)+'|'+String(point.id||index)}))),[customers]);
  const [pointKey,setPointKey]=useState(()=>points.find(point=>String(point.customerId)===String(initial.customerId)&&String(point.id)===String(initial.pointId)&&point.name===initial.pointName)?.key||'');
  const [query,setQuery]=useState(initial.pointName||''),[open,setOpen]=useState(false);
  const matches=points.filter(point=>normalizeLookupText(point.name+' '+point.customerName).includes(normalizeLookupText(query))).slice(0,40);
  const disabled=saving||!canEdit;
  const cancelKey=event=>{if(event.key==='Escape'&&!event.defaultPrevented&&!event.isComposing&&!event.nativeEvent?.isComposing&&!saving){event.preventDefault();event.stopPropagation();onClose();}};
  useEffect(()=>{
    const key=event=>{
      if(event.key!=='Escape'||event.defaultPrevented||event.isComposing||event.keyCode===229||saving)return;
      // The first + button keeps focus outside the new row. Esc must still cancel it.
      // Let a dialog or a different cell editor consume its own Escape first.
      if(document.querySelector('.overlay,.scf-dialog-overlay,.delivery-column-filter-backdrop'))return;
      const target=event.target;
      if(!target?.closest?.('.delivery-inline-copy-row')&&target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
      cancelKey(event);
    };
    document.addEventListener('keydown',key,true);
    return()=>document.removeEventListener('keydown',key,true);
  },[saving,onClose]);
  const detach=previous=>{const next={...previous};delete next._appendToId;return next;};
  const set=(field,value)=>setDraft(previous=>({...detach(previous),[field]:value}));
  const submit=async()=>{
    if(disabled)return;
    setError('');setSaving(true);
    try{const order=draft._appendToId?{...draft,lines:scfValidateInlineLines(draft.lines,products)}:scfValidateInlineCopy(draft,points,pointKey,products);if(await onSave(order)===false)setError('Chưa lưu được đơn. Kiểm tra thông báo và sửa lại thông tin.');}
    catch(error){setError(error.message||'Chưa lưu được đơn.');}finally{setSaving(false);}
  };
  const columns=layoutColumns||DELIVERY_ORDER_COLUMNS.filter(([key])=>!['status'].includes(key));
  const columnCount=Math.max(1,columns.length);
  return (draft.lines.length?draft.lines:[{id:'empty',productName:'Chưa có sản phẩm'}]).map((line,index)=>{
    const cells={date:index===0&&h('td',{rowSpan:Math.max(1,draft.lines.length)},h('input',{type:'date',value:toIsoDate(draft.deliveryDate),disabled,'aria-label':'Ngày giao đơn mới',onChange:e=>set('deliveryDate',e.target.value?vnDateFromISO(e.target.value):'')})),point:index===0&&h('td',{rowSpan:Math.max(1,draft.lines.length)},h('div',{className:'delivery-inline-point'},
      h('input',{value:query,disabled,placeholder:'Chọn địa điểm…','aria-label':'Địa điểm đơn mới',role:'combobox','aria-expanded':open,onFocus:()=>setOpen(true),onChange:e=>{setQuery(e.target.value);setPointKey('');setDraft(previous=>detach(previous));setOpen(true);},onBlur:()=>setTimeout(()=>setOpen(false),150)}),
      open&&h('div',{className:'delivery-inline-point-results',role:'listbox'},matches.length?matches.map(point=>h('button',{key:point.key,type:'button',role:'option','aria-selected':pointKey===point.key,onMouseDown:e=>e.preventDefault(),onClick:()=>{setDraft(previous=>detach(previous));setPointKey(point.key);setQuery(point.name);setOpen(false);}},h('b',null,point.name),h('small',null,point.customerName))):h('span',null,'Không tìm thấy địa điểm')))),product:h('td',{key:'product'},h('div',{className:'delivery-product-info'},
        h('fieldset',{disabled,style:{border:0,padding:0,margin:0,minWidth:0,display:'flex',gap:4,alignItems:'center'}},h(ImportProductSearch,{products,value:line.productId||'',prodCats,showCategoryFilters:true,compact:true,onChange:productId=>{if(disabled)return;const product=products.find(product=>String(product.id)===String(productId));setDraft(previous=>({...previous,lines:previous.lines.map((item,i)=>i===index?scfPickInlineProduct(item,product):item)}));}}),draft.lines.length>1&&h('button',{type:'button',className:'bi',title:'Bỏ dòng sản phẩm nháp','aria-label':'Bỏ dòng sản phẩm nháp '+(index+1),onClick:()=>setDraft(previous=>({...previous,lines:previous.lines.filter((item,i)=>i!==index)}))},'×')),
        !products.some(product=>String(product.id)===String(line.productId))&&line.productName&&h('small',{style:{color:'var(--tx2)'}},line.productName+' — chọn lại sản phẩm')
      )),
      ...Object.fromEntries(['qtyInvoice','qtyProd'].map(field=>[field,h('td',{key:field},h('input',{value:line[field]??'',disabled,inputMode:'decimal','aria-label':(field==='qtyInvoice'?'SL HĐ':'SL đặt')+' đơn mới '+(index+1),onChange:e=>{const value=e.target.value;setDraft(previous=>({...previous,lines:previous.lines.map((item,i)=>i===index?{...item,[field]:value}:item)}));}}))])),
      qtyDelivered:h('td',{key:'qtyDelivered'},line.qtyProd||'—'),time:index===0&&h('td',{rowSpan:Math.max(1,draft.lines.length)},h('input',{type:'time',value:mobileDeliveryTime(draft.deliveryTime),disabled,'aria-label':'Giờ giao đơn mới',onChange:e=>set('deliveryTime',e.target.value)})),note:h('td',{className:'delivery-inline-copy-note',colSpan:1},h('input',{type:'text',value:line.note||'',disabled,placeholder:'Chú ý sản phẩm…','aria-label':'Chú ý đơn mới '+(index+1),onChange:e=>{const value=e.target.value;setDraft(previous=>({...previous,lines:previous.lines.map((item,i)=>i===index?{...item,note:value}:item)}));}}))};
    return h('tr',{key:line.id,className:'delivery-inline-copy-row',onKeyDownCapture:cancelKey},columns.map(([key])=>cells[key]===undefined?(index===0?h('td',{key,rowSpan:Math.max(1,draft.lines.length),'aria-hidden':true}):null):cells[key]));
  }).concat(h('tr',{key:'draft-actions',className:'delivery-inline-copy-row delivery-inline-copy-footer',onKeyDownCapture:cancelKey},h('td',{colSpan:columnCount},h('div',{className:'delivery-inline-copy-actions'},h('b',null,draft._appendToId?'Thêm vào đơn hiện có':'Đơn nháp'),h('button',{type:'button',disabled,onClick:()=>setDraft(previous=>({...previous,lines:[...previous.lines,{id:uid(),productId:'',productName:'',qtyInvoice:'',qtyProd:'',qtyDelivered:''}]}))},'+ Dòng sản phẩm'),h('button',{type:'button',className:'bp',disabled,onClick:submit},saving?'Đang lưu…':draft._appendToId?'Lưu sản phẩm':'Lưu đơn mới'),h('button',{type:'button',className:'delivery-inline-cancel',disabled:saving,onClick:onClose,'data-scf-action':'view'},'Hủy')),error&&h('div',{role:'alert',className:'delivery-editor-error'},error))
  ));

}

// Keep every order in a trip on the same page, including pending trip groups.
function deliveryOrderPageUnits(rows,byTrip,groupForOrder){
  if(!byTrip)return rows.map(order=>[order]);
  const groups=new Map();
  rows.forEach(order=>{
    const key=groupForOrder(order).key;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(order);
  });
  return [...groups.values()];
}
function scfTransferProduction(order,selection,rules=[]){
  if(!selection||selection.mode==='keep')return order;
  const stamp=new Date().toISOString();
  if(selection.mode==='auto')return {...order,prodShiftAssignMode:'auto',productionScheduleVersion:2,productionScheduleResetAt:stamp,productionScheduleResetTripId:String(order.tripId||''),
    lines:(order.lines||[]).map(line=>({...line,shiftOverride:false,prodShiftId:'',prodDate:'',prodTime:'',prodWorkShiftId:'',labelDate:'',labelTime:'',productionScheduleResetAt:stamp}))};
  const rule=rules.find(r=>String(r.id)===String(selection.ruleId)&&r.active!==false);
  if(!rule||deliveryOrderDateKey(selection.prodDate)===null)throw new Error('Hãy chọn ngày SX và ca SX hợp lệ.');
  if(selection.labelDate!==undefined&&(deliveryOrderDateKey(selection.labelDate)===null||!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(selection.labelTime||''))))throw new Error('Hãy chọn ngày in tem và giờ in tem hợp lệ.');
  const timing={prodDate:vnDateFromISO(toIsoDate(selection.prodDate)),prodTime:rule.start,prodWorkShiftId:rule.id,
    ...(selection.labelDate!==undefined?{labelDate:vnDateFromISO(toIsoDate(selection.labelDate)),labelTime:selection.labelTime}:{})};
  return {...order,...timing,prodShiftAssignMode:'manual',productionScheduleResetAt:stamp,
    lines:(order.lines||[]).map(line=>({...line,...timing,shiftOverride:true,productionScheduleResetAt:stamp}))};
}
function DeliveryOrderTripModal({order,trips,trip,defaultDate,disabled,onConfirm,onClose,prodShiftRules=[],productionPlan={},prodShifts=[],customers=[],compactWidth=0}){
  const [date,setDate]=useState(manualTripDateToISO(trip?.deliveryDate||defaultDate));
  const [tripId,setTripId]=useState(String(trip?.id||''));
  const [saving,setSaving]=useState(false),[error,setError]=useState('');
  const [productionChoice,setProductionChoice]=useState('keep');
  const [productionEditMode,setProductionEditMode]=useState(order.prodShiftAssignMode==='manual'?'manual':'auto');
  const [productionDate,setProductionDate]=useState(toIsoDate(productionPlan.prodDate||order.prodDate||order.deliveryDate));
  const [labelDate,setLabelDate]=useState(toIsoDate(productionPlan.labelDate||order.labelDate||order.lines?.[0]?.labelDate||order.deliveryDate));
  const [labelTime,setLabelTime]=useState(productionPlan.labelTime||order.labelTime||order.lines?.[0]?.labelTime||'');
  const rules=prodShiftRules.length?prodShiftRules:(typeof DEF_PROD_SHIFT_RULES==='undefined'?[]:DEF_PROD_SHIFT_RULES);
  const currentRule=rules.find(rule=>String(rule.id)===String(productionPlan.prodWorkShiftId||order.prodWorkShiftId||''))||rules.find(rule=>rule.start===(productionPlan.prodTime||order.prodTime));
  const manualTiming=()=>{if(productionChoice==='keep'||productionChoice==='auto')setProductionChoice(currentRule?.id||'');};
  const productionLocked=!!trip&&(!!trip.driverDispatchedAt||['active','completion_pending','completed'].includes(trip.status));
  const autoDraft={...order,tripId,prodShiftAssignMode:'auto',productionScheduleVersion:2};
  const autoPlan=productionEditMode==='auto'?scfTripProductionPlan(autoDraft,getProdShiftForOrder(autoDraft,prodShifts,customers),trips,rules):null;
  const displayPlan=productionEditMode==='auto'&&(productionChoice==='auto'||tripId!==String(trip?.id||''))?autoPlan:productionPlan;
  const displayedRule=rules.find(rule=>String(rule.id)===String(displayPlan?.prodWorkShiftId||''))||rules.find(rule=>rule.start===displayPlan?.prodTime)||currentRule;
  const timingDisabled=disabled||saving||productionLocked||productionEditMode!=='manual';
  const toggleProductionMode=()=>{
    if(productionEditMode==='auto'){
      setProductionDate(toIsoDate(displayPlan?.prodDate||productionDate));setLabelDate(toIsoDate(displayPlan?.labelDate||labelDate));setLabelTime(displayPlan?.labelTime||labelTime);
      setProductionChoice(displayedRule?.id||'');setProductionEditMode('manual');
    }else{setProductionChoice('auto');setProductionEditMode('auto');}
    setError('');
  };
  const savingRef=React.useRef(false);
  const options=React.useMemo(()=>filterManualTripOptions(trips,date,''),[trips,date]);
  const panelRef=React.useRef(null);
  useEffect(()=>{panelRef.current?.scrollIntoView({block:'nearest',behavior:'instant'});},[]);
  const close=()=>{if(!savingRef.current)onClose();};
  useEffect(()=>{
    const key=event=>{
      if(event.key!=='Escape'||event.defaultPrevented||event.isComposing||event.keyCode===229||savingRef.current)return;
      if(document.querySelector('.overlay,.scf-dialog-overlay,.delivery-column-filter-backdrop'))return;
      event.preventDefault();event.stopPropagation();close();
    };
    document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);
  },[onClose]);
  const save=async()=>{
    if(disabled||savingRef.current)return;
    if(!date||!tripId||!options.some(t=>String(t.id)===String(tripId))){setError('Hãy chọn ngày chuyến và ca giao trong ngày đó.');return;}
    savingRef.current=true;setSaving(true);setError('');
    try{
      const selection={mode:productionChoice==='keep'?'keep':productionChoice==='auto'?'auto':'manual',ruleId:productionChoice,prodDate:productionDate,labelDate,labelTime};
      if(selection.mode==='manual')scfTransferProduction(order,selection,rules);
      if(await onConfirm(tripId,selection))onClose();else setError('Chưa xác nhận được thay đổi. Hãy kiểm tra đồng bộ rồi bấm Lưu để thử lại.');
    }
    catch(error){setError(error.message||'Chưa chuyển được chuyến.');}
    finally{savingRef.current=false;setSaving(false);}
  };
  return h('section',{ref:panelRef,className:'delivery-order-trip-panel'+(compactWidth?' delivery-order-trip-compact':''),style:compactWidth?{width:'100%',maxWidth:compactWidth}:undefined,role:'region','aria-label':'Chuyển chuyến cho '+(order.pointName||order.id),onKeyDown:event=>{if(event.key==='Escape'){event.stopPropagation();close();}}},
    h('div',{className:'delivery-transfer-context',title:[order.pointName||order.customer||order.id,order.deliveryDate,order.deliveryTime,'Hiện tại: '+(trip?manualTripText(trip):'Chưa xếp chuyến')].filter(Boolean).join(' · ')},h('span',null,order.pointName||order.customer||order.id)),
    h(F,{label:compactWidth?'Ngày':'Ngày chuyến'},h('input',{type:'date','data-no-auto-picker':'1','aria-label':'Ngày chuyến mới',value:date,disabled:disabled||saving,onChange:e=>{setDate(e.target.value);setTripId('');setError('');}})),
    h(F,{label:compactWidth?'Ca giao':'Ca giao – Người giao'},h('select',{'aria-label':'Chuyến mới',title:'Ca giao – Người giao',value:options.some(t=>String(t.id)===tripId)?tripId:'',disabled:disabled||saving,onChange:e=>{setTripId(e.target.value);setError('');}},h('option',{value:''},options.length?'Chọn chuyến trong ngày':'Không có chuyến trong ngày'),options.map(t=>h('option',{key:t.id,value:String(t.id)},manualTripText(t))))),
    h('div',{className:'delivery-transfer-production'},
      h('button',{type:'button',className:'delivery-trip-mode-switch','data-mode':productionEditMode,role:'switch','aria-label':'Xếp ca SX tự động','aria-checked':productionEditMode==='auto',title:productionEditMode==='auto'?'Tự động theo chuyến giao · Bấm chuyển BT để sửa':'Bằng tay · Bấm chuyển TĐ theo chuyến giao',disabled:disabled||saving||productionLocked,onClick:toggleProductionMode},productionEditMode==='auto'?'TĐ':'BT'),

      h(F,{label:compactWidth?'SX':'Ngày SX'},h('input',{type:'date','data-no-auto-picker':'1','aria-label':'Ngày SX khi chuyển chuyến',title:'Ngày SX',value:productionEditMode==='auto'?toIsoDate(displayPlan?.prodDate||''):productionDate,disabled:timingDisabled,onChange:e=>{manualTiming();setProductionDate(e.target.value);}})),
      h(F,{label:'Ca SX'},
        h('select',{'aria-label':'Ca SX khi chuyển chuyến',value:productionChoice,disabled:timingDisabled,onChange:e=>{setProductionChoice(e.target.value);if(e.target.value==='auto')setProductionEditMode('auto');setError('');}},
          h('option',{value:'keep'},displayedRule?.name||productionPlan.shift?.name||'Ca SX hiện tại'),
          h('option',{value:'auto'},'Theo chuyến giao'+(displayedRule?.name?' · '+displayedRule.name:'')),h('option',{value:'',disabled:true},'Chọn ca SX'),
          rules.filter(rule=>rule.active!==false).map(rule=>h('option',{key:rule.id,value:rule.id},rule.name)))),
      h(F,{label:compactWidth?'Tem':'Ngày tem'},h('input',{type:'date','data-no-auto-picker':'1','aria-label':'Ngày in tem khi chuyển chuyến',title:'Ngày tem',value:productionEditMode==='auto'?toIsoDate(displayPlan?.labelDate||''):labelDate,disabled:timingDisabled,onChange:e=>{manualTiming();setLabelDate(e.target.value);}})),
      h(F,{label:compactWidth?'Giờ':'Giờ tem'},h('input',{type:'time','aria-label':'Giờ in tem khi chuyển chuyến',title:'Giờ tem',value:productionEditMode==='auto'?(displayPlan?.labelTime||''):labelTime,disabled:timingDisabled,onChange:e=>{manualTiming();setLabelTime(e.target.value);}}))),
    productionLocked&&h('p',{role:'alert'},'Ca SX và lịch in tem đã khóa vì chuyến đã giao lái xe.'),
    disabled&&h('p',{role:'alert'},'Đơn hoặc chuyến đã khóa, hoặc bạn không có quyền chuyển chuyến.'),
    error&&h('p',{role:'alert',className:'delivery-editor-error'},error),
    h('div',{className:'form-actions delivery-transfer-save'},h('button',{type:'button',disabled:saving,onClick:close,'data-scf-action':'view'},'Đóng'),h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:disabled||saving||!tripId,onClick:save},saving?'Đang lưu…':'Lưu'))
  );
}
function DeliveryToolbarButton({label,icon,...props}){
  return h('button',{...props,type:'button',className:'delivery-toolbar-icon-button','aria-label':label},h('i',{className:'ti '+icon,'aria-hidden':true}),h('span',{className:'delivery-toolbar-button-label'},label),h('span',{className:'delivery-toolbar-tooltip',role:'tooltip'},label));
}
function DeliveryViewControls({menuHidden,setMenuHidden,toolsHidden,setToolsHidden,onViewOrderSummary,onViewProduction,menuOnly=false,utility,onCreate,visibilityControl}){
  return h('div',{className:'delivery-view-controls'},
    visibilityControl||h('button',{type:'button','data-scf-action':'view',onClick:()=>{if(menuOnly){setMenuHidden(v=>!v);return;}const hide=!(menuHidden&&toolsHidden);setMenuHidden(hide);setToolsHidden(hide);},'aria-expanded':menuOnly?!menuHidden:!(menuHidden&&toolsHidden),'aria-controls':'delivery-filter-tools',title:menuOnly?'Ẩn hoặc hiện menu web; giữ thanh thao tác và bộ lọc cột':'Ẩn hoặc hiện menu, bộ lọc và tiện ích; giữ nguyên điều kiện lọc'},h('i',{className:'ti '+(menuHidden&&toolsHidden?'ti-layout-navbar-expand':'ti-layout-navbar-collapse'),'aria-hidden':true}),menuOnly?(menuHidden?'Hiện menu':'Ẩn menu'):(menuHidden&&toolsHidden?'Hiện menu & tiện ích':'Ẩn menu & tiện ích')),
    utility,
    onCreate&&h(AddBtn,{onClick:onCreate,label:'Tạo đơn'}),
    onViewOrderSummary&&h(DeliveryToolbarButton,{'data-scf-action':'view',onClick:onViewOrderSummary,icon:'ti-photo-search',label:'Đơn Tổng'}),
    onViewProduction&&h(DeliveryToolbarButton,{'data-scf-action':'view',onClick:onViewProduction,icon:'ti-clipboard-list',label:'KL SX'})
  );
}
function DeliveryVisibilityMenu({menuHidden,setMenuHidden,ordersHidden,setOrdersHidden,hiddenColumns,setHiddenColumns,canSelectOrders=false,selectionHidden=false,onSelectionHiddenChange}){
  const menuRef=useRef(null);
  useEffect(()=>{const outside=event=>{if(menuRef.current?.open&&!menuRef.current.contains(event.target))menuRef.current.open=false;};const escape=event=>{if(event.key==='Escape'&&menuRef.current)menuRef.current.open=false;};document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape,true);return()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape,true);};},[]);
  return h('details',{ref:menuRef,className:'delivery-visibility-menu'},h('summary',{'aria-label':'Ẩn và hiện giao diện'},h('i',{className:'ti ti-eye-off','aria-hidden':true}),' Ẩn ',h('i',{className:'ti ti-chevron-down','aria-hidden':true})),
    h('div',{className:'delivery-visibility-options'},
      h('label',null,h('input',{type:'checkbox',checked:!!menuHidden,onChange:e=>setMenuHidden(e.target.checked)}),'Ẩn menu'),
      canSelectOrders&&h('label',null,h('input',{type:'checkbox','aria-label':'Hiện ô chọn đơn',checked:!selectionHidden,onChange:e=>onSelectionHiddenChange(!e.target.checked)}),'Ô chọn đơn'),
      h('label',null,h('input',{type:'checkbox',checked:!!ordersHidden,onChange:e=>setOrdersHidden(e.target.checked)}),'Ẩn đơn chi tiết'),h('hr'),h('span',{className:'delivery-visibility-caption'},'Hiện các cột'),
      DELIVERY_ORDER_COLUMNS.map(([key,label])=>{const optionLabel=key==='actions'?'Cụm nút thao tác đơn hàng (Tạo-sửa)':label;return h('label',{key},h('input',{type:'checkbox','aria-label':key==='actions'?'Hiện cụm nút thao tác đơn hàng':'Hiện cột '+label,checked:!hiddenColumns.includes(key),disabled:DELIVERY_ORDER_COLUMNS.filter(([id])=>!hiddenColumns.includes(id)).length<=1&&!hiddenColumns.includes(key),onChange:e=>{const checked=e.target.checked;setHiddenColumns(previous=>checked?previous.filter(item=>item!==key):[...new Set([...previous,key])]);}}),optionLabel);})));
}
function deliveryAuditTime(value){
  const raw=String(value||'').trim();if(!raw)return null;
  let text=raw.replace(' ','T'),match=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if(!match){const reverse=raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(reverse)match=[raw,reverse[4],reverse[5],reverse[6],reverse[1],reverse[2],reverse[3]];}
  if(match)text=match[3]+'-'+match[2].padStart(2,'0')+'-'+match[1].padStart(2,'0')+(match[4]?'T'+match[4].padStart(2,'0')+':'+match[5]+':'+(match[6]||'00'):'');
  const iso=text.match(/^(\d{4}-\d{2}-\d{2})(?:T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/);
  if(!iso||deliveryOrderDateKey(iso[1])===null)return null;
  if(!iso[2])return {day:iso[1],ms:null,precise:false};
  const ms=Date.parse(text+(iso[5]?'':'+07:00'));if(!Number.isFinite(ms))return null;
  return {day:new Date(ms+7*3600000).toISOString().slice(0,10),ms,precise:true};
}
function deliveryOrderAuditMeta(order,people=new Map()){
  const history=Array.isArray(order.orderHistory)?order.orderHistory:[];
  const creation=history.find(item=>/^(tao don|lai xe tao don)/.test(normalizeLookupText(item.action))),last=history[history.length-1];
  const sources=[order.createdAtIso,order.createdAt,order.kpiAudit?.createdAt,creation?.atIso,creation?.at].map(deliveryAuditTime).filter(Boolean);
  const created=sources.find(item=>item.precise)||sources[0]||null;
  const creatorId=String(order.createdById||order.kpiAudit?.ownerId||creation?.byId||'');
  const editorId=String(order.updatedById||(normalizeLookupText(order.updatedBy)===normalizeLookupText(last?.by)?last?.byId:'')||'');
  return {created,creator:people.get(creatorId)||String(order.createdBy||creation?.by||creatorId),editor:people.get(editorId)||String(order.updatedBy||last?.by||editorId)};
}
function deliveryMatchesAuditFilter(meta,filter,now=Date.now()){
  const actorMatch=(value,selected)=>!selected||(selected==='__unknown'?!value:normalizeLookupText(value)===normalizeLookupText(selected));
  if(!actorMatch(meta.creator,filter.creator)||!actorMatch(meta.editor,filter.editor))return false;
  if(!filter.mode)return true;
  const created=meta.created;if(!created)return false;
  const durations={'30m':1800000,'1h':3600000,'2h':7200000,'24h':86400000};
  if(durations[filter.mode])return created.precise&&created.ms>=now-durations[filter.mode]&&created.ms<=now;
  if(filter.mode==='day')return !!filter.from&&created.day===filter.from;
  if(filter.mode==='range'){
    const from=filter.from||'',to=filter.to||'';
    if(from&&to)return created.day>=[from,to].sort()[0]&&created.day<=[from,to].sort()[1];
    return (!from||created.day>=from)&&(!to||created.day<=to);
  }
  return true;
}
function DeliveryAuditFilterFields({value,getActors,onApply,onClear,count}){
  const [draft,setDraft]=useState(value);
  const {creators,editors}=React.useMemo(getActors,[getActors]);
  const update=(key,next)=>setDraft(p=>({...p,[key]:next}));
  const actorSelect=(key,label,options)=>h('label',null,label,h('select',{'aria-label':label,value:draft[key]||'',onChange:e=>update(key,e.target.value)},h('option',{value:''},'Tất cả'),options.map(name=>h('option',{key:name,value:name},name==='__unknown'?'Không rõ':name))));
  return h(React.Fragment,null,
    h('label',null,'Thời gian tạo đơn',h('select',{'aria-label':'Thời gian tạo đơn',value:draft.mode||'',onChange:e=>setDraft(p=>({...p,mode:e.target.value,from:p.from||isoDate(),to:p.to||isoDate()}))},[['','Không giới hạn'],['30m','30 phút vừa qua'],['1h','1 giờ vừa qua'],['2h','2 giờ vừa qua'],['24h','24 giờ vừa qua'],['day','Ngày cụ thể'],['range','Khoảng ngày']].map(([key,text])=>h('option',{key,value:key},text)))),
    ['day','range'].includes(draft.mode)&&h('label',null,draft.mode==='day'?'Ngày tạo đơn':'Từ ngày tạo',h('input',{'aria-label':'Từ ngày tạo đơn',type:'date',value:draft.from||'',onChange:e=>update('from',e.target.value)})),
    draft.mode==='range'&&h('label',null,'Đến ngày tạo',h('input',{'aria-label':'Đến ngày tạo đơn',type:'date',value:draft.to||'',onChange:e=>update('to',e.target.value)})),
    actorSelect('creator','Người tạo đơn',creators),actorSelect('editor','Người sửa đơn cuối',editors),
    h('small',null,'Lọc thêm trong các điều kiện ngày, địa điểm và chuyến đang chọn.'),
    h('button',{type:'button',className:'bp',onClick:()=>onApply(draft)},'Áp dụng — tìm đơn'),
    h('button',{type:'button',onClick:()=>{setDraft({});onClear();}},'Xóa lọc tạo/sửa'),
    h('small',null,count+' đơn đang hiển thị. Đơn cũ chỉ lưu ngày tạo có thể tìm bằng ngày hoặc khoảng ngày.')
  );
}

function DeliveryColumnFilter({label,active,children,onClear}){
  const [anchor,setAnchor]=useState(null),button=React.useRef(null),panel=React.useRef(null);
  const close=()=>{setAnchor(null);button.current?.focus();};
  useEffect(()=>{
    if(!anchor)return;
    panel.current?.focus();
    const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}};
    const scroll=e=>{if(!panel.current?.contains(e.target))setAnchor(null);};
    document.addEventListener('keydown',key,true);window.addEventListener('resize',close);window.addEventListener('scroll',scroll,true);
    return()=>{document.removeEventListener('keydown',key,true);window.removeEventListener('resize',close);window.removeEventListener('scroll',scroll,true);};
  },[anchor]);
  return h(React.Fragment,null,
    h('span',{className:'delivery-column-filter'+(active?' active':'')},
      h('button',{ref:button,type:'button','aria-label':'Lọc '+label,'aria-expanded':!!anchor,title:'Lọc '+label,onClick:e=>{const r=e.currentTarget.getBoundingClientRect(),top=Math.max(8,Math.min(r.bottom+4,window.innerHeight-320));setAnchor({left:Math.max(8,Math.min(r.left,window.innerWidth-296)),top,maxHeight:window.innerHeight-top-8});}},label),
      h('button',{type:'button',disabled:!active,'aria-label':'Xóa lọc '+label,title:active?'Xóa lọc '+label:'Chưa lọc '+label,onClick:()=>{onClear?.();setAnchor(null);},style:{color:active?'#d32f2f':undefined}},h('i',{className:'ti ti-filter','aria-hidden':true}))),
    anchor&&ReactDOM.createPortal(h('div',{className:'delivery-column-filter-backdrop',onClick:close},h('div',{ref:panel,className:'delivery-column-filter-popup',tabIndex:-1,role:'dialog','aria-label':'Lọc '+label,style:anchor,onClick:e=>e.stopPropagation()},h('strong',null,'Lọc '+label),children,h('button',{type:'button',onClick:close},'Xong'))),document.body)
  );
}
function useDeliveryOrdersViewport(pageRef,enabled,menuHidden){
  useEffect(()=>{
    const page=pageRef.current;if(!enabled||!page)return;
    let frame=null;
    const measure=()=>{
      frame=null;
      const bottom=parseFloat(window.getComputedStyle(page.parentElement).paddingBottom)||0;
      const height=Math.max(320,Math.floor((window.visualViewport?.height||window.innerHeight)-Math.max(0,page.getBoundingClientRect().top)-bottom-4))+'px';
      if(page.style.getPropertyValue('--delivery-viewport-height')!==height)page.style.setProperty('--delivery-viewport-height',height);
    };
    const schedule=()=>{if(frame===null)frame=window.requestAnimationFrame(measure);};
    measure();
    const observer=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
    observer?.observe(page);const chrome=document.querySelector('.topbar');if(chrome)observer?.observe(chrome);
    window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule);
    return()=>{observer?.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule);window.visualViewport?.removeEventListener('resize',schedule);if(frame!==null)window.cancelAnimationFrame(frame);page.style.removeProperty('--delivery-viewport-height');};
  },[enabled,pageRef,menuHidden]);
}
function deliveryDefaultTripGroup(user){
  const name=normalizeLookupText(user?.name||'').replace(/\s+/g,' ');
  return name==='nguyen ky huong'?'dt':'samsung';
}
function DeliveryOrdersTab({orders,setOrders,customers,setCustomers,products,prodCats,quotes,employees,currentUser,trips,setTrips,company,prodShifts,prodShiftRules,shifts,menuHidden,setMenuHidden,printTemplateSettings,notify,onViewOrderSummary,onViewProduction,highlightOrderOnHover=true}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[copyDraft,setCopyDraft]=useState(null);const[print,spr]=useState(null);const[invoiceView,setInvoiceView]=useState(null);const[historyView,setHistoryView]=useState(null);const[q,sq]=useState('');const[filter,sf]=useState('all');const[sortMode,setSortMode]=useState('trip');const _td0=fmtDate();const _ti0=_td0.split('/').reverse().join('-');
  const[dateFilterMode,setDateFilterMode]=useState('day');
  const[dateBasis,setDateBasis]=useState('trip');
  const[summaryPrintTrip,setSummaryPrintTrip]=useState(null);
  const[driverEditTripId,setDriverEditTripId]=useState('');
  const[tripTransferOrderId,setTripTransferOrderId]=useState('');
  const deliveryDrag=useRef(null);
  const [dragTarget,setDragTarget]=useState('');
  const[fDate,sfDate]=useState(_ti0);const[fDateTo,sfDateTo]=useState(_ti0);
  const[fWeek,sfWeek]=useState(currentISOWeekInput());const[fMonth,sfMonth]=useState(_ti0.slice(0,7));
  const[fPoint,sfPoint]=useState('');const[fCustomer,sfCustomer]=useState('');const[fProduct,sfProduct]=useState('');const[fTime,sfTime]=useState('');const[fArea,sfArea]=useState('');
  const[fTripGroup,sfTripGroup]=useState(()=>deliveryDefaultTripGroup(currentUser));
  const[fNote,sfNote]=useState('');const[fTripId,sfTripId]=useState('');
  const[fTripDate,sfTripDate]=useState('');const[fTripShift,sfTripShift]=useState('');const[fTripDriver,sfTripDriver]=useState('');
  const[auditFilter,setAuditFilter]=useState({}),[auditNow,setAuditNow]=useState(()=>Date.now());
  const auditActive=!!(auditFilter.mode||auditFilter.creator||auditFilter.editor);
  useEffect(()=>{if(!['30m','1h','2h','24h'].includes(auditFilter.mode))return;const timer=setInterval(()=>setAuditNow(Date.now()),30000);return()=>clearInterval(timer);},[auditFilter.mode]);
  const auditMetaForOrder=React.useMemo(()=>{
    const people=new Map([...(employees||[]),currentUser].filter(Boolean).map(p=>[String(p.id),String(p.name||p.username||p.id)])),cache=new WeakMap();
    return order=>{if(!cache.has(order))cache.set(order,deliveryOrderAuditMeta(order,people));return cache.get(order);};
  },[employees,currentUser?.id,currentUser?.name]);
  const getAuditActors=React.useMemo(()=>()=>{
    const creators=new Set(),editors=new Set();orders.forEach(order=>{const meta=auditMetaForOrder(order);creators.add(meta.creator||'__unknown');editors.add(meta.editor||'__unknown');});
    const sort=(a,b)=>a===b?0:a==='__unknown'?1:b==='__unknown'?-1:a.localeCompare(b,'vi');return {creators:[...creators].sort(sort),editors:[...editors].sort(sort)};
  },[orders,auditMetaForOrder]);
  const[pageSize,setPageSize]=useState(20);const[currentPage,setCurrentPage]=useState(1);let oSeq=orders.length+1;
  const[mobileActionsOpen,setMobileActionsOpen]=useState(false);const[mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
  const[toolsHidden,setToolsHidden]=useState(false);
  const[toolbarCollapsed,setToolbarCollapsed]=useState(false);
  const[bulkSelected,setBulkSelected]=useState(()=>new Set());
  const[selectionHidden,setSelectionHidden]=useLS('scf_delivery_selection_hidden_'+String(currentUser?.id||''),false);
  const changeSelectionHidden=value=>{setSelectionHidden(value);if(value)setBulkSelected(new Set());};
  const[hiddenColumns,setHiddenColumns]=useLS('scf_delivery_hidden_columns_v705',['status']);
  const[ordersHidden,setOrdersHidden]=useLS('scf_delivery_orders_hidden',false);
  const[groupDetailsHidden,setGroupDetailsHidden]=useState({});
  const changeOrdersHidden=value=>{setOrdersHidden(value);setGroupDetailsHidden({});};
  const groupIsHidden=group=>group?.mode==='trip'&&Object.prototype.hasOwnProperty.call(groupDetailsHidden,group.key)?groupDetailsHidden[group.key]:ordersHidden;
  const toggleGroupDetails=group=>{if(group?.mode==='trip')setGroupDetailsHidden(previous=>({...previous,[group.key]:!(Object.prototype.hasOwnProperty.call(previous,group.key)?previous[group.key]:ordersHidden)}));};
  const groupDetailProps=group=>group?.mode==='trip'?{detailsHidden:groupIsHidden(group),onToggleDetails:()=>toggleGroupDetails(group)}:{};
  const[invoiceFilter,setInvoiceFilter]=useState('');
  const detailColumnsHidden=false;
  const [compactEntry,setCompactEntry]=useLS('scf_delivery_compact_entry_'+(currentUser?.id||''),false);
  const effectiveHiddenColumns=compactEntry?[...new Set([...hiddenColumns,'label'])]:hiddenColumns;
  const changeColumnVisibility=change=>{const next=typeof change==='function'?change(effectiveHiddenColumns):change;setHiddenColumns(next);setCompactEntry(next.includes('label'));};
  const visibleColumns=DELIVERY_ORDER_COLUMNS.filter(([key])=>!effectiveHiddenColumns.includes(key));
  const columnCount=Math.max(1,visibleColumns.length);
  const[mobileEdit,setMobileEdit]=useState(null);
  const[isMobile,setIsMobile]=useState(()=>!!window.matchMedia?.('(max-width: 768px)').matches);
  const deliveryPageRef=useRef(null);
  useDeliveryOrdersViewport(deliveryPageRef,!isMobile,menuHidden);
  useEffect(()=>{
    const media=window.matchMedia?.('(max-width: 768px)');if(!media)return;
    const update=()=>setIsMobile(media.matches);update();
    media.addEventListener?.('change',update);
    return()=>media.removeEventListener?.('change',update);
  },[]);
  const canEditMobileOrder=canWrite(currentUser?.role,'delivery',currentUser?.permLevels);
  const canChangeTripDriver=canEditMobileOrder&&canTripAction(currentUser,'manage');
  const canDispatchFromOrders=canEditMobileOrder&&canTripAction(currentUser,'dispatch')&&canAccess(currentUser?.role,'trips',currentUser?.permissions,employeeDepartments(currentUser));
  const dispatchBusy=useRef(new Set());
  const isAdmin=['admin','administrator'].includes(String(currentUser?.role||'').trim().toLowerCase());
  const showOrderSelection=isAdmin&&!selectionHidden;
  const currentDeptKey=normalizeLookupText(currentUser?.dept||'');
  const isAccounting=employeeDepartmentIncludes(currentUser,'Kế toán');
  const canWithdrawStartedOrder=isAdmin||isAccounting;
  const deliveryTableScroll=useRef(null);
  const toggleOrderSchedule=id=>{setTripTransferOrderId(previous=>previous===String(id)?'':String(id));deliveryTableScroll.current?.scrollTo?.({left:0,behavior:'instant'});};
  const columnWidthKey='scf_delivery_column_widths_v739_'+String(currentUser?.id||currentUser?.username||'guest');
  const [columnPreferences,setColumnPreferences]=useState(()=>({key:columnWidthKey,widths:scfDeliveryReadColumnWidths(columnWidthKey)}));
  const [tableViewportWidth,setTableViewportWidth]=useState(0);
  useEffect(()=>{setColumnPreferences(previous=>previous.key===columnWidthKey?previous:{key:columnWidthKey,widths:scfDeliveryReadColumnWidths(columnWidthKey)});},[columnWidthKey]);
  const customColumnWidths=columnPreferences.key===columnWidthKey?columnPreferences.widths:{};
  const resizeColumn=(key,width)=>setColumnPreferences(previous=>{
    const widths={...(previous.key===columnWidthKey?previous.widths:scfDeliveryReadColumnWidths(columnWidthKey))};
    if(width===null)delete widths[key];else widths[key]=scfDeliveryColumnWidth(key,width);
    try{localStorage.setItem(columnWidthKey,JSON.stringify(widths));}catch(_){}
    return {key:columnWidthKey,widths};
  });
  useEffect(()=>{
    const element=deliveryTableScroll.current;if(isMobile||!element)return;
    const measure=()=>{const width=element.clientWidth;if(width>0)setTableViewportWidth(previous=>previous===width?previous:width);};
    measure();if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();
  },[isMobile]);
  useEffect(()=>{
    if(highlightOrderOnHover)return;
    const body=deliveryTableScroll.current?.querySelector('tbody');if(!body)return;
    (scfDeliveryHoverRows.get(body)||[]).forEach(row=>row.classList.toggle('delivery-order-hover',false));scfDeliveryHoverRows.delete(body);
  },[highlightOrderOnHover]);
  const normArea=v=>String(v||'').trim().replace(/\s+/g,' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').toUpperCase();
  const areaKey=v=>normArea(v).replace(/[^A-Z0-9]/g,'');
  const sameArea=(a,b)=>{
    const ak=areaKey(a), bk=areaKey(b);
    if(!ak||!bk)return false;
    if(ak==='CHUAPHANKHUVUC'||bk==='CHUAPHANKHUVUC')return false;
    return ak===bk||ak.includes(bk)||bk.includes(ak);
  };
  const {pointMatchById,pointMatchByName,orderContext}=React.useMemo(()=>{
  const pointMatchById=new Map();
  const pointMatchByName=new Map();
  (customers||[]).forEach(customer=>(customer.points||[]).forEach(point=>{
    const match={customer,point};
    if(point.id)pointMatchById.set(String(point.id),match);
    const nameKey=normalizeLookupText(point.name||'');
    if(nameKey){
      if(!pointMatchByName.has(nameKey))pointMatchByName.set(nameKey,match);
      else pointMatchByName.set(nameKey,null);
    }
  }));
  const contextCache=new WeakMap();
  const orderContext=o=>{
    if(contextCache.has(o))return contextCache.get(o);
    const resolved=findOrderPointMatch(o,customers||[]);
    const pt=resolved?.point||{};
    const cust=resolved?.customer||{};
    const ctx={
      ...o,
      deliveryTime:normalizeTimeInput(o?.deliveryTime||''),
      pointId:pt.id||o?.pointId||'',
      pointName:pt.name||o?.pointName||o?.address||'',
      address:pt.address||o?.address||'',
      area:pt.area||o?.area||'',
      customerId:o?.customerId||o?.custId||cust.id||'',
      customer:o?.customer||o?.customerName||cust.name||''
    };
    contextCache.set(o,ctx);contextCache.set(ctx,ctx);return ctx;
  };
  return {pointMatchById,pointMatchByName,orderContext};
  },[customers]);
  const tripById=React.useMemo(()=>new Map((trips||[]).map(trip=>[String(trip.id||''),trip])),[trips]);
  const indexedTrips=React.useMemo(()=>deliveryTripIndex(trips),[trips]);
  const pickerTrips=React.useMemo(()=>(trips||[]).filter(t=>!['completion_pending','completed'].includes(t.status)),[trips]);
  const pickerTripsForOrder=React.useMemo(()=>{
  const selectedOptions=new Map();
  return order=>{
    const selected=tripById.get(String(order.tripId||''));
    if(!selected||!['completion_pending','completed'].includes(selected.status))return pickerTrips;
    if(!selectedOptions.has(selected))selectedOptions.set(selected,[...pickerTrips,selected]);
    return selectedOptions.get(selected);
  };
  },[pickerTrips,tripById]);
  useEffect(()=>{
    const onKey=e=>{
      if((e.ctrlKey||e.metaKey)&&!e.altKey&&String(e.key||'').toLowerCase()==='d'){
        e.preventDefault();
        if(!modal&&!print&&!invoiceView){se(null);setCopyDraft(null);sm('fastEntry');}
      }
    };
    document.addEventListener('keydown',onKey,true);
    return()=>document.removeEventListener('keydown',onKey,true);
  },[modal,print,invoiceView]);
  useEffect(()=>{setCurrentPage(1);setBulkSelected(new Set());},[q,filter,dateFilterMode,dateBasis,fDate,fDateTo,fWeek,fMonth,fPoint,fCustomer,fProduct,fTime,fArea,fTripGroup,fNote,fTripId,fTripDate,fTripShift,fTripDriver,sortMode,pageSize,auditFilter,invoiceFilter]);
  // Server notifications apply field visibility and saved trip ownership in one place.
  // Keep callers compatible without duplicate or prematurely broadcast client notices.
  const notifyDriverOrderChange=()=>{};
  const historyEntry=(action,changes=[])=>({id:'LS'+uid(),action,changes,at:fmtDT(),atIso:new Date().toISOString(),by:currentUser?.name||'Hệ thống',byId:currentUser?.id||''});
  const catalogPointChoices=React.useMemo(()=>scfDeliveryPointChoices(customers),[customers]);
  const catalogProductChoices=React.useMemo(()=>products.map(product=>({key:String(product.id),label:scfFastEntryProductLabel(product),category:isGoodsProduct(product,prodCats||[])?'HH':'TP'})),[products,prodCats]);
  const catalogContext=useRef(null);catalogContext.current={customers,products,currentUser,trips};
  const canEditCatalogOrder=order=>{
    const trip=orderTrip(order);
    return canEditMobileOrder&&!window.__SCF_ACCESS_CONTEXT?.readOnly&&!closedTrip(trip)&&!['done','cancelled','failed'].includes(order?.status)&&(!(dispatchedTrip(trip)||order?.status==='delivering')||canWithdrawStartedOrder);
  };
  const saveCatalogCell=async(base,lineIndex,kind,selection)=>{
    if(kind!=='product')throw Error('Địa điểm và ngày của đơn đã khóa. Hãy tạo đơn mới.');
    const actorId=window.__SCF_ACCESS_CONTEXT?.employeeId;
    const ensureAllowed=order=>{
      const latest=catalogContext.current,user=latest.currentUser;
      if(String(user?.id||'')!==String(currentUser?.id||'')||actorId&&String(window.__SCF_ACCESS_CONTEXT?.employeeId||'')!==String(actorId))throw Error('Tài khoản đã thay đổi. Hãy mở lại đơn.');
      if(latest.customers!==customers||latest.products!==products)throw Error('Danh mục đã cập nhật. Hãy chọn lại để kiểm tra.');
      const trip=latest.trips.find(item=>String(item.id)===String(order?.tripId||''))||orderTrip(order);
      const canEditStarted=['admin','administrator'].includes(String(user?.role||'').toLowerCase())||normalizeLookupText(user?.dept||'').includes('ke toan');
      if(!canEditCatalogOrder(order)||!canWrite(user?.role,'delivery',user?.permLevels)||closedTrip(trip)||dispatchedTrip(trip)&&!canEditStarted)throw Error('Đơn đã khóa hoặc bạn không có quyền sửa địa điểm/sản phẩm.');
    };
    const lineId=base.lines?.[lineIndex]?.id;
    const prepare=previous=>{
      const matches=previous.filter(order=>String(order.id)===String(base.id));if(matches.length!==1)throw Error('Không xác định được duy nhất đơn đích.');
      const live=matches[0];ensureAllowed(live);
      return scfDeliveryCatalogChange({live,base,kind,lineId,lineIndex,selection,customers,products,orders:previous});
    };
    const change=prepare(orders),candidate=change.order,index=change.index;
    if(candidate===orders.find(order=>String(order.id)===String(base.id)))return true;
    const effective=(order)=>order.warehouseMerged?{...order,...scfDeliveryEffectiveLine(order,order.lines[index]),lines:[order.lines[index]]}:order;
    const oldRule=getProdShiftForOrder(effective(base),prodShifts||[],customers||[]),newRule=getProdShiftForOrder(effective(candidate),prodShifts||[],customers||[]);
    const signature=rule=>JSON.stringify(rule||null),routingChanged=signature(oldRule)!==signature(newRule);
    const beforeWeight=calcOrderedWeight(base),afterWeight=calcOrderedWeight(candidate);
    const oldUnit=base.lines[lineIndex]?.unit||'',newUnit=candidate.lines[index]?.unit||'';
    const message=(kind==='point'?(base.warehouseMerged?'Đổi địa điểm riêng dòng kho vận':'Đổi địa điểm của cả đơn'):'Đổi sản phẩm dòng đang chọn')+': '+change.before+' → '+change.after+'.'
      +(kind==='product'?' Giữ số lượng hiện tại; đơn vị '+oldUnit+' → '+newUnit+'. Tổng kg đặt '+beforeWeight.toFixed(2)+' → '+afterWeight.toFixed(2)+'.':'')
      +(routingChanged?' CẢNH BÁO: quy tắc của địa điểm/sản phẩm mới đề xuất chuyến hoặc ca SX khác.':'')
      +' Giữ nguyên chuyến, TĐ/BT, ngày/ca SX và ngày/giờ tem đã lưu. Giá riêng cũ sẽ bỏ để lấy theo danh mục/báo giá phù hợp. Tiếp tục?';
    if(!await window.scfConfirm(message,routingChanged?'Kiểm tra chuyến và lịch SX':'Xác nhận sửa đơn'))return false;
    let failure=null;
    ReactDOM.flushSync(()=>setOrders(previous=>{
      try{const result=prepare(previous),live=previous.find(order=>String(order.id)===String(base.id)),stamp=fmtDT();
        const updated={...result.order,updatedAt:stamp,updatedBy:currentUser?.name||'',orderHistory:[...(live.orderHistory||[]),historyEntry('Sửa trực tiếp '+(kind==='point'?'địa điểm':'sản phẩm'),[result.before+' → '+result.after,...(routingChanged?['Đã xác nhận cảnh báo; giữ chuyến và lịch SX/tem đã lưu']:[])])]};
        return previous.map(order=>order===live?updated:order);
      }catch(error){failure=error;return previous;}
    }));
    if(failure)throw failure;
    window.showToast('Đã sửa trên máy, đang đồng bộ.','info');return true;
  };
  const [lastCellEdit,setLastCellEdit]=useState(null);
  const saveLineQuantity=(base,lineIndex,field,value)=>{
    if(!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly)throw new Error('Tài khoản chỉ có quyền xem đơn hàng.');
    let failure=null,updated=null;
    const stamp=fmtDT(),audit=historyEntry(field==='qtyDelivered'?'Sửa số lượng đã giao':'Sửa nhanh số lượng');
    // Commit one field against the latest state. No trip reassignment or full-list sync.
    ReactDOM.flushSync(()=>setOrders(previous=>{
      try{
        const matches=previous.filter(order=>String(order.id)===String(base.id));
        if(matches.length>1)throw new Error('Mã đơn bị trùng. Cần kiểm tra đơn trước khi sửa nhanh.');
        const live=matches[0];
        const allowDelivered=field==='qtyDelivered'&&canMobileEditDelivered(live);
        if(field==='qtyDelivered'&&!allowDelivered)throw new Error('Tài khoản chưa có quyền sửa SL giao hoặc đơn đã quá thời hạn được sửa.');
        const result=mergeDeliveryLineQuantity(live,base,lineIndex,field,value,allowDelivered);
        if(field==='qtyProd')result.order=scfSyncPendingDeliveryQty(result.order,trips);
        if(!result.changes.length)return previous;
        updated={...result.order,...(field==='qtyDelivered'?{lines:result.order.lines.map((line,index)=>(base.lines?.[lineIndex]?.id?String(line.id)===String(base.lines[lineIndex].id):index===lineIndex)?{...line,deliveredAt:stamp,deliveredBy:currentUser?.name||''}:line)}:{}),updatedAt:stamp,updatedBy:currentUser?.name||'',orderHistory:[...(live.orderHistory||[]),{...audit,changes:result.changes}]};
        return previous.map(order=>order===live?updated:order);
      }catch(error){failure=error;return previous;}
    }));
    if(failure)throw failure;
    if(updated){
      notifyDriverOrderChange(updated,'Số lượng đơn hàng đã được cập nhật');
      setLastCellEdit({base:updated,lineIndex:base.lines?.[lineIndex]?.id?updated.lines.findIndex(line=>String(line.id)===String(base.lines[lineIndex].id)):lineIndex,field,value:mobileDeliveryQty(base.lines?.[lineIndex],field)});
    }
  };
  const saveLineNote=(base,lineIndex,value)=>{
    if(!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly)throw new Error('Tài khoản chỉ có quyền xem đơn hàng.');
    let failure=null,updated=null;
    const stamp=fmtDT(),audit=historyEntry('Sửa nhanh chú ý');
    ReactDOM.flushSync(()=>setOrders(previous=>{
      try{
        const matches=previous.filter(order=>String(order.id)===String(base.id));
        if(matches.length>1)throw new Error('Mã đơn bị trùng. Cần kiểm tra đơn trước khi sửa nhanh.');
        const live=matches[0],result=mergeDeliveryLineNote(live,base,lineIndex,value);
        if(!result.changes.length)return previous;
        updated={...result.order,updatedAt:stamp,updatedBy:currentUser?.name||'',orderHistory:[...(live.orderHistory||[]),{...audit,changes:result.changes}]};
        return previous.map(order=>order===live?updated:order);
      }catch(error){failure=error;return previous;}
    }));
    if(failure)throw failure;
    if(updated){notifyDriverOrderChange(updated,'Chú ý đơn hàng đã được cập nhật');setLastCellEdit({base:updated,lineIndex:lineIndex===null?null:base.lines?.[lineIndex]?.id?updated.lines.findIndex(line=>String(line.id)===String(base.lines[lineIndex].id)):lineIndex,field:'note',value:String((lineIndex===null?base:base.lines?.[lineIndex])?.note||'')});}
  };
  const lineText=order=>(order?.lines||[]).map(l=>(l.productName||l.productId||'Sản phẩm')+': '+numFmt(l.qtyInvoice??l.qtyProd??l.qty)+(l.unit?' '+l.unit:'')).join('; ');
  const orderChanges=(before,after)=>{
    const fields=[['customer','Khách hàng'],['pointName','Địa điểm'],['deliveryDate','Ngày giao'],['deliveryTime','Giờ giao'],['area','Khu vực'],['status','Trạng thái'],['tripId','Chuyến'],['note','Ghi chú']];
    const changes=fields.filter(([key])=>String(before?.[key]??'')!==String(after?.[key]??'')).map(([key,label])=>label+': '+(before?.[key]||'—')+' → '+(after?.[key]||'—'));
    const oldLines=lineText(before),newLines=lineText(after);if(oldLines!==newLines)changes.push('Hàng hóa: '+(oldLines||'—')+' → '+(newLines||'—'));
    return changes.length?changes:['Đã lưu lại nội dung đơn hàng'];
  };
  const save=d=>{
    if(!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly){window.showToast('Tài khoản chỉ có quyền xem đơn hàng.','warn');return false;}
    if(edit){try{scfAssertDeliveryIdentityLocked(edit,d);}catch(error){window.showToast(error.message,'warn');return false;}}
    let planned=prepareAutomaticTripForSave(cleanDeliveryOrderRecord(d));
    // A copied order keeps the source assignment instead of being routed again on save.
    if(!edit&&copyDraft){
      const copiedTrip=tripById.get(String(d.tripId||''));
      planned={...planned,tripId:d.tripId||null,tripAssignMode:d.tripAssignMode==='manual'?'manual':'auto',status:d.tripId?(copiedTrip?.status==='active'?'delivering':'assigned'):'pending'};
    }
    const duplicate=edit?null:findExistingDeliveryOrder(orders,planned);
    if(duplicate){window.showToast(duplicateDeliveryOrderMessage(planned,duplicate),'warn',10000);return false;}
    if(edit){
      const currentTrip=orderTrip(edit);
      if(dispatchedTrip(currentTrip)||closedTrip(currentTrip)||['delivering','done'].includes(edit.status)){
        planned={...planned,tripId:edit.tripId||currentTrip?.id||null,tripAssignMode:edit.tripAssignMode||'manual',status:edit.status};
      }
      const updated={...planned,id:edit.id,orderHistory:[...(edit.orderHistory||[]),historyEntry('Cập nhật đơn hàng',orderChanges(edit,planned))],updatedAt:fmtDT(),updatedBy:currentUser?.name||''};applyOrdersAndTripSync(p=>p.map(x=>x.id===edit.id?updated:x));notifyDriverOrderChange({...edit,...updated,id:edit.id},'Đơn hàng trong chuyến đã được cập nhật');
    }
    else{const datePart=(planned.deliveryDate||fmtDate()).split('/').slice(0,2).join('');const creatorCode=String(currentUser?.id||currentUser?.username||'NV').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(-8)||'NV';let id='DGH'+datePart+'-'+creatorCode+'-'+String(oSeq++).padStart(3,'0');while(findExistingDeliveryOrderId(orders,id))id='DGH'+datePart+'-'+creatorCode+'-'+String(oSeq++).padStart(3,'0');const clean={...planned};delete clean.copySourceId;const created={...clean,id,warehouseMergePending:false,createdAt:fmtDate(),createdBy:currentUser?.name||'',orderHistory:[historyEntry(copyDraft?'Tạo đơn từ bản sao':'Tạo đơn hàng',[(copyDraft?'Sao chép từ đơn '+copyDraft.copySourceId+'. ':'')+'Địa điểm: '+(clean.pointName||clean.customer||'—'),'Hàng hóa: '+(lineText(clean)||'—')])]};applyOrdersAndTripSync(p=>[...p,created]);if(copyDraft)window.showToast('Đã tạo đơn mới từ bản sao '+copyDraft.copySourceId+'.','success');}
    sm(null);se(null);setCopyDraft(null);return true;
  };
  const copyOrder=order=>{
    if(!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly){window.showToast('Tài khoản chỉ có quyền xem đơn hàng.','warn');return;}
    const draft=scfInlineCopyDraft(cleanDeliveryOrderRecord(orderContext(order)));
    se(null);setCopyDraft({...draft,_inlineSourceKey:isMobile?'':order._rowKey});sm(isMobile?'f':null);
  };
  const addProductsToOrder=order=>{
    if(!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly)return;
    const source=cleanDeliveryOrderRecord(orderContext(order));
    const trip=orderTrip(source);
    if(closedTrip(trip)||['done','cancelled'].includes(source.status)){window.showToast('Đơn đã đóng, không thể thêm sản phẩm.','warn');return;}
    if((dispatchedTrip(trip)||source.status==='delivering')&&!canWithdrawStartedOrder){window.showToast('Đơn đang giao, cần Admin hoặc kế toán cập nhật.','warn');return;}
    setCopyDraft({...scfInlineCopyDraft(source),_inlineSourceKey:order._rowKey,_appendToId:source.id,lines:[{id:uid(),productId:'',productName:'',qtyInvoice:'',qtyProd:'',qtyDelivered:''}]});se(null);sm(null);
  };
  const saveAddedProducts=draft=>{
    if(!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly)throw new Error('Tài khoản chỉ có quyền xem đơn hàng.');
    const lines=scfValidateInlineLines(draft.lines,products);
    let saved=null,failure=null;
    ReactDOM.flushSync(()=>applyOrdersAndTripSync(previous=>{
      try{
        const live=previous.find(order=>String(order.id)===String(draft._appendToId));
        if(!live)throw new Error('Đơn không còn tồn tại.');
        const trip=orderTrip(live);
        if(closedTrip(trip)||['done','cancelled'].includes(live.status))throw new Error('Đơn đã đóng, không thể thêm sản phẩm.');
        if((dispatchedTrip(trip)||live.status==='delivering')&&!canWithdrawStartedOrder)throw new Error('Đơn đang giao, cần Admin hoặc kế toán cập nhật.');
        const merged=scfAppendDeliveryLines(live,lines);
        if(merged===live)return previous;
        const addedLines=scfFastEntryInheritSchedule(live,lines);
        saved={...live,lines:[...(live.lines||[]),...addedLines],updatedAt:fmtDT(),updatedBy:currentUser?.name||'',orderHistory:[...(live.orderHistory||[]),historyEntry('Thêm sản phẩm',lines.map(line=>line.productName+' · SL HĐ: '+line.qtyInvoice+' · SL đặt: '+line.qtyProd))]};
        return previous.map(order=>String(order.id)===String(live.id)?saved:order);
      }catch(error){failure=error;return previous;}
    }));
    if(failure)throw failure;
    if(saved)notifyDriverOrderChange(saved,'Đơn hàng được thêm sản phẩm');
    setCopyDraft(null);window.showToast('Đã thêm sản phẩm vào đơn hiện có.','success');return true;
  };
  const saveFastEntries=entries=>{
    if(!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly)throw Error('Tài khoản chỉ có quyền xem.');
    let failure=null;
    ReactDOM.flushSync(()=>applyOrdersAndTripSync(previous=>{
      try{
        let next=[...previous];const created=new Map();
        for(const item of entries){
          const draft=item.draft,matches=scfFastEntryMatches(previous,draft);
          const identity=JSON.stringify([draft.customerId,draft.pointId,draft.deliveryDate,draft.deliveryTime]);
          let live=item.target?next.find(order=>String(order.id)===item.target):created.get(identity);
          if(item.target&&!matches.some(order=>String(order.id)===item.target))throw Error('Đơn đích đã thay đổi ngày, địa điểm hoặc giờ. Hãy xem trước lại.');
          if(!item.target&&matches.length)throw Error('Vừa có đơn cùng ngày, địa điểm và giờ được thêm ở nơi khác. Hãy xem trước lại.');
          const lines=scfValidateInlineLines(draft.lines,products);
          if(live){
            const trip=orderTrip(live);
            if(closedTrip(trip)||['done','cancelled'].includes(live.status))throw Error('Đơn '+live.id+' đã đóng.');
            if((dispatchedTrip(trip)||live.status==='delivering')&&!canWithdrawStartedOrder)throw Error('Bạn chưa có quyền thêm vào đơn đang giao.');
            if(lines.some(line=>(live.lines||[]).some(old=>String(old.productId)===String(line.productId)))&&!item.separate)throw Error('Trùng sản phẩm tại '+draft.pointName+'. Hãy xác nhận thêm dòng riêng hoặc sửa số cũ.');
            const inherited=scfFastEntryInheritSchedule(live,lines);
            const updated={...live,lines:[...(live.lines||[]),...inherited],updatedAt:fmtDT(),updatedBy:currentUser?.name||'',orderHistory:[...(live.orderHistory||[]),historyEntry('Thêm sản phẩm bằng nhập nhanh',lines.map(line=>line.productName+' · SL đặt '+line.qtyProd+' · SL HĐ '+line.qtyInvoice))]};
            next=next.map(order=>order===live?updated:order);if(created.has(identity))created.set(identity,updated);
          }else{
            const planned=prepareAutomaticTripForSave({...draft,lines,productionScheduleVersion:2});
            const allocated=allocateImportedDeliveryOrderIds(next,[planned],currentUser)[0];
            const order={...allocated,warehouseMergePending:false,createdAt:fmtDate(),createdBy:currentUser?.name||'',updatedAt:fmtDT(),updatedBy:currentUser?.name||'',orderHistory:[historyEntry('Tạo đơn bằng nhập nhanh',lines.map(line=>line.productName+' · SL đặt '+line.qtyProd+' · SL HĐ '+line.qtyInvoice))]};
            next.push(order);created.set(identity,order);
          }
        }return next;
      }catch(error){failure=error;return previous;}
    }));
    if(failure)throw failure;
    window.showToast('Đã lưu '+entries.length+' dòng trên máy; đang đồng bộ lên máy chủ.','info');
  };
  const previewWarehousePaste=drafts=>{
    // Feed the established importer so PAC occurrence checks, conversion and grouping stay identical.
    const grouped=new Map();
    drafts.forEach((draft,index)=>{const key=JSON.stringify([draft.customerId,draft.pointId,draft.deliveryDate,draft.deliveryTime]);if(grouped.has(key))grouped.get(key).lines.push(...draft.lines);else grouped.set(key,{...draft,id:'PASTE'+index,_importRow:index+1,lines:[...draft.lines]});});
    const newOrders=[...grouped.values()];
    window._importData={newOrders,dupOrders:newOrders.filter(order=>findExistingDeliveryOrder(orders,order)),unknownPts:[],incompleteOrders:[],suspiciousDateRows:[]};sm('importPreview');
  };
  const saveRecognizedInline=async draft=>{
    if(draft._appendToId){
      const live=orders.find(order=>String(order.id)===String(draft._appendToId));
      if(draft.lines.some(line=>(live?.lines||[]).some(old=>String(old.productId)===String(line.productId)))&&!await window.scfConfirm('Sản phẩm đã có trong đơn. Xác nhận thêm một dòng riêng, không cộng vào số cũ?','Trùng sản phẩm'))return false;
      return saveAddedProducts(draft);
    }
    if(draft.warehouseMerged)return save(draft);
    const matches=scfFastEntryMatches(orders,draft);
    if(matches.length>1)throw Error('Có nhiều đơn cùng ngày, địa điểm và giờ. Dùng Nhập nhanh để chọn đúng đơn đích.');
    if(matches.length===1){
      const duplicate=draft.lines.some(line=>(matches[0].lines||[]).some(old=>String(old.productId)===String(line.productId)));
      if(!await window.scfConfirm((duplicate?'Sản phẩm đã có. Bạn muốn thêm dòng riêng vào đơn ':'Thêm sản phẩm vào đơn ')+matches[0].id+' · '+draft.pointName+' · '+draft.deliveryDate+' '+draft.deliveryTime+'?','Xác nhận đơn đích'))return false;
      saveFastEntries([{draft,target:String(matches[0].id),separate:duplicate}]);setCopyDraft(null);return true;
    }
    if(!await window.scfConfirm('Tạo đơn mới: '+draft.deliveryDate+' · '+draft.pointName+' · '+draft.deliveryTime+'?','Xác nhận đơn mới'))return false;
    return save(draft);
  };
  const del=async id=>{
    const old=orders.find(x=>x.id===id);
    if(!canDel(currentUser.role,'delivery',currentUser.permLevels)||!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly){window.showToast('Tài khoản không có quyền xóa đơn.','warn');return;}
    const currentTrip=orderTrip(old);
    if(!scfCanDeleteDeliveryOrder(currentUser,old,currentTrip)){window.showToast('Đơn đã giao hoặc đã ngoài giới hạn ngày được xóa.','warn');return;}
    if(dispatchedTrip(currentTrip)||closedTrip(currentTrip)||['delivering','done'].includes(old?.status)){
      window.showToast('Không thể xóa đơn đang giao hoặc đã giao. Kế toán cần rút đơn và lưu lý do trước.','warn');return;
    }
    if(await window.scfConfirm('Bạn có chắc muốn xóa đơn hàng này?','Xóa đơn hàng',true)){
      if(old)notifyDriverOrderChange(old,'Một đơn hàng đã bị xóa khỏi chuyến');
      applyOrdersAndTripSync(p=>p.filter(x=>x.id!==id));
    }
  };
  const sts=[['all','Tất cả'],['pending','Chờ xếp'],['assigned','Đã xếp'],['delivering','Đang giao'],['done','Đã giao'],['failed','Giao lỗi'],['cancelled','Hủy']];
  const getArea=o=>{
    const direct=String(o?.area||'').trim();
    if(direct&&areaKey(direct)!=='CHUAPHANKHUVUC')return direct;
    const resolved=findOrderPointMatch(o,customers||[]);
    const areaFromPoint=String(resolved?.point?.area||'').trim();
    if(areaFromPoint&&areaKey(areaFromPoint)!=='CHUAPHANKHUVUC')return areaFromPoint;
    return '';
  };
  const tripMatchesShift=(trip,shiftId,shiftName)=>{
    const desiredId=String(shiftId||'').trim();
    const desiredName=normalizeLookupText(shiftName||'');
    const tripId=String(trip?.shiftId||'').trim();
    const tripName=normalizeLookupText(trip?.shiftName||'');
    return desiredId?tripId===desiredId:(!!desiredName&&tripName===desiredName);
  };
  const autoTripForOrder=(o,plannedProdShift)=>{
    const ctx=orderContext(o);
    const configuredProdShift=plannedProdShift||getProdShiftForOrder(ctx,prodShifts||[],customers||[]);
    if(!configuredProdShift)return null;
    const preferredDate=addDaysVN(ctx.deliveryDate,Number(configuredProdShift.tripDateOffset??0));
    const configuredShiftId=String(configuredProdShift.tripShiftId||'').trim();
    const configuredShiftName=normalizeLookupText(configuredProdShift.tripShiftName||'');
    // Ca SX chưa cấu hình ca giao thì giữ đơn ở Chờ xếp.
    // Không tự suy đoán theo khu vực hoặc theo một chuyến bất kỳ cùng ngày.
    if(!configuredShiftId&&!configuredShiftName)return null;
    const configuredShiftByName=configuredShiftName?(shifts||[]).find(s=>normalizeLookupText(s?.name||'')===configuredShiftName):null;
    const configuredShiftById=configuredShiftId?(shifts||[]).find(s=>String(s?.id||'')===configuredShiftId):null;
    const configuredShift=configuredShiftByName||configuredShiftById;
    if(!configuredShift||configuredShift.active===false)return null;
    const preferredShiftId=String(configuredShift.id||'');
    const preferredShiftName=String(configuredShift.name||'');
    if(!preferredDate)return null;
    const candidates=indexedTrips.candidates(preferredDate,preferredShiftId).filter(t=>tripMatchesShift(t,preferredShiftId,preferredShiftName));
    if(!candidates.length)return null;
    return candidates.find(t=>String(t.id||'')===String(o.tripId||''))||candidates[0]||null;
  };
  // Hai bộ lọc SS TN / ĐT được phân loại theo ca của chuyến, không theo khu
  // vực điểm giao. Nhờ vậy đơn thuộc khu vực SS TN nhưng đang nằm trong một
  // chuyến ĐT sẽ không còn xuất hiện sai nhóm.
  const samsungTripShiftOrder=['SS T1','VP ĐÊM','SS T2','YP QV','SS S1','SS S2','VP NGÀY','SS C'];
  const samsungTripShiftRank=new Map(samsungTripShiftOrder.map((name,index)=>[normalizeLookupText(name),index]));
  const deliveryTripCache=React.useMemo(()=>new WeakMap(),[trips,prodShifts,customers,shifts]);
  const deliveryTripForOrder=o=>{
    if(deliveryTripCache.has(o))return deliveryTripCache.get(o);
    const ctx=orderContext(o);
    const storedTrip=ctx.tripId?tripById.get(String(ctx.tripId)):null;
    // Display the saved assignment. Automatic planning changes tripId itself;
    // rendering a predicted assignment here made this page disagree with Trips.
    const trip=storedTrip||(!ctx.tripId&&ctx.tripAssignMode!=='manual'?manualTripForOrder(trips,ctx):null);
    deliveryTripCache.set(o,trip);return trip;
  };
  const deliveryTripShiftName=o=>{
    const ctx=orderContext(o);
    return String(deliveryTripForOrder(ctx)?.shiftName||getOrderTripShiftName(ctx,prodShifts||[])||'').trim();
  };
  const samsungTripOrder=o=>samsungTripShiftRank.get(normalizeLookupText(deliveryTripShiftName(o)));
  const matchesAreaOrTripGroup=o=>{
    if(!fArea)return true;
    const selectedArea=areaKey(fArea);
    if(['SSTN','DT'].includes(selectedArea)&&!deliveryTripForOrder(o))return true;
    if(selectedArea==='SSTN')return samsungTripOrder(o)!==undefined;
    const trip=deliveryTripForOrder(o);
    const shiftName=normalizeLookupText(trip?.shiftName||getOrderTripShiftName(o,prodShifts||[]));
    const tripArea=areaKey(trip?.area||'');
    const orderArea=areaKey(getArea(o));
    if(selectedArea==='DT')return tripArea==='DT'||/^dt(?:\s|$)/.test(shiftName)||(!trip&&orderArea==='DT');
    if(selectedArea==='KV')return tripArea==='KV'||/^kv(?:\s|$)/.test(shiftName)||(!trip&&orderArea==='KV');
    return orderArea===selectedArea;
  };
  const prepareAutomaticTripForSave=d=>{
    const linked=tripById.get(String(d?.tripId||''));
    if(!['pending','assigned',''].includes(String(d?.status||''))||linked&&(linked.driverDispatchedAt||['active','completion_pending','completed','cancelled'].includes(linked.status)))return d;
    const ctx=orderContext(d);
    const manualProdShift=d?.prodShiftAssignMode==='manual'&&d?.prodShiftId?(prodShifts||[]).find(s=>String(s?.id||'')===String(d.prodShiftId)):null;
    const plannedShift=getProdShiftForOrder(ctx,prodShifts||[],customers||[]);
    if(d?.tripAssignMode==='manual')return scfApplyAutomaticProduction(d,plannedShift);
    const nextCtx=manualProdShift?{...ctx,prodShiftAssignMode:'manual',prodShiftId:manualProdShift.id}:{...ctx,prodShiftAssignMode:'auto',prodShiftId:plannedShift?.id||''};
    const autoTrip=plannedShift?autoTripForOrder(nextCtx,plannedShift):null;
    const tripId=autoTrip?.id||null,status=autoTrip?'assigned':'pending';
    const next=String(d.tripId||'')===String(tripId||'')&&d.status===status&&d.tripAssignMode==='auto'?d:{...d,tripAssignMode:'auto',tripId,status};
    return scfApplyAutomaticProduction(next,plannedShift);
  };
  const syncTripOrderIds=nextOrders=>{
    const members=new Map();
    (nextOrders||[]).forEach(order=>{const ids=members.get(order.tripId)||[];ids.push(order.id);members.set(order.tripId,ids);});
    setTrips(prevTrips=>{
      let changed=false;
      const nextTrips=(prevTrips||[]).map(t=>{
        const desired=members.get(t.id)||[];
        const current=t.orderIds||[];
        if(desired.length!==current.length||desired.some((id,idx)=>id!==current[idx])){
          changed=true;
          return {...t,orderIds:desired};
        }
        return t;
      });
      return changed?nextTrips:prevTrips;
    });
  };
  // App tự đồng bộ kế hoạch sau tải/tạo/import; thao tác ở tab dùng cùng quy tắc.
  const applyOrdersAndTripSync=updater=>{
    setOrders(prev=>{
      const nextOrders=typeof updater==='function'?updater(prev):updater;
      syncTripOrderIds(nextOrders);
      return nextOrders;
    });
  };
  useEffect(()=>{
    if(!(orders||[]).some(order=>deliveryOrderStatusForTrip(order,tripById.get(String(order.tripId||'')))!==order.status))return;
    applyOrdersAndTripSync(prev=>prev.map(order=>{
      const status=deliveryOrderStatusForTrip(order,tripById.get(String(order.tripId||'')));
      return status===order.status?order:{...order,status,orderHistory:[...(order.orderHistory||[]),historyEntry('Đồng bộ trạng thái xếp chuyến',['Chuyến: '+order.tripId,'Trạng thái: '+(order.status||'—')+' → '+status])],updatedAt:fmtDT(),updatedBy:currentUser?.name||''};
    }));
  },[orders,trips]);
  const orderTrip=order=>manualTripForOrder(trips,order);
  const startedTrip=trip=>trip?.status==='active';
  const dispatchedTrip=trip=>!!trip?.driverDispatchedAt||startedTrip(trip);
  const closedTrip=trip=>['completion_pending','completed'].includes(trip?.status);
  const canMobileEditDelivered=order=>{
    if(['admin','administrator'].includes(String(currentUser?.role||'').trim().toLowerCase()))return true;
    const trip=orderTrip(order),limitDays=tripActualQtyLimitDays(currentUser);
    if(!canTripAction(currentUser,'orderActualQty')||closedTrip(trip)||trip?.status==='cancelled'||['done','cancelled'].includes(order?.status))return false;
    const isDriver=currentUser?.role==='driver'||employeeHasDepartment(currentUser,'Lái xe');
    if(isDriver&&(!trip||!(String(trip.driverId||'')===String(currentUser?.id||'')||normalizeLookupText(trip.driverName)===normalizeLookupText(currentUser?.name))))return false;
    const iso=toIsoDate(trip?.deliveryDate||order?.deliveryDate),now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const age=iso?Math.floor((today-new Date(iso+'T00:00:00'))/86400000):0;
    return limitDays===0||age<limitDays||(isDriver&&!!trip?.driverConfirmedAt);
  };
  const saveMobileProduction=async(base,index,plan,field,value)=>{
    if(!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly)throw new Error('Tài khoản chỉ có quyền xem đơn hàng.');
    let saved=null,failure=null;
    ReactDOM.flushSync(()=>setOrders(previous=>{
      try{
        const live=previous.find(order=>String(order.id)===String(base.id));
        if(!live)throw new Error('Đơn không còn tồn tại.');
        const trip=orderTrip(live);
        if(closedTrip(trip)||['done','cancelled'].includes(live.status))throw new Error('Đơn đã đóng, không thể đổi thông tin SX.');
        if((dispatchedTrip(trip)||live.status==='delivering')&&!canWithdrawStartedOrder)throw new Error('Đơn đang giao, cần Admin hoặc kế toán cập nhật.');
        const livePlans=productionDisplayForOrder(live).plans||[];
        const requested=field==='mode'&&value==='auto'?scfRequestTripProduction({...live,prodShiftAssignMode:'auto'},trips):live;
        const autoPlan=prodShiftPlansForOrder({...requested,prodShiftAssignMode:'auto',prodShiftId:'',prodDate:'',prodTime:'',labelDate:'',labelTime:'',lines:(live.lines||[]).map(line=>({...line,shiftOverride:false}))},prodShifts||[],prodShiftRules||[])[0]||{};
        const automatic=Object.fromEntries(['prodDate','prodTime','labelDate','labelTime'].map(key=>[key,autoPlan[key]||'']));
        const merged=scfMergeMobileProduction(live,base,index,plan,field,value,livePlans,automatic);
        const updated=merged!==live&&field==='mode'&&value==='auto'?scfRequestTripProduction(merged,trips):merged;
        if(updated===live)return previous;
        saved={...updated,updatedAt:fmtDT(),updatedBy:currentUser?.name||'',orderHistory:[...(live.orderHistory||[]),historyEntry('Sửa thông tin SX trên điện thoại',[(base.lines?.[index]?.productName||'Sản phẩm')+' · '+field+': '+value])]};
        return previous.map(order=>String(order.id)===String(live.id)?saved:order);
      }catch(error){failure=error;return previous;}
    }));
    if(failure)throw failure;
    if(saved)notifyDriverOrderChange(saved,'Thông tin sản xuất của đơn đã được cập nhật');
    await window.scfFlushPendingWrites?.();
    const confirmed=window.scfWaitForCollectionSync?await window.scfWaitForCollectionSync('scf_orders',50000):!serverAuthEnabled();
    if(!confirmed){window.showToast('Thông tin SX đang chờ máy chủ xác nhận.','warn');return false;}
    return true;
  };
  const saveMobileOrder=async(base,draft)=>{
    if(!canEditMobileOrder)throw new Error('Tài khoản chỉ có quyền xem đơn hàng.');
    const live=(orders||[]).find(order=>String(order.id)===String(base.id));
    const result=mergeMobileDeliveryOrder(live,base,draft,canMobileEditDelivered(live));
    if(!result.changes.length)return;
    const currentTrip=orderTrip(live),keepTrip=dispatchedTrip(currentTrip)||closedTrip(currentTrip)||['delivering','done'].includes(live.status);
    let updated=result.scheduleChanged?prepareAutomaticTripForSave(result.order):result.order;
    if(keepTrip)updated={...updated,tripId:live.tripId||currentTrip?.id||null,tripAssignMode:live.tripAssignMode||'manual',status:live.status};
    // Existing orders may share a delivery slot; creation still checks duplicates.
    const stamp=fmtDT(),actor=currentUser?.name||'';
    updated={...updated,lines:updated.lines.map((line,index)=>line.qtyDelivered!==live.lines?.[index]?.qtyDelivered?{...line,deliveredAt:stamp,deliveredBy:actor}:line),orderHistory:[...(live.orderHistory||[]),historyEntry('Sửa đơn trên điện thoại',result.changes)],updatedAt:stamp,updatedBy:actor};
    applyOrdersAndTripSync(previous=>previous.map(order=>String(order.id)===String(live.id)?updated:order));
    notifyDriverOrderChange(updated,'Đơn hàng trong chuyến đã được cập nhật');
    await new Promise(resolve=>setTimeout(resolve,0));
    const confirmed=await(window.scfWaitForCollectionSync?.('scf_orders',15000)??Promise.resolve(false));
    window.showToast(confirmed?'Máy chủ đã lưu đơn.':'Đơn đã cập nhật trên máy và đang chờ đồng bộ.',confirmed?'success':'warn',7000);
  };
  const saveGridDeliveryTime=(base,lineIndex,field,value)=>{
    if(!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly)throw Error('Tài khoản chỉ có quyền xem đơn hàng.');
    const time=mobileDeliveryTime(value);if(!time)throw Error('Giờ giao phải hợp lệ, ví dụ 08:00 hoặc 8:00.');
    let failure=null,updated=null;
    ReactDOM.flushSync(()=>setOrders(previous=>{
      try{
        const matches=previous.filter(o=>String(o.id)===String(base.id));if(matches.length!==1)throw Error('Không xác định được đơn duy nhất. Hãy tải lại danh sách.');
        const live=matches[0],trip=orderTrip(live);
        if(live.warehouseMerged)throw Error('Đơn kho vận cần chỉnh giờ tại đơn nguồn.');
        if(closedTrip(trip)||['done','cancelled'].includes(live.status))throw Error('Đơn đã đóng, không thể đổi giờ giao.');
        if((dispatchedTrip(trip)||live.status==='delivering')&&!canWithdrawStartedOrder)throw Error('Đơn đang giao, cần Admin hoặc kế toán cập nhật.');
        if(mobileDeliveryTime(live.deliveryTime)===time)return previous;
        if(mobileDeliveryTime(live.deliveryTime)!==mobileDeliveryTime(base.deliveryTime))throw Error('Giờ giao đã được sửa ở nơi khác. Hãy mở lại ô.');
        let next=prepareAutomaticTripForSave({...live,deliveryTime:time});
        if(dispatchedTrip(trip)||live.status==='delivering')next={...next,tripId:live.tripId,tripAssignMode:live.tripAssignMode,status:live.status};
        // Editing an existing order may share a delivery slot with another order.
        updated={...next,updatedAt:fmtDT(),updatedBy:currentUser?.name||'',orderHistory:[...(live.orderHistory||[]),historyEntry('Sửa nhanh giờ giao',[(live.deliveryTime||'—')+' → '+time])]};
        const result=previous.map(o=>o===live?updated:o);syncTripOrderIds(result);return result;
      }catch(error){failure=error;return previous;}
    }));
    if(failure)throw failure;if(updated)notifyDriverOrderChange(updated,'Giờ giao của đơn hàng đã được cập nhật');
  };
  const notifyTripDriverChange=(trip,title,order,message)=>{
    if(!trip||(!trip.driverDispatchedAt&&!['active','completion_pending','completed'].includes(trip.status)))return;
    const driverId=trip.driverId||(employees||[]).find(e=>normalizeLookupText(e.name)===normalizeLookupText(trip.driverName))?.id;
    if(driverId)notify?.({recipientId:driverId,title,message:(order.pointName||order.customer||order.id)+' · '+message,icon:'ti-package',sourceType:'order',sourceId:order.id,targetPage:'trips'});
  };
  const setOrderTripMode=(order,mode)=>{
    const currentTrip=orderTrip(order);
    if(closedTrip(currentTrip)){window.showToast('Chuyến đã chờ duyệt hoặc hoàn thành nên không thể đổi cách xếp.','warn');return;}
    if(dispatchedTrip(currentTrip)&&!canWithdrawStartedOrder){window.showToast('Đơn đã giao lái xe. Chỉ Kế toán hoặc Admin được rút/chuyển đơn.','warn');return;}
    if(dispatchedTrip(currentTrip)&&mode==='auto'){window.showToast('Đơn đã giao lái xe chỉ được Kế toán/Admin rút hoặc chuyển bằng chế độ chọn tay.','warn');return;}
    if(mode==='manual'){
      const currentTripId=order.tripId||autoTripForOrder(order)?.id||null;
      applyOrdersAndTripSync(prev=>prev.map(x=>x.id===order.id?{...x,tripAssignMode:'manual',tripId:currentTripId,status:startedTrip(currentTrip)?'delivering':currentTripId?'assigned':'pending',orderHistory:[...(x.orderHistory||[]),historyEntry('Đổi cách xếp chuyến',['Tự động → Thủ công','Chuyến: '+(currentTripId||'Chưa xếp')])],updatedAt:fmtDT(),updatedBy:currentUser?.name||''}:x));
      return;
    }
    const autoTrip=autoTripForOrder({...order,tripId:null,tripAssignMode:'auto'});
    applyOrdersAndTripSync(prev=>prev.map(x=>x.id===order.id?{...x,tripAssignMode:'auto',tripId:autoTrip?.id||null,status:autoTrip?'assigned':'pending',orderHistory:[...(x.orderHistory||[]),historyEntry('Đổi cách xếp chuyến',['Thủ công → Tự động','Chuyến: '+(order.tripId||'—')+' → '+(autoTrip?.id||'Chưa xếp')])],updatedAt:fmtDT(),updatedBy:currentUser?.name||''}:x));
  };
  const confirmManualTripSave=async(orderId,newTripId,expectedProduction)=>{
    // Chờ React ghi thay đổi vào hàng đồng bộ trước khi kiểm tra kết quả.
    await new Promise(resolve=>setTimeout(resolve,0));
    const confirmed=!serverAuthEnabled()||await window.scfWaitForOrderTripSync?.(orderId,newTripId,expectedProduction,50000);
    const exact=!!confirmed;
    if(confirmed&&exact){window.showToast(expectedProduction?'Máy chủ đã xác nhận chuyến và ca SX.':newTripId?'Máy chủ đã xác nhận chuyển chuyến.':'Máy chủ đã xác nhận rút đơn khỏi chuyến.','success');return true;}
    const syncFailure=window.scfGetSyncReport?.()?.items?.find(item=>item.key==='scf_orders')?.errorMessage;
    if(syncFailure)throw Error(syncFailure+' Đơn vẫn được giữ trong hàng chờ; không cần tạo lại đơn.');
    window.showToast('Máy chủ chưa xác nhận chuyển chuyến. Thay đổi vẫn đang chờ đồng bộ; hãy thử xác nhận lại.','warn',10000);
    return false;
  };
  const assignTripManually=async(order,newTripId,productionSelection)=>{
    if(!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly)return false;
    const hasProductionChange=productionSelection&&productionSelection.mode!=='keep';
    const productionRules=prodShiftRules?.length?prodShiftRules:DEF_PROD_SHIFT_RULES;
    if(hasProductionChange){
      const source=orderTrip(order),target=tripById.get(String(newTripId));
      if(dispatchedTrip(source)||dispatchedTrip(target)){window.showToast('Ca SX đã khóa vì chuyến đã giao lái xe.','warn');return false;}
      scfTransferProduction(order,productionSelection,productionRules);
    }
    const requestedProduction=hasProductionChange?scfTransferProduction(order,productionSelection,productionRules):null;
    let expectedProduction=!requestedProduction?undefined:productionSelection.mode==='auto'?{prodShiftAssignMode:'auto'}:
      {prodShiftAssignMode:'manual',prodWorkShiftId:requestedProduction.prodWorkShiftId,prodDate:requestedProduction.prodDate,prodTime:requestedProduction.prodTime,...(productionSelection.labelDate!==undefined?{labelDate:requestedProduction.labelDate,labelTime:requestedProduction.labelTime}:{})};
    if(hasProductionChange&&productionSelection.mode==='auto'&&!scfTripProductionPlan({...order,tripId:newTripId,prodShiftAssignMode:'auto',productionScheduleVersion:2},getProdShiftForOrder(orderContext(order),prodShifts||[],customers||[]),trips,productionRules)){
      window.showToast('Chuyến mới chưa có lịch ca SX phù hợp. Hãy chọn ca SX cụ thể.','warn');return false;
    }
    const applyProduction=changed=>{
      if(!hasProductionChange)return changed;
      let next=scfTransferProduction(changed,productionSelection,productionRules);
      if(productionSelection.mode==='auto')next=scfApplyAutomaticProduction(next,getProdShiftForOrder(orderContext(next),prodShifts||[],customers||[]),trips);
      expectedProduction=productionSelection.mode==='auto'?{prodShiftAssignMode:'auto'}:{prodShiftAssignMode:'manual',prodWorkShiftId:next.prodWorkShiftId,prodDate:next.prodDate,prodTime:next.prodTime,...(productionSelection.labelDate!==undefined?{labelDate:next.labelDate,labelTime:next.labelTime}:{})};
      return {...next,orderHistory:[...(next.orderHistory||[]),historyEntry('Đổi ca SX khi chuyển chuyến',[productionSelection.mode==='auto'?'Ca SX: Tự động theo chuyến mới':'Ca SX: '+(productionRules.find(r=>String(r.id)===String(productionSelection.ruleId))?.name||'')+' · Ngày SX: '+next.prodDate+(productionSelection.labelDate!==undefined?' · In tem: '+next.labelDate+' '+next.labelTime:'')])]};
    };
    const oldTrip=orderTrip(order);
    const oldTripId=order.tripId||oldTrip?.id||'';
    const sameTrip=String(oldTripId)===String(newTripId||'');
    const sameTripStatus=newTripId?(oldTrip?.status==='active'?'delivering':'assigned'):'pending';
    if(!hasProductionChange&&sameTrip&&String(order.tripId||'')===String(newTripId||'')&&order.status===sameTripStatus&&order.tripAssignMode==='manual'){
      return confirmManualTripSave(order.id,newTripId,expectedProduction);
    }
    if(closedTrip(oldTrip)){window.showToast('Chuyến đã chờ duyệt hoặc hoàn thành nên không thể rút đơn.','warn');return false;}
    const targetTrip=(trips||[]).find(t=>String(t.id||'')===String(newTripId||''));
    if(closedTrip(targetTrip)){window.showToast('Không thể chuyển đơn vào chuyến đã chờ duyệt hoặc hoàn thành.','warn');return false;}
    if(sameTrip){
      const stamp=fmtDT();
      applyOrdersAndTripSync(prev=>prev.map(x=>x.id===order.id?applyProduction({...x,tripAssignMode:'manual',tripId:newTripId||null,status:sameTripStatus,orderHistory:[...(x.orderHistory||[]),historyEntry('Đồng bộ trạng thái xếp chuyến',['Chuyến: '+(newTripId||'Chưa xếp'),'Trạng thái: '+(x.status||'—')+' → '+sameTripStatus])],updatedAt:stamp,updatedBy:currentUser?.name||''}):x));
      return confirmManualTripSave(order.id,newTripId,expectedProduction);
    }
    const isStarted=dispatchedTrip(oldTrip)||order.status==='delivering';
    if(isStarted&&!canWithdrawStartedOrder){window.showToast('Đơn đã giao lái xe hoặc đang đi giao. Chỉ Kế toán hoặc Admin được rút/chuyển đơn.','warn');return false;}
    let reason='';
    if(isStarted){
      reason=String(window.prompt('Nhập lý do '+(newTripId?'chuyển đơn sang chuyến khác':'rút đơn khỏi chuyến đang giao')+':','')||'').trim();
      if(!reason){window.showToast('Kế toán phải nhập lý do để rút hoặc chuyển đơn đang giao.','warn');return false;}
    }
    const stamp=fmtDT();
    const nextStatus=!newTripId?'pending':targetTrip?.status==='active'?'delivering':'assigned';
    const actor=isAccounting&&!isAdmin?'Kế toán':'Admin';
    applyOrdersAndTripSync(prev=>prev.map(x=>{
      if(x.id!==order.id)return x;
      const action=isStarted?(newTripId?actor+' chuyển đơn đang giao':actor+' rút đơn khỏi chuyến đang giao'):'Đổi chuyến giao hàng';
      const changes=['Chuyến: '+(oldTripId||'Chưa xếp')+' → '+(newTripId||'Chưa xếp'),'Trạng thái: '+(x.status||'—')+' → '+nextStatus];
      if(reason)changes.push('Lý do: '+reason);
      const transfer={id:'DC'+uid(),fromTripId:oldTripId||'',toTripId:newTripId||'',reason,fromTripStatus:oldTrip?.status||'',toTripStatus:targetTrip?.status||'',at:stamp,by:currentUser?.name||'',byId:currentUser?.id||''};
      const moved={...x,tripAssignMode:'manual',tripId:newTripId||null,status:nextStatus,tripTransferHistory:[...(x.tripTransferHistory||[]),transfer],orderHistory:[...(x.orderHistory||[]),historyEntry(action,changes)],updatedAt:stamp,updatedBy:currentUser?.name||''};
      return applyProduction(newTripId&&x.prodShiftAssignMode!=='manual'?scfRequestTripProduction(moved,trips):moved);
    }));
    const confirmed=await confirmManualTripSave(order.id,newTripId,expectedProduction);
    if(confirmed){
      notifyTripDriverChange(oldTrip,newTripId?'Đơn đã được chuyển khỏi chuyến':'Đơn đã được rút khỏi chuyến',order,'Lý do: '+(reason||'Điều chỉnh chuyến'));
      if(targetTrip)notifyTripDriverChange(targetTrip,'Có đơn được chuyển vào chuyến',order,'Từ chuyến '+(oldTripId||'—')+(reason?' · Lý do: '+reason:''));
    }
    return confirmed;
  };
  const saveGroupDriver=async(tripId,driver)=>{
    if(!canChangeTripDriver)throw new Error('Tài khoản không có quyền sửa chuyến.');
    if(window.__SCF_ACCESS_CONTEXT?.readOnly)throw new Error('Dữ liệu đang ở chế độ chỉ xem. Hãy tải lại dữ liệu trước khi đổi lái xe.');
    const trip=tripById.get(String(tripId));
    if(!deliveryTripDriverEditable(trip))throw new Error('Chuyến đã giao lái xe hoặc đã kết thúc. Hãy thu hồi chuyến trước khi đổi lái xe.');
    // Dùng toàn bộ đơn trong chuyến, kể cả đơn ngoài trang và ngoài bộ lọc đang xem.
    // Cùng nguồn liên kết với dòng tổng và trang Chuyến. Không kéo lại đơn
    // đã rút bằng tay hoặc thuộc chuyến khác từ danh sách mã đơn cũ.
    const members=orders.filter(order=>order.status!=='cancelled'&&String(deliveryTripForOrder(order)?.id||'')===String(tripId));
    const memberIds=members.map(order=>order.id);
    const alreadySaved=String(trip.driverId||'')===String(driver.id)&&String(trip.driverName||'')===String(driver.name||'')&&trip.driverAssignMode==='manual'&&members.every(order=>String(order.tripId||'')===String(tripId)&&order.tripAssignMode==='manual');
    if(!alreadySaved){
      const result=deliveryTripDriverChange(trip,driver,orders,memberIds,currentUser);
      const changedOrders=new Map(result.orders.filter((order,index)=>order!==orders[index]).map(order=>[String(order.id),order]));
      setOrders(prev=>prev.map(order=>{
        const changed=changedOrders.get(String(order.id));
        return changed?{...order,tripId:changed.tripId,tripAssignMode:changed.tripAssignMode,updatedAt:changed.updatedAt,updatedBy:changed.updatedBy,
          orderHistory:[...(order.orderHistory||[]),changed.orderHistory[changed.orderHistory.length-1]]}:order;
      }));
      const pinnedIds=new Set(memberIds.map(String));
      setTrips(prev=>prev.map(item=>{
        if(String(item.id)===String(tripId))return {...item,driverId:result.trip.driverId,driverName:result.trip.driverName,
          driverAssignMode:'manual',orderIds:result.trip.orderIds,status:result.trip.status,updatedAt:result.trip.updatedAt,updatedBy:result.trip.updatedBy,
          tripHistory:[...(item.tripHistory||[]),result.trip.tripHistory[result.trip.tripHistory.length-1]]};
        const orderIds=(item.orderIds||[]).filter(id=>!pinnedIds.has(String(id)));
        return orderIds.length===(item.orderIds||[]).length?item:{...item,orderIds};
      }));
    }
    await new Promise(resolve=>setTimeout(resolve,0));
    const remote=serverAuthEnabled();
    if(remote){
      window.showToast('Đã đổi lái trên máy và chuyển '+members.length+' đơn sang Bằng tay. Đang đồng bộ…','info',5000);
      deliverySyncTripDriverInBackground(trip,driver,memberIds);
      return {queued:true};
    }
    window.showToast('Đã đổi lái xe và chuyển '+members.length+' đơn trong chuyến sang Bằng tay.','success');return true;
  };
  const dispatchGroupTrip=tripId=>{
    if(!canDispatchFromOrders||window.__SCF_ACCESS_CONTEXT?.readOnly){window.showToast('Tài khoản không có quyền giao chuyến cho lái xe.','warn');return;}
    const id=String(tripId);if(dispatchBusy.current.has(id))return;
    dispatchBusy.current.add(id);
    try{
      const trip=tripById.get(id);
      if(trip?.driverDispatchedAt){
        const recalled=deliveryTripRecallChange(trip,currentUser);
        setTrips(previous=>previous.map(item=>String(item.id)===id?{...item,...recalled}:item));
        if(trip.driverId)notify?.({recipientId:trip.driverId,title:'Đã hủy giao chuyến',message:(trip.shiftName||trip.id)+' - '+trip.deliveryDate,icon:'ti-truck-off',sourceType:'trip',sourceId:trip.id,targetPage:'trips'});
        window.showToast('Đã hủy giao. Giữ nguyên lái xe và đơn trong chuyến; thay đổi đang được đồng bộ.','success');return;
      }
      const memberIds=orders.filter(order=>String(deliveryTripForOrder(order)?.id||'')===id&&order.status!=='cancelled').map(order=>order.id);
      const result=deliveryTripDispatchChange(trip,orders,employees,memberIds,currentUser);
      const changedIds=new Set(result.orders.filter((order,index)=>order!==orders[index]).map(order=>String(order.id)));
      setTrips(previous=>previous.map(item=>String(item.id)===id?{...item,...result.trip}:item));
      if(changedIds.size)setOrders(previous=>previous.map(order=>changedIds.has(String(order.id))?{...order,status:'assigned'}:order));
      notify?.(result.notification);
      window.showToast('Đã giao chuyến cho '+result.trip.driverName+'. Thay đổi và thông báo được đưa vào đồng bộ.','success');
    }catch(error){window.showToast(error.message||'Chưa giao được chuyến.','warn');}
    finally{setTimeout(()=>dispatchBusy.current.delete(id),0);}
  };
  const groupDispatchButton=group=>{
    const trip=tripById.get(String(group?.tripId||''));if(!trip||!canDispatchFromOrders)return null;
    if(!['planning','assigned'].includes(trip.status))return null;
    const recall=!!trip.driverDispatchedAt;
    const disabled=!!window.__SCF_ACCESS_CONTEXT?.readOnly||(!trip.driverId&&!trip.driverName)||(recall&&!!trip.startTime);
    return h('button',{type:'button',className:'bs delivery-group-dispatch','data-scf-action':'write',disabled,
      title:disabled?(trip.startTime?'Chuyến đã bắt đầu giao':'Chọn lái xe trước khi giao chuyến'):recall?'Hủy giao, giữ nguyên lái xe và đơn trong chuyến':'Giao toàn bộ chuyến cho lái xe','aria-label':(recall?'Hủy giao chuyến ':'Giao lái xe chuyến ')+(group.label||trip.id),
      onClick:event=>{event.stopPropagation();dispatchGroupTrip(trip.id);},
      style:{background:'transparent',color:'#143c3c',border:'1px solid #40657c',borderRadius:6,minHeight:30,padding:'4px 8px',whiteSpace:'nowrap',fontWeight:400}},h('i',{className:'ti '+(recall?'ti-truck-off':'ti-truck-delivery')}),recall?' Hủy giao':' Giao lái xe');
  };
  const changeDateFilterMode=mode=>{
    if(['yesterday','today','tomorrow'].includes(mode)){
      const now=isoDate(),date=new Date(now+'T12:00:00');
      date.setDate(date.getDate()+({yesterday:-1,today:0,tomorrow:1}[mode]));
      const value=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
      sfDate(value);sfDateTo(value);setDateFilterMode('day');return;
    }
    setDateFilterMode(mode);
    if(mode==='day'&&!fDate)sfDate(_ti0);
    if(mode==='range'){
      if(!fDate)sfDate(_ti0);
      if(!fDateTo)sfDateTo(_ti0);
    }
    if(mode==='week'&&!fWeek)sfWeek(currentISOWeekInput());
    if(mode==='month'&&!fMonth)sfMonth(_ti0.slice(0,7));
  };
  const moveFilterDay=offset=>{
    const date=new Date((fDate||_ti0)+'T12:00:00');
    date.setDate(date.getDate()+offset);
    const value=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
    sfDate(value);sfDateTo(value);setDateFilterMode('day');setCurrentPage(1);
  };
  const hasDateFilter=(dateFilterMode==='day'&&!!fDate)||(dateFilterMode==='range'&&!!(fDate||fDateTo))||(dateFilterMode==='week'&&!!fWeek)||(dateFilterMode==='month'&&!!fMonth);
  const resetDeliveryFilters=()=>{setInvoiceFilter('');sfNote('');sfTripId('');sfTripDate('');sfTripShift('');sfTripDriver('');sf('all');sfDate('');sfDateTo('');sfWeek('');sfMonth('');sfPoint('');sfCustomer('');sfProduct('');sfTime('');sfArea('');sfTripGroup(deliveryDefaultTripGroup(currentUser));setAuditFilter({});};
  const applyAuditFilter=value=>{setAuditFilter({...value});setAuditNow(Date.now());setCurrentPage(1);setBulkSelected(new Set());};
  const locateExistingImportedOrder=order=>{
    setAuditFilter({});
    const rawDate=String(order?.deliveryDate||'').trim();
    const slashDate=rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const inputDate=slashDate?slashDate[3]+'-'+slashDate[2].padStart(2,'0')+'-'+slashDate[1].padStart(2,'0'):rawDate;
    setDateFilterMode('day');
    setDateBasis('order');
    sfDate(inputDate);
    sfDateTo(inputDate);
    sfWeek('');sfMonth('');sfPoint('');sfCustomer('');sfProduct('');sfTime('');sfArea('');sfTripGroup(deliveryDefaultTripGroup(currentUser));sfNote('');sfTripId('');sfTripDate('');sfTripShift('');sfTripDriver('');
    sf('all');
    sq(String(order?.id||order?.pointName||''));
    setCurrentPage(1);
    sm(null);
    delete window._importData;
    const orderYear=Number((rawDate.match(/(\d{4})$/)||[])[1]||0),currentYear=new Date().getFullYear();
    window.showToast(orderYear&&Math.abs(orderYear-currentYear)>1
      ?'Đã mở đúng đơn '+(order?.id||'đã tồn tại')+'. Lưu ý: đơn này đang mang năm '+orderYear+', không phải '+currentYear+'.'
      :'Đã mở đúng đơn '+(order?.id||'đã tồn tại')+' và đặt lại các bộ lọc.','info',9000);
  };
  const matchesDateFilter=value=>{
    if(!hasDateFilter)return true;
    const key=deliveryOrderDateKey(value);
    if(key===null)return false;
    if(dateFilterMode==='day')return key===deliveryOrderDateKey(fDate);
    if(dateFilterMode==='range'){
      const from=deliveryOrderDateKey(fDate),to=deliveryOrderDateKey(fDateTo);
      if(from!==null&&to!==null)return key>=Math.min(from,to)&&key<=Math.max(from,to);
      if(from!==null)return key>=from;
      if(to!==null)return key<=to;
      return true;
    }
    if(dateFilterMode==='week'){
      const range=isoWeekDateKeyRange(fWeek);
      return !!range&&key>=range[0]&&key<=range[1];
    }
    if(dateFilterMode==='month'){
      const m=String(fMonth||'').match(/^(\d{4})-(\d{2})$/);
      return !!m&&Math.floor(key/100)===Number(m[1])*100+Number(m[2]);
    }
    return true;
  };
  const orderIdentityCache=React.useMemo(()=>new WeakMap(),[]);
  const allOrderRowKeys=React.useMemo(()=>deliveryOrderRecordKeys(orders,orderIdentityCache),[orders]);
  const filterDates=React.useMemo(()=>new WeakMap(),[trips,prodShifts,customers,shifts]);
  const filterDateForOrder=order=>{
    if(!hasDateFilter)return '';
    if(sortMode!=='trip'||dateBasis==='order')return order.deliveryDate;
    if(!filterDates.has(order)){
      const trip=deliveryTripForOrder(order);
      filterDates.set(order,deliveryOrderFilterDate(order,'trip',trip,trip?.deliveryDate?'':getOrderTripDate(orderContext(order),prodShifts||[])));
    }
    return filterDates.get(order);
  };
  const orderRowKeyByObject=React.useMemo(()=>new Map((orders||[]).map((order,index)=>[order,allOrderRowKeys[index]])),[orders,allOrderRowKeys]);
  // Đơn gốc phải ưu tiên khóa vừa tính; một số dữ liệu cũ có thể đã lưu nhầm _rowKey nội bộ.
  const orderRowKey=order=>orderRowKeyByObject.get(order)||order?._rowKey||('delivery-order-fallback\u001f'+String(order?.id||''));
  const tripFilterMeta=React.useMemo(()=>{
    const people=new Map((employees||[]).map(person=>[String(person.id),String(person.name||'').trim()]));
    const idsByName=new Map();
    for(const person of employees||[]){const key=normalizeLookupText(person.name);if(key)idsByName.set(key,idsByName.has(key)?null:String(person.id));}
    return (trips||[]).map(trip=>{const storedName=String(trip.driverName||'').trim(),driverId=String(trip.driverId||'')||idsByName.get(normalizeLookupText(storedName))||'';
      const driverName=people.get(driverId)||storedName||driverId;
      return {trip,date:manualTripDateToISO(trip.deliveryDate||trip.date),shift:String(trip.shiftId||trip.shiftName||'__unassigned'),shiftName:trip.shiftName||'Chưa có ca',driver:driverId?'id:'+driverId:driverName?'name:'+normalizeLookupText(driverName):'__unassigned',driverName:driverName||'Chưa có lái xe'};});
  },[trips,employees]);
  const tripFilterMetaById=React.useMemo(()=>new Map(tripFilterMeta.map(meta=>[String(meta.trip.id),meta])),[tripFilterMeta]);
  const baseFilterRows=React.useMemo(()=>orders.filter(x=>{
    if(invoiceFilter){
      const trip=deliveryTripForOrder(x);
      const hasInvoice=!!String(x.invoiceImage||'').trim()||(typeof scfWarehouseOrders!=='undefined'&&!!scfWarehouseOrders.photo(x,trip,products,shifts)?.src);
      if((invoiceFilter==='yes')!==!!hasInvoice)return false;
    }
    if(auditActive&&!deliveryMatchesAuditFilter(auditMetaForOrder(x),auditFilter,auditNow))return false;
    if(q&&!String(x.customer||'').toLowerCase().includes(q.toLowerCase())&&!String(x.id||'').toLowerCase().includes(q.toLowerCase())&&!String(x.pointName||'').toLowerCase().includes(q.toLowerCase())&&!(x.lines||[]).some(line=>String(line.productName||'').toLowerCase().includes(q.toLowerCase()))) return false;
    if(!matchesDateFilter(filterDateForOrder(x)))return false;
    if(fProduct){
      const selectedName=normalizeLookupText(fProduct);
      if(!(x.lines||[]).some(line=>normalizeLookupText(line.productName||'')===selectedName))return false;
    }
    if(fTime&&normalizeTimeInput(x.deliveryTime||'')!==fTime) return false;
    if(fNote&&!normalizeLookupText([x.note,...(x.lines||[]).map(line=>line.note)].filter(Boolean).join(' ')).includes(normalizeLookupText(fNote)))return false;
    if(fTripId||fTripDate||fTripShift||fTripDriver){
      const trip=deliveryTripForOrder(x),meta=tripFilterMetaById.get(String(trip?.id||''));
      if(fTripId&&(fTripId==='__none'?!!trip:String(trip?.id||'')!==fTripId))return false;
      if((fTripDate||fTripShift||fTripDriver)&&(!meta||(fTripDate&&meta.date!==fTripDate)||(fTripShift&&meta.shift!==fTripShift)||(fTripDriver&&meta.driver!==fTripDriver)))return false;
    }
    if(!matchesAreaOrTripGroup(x)) return false;
    if(fTripGroup&&deliveryTripForOrder(x)&&!deliveryMatchesTripGroup(deliveryTripForOrder(x),fTripGroup))return false;
    return true;
  }),[orders,trips,customers,prodShifts,shifts,q,dateFilterMode,dateBasis,fDate,fDateTo,fWeek,fMonth,sortMode,fProduct,fTime,fArea,fTripGroup,fNote,fTripId,fTripDate,fTripShift,fTripDriver,tripFilterMetaById,auditFilter,auditNow,auditMetaForOrder,invoiceFilter,products]);
  const customerFilterCatalog=React.useMemo(()=>{
    const byId=new Map(),byName=new Map();
    for(const customer of customers||[]){byId.set(String(customer.id),customer);const key=normalizeLookupText(customer.name);byName.set(key,byName.has(key)?null:customer);}
    return {byId,byName};
  },[customers]);
  const customerEntryCache=React.useMemo(()=>new WeakMap(),[customerFilterCatalog]);
  const customerEntriesForOrder=order=>{if(!customerEntryCache.has(order))customerEntryCache.set(order,deliveryOrderCustomerEntries(order,customerFilterCatalog));return customerEntryCache.get(order);};
  const customerOptions=React.useMemo(()=>{
    const entries=new Map();
    for(const order of baseFilterRows)if(filter==='all'||order.status===filter)for(const entry of customerEntriesForOrder(order))entries.set(entry.key,entry.label);
    if(fCustomer&&!entries.has(fCustomer))entries.set(fCustomer,customerFilterCatalog.byId.get(fCustomer.slice(3))?.name||fCustomer.replace(/^(id|name):/,''));
    const labelCounts=new Map();for(const label of entries.values())labelCounts.set(label,(labelCounts.get(label)||0)+1);
    return [...entries].map(([key,label])=>[key,labelCounts.get(label)>1?label+' ('+key.replace(/^(id|name):/,'')+')':label]).sort((a,b)=>a[1].localeCompare(b[1],'vi',{numeric:true}));
  },[baseFilterRows,filter,customerFilterCatalog,customerEntryCache,fCustomer]);
  const listWithoutPoint=React.useMemo(()=>baseFilterRows.filter(x=>(filter==='all'||x.status===filter)&&(!fCustomer||customerEntriesForOrder(x).some(entry=>entry.key===fCustomer))),[baseFilterRows,filter,fCustomer,customerEntryCache]);
  const pointOptions=React.useMemo(()=>[...new Set(listWithoutPoint.map(x=>String(x.pointName||x.address||'').trim()).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'vi',{sensitivity:'base',numeric:true})),[listWithoutPoint]);

  const list=React.useMemo(()=>listWithoutPoint.filter(x=>!fPoint||String(x.pointName||x.address||'').trim()===fPoint),[listWithoutPoint,fPoint]);
  const canViewQuantityTotals=canViewDeliveryQuantityTotals(currentUser);
  const quantityTotals=React.useMemo(()=>canViewQuantityTotals?deliveryOrderQuantityTotals(list):null,[list,canViewQuantityTotals]);
  const statusScope=React.useMemo(()=>baseFilterRows.filter(x=>(!fPoint||String(x.pointName||x.address||'').trim()===fPoint)&&(!fCustomer||customerEntriesForOrder(x).some(entry=>entry.key===fCustomer))),[baseFilterRows,fPoint,fCustomer,customerEntryCache]);
  const statusCount=value=>value==='all'?statusScope.length:statusScope.filter(order=>order.status===value).length;
  const orderFilterValueCache=React.useMemo(()=>new WeakMap(),[]);
  const orderFilterValues=order=>{
    if(!orderFilterValueCache.has(order))orderFilterValueCache.set(order,{
      productNames:(order.lines||[]).map(line=>String(line.productName||'').trim()).filter(Boolean),
      time:normalizeTimeInput(order.deliveryTime||'')
    });
    return orderFilterValueCache.get(order);
  };
  const productFilterNames=React.useMemo(()=>[...new Set((orders||[]).flatMap(order=>orderFilterValues(order).productNames))]
    .sort((a,b)=>a.localeCompare(b,'vi',{sensitivity:'base',numeric:true})),[orders]);
  const timeFilterValues=React.useMemo(()=>[...new Set(orders.map(o=>orderFilterValues(o).time).filter(Boolean))]
    .sort((a,b)=>timeToMin(a)-timeToMin(b)||a.localeCompare(b,'vi')),[orders]);
  const areaFilterValues=React.useMemo(()=>[...new Map(['SS TN','ĐT','KV',...customers.flatMap(c=>(c.points||[]).map(p=>p.area)),...trips.map(t=>t.area)]
    .filter(Boolean).map(area=>[areaKey(area),area])).values()].sort((a,b)=>a.localeCompare(b,'vi')),[customers,trips]);
  const updateAutoProductionTimes=()=>{
    const targetRowKeys=new Set(list.map(orderRowKey));
    let changed=0,miss=0,tripMiss=0;
    const nextOrders=orders.map((o,index)=>{
      if(changed>=25||!targetRowKeys.has(allOrderRowKeys[index]))return o;
      const next=prepareAutomaticTripForSave(o);
      if(!next.prodShiftId)miss++;
      if(!next.tripId)tripMiss++;
      if(next===o)return o;
      changed++;
      return {...next,updatedAt:fmtDT(),updatedBy:currentUser?.name||''};
    });
    if(changed){
      applyOrdersAndTripSync(nextOrders);
      window.showToast('Đã cập nhật SX và chuyến cho '+changed+' đơn. Các đơn còn lại sẽ tự cập nhật sau khi đồng bộ.'+(miss?' Có đơn chưa có ca SX phù hợp.':''),'info',7000);
      return;
    }
    window.showToast(miss
      ?'Không cập nhật được: '+miss+' đơn chưa tìm thấy cấu hình ca SX phù hợp.'
      :(tripMiss?'Không cập nhật được: '+tripMiss+' đơn đã có ca SX nhưng chưa tìm thấy chuyến cùng ngày/ca/khu vực.':'Dữ liệu ca SX và chuyến xe đã đúng, không có thay đổi cần đồng bộ.'),tripMiss?'warn':'info',7000);
  };
  const productsById=React.useMemo(()=>{
    const index=new Map();(products||[]).forEach(product=>{if(!index.has(product.id))index.set(product.id,product);});return index;
  },[products]);
  const orderLineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const orderLineWeight=l=>{
    const p=productsById.get(l.productId);
    const unit=String(l.unit||p?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');
    const qty=orderLineQty(l);
    if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;
    const wpu=p?.weightPerUnit||numFmt(l.weightPerUnit)||0;
    return wpu*qty;
  };
  const calcOrderWeight=o=>(o.lines||[]).reduce((s,l)=>s+orderLineWeight(l),0);
  const calcOrderedWeight=o=>(o.lines||[]).reduce((sum,line)=>{
    const product=productsById.get(line.productId),unit=String(line.unit||product?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');
    const qty=numFmt(line.qtyProd??line.qty??line.quantity??0);
    return sum+(['kg','kgs','kilogram','kilograms'].includes(unit)?qty:qty*numFmt(product?.weightPerUnit||line.weightPerUnit||0));
  },0);
  const shiftScheduleMeta=React.useMemo(()=>(shifts||[]).map((sh,idx)=>({
    ...sh,
    _order:idx,
    _start:String(sh.timeStart||sh.startTime||'').trim(),
    _startMin:String(sh.timeStart||sh.startTime||'').trim()?timeToMin(sh.timeStart||sh.startTime):Number.MAX_SAFE_INTEGER
  })),[shifts]);
  const shiftMatchCache=React.useMemo(()=>new Map(),[shiftScheduleMeta]);
  const matchShiftSchedule=({shiftId,shiftName,area,deliveryTime}={})=>{
    const cacheKey=JSON.stringify([shiftId||'',shiftName||'',area||'',deliveryTime||'']);
    if(shiftMatchCache.has(cacheKey))return shiftMatchCache.get(cacheKey);
    const desiredId=String(shiftId||'').trim();
    const desiredName=normalizeLookupText(shiftName||'');
    const desiredArea=String(area||'').trim();
    const desiredTime=String(deliveryTime||'').trim();
    const scoreShift=sh=>{
      let score=0;
      if(desiredId&&String(sh.id||'').trim()===desiredId)score+=5000;
      const shName=normalizeLookupText(sh.name||'');
      if(desiredName&&shName===desiredName)score+=1600;
      else if(desiredName&&shName&&(shName.includes(desiredName)||desiredName.includes(shName)))score+=900;
      if(desiredArea&&sameArea(sh.area,desiredArea))score+=700;
      const shTime=String(sh.timeStart||sh.startTime||'').trim();
      if(desiredTime&&shTime===desiredTime)score+=1200;
      return score;
    };
    const ranked=shiftScheduleMeta
      .map(sh=>({sh,score:scoreShift(sh)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score||a.sh._order-b.sh._order||a.sh._startMin-b.sh._startMin||(String(a.sh.id||'').localeCompare(String(b.sh.id||''),'vi')));
    const matched=ranked[0]?.sh||null;
    shiftMatchCache.set(cacheKey,matched);return matched;
  };
  const tripGroupLabel=t=>{
    if(!t)return 'Chưa có chuyến';
    const parts=[t.deliveryDate,t.shiftName,t.area].filter(Boolean);
    return parts.join(' · ')||t.id||'Chưa có chuyến';
  };
  const orderMetaCache=React.useMemo(()=>new WeakMap(),[customers]);
  const orderMeta=React.useMemo(()=>list.map(o=>{
    const rowKey=orderRowKey(o),cached=orderMetaCache.get(o);
    if(cached&&cached._rowKey===rowKey)return cached;
    const ctx=orderContext(o);
    const area=getArea(ctx)||'';
    const meta={...o,_ctx:ctx,_area:area,_rowKey:rowKey};
    orderMetaCache.set(o,meta);return meta;
  }),[list,customers,allOrderRowKeys]);
  const enrichedOrderCache=React.useMemo(()=>new WeakMap(),[trips,prodShifts,customers,shifts]);
  const enrichOrderTripMeta=o=>{
    if(enrichedOrderCache.has(o))return enrichedOrderCache.get(o);
    const ctx=o._ctx||orderContext(o);
    const tripMode=o.tripAssignMode==='manual'?'manual':'auto';
    const storedTrip=ctx.tripId?tripById.get(String(ctx.tripId)):null;
    const autoTrip=tripMode==='manual'?storedTrip:autoTripForOrder({...ctx,tripId:null});
    const manualTrip=storedTrip||null;
    const effectiveTrip=deliveryTripForOrder(ctx);
    const preferredTripDate=getOrderTripDate(ctx,prodShifts||[])||'';
    const preferredTripShiftName=getOrderTripShiftName(ctx,prodShifts||[])||'';
    const enriched={...o,_ctx:ctx,_autoTrip:autoTrip,_effectiveTrip:effectiveTrip,_preferredTripDate:preferredTripDate,_preferredTripShiftName:preferredTripShiftName,_area:o._area||getArea(ctx)||''};
    enrichedOrderCache.set(o,enriched);return enriched;
  };
  const sortableOrderMeta=React.useMemo(()=>sortMode==='trip'?orderMeta.map(enrichOrderTripMeta):orderMeta,[orderMeta,sortMode,trips,prodShifts,customers,shifts]);
  const sequenceCache=React.useMemo(()=>new WeakMap(),[customers,trips,shifts,prodShifts]);
  const configuredDeliverySequence=o=>{
    if(sequenceCache.has(o))return sequenceCache.get(o);
    const ctx=o?._ctx||orderContext(o);
    const resolved=findOrderPointMatch(ctx,customers||[]);
    const trip=o._effectiveTrip||o._autoTrip;
    if(tripManualOrderEnabled(trip)){const value=tripOrderSortValue(trip,ctx,customers);sequenceCache.set(o,value);return value;}
    const shift=matchShiftSchedule({shiftId:trip?.shiftId,shiftName:trip?.shiftName||o._preferredTripShiftName,area:trip?.area||o._area,deliveryTime:trip?.deliveryTime||ctx.deliveryTime});
    const sequence=scfPointDeliverySequence(resolved?.point,{shiftId:trip?.shiftId||shift?.id,shiftName:trip?.shiftName||o._preferredTripShiftName||''});
    sequenceCache.set(o,sequence);return sequence;
  };
  const groupInfoCache=React.useMemo(()=>new WeakMap(),[trips,shifts,employees,fArea,sortMode]);
  const groupInfoForOrder=o=>{
    if(!groupInfoCache.has(o))groupInfoCache.set(o,buildGroupInfoForOrder(o));
    return groupInfoCache.get(o);
  };
  const buildGroupInfoForOrder=o=>{
    if(sortMode==='trip'){
      if(o._effectiveTrip){
        const label=tripGroupLabel(o._effectiveTrip);
        const tripDateObj=parseAnyDate(o._effectiveTrip.deliveryDate||'');
        const shiftMeta=matchShiftSchedule({shiftId:o._effectiveTrip.shiftId,shiftName:o._effectiveTrip.shiftName,area:o._effectiveTrip.area,deliveryTime:o._effectiveTrip.deliveryTime});
        const selectedArea=areaKey(fArea);
        const samsungRank=samsungTripShiftRank.get(normalizeLookupText(o._effectiveTrip.shiftName||''));
        return {
          key:'trip:'+(o._effectiveTrip.id||tripGroupLabel(o._effectiveTrip)),
          label,
          summaryLabel:label,
          mode:'trip',
          tripId:o._effectiveTrip.id,
          imageSortTrip:o._effectiveTrip,
          driverName:String(o._effectiveTrip.driverName||'').trim()||(o._effectiveTrip.driverId?String((employees||[]).find(e=>String(e.id)===String(o._effectiveTrip.driverId))?.name||'').trim():''),
          sortDate:tripDateObj?tripDateObj.getTime():Number.MAX_SAFE_INTEGER,
          sortShiftOrder:selectedArea==='SSTN'?(samsungRank??Number.MAX_SAFE_INTEGER):(selectedArea==='DT'?0:(shiftMeta?shiftMeta._order:Number.MAX_SAFE_INTEGER)),
          sortShiftTime:shiftMeta?shiftMeta._startMin:(String(o._effectiveTrip.deliveryTime||'').trim()?timeToMin(o._effectiveTrip.deliveryTime):Number.MAX_SAFE_INTEGER),
          sortText:label
        };
      }
      return {
        key:'trip:unassigned',label:'Đơn chưa xếp chuyến — cần kế toán xếp chuyến',summaryLabel:'Đơn chưa xếp chuyến',mode:'unassigned',
        sortDate:Number.MIN_SAFE_INTEGER,sortShiftOrder:-1,sortShiftTime:-1,sortText:''
      };
    }
    return {
      key:'area:'+areaKey(o._area||''),
      label:o._area||'Chưa phân khu vực',
      summaryLabel:o._area||'Chưa phân khu vực',
      mode:'area',
      sortDate:0,
      sortText:o._area||'Chưa phân khu vực'
    };
  };
  const deliverySequenceIndex=React.useMemo(()=>{
    const result=new Map(),byTrip=new Map(),unassigned=new Map();
    for(const order of orders||[]){if(order.status==='cancelled')continue;
      const key=String(order.tripId||'');if(!key){unassigned.set(String(order.id),order);continue;}
      if(!byTrip.has(key))byTrip.set(key,[]);byTrip.get(key).push(order);
    }
    for(const trip of trips||[]){const members=[...(byTrip.get(String(trip.id))||[])];
      for(const id of new Set((trip.orderIds||[]).map(String))){if(unassigned.has(id))members.push(unassigned.get(id));}
      sortTripOrdersByDeliveryOrder(trip,members,customers||[]).forEach((o,i)=>result.set(String(trip.id)+'|'+String(o.id),i+1));
    }return result;
  },[orders,trips,customers]);
  const sortedList=React.useMemo(()=>[...sortableOrderMeta].sort((a,b)=>{
    const ga=groupInfoForOrder(a),gb=groupInfoForOrder(b);
    if(sortMode==='trip'){
      const dateCmp=(ga.sortDate||0)-(gb.sortDate||0);
      if(dateCmp!==0)return dateCmp;
      const groupCmp=ga.key===gb.key?0:scfCompareTripImageTrips(ga.imageSortTrip,gb.imageSortTrip);
      if(groupCmp!==0)return groupCmp;
    }else{
      const areaCmp=(ga.sortText||'zzz').localeCompare(gb.sortText||'zzz','vi');
      if(areaCmp!==0)return areaCmp;
    }
    if(sortMode==='trip'&&ga.key===gb.key&&a._effectiveTrip){
      const tripId=String(a._effectiveTrip.id),ar=deliverySequenceIndex.get(tripId+'|'+String(a.id)),br=deliverySequenceIndex.get(tripId+'|'+String(b.id));
      if(ar&&br&&ar!==br)return ar-br;
    }
    // Giữ cách gom nhóm theo khu vực/chuyến, nhưng trong từng nhóm luôn xếp ngày giao tăng dần.
    const aDeliveryDate=deliveryOrderDateKey(a._ctx.deliveryDate);
    const bDeliveryDate=deliveryOrderDateKey(b._ctx.deliveryDate);
    const deliveryDateCmp=(aDeliveryDate??Number.MAX_SAFE_INTEGER)-(bDeliveryDate??Number.MAX_SAFE_INTEGER);
    if(deliveryDateCmp!==0)return deliveryDateCmp;
    if(sortMode==='trip'){
      // Trong cùng một chuyến, dùng đúng thứ tự đã cấu hình tại “Cài đặt thứ tự giao”.
      const aSequence=configuredDeliverySequence(a),bSequence=configuredDeliverySequence(b);
      const sequenceCmp=(aSequence>0?aSequence:Number.MAX_SAFE_INTEGER)-(bSequence>0?bSequence:Number.MAX_SAFE_INTEGER);
      if(sequenceCmp!==0)return sequenceCmp;
      const timeCmp=(a._ctx.deliveryTime||'').localeCompare(b._ctx.deliveryTime||'');
      if(timeCmp!==0)return timeCmp;
    }
    const pointCmp=(a._ctx.pointName||'').localeCompare(b._ctx.pointName||'','vi');
    if(pointCmp!==0)return pointCmp;
    return sortMode==='trip'?String(a.id||'').localeCompare(String(b.id||''),'vi'):(a._ctx.deliveryTime||'').localeCompare(b._ctx.deliveryTime||'');
  }),[sortableOrderMeta,sortMode,customers,trips,shifts,employees,fArea,deliverySequenceIndex]);
  const canReorderDelivery=trip=>sortMode==='trip'&&canChangeTripDriver&&!window.__SCF_ACCESS_CONTEXT?.readOnly&&deliveryTripDriverEditable(trip)&&!copyDraft;
  const dropDeliveryOrder=(event,order)=>{
    const drag=deliveryDrag.current;if(!drag)return;
    event.preventDefault();deliveryDrag.current=null;setDragTarget('');
    const trip=deliveryTripForOrder(order);
    if(!canReorderDelivery(trip)||String(trip.id)!==drag.tripId)return;
    try{const result=scfDeliveryReorderTrip({trip,orders,customers,sourceId:drag.orderId,targetId:order.id,currentUser});if(!result)return;
      setOrders(previous=>scfDeliveryReorderTrip({trip,orders:previous,customers,sourceId:drag.orderId,targetId:order.id,currentUser}).orders);setTrips(previous=>previous.map(t=>String(t.id)===String(trip.id)?{...t,deliveryOrderMode:'manual',updatedAt:result.trip.updatedAt,updatedBy:result.trip.updatedBy}:t));
      window.showToast('Đã đổi vị trí hai đơn trong chuyến.','success');
    }catch(error){window.showToast(error.message,'warn');}
  };
  const printGroupSummary=group=>{const trip=tripById.get(String(group.tripId));if(trip)setSummaryPrintTrip(trip);};
  const groupPrintButton=group=>group.mode==='trip'?h('button',{type:'button',className:'bi delivery-group-print','data-scf-action':'view',title:'In đơn tổng chuyến','aria-label':'In đơn tổng chuyến '+group.label,onClick:()=>printGroupSummary(group)},h('i',{className:'ti ti-printer'})):null;
  const exportDetailedExcel=async()=>{
          await scfLoadOptionalScript('XLSX','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
// Flatten orders + lines for Excel export
          const rows=[];
          list.forEach(o=>{
            if(!o.lines||o.lines.length===0){
              const plan=prodShiftPlan(o,prodShifts||[],prodShiftRules);
              rows.push({'Mã đơn':o.id,'Khách hàng':o.customer,'Ngày giao':o.deliveryDate,'Giờ giao':normalizeTimeInput(o.deliveryTime||''),'Điểm giao':o.pointName||'','Công đi':o.workOut||0,'Công về':o.workReturn||0,'Trạng thái':o.status,'Ghi chú đơn':o.note||'','Sản phẩm':'','ĐVT':'','SL Đặt':0,'SL hóa đơn':0,'Giá mua':0,'Thành tiền mua':0,'Ca SX':plan?.shift?.name||'','Giờ SX thực tế':plan?.prodWorkShiftId?'':plan?.prodTime||'','Ngày SX':plan?.prodDate||'','Giờ in tem':plan?.labelTime||'','Ngày in tem':plan?.labelDate||'','Ghi chú dòng':''});
            } else {
              o.lines.forEach((l,i)=>{
                const plan=i===0?prodShiftPlan(o,prodShifts||[],prodShiftRules):null;
                const buy=numFmt(l.purchasePrice||l.price);
                const qty=numFmt(l.qtyInvoice)||numFmt(l.qtyProd);
                rows.push({'Mã đơn':i===0?o.id:'','Khách hàng':i===0?o.customer:'','Ngày giao':i===0?o.deliveryDate:'','Giờ giao':i===0?normalizeTimeInput(o.deliveryTime||''):'','Điểm giao':i===0?(o.pointName||''):'','Công đi':i===0?(o.workOut||0):0,'Công về':i===0?(o.workReturn||0):0,'Trạng thái':i===0?o.status:'','Ghi chú đơn':i===0?(o.note||''):'',' Sản phẩm':l.productName||'','ĐVT':l.unit||'','SL Đặt':l.qtyProd||0,'SL hóa đơn':l.qtyInvoice||0,'Giá mua':buy,'Thành tiền mua':buy*qty,'Ca SX':i===0?(plan?.shift?.name||''):'','Giờ SX thực tế':i===0&&!plan?.prodWorkShiftId?(plan?.prodTime||''):'','Ngày SX':i===0?(plan?.prodDate||''):'','Giờ in tem':i===0?(plan?.labelTime||''):'','Ngày in tem':i===0?(plan?.labelDate||''):'','Ghi chú dòng':l.note||''});
              });
            }
          });
          const ws=XLSX.utils.json_to_sheet(rows);
          const wb=XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb,ws,'Don giao hang');
          XLSX.writeFile(wb,'Don_giao_hang_'+fmtDate().split('/').join('-')+'.xlsx');
          };
  const paginateByTrip=sortMode==='trip';
  const tripTones=React.useMemo(()=>{
    const tones=new Map();let index=0;
    for(const order of sortedList){const group=groupInfoForOrder(order);if(group.mode==='unassigned'||tones.has(group.key))continue;tones.set(group.key,index++%2?'gray':'green');}
    return tones;
  },[sortedList,groupInfoCache]);
  const toneForGroup=group=>group?.mode==='unassigned'?'unassigned':tripTones.get(group?.key)||'green';
  const pageUnitLabel=paginateByTrip?'chuyến':'đơn';
  const unassignedList=React.useMemo(()=>paginateByTrip?sortedList.filter(order=>!order._effectiveTrip):[],[sortedList,paginateByTrip]);
  const pageUnits=React.useMemo(()=>deliveryOrderPageUnits(paginateByTrip?sortedList.filter(order=>!!order._effectiveTrip):sortedList,paginateByTrip,groupInfoForOrder),[sortedList,paginateByTrip,groupInfoCache]);
  const totalPageUnits=pageUnits.length;
  const totalPages=Math.max(1,Math.ceil(totalPageUnits/pageSize));
  const visiblePage=Math.min(Math.max(1,currentPage),totalPages);
  const pageStart=(visiblePage-1)*pageSize;
  const pageEnd=Math.min(pageStart+pageSize,totalPageUnits);
  const pagedList=React.useMemo(()=>[...(visiblePage===1?unassignedList:[]),...pageUnits.slice(pageStart,pageEnd).flat()].map(o=>{
    const enriched=Object.prototype.hasOwnProperty.call(o,'_autoTrip')?o:enrichOrderTripMeta(o);
    return {...enriched,_totalW:calcOrderWeight(enriched._ctx),_orderedW:calcOrderedWeight(enriched._ctx)};
  }),[pageUnits,unassignedList,visiblePage,pageStart,pageEnd,trips,prodShifts,customers,shifts,products]);
  const visibleProductLabels=React.useMemo(()=>pagedList.flatMap(order=>{
    const lines=(order._ctx||orderContext(order)).lines||[];
    return lines.map((line,index)=>({
      label:String(line?.productName||'Sản phẩm').trim(),
      name:String(line?.productName||'Sản phẩm').trim()
    }));
  }),[pagedList,productsById]);
  const longestVisibleProduct=React.useMemo(()=>visibleProductLabels.reduce((longest,item)=>deliveryProductTextWidth(item.label)>deliveryProductTextWidth(longest.label)?item:longest,{label:'',name:''}),[visibleProductLabels]);
  const productColumnWidth=Math.max(145,Math.min(420,Math.ceil(deliveryProductTextWidth(longestVisibleProduct.label)+28)));
  const fittedColumnWidths=React.useMemo(()=>{
    const result={sequence:105,date:155,point:150,product:productColumnWidth,qtyInvoice:85,qtyProd:85,qtyDelivered:85,time:75,invoice:65,note:180,trip:compactEntry?130:310,production:210,label:135,status:105,actions:150};
    for(const order of pagedList){const ctx=order._ctx||order;
      for(const line of ctx.lines||[]){
        result.point=Math.min(300,Math.max(result.point,deliveryProductTextWidth(line.warehouseSourcePointName||ctx.pointName||'')+22));
        result.note=Math.min(340,Math.max(result.note,deliveryProductTextWidth(line.note||ctx.note||'')+24));
        for(const field of ['qtyInvoice','qtyProd','qtyDelivered'])result[field]=Math.max(result[field],Math.min(145,deliveryProductTextWidth(String(line[field]??''))+32));
      }
    }
    if(quantityTotals)for(const field of ['qtyInvoice','qtyProd','qtyDelivered'])result[field]=Math.max(result[field],Math.ceil(deliveryProductTextWidth('('+quantityTotals[field].toLocaleString('vi-VN',{maximumFractionDigits:2})+')')+20));
    return result;
  },[pagedList,productColumnWidth,compactEntry,quantityTotals]);
  const renderedColumnWidths=scfDeliveryLayoutWidths(visibleColumns,fittedColumnWidths,customColumnWidths,tableViewportWidth);
  const renderedTableWidth=Object.values(renderedColumnWidths).reduce((sum,width)=>sum+width,0);
  const transferPanelWidth=Math.max(240,DELIVERY_ORDER_COLUMNS.slice(0,DELIVERY_ORDER_COLUMNS.findIndex(([key])=>key==='time')+1).reduce((sum,[key])=>sum+(renderedColumnWidths[key]||0),0)-24);
  const productColumnTitle=longestVisibleProduct.name
    ?'Tên dài nhất đang hiển thị: '+longestVisibleProduct.name+' ('+Array.from(longestVisibleProduct.name).length+' ký tự)'
    :'Chưa có tên sản phẩm';
  const productionDisplayCache=React.useMemo(()=>new WeakMap(),[prodShifts,prodShiftRules,customers,trips,shifts]);
  const productionDisplayForOrder=ctx=>{
    if(!productionDisplayCache.has(ctx)){
      const plans=prodShiftPlansForOrder(ctx,prodShifts||[],prodShiftRules);
      const resolution=ctx.prodShiftAssignMode==='manual'?{}:scfOrderProductionResolution(ctx,getProdShiftForOrder(ctx,prodShifts||[],customers||[]));
      productionDisplayCache.set(ctx,{plans,firstPlan:plans[0]||prodShiftPlan(ctx,prodShifts||[],prodShiftRules),offset:getOrderTripDateOffset(ctx,prodShifts||[]),scheduleIssue:resolution.conflict?resolution.issue:''});
    }
    return productionDisplayCache.get(ctx);
  };
  // Duyệt theo danh sách khóa hiện có để số ô đã chọn và số đơn được xóa luôn đồng nhất.
  // Cách này cũng tự loại các khóa lựa chọn cũ sau khi dữ liệu đơn hàng thay đổi.
  const selectedOrderKeys=isAdmin
    ?allOrderRowKeys.filter(key=>bulkSelected.has(key))
    :[];
  const pageOrderKeys=pagedList.map(orderRowKey);
  const filteredOrderKeys=list.map(orderRowKey);
  const allPageSelected=pageOrderKeys.length>0&&pageOrderKeys.every(key=>bulkSelected.has(key));
  const allFilteredSelected=filteredOrderKeys.length>0&&filteredOrderKeys.every(key=>bulkSelected.has(key));
  const toggleBulkOrder=order=>{
    if(!isAdmin)return;
    const key=orderRowKey(order);
    if(!key)return;
    setBulkSelected(prev=>{
      const next=new Set(prev);
      if(next.has(key))next.delete(key);else next.add(key);
      return next;
    });
  };
  const setPageSelection=checked=>{
    if(!isAdmin)return;
    setBulkSelected(prev=>{
      const next=new Set(prev);
      pageOrderKeys.forEach(key=>{if(checked)next.add(key);else next.delete(key);});
      return next;
    });
  };
  const toggleFilteredSelection=()=>{
    if(!isAdmin||!filteredOrderKeys.length)return;
    setBulkSelected(prev=>{
      const next=new Set(prev);
      filteredOrderKeys.forEach(key=>{if(allFilteredSelected)next.delete(key);else next.add(key);});
      return next;
    });
  };
  const deleteSelectedOrders=()=>{
    if(!isAdmin)return;
    if(window.__SCF_ACCESS_CONTEXT?.readOnly||!canDel(currentUser.role,'delivery',currentUser.permLevels))return;
    const keys=selectedOrderKeys;
    const selectedKeys=new Set(keys);
    if(orders.some((order,index)=>selectedKeys.has(allOrderRowKeys[index])&&!scfCanDeleteDeliveryOrder(currentUser,order,orderTrip(order)))){window.showToast('Có đơn đã giao hoặc ngoài giới hạn ngày được xóa.','warn');return;}
    if(!keys.length){window.showToast('Chưa chọn đơn hàng cần xóa.','warning');return;}
    const message='Bạn sắp xóa vĩnh viễn '+keys.length+' đơn hàng đã chọn.\nCác đơn này cũng sẽ được gỡ khỏi chuyến liên quan.\n\nThao tác không thể hoàn tác. Tiếp tục xóa?';
    if(!window.confirm(message))return;
    const keySet=new Set(keys);
    applyOrdersAndTripSync(prev=>{
      const prevKeys=deliveryOrderRecordKeys(prev);
      return prev.filter((_order,index)=>!keySet.has(prevKeys[index]));
    });
    setBulkSelected(new Set());
    window.showToast('Đã xóa '+keys.length+' đơn hàng.','success');
  };
  const updateOrderProductNames=async()=>{
    if(!isAdmin)return;
    const targetKeys=new Set(selectedOrderKeys.length?selectedOrderKeys:list.map(orderRowKey));
    const productById=new Map((products||[]).filter(p=>p?.id).map(p=>[String(p.id),p]));
    const eligibleStatuses=new Set(['pending','assigned']);
    let orderCount=0,lineCount=0;
    (orders||[]).forEach((order,index)=>{
      if(!targetKeys.has(allOrderRowKeys[index])||!eligibleStatuses.has(order.status||'pending'))return;
      let changed=false;
      (order.lines||[]).forEach(line=>{
        const product=productById.get(String(line.productId||''));
        if(product&&String(product.name||'').trim()&&String(line.productName||'').trim()!==String(product.name||'').trim()){
          lineCount++;changed=true;
        }
      });
      if(changed)orderCount++;
    });
    if(!lineCount){window.showToast('Không có tên sản phẩm nào cần cập nhật trong phạm vi đã chọn.','info');return;}
    const scopeText=selectedOrderKeys.length?(selectedOrderKeys.length+' đơn đã chọn'):'danh sách đang lọc';
    const ok=await window.scfConfirm('Cập nhật '+lineCount+' dòng sản phẩm trong '+orderCount+' đơn thuộc '+scopeText+'?\n\nChỉ đơn Chờ xếp và Đã xếp được cập nhật. Đơn đã giao hoặc đã hủy sẽ được giữ nguyên.','Cập nhật tên sản phẩm');
    if(!ok)return;
    applyOrdersAndTripSync(prev=>{
      const prevKeys=deliveryOrderRecordKeys(prev);
      return prev.map((order,index)=>{
        if(!targetKeys.has(prevKeys[index])||!eligibleStatuses.has(order.status||'pending'))return order;
        let changed=false;
        const lines=(order.lines||[]).map(line=>{
          const product=productById.get(String(line.productId||''));
          const nextName=String(product?.name||'').trim();
          if(!nextName||String(line.productName||'').trim()===nextName)return line;
          changed=true;
          return {...line,productName:nextName};
        });
        return changed?{...order,lines,updatedAt:fmtDT(),updatedBy:currentUser?.name||''}:order;
      });
    });
    window.showToast('Đã cập nhật tên cho '+lineCount+' dòng sản phẩm trong '+orderCount+' đơn.','success');
  };
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const labelPackRule=line=>{
    const product=(products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||null;
    return resolveProductLabelPackRule(product,line?.productName||product?.name||'');
  };
  const pacPackWeight=line=>{
    const product=(products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||null;
    const explicit=numFmt(product?.weightPerUnit)||numFmt(line?.weightPerUnit)||numFmt(product?.labelPackSize)||numFmt(line?.labelPackSize)||0;
    if(explicit>0)return explicit;
    const text=[line?.productName,product?.name,line?.customerProductName,product?.custName].filter(Boolean).join(' ').toUpperCase();
    const m=text.match(/(\d+(?:[.,]\d+)?)\s*KG\s*\/\s*PAC\b/);
    return m?numFmt(String(m[1]).replace(',','.')):0;
  };
  const isPacPackageLine=line=>{
    const product=(products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||null;
    const text=[line?.productName,product?.name,line?.customerProductName,product?.custName].filter(Boolean).join(' ').toUpperCase();
    const unit=String(line?.unit||product?.unit||'').trim().toLowerCase();
    return unit==='pac'||text.includes('/PAC')||text.includes('KG/PAC')||(/\bpac\b/i.test(text)&&/gói|goi/i.test(unit));
  };
  const splitLabelWeights=(totalKg,line)=>{
    const rule=labelPackRule(line);
    if(!rule.enabled)return [];
    if(isPacPackageLine(line)){
      const packCount=Math.max(0,Math.round(orderLineQty(line)));
      const perPackWeight=Number(pacPackWeight(line)||0);
      if(!(packCount>0) || !(perPackWeight>0))return [];
      return Array.from({length:packCount},()=>perPackWeight);
    }
    const kg=Number(numFmt(totalKg)||0);
    if(!(kg>0))return [];
    const pack=Number(rule.pack||10);
    const full=Math.floor(kg/pack);
    const rem=Number((kg-full*pack).toFixed(2));
    const parts=Array.from({length:full},()=>pack);
    if(rem>0){
      if(rule.mergeSmallRemainder&&rem<2&&parts.length)parts[parts.length-1]=Number((parts[parts.length-1]+rem).toFixed(2));
      else parts.push(rem);
    }
    return parts;
  };
  const labelLinesForOrder=o=>{
    const plan=prodShiftPlan(o,prodShifts||[],prodShiftRules);
    const labels=[];
    (o.lines||[]).forEach(l=>{
      const kg=orderLineWeight(l);
      if(!kg)return;
      splitLabelWeights(kg,l).forEach(partKg=>labels.push({line:l,kg:partKg,plan,order:o}));
    });
    return labels;
  };
  const cleanPacProductName=name=>String(name||'')
    .replace(/\s+/g,' ')
    .replace(/\s*,\s*\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'')
    .replace(/\s+\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'')
    .replace(/\s*,\s*PAC\b/ig,'')
    .trim()
    .toUpperCase();
  const buildLabelSummaryHtml=labels=>{
    const summaryMap=new Map();
    labels.forEach(it=>{
      const product=String(it.line?.productName||'Sản phẩm').trim()||'Sản phẩm';
      const kgKey=String(numFmt(it.kg));
      const productMap=summaryMap.get(product)||new Map();
      const current=productMap.get(kgKey)||{kg:numFmt(it.kg),count:0};
      current.count+=1;
      productMap.set(kgKey,current);
      summaryMap.set(product,productMap);
    });
    return [...summaryMap.entries()].map(([product,weightMap])=>{
      const parts=[...weightMap.values()]
        .sort((a,b)=>b.kg-a.kg)
        .map(item=>'<span class="summary-chip">'+esc(Number(item.kg||0).toLocaleString('vi-VN',{maximumFractionDigits:2}))+'kg × '+item.count+'</span>')
        .join('');
      return '<div class="summary-row"><div class="summary-product">'+esc(product)+'</div><div class="summary-parts">'+parts+'</div></div>';
    }).join('');
  };
  const buildPrintOrderSummaryHtml=ordersForPrint=>{
    const list=(Array.isArray(ordersForPrint)?ordersForPrint:[ordersForPrint]).filter(Boolean);
    const points=[...new Set(list.map(o=>String(o?.pointName||'').trim()).filter(Boolean))];
    const pointLabel=points.length<=1?(points[0]||'Chưa có địa điểm'):(points.length+' địa điểm');
    const grouped=new Map();
    list.forEach(o=>{
      (o?.lines||[]).filter(Boolean).forEach(line=>{
        const product=String(line?.productName||'Sản phẩm').trim()||'Sản phẩm';
        const unit=String(line?.unit||((products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||{}).unit||'').trim();
        const key=product+'__'+unit;
        const current=grouped.get(key)||{product,unit,qty:0};
        current.qty+=orderLineQty(line);
        grouped.set(key,current);
      });
    });
    const rows=[...grouped.values()]
      .map(item=>'<div class="summary-row"><div class="summary-product">'+esc(item.product)+'</div><div class="summary-parts"><span class="summary-chip">'+esc(Number(item.qty||0).toLocaleString('vi-VN',{maximumFractionDigits:2})+(item.unit?' '+item.unit:''))+'</span></div></div>')
      .join('');
    return {
      pointLabel,
      rows: rows||'<div class="summary-row"><div class="summary-product">Chưa có sản phẩm</div></div>'
    };
  };
  const buildClassicLabelSvg=(it,o)=>{
    const l=it.line;
    const product=l.productName||'';
    const nsx=it.plan?.labelDate||o.deliveryDate||'';
    const gioSx=(it.plan?.labelTime||'').replace(':','H').replace(/H00$/,'H');
    const kgNum=Number(it.kg).toLocaleString('vi-VN',{maximumFractionDigits:2});
    const pName=product.toUpperCase();
    const directUse=pName.includes('BÚN LÁ')||pName.includes('BUN LA')||pName.includes('BÁNH CUỐN')||pName.includes('BANH CUON')||pName.includes('BÁNH PHỞ CUỐN')||pName.includes('BANH PHO CUON');
    const hdsd=directUse?'Ăn trực tiếp':'Trần qua nước sôi trước khi ăn.';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="580" height="400" viewBox="0 0 580 400">'+
        '<rect width="580" height="400" fill="white"/>'+
        '<rect x="10" y="10" width="560" height="380" fill="white" stroke="#111" stroke-width="2"/>'+
        '<text x="160" y="68" font-family="Arial,sans-serif" font-size="54" font-weight="700" text-anchor="middle" lengthAdjust="spacingAndGlyphs" textLength="270">'+esc(product)+'</text>'+
        '<text x="425" y="68" font-family="Arial,sans-serif" font-size="52" font-weight="700" text-anchor="middle">'+kgNum+'</text>'+
        '<text x="520" y="68" font-family="Arial,sans-serif" font-size="38" font-weight="700" text-anchor="middle">KG</text>'+
        '<text x="22" y="112" font-family="Arial,sans-serif"><tspan font-size="22">SP CỦA: C.TY TNHH </tspan><tspan font-size="23" font-weight="700">THỰC PHẨM SÔNG CÔNG</tspan></text>'+
        '<text x="22" y="154" font-family="Arial,sans-serif" font-size="23">ĐC: Tổ 1, Phường Bá Xuyên, Tỉnh Thái Nguyên</text>'+
        '<text x="22" y="196" font-family="Arial,sans-serif" font-size="23" font-weight="700">SĐT : 0969709878</text>'+
        '<text x="258" y="196" font-family="Arial,sans-serif" font-size="23">THÀNH PHẦN: Bột gạo, nước</text>'+
        '<text x="22" y="238" font-family="Arial,sans-serif" font-size="23">HDSD: '+esc(hdsd)+'</text>'+
        '<text x="512" y="238" font-family="Arial,sans-serif" font-size="25" text-anchor="end"><tspan font-weight="700">PH</tspan> 5-8</text>'+
        '<text x="22" y="280" font-family="Arial,sans-serif" font-size="23">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'+
        '<text x="22" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">NSX:</text>'+
        '<text x="132" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">'+esc(nsx)+'</text>'+
        '<text x="342" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">GIỜ SX:</text>'+
        '<text x="512" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700" text-anchor="end">'+esc(gioSx)+'</text>'+
        '<text x="28" y="364" font-family="Arial,sans-serif" font-size="23">HSD: 24H</text>'+
        '<text x="170" y="364" font-family="Arial,sans-serif" font-size="23">FORMOL: 0</text>'+
        '<text x="302" y="364" font-family="Arial,sans-serif" font-size="23">HÀN THE: 0</text>'+
        '<text x="552" y="364" font-family="Arial,sans-serif" font-size="23" text-anchor="end">BQ: 0-10°C</text>'+
      '</svg>'
    );
  };
  const buildPacLabelSvg=(it,o)=>{
    const l=it.line;
    const matchedPoint=(customers||[])
      .flatMap(c=>(c.points||[]))
      .find(p=>p.id===o.pointId||p.id===o.ptId||p.name===o.pointName);
    const pointName=String(matchedPoint?.name||o.pointName||'KHO VẬN').toUpperCase();
    const product=cleanPacProductName(l.productName||'');
    const kgNum=Number(it.kg||0).toLocaleString('vi-VN',{maximumFractionDigits:2});
    const nsx=it.plan?.labelDate||o.deliveryDate||'';
    const gioSx=String(it.plan?.labelTime||'').replace(':','H').replace(/H00$/,'H')||'';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">'+
        '<rect width="1000" height="1000" fill="white"/>'+
        '<g transform="translate(28 41) scale(0.95)">'+
        '<rect x="0" y="0" width="1000" height="1006" fill="white" stroke="#111" stroke-width="6"/>'+
        '<text x="430" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+esc(product)+'</text>'+
        '<text x="804" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+esc(kgNum)+'</text>'+
        '<text x="922" y="143" font-family="Times New Roman,serif" font-size="52" font-weight="700" text-anchor="middle">KG</text>'+
        '<text x="72" y="245" font-family="Times New Roman,serif" font-size="32" font-weight="700">SP CỦA: CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG</text>'+
        '<text x="72" y="329" font-family="Times New Roman,serif" font-size="32" font-weight="700">ĐC: Tổ 1, Phường Bá Xuyên, Tỉnh Thái Nguyên</text>'+
        '<text x="72" y="413" font-family="Times New Roman,serif" font-size="32" font-weight="700">SĐT : 0969709878</text>'+
        '<text x="510" y="413" font-family="Times New Roman,serif" font-size="32" font-weight="700">TP: Bột gạo, nước</text>'+
        '<text x="72" y="497" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 15°C-20°C. Đóng gói hở. HSD 12h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="581" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 10°C-15°C. Đóng gói hở. HSD 24h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="665" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 5°C-10°C. Đóng gói hở. HSD 36h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="749" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 0°C-5°C. Đóng gói kín. HSD 72h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="833" font-family="Times New Roman,serif" font-size="31" font-weight="700">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'+
        '<text x="105" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">Formol:</text>'+
        '<text x="292" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">0</text>'+
        '<text x="448" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">PH:</text>'+
        '<text x="560" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">5-8</text>'+
        '<text x="634" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">Hàn the:</text>'+
        '<text x="846" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">0</text>'+
        '<text x="140" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">NSX:</text>'+
        '<text x="335" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">'+esc(nsx)+'</text>'+
        '<text x="620" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">GIỜ SX:</text>'+
        '<text x="860" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">'+esc(gioSx)+'</text>'+
        '</g>'+
      '</svg>'
    );
  };
  const openLabelPrintWindow=(labels,ordersForPrint,mode)=>{
    if(!labels.length)return;
    const isPacMode=mode==='pac';
    const isClassic58=!isPacMode;
    const pageSize=isPacMode?'100mm 100mm':'58mm 40mm';
    const labelWidth=isPacMode?'100mm':'58mm';
    const labelHeight=isPacMode?'100mm':'40mm';
    const contentWidth=isPacMode?'100mm':'58mm';
    const contentHeight=isPacMode?'100mm':'40mm';
    const title=isPacMode?'In tem kho vận ':'In tem ';
    const printOrders=(Array.isArray(ordersForPrint)?ordersForPrint:[ordersForPrint]).filter(Boolean);
    const orderSummary=buildPrintOrderSummaryHtml(printOrders);
    const groups=new Map();
    labels.forEach(it=>{
      const order=it.order||printOrders[0]||{};
      const key=JSON.stringify([order.customerId||order.customer||'',order.pointId||order.pointName||order.address||'',order.deliveryDate||'',normalizeTimeInput(order.deliveryTime||'')]);
      if(!groups.has(key))groups.set(key,{order,labels:[]});
      groups.get(key).labels.push(it);
    });
    const cards=[...groups.values()].map(group=>{
      const order=group.order;
      const separatorSvg='<svg xmlns="http://www.w3.org/2000/svg" width="580" height="400" viewBox="0 0 580 400"><rect width="580" height="400" fill="white"/><rect x="10" y="10" width="560" height="380" fill="none" stroke="black" stroke-width="3"/><text x="290" y="65" text-anchor="middle" font-family="Arial" font-size="30">ĐỊA ĐIỂM GIAO HÀNG</text><foreignObject x="25" y="85" width="530" height="160"><div xmlns="http://www.w3.org/1999/xhtml" style="font:bold 38px Arial;text-align:center;overflow-wrap:anywhere">'+esc(order.pointName||order.address||order.pointId||'Chưa có địa điểm')+'</div></foreignObject><text x="290" y="290" text-anchor="middle" font-family="Arial" font-size="34">Ngày giao: '+esc(order.deliveryDate||'—')+'</text><text x="290" y="350" text-anchor="middle" font-family="Arial" font-size="36" font-weight="bold">Giờ giao: '+esc(normalizeTimeInput(order.deliveryTime||'')||'—')+'</text></svg>';
      const separator='<section class="label"><img class="label-img'+(isClassic58?' classic58-img':'')+'" alt="Tem địa điểm và lịch giao hàng" src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(separatorSvg)+'"></section>';
      return separator+group.labels.map(it=>{
      const product=it.line?.productName||'';
      const orderForLabel=it.order||printOrders[0]||{};
      const svg=isPacMode?buildPacLabelSvg(it,orderForLabel):buildClassicLabelSvg(it,orderForLabel);
      const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
      return '<section class="label'+(isClassic58?' classic58':'')+'"><img class="label-img'+(isClassic58?' classic58-img':'')+'" alt="Tem '+esc(product)+'" src="'+src+'"></section>';
      }).join('');
    }).join('');
    const w=window.open('','_blank');
    if(!w){window.showToast('Trình duyệt đang chặn cửa sổ in tem. Hãy cho phép popup rồi thử lại.','warn');return;}
    const titleSuffix=printOrders.length===1?String(printOrders[0]?.id||''):String(printOrders.length)+' đơn';
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+title+esc(titleSuffix)+'</title><style>'+
      '@page{size:'+pageSize+';margin:0}'+
      '*{box-sizing:border-box}'+
      'html,body{margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
      'body{font-family:Arial,"Times New Roman",serif;color:#111;padding:10px}'+
      '.summary{margin-bottom:10px;padding:10px 12px;border:1px solid #cfe0d7;border-radius:10px;background:#f4faf7}'+
      '.summary-title{font-size:14px;font-weight:700;margin-bottom:8px}'+
      '.summary-sub{font-size:12px;color:#355447;margin-bottom:8px}'+
      '.summary-row{display:flex;align-items:flex-start;gap:8px;justify-content:space-between;margin-bottom:6px}'+
      '.summary-row:last-child{margin-bottom:0}'+
      '.summary-product{font-size:13px;font-weight:700;min-width:170px}'+
      '.summary-parts{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}'+
      '.summary-chip{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:#fff;border:1px solid #b9d1c3;font-size:12px;font-weight:700;color:#234234}'+
      '.labels{display:flex;flex-direction:column;gap:0}'+
      '.label{position:relative;display:block;width:'+labelWidth+';height:'+labelHeight+';overflow:hidden;break-after:page;page-break-after:always}'+
      '.label:last-child{break-after:auto;page-break-after:auto}'+
      '.label-img{display:block;width:'+labelWidth+';height:'+labelHeight+';image-rendering:high-quality;-webkit-user-select:none;user-select:none}'+
      '.label.classic58{width:58mm;height:40mm}'+
      '.label-img.classic58-img{position:static;width:58mm;height:40mm;transform:none}'+
      '@media print{body{padding:0}.summary{display:none}.labels{display:block}.label.classic58{width:58mm;height:40mm}.label-img.classic58-img{position:static;width:'+contentWidth+';height:'+contentHeight+';transform:rotate(180deg);transform-origin:center center}}'+
      '<\/style><\/head><body><div class="summary"><div class="summary-title">Tóm tắt tem trước khi in</div><div class="summary-sub">Địa điểm: '+esc(orderSummary.pointLabel)+' · Tổng số tem: '+labels.length+' · Số đơn: '+printOrders.length+'</div>'+orderSummary.rows+'</div><div class="labels">'+cards+'<\/div><\/body><\/html>');
    w.document.close();
    setTimeout(()=>w.print(),400);
  };
  const printLabels=o=>{
    const labels=labelLinesForOrder(o);
    if(!labels.length){window.showToast('Đơn này chưa có số kg để in tem!','warn');return;}
    const pacLabels=labels.filter(it=>isPacPackageLine(it?.line));
    const classicLabels=labels.filter(it=>!isPacPackageLine(it?.line));
    if(pacLabels.length&&classicLabels.length)window.showToast('Đơn này có cả tem PAC kho vận 10x10 và tem thường. Hệ thống sẽ mở 2 cửa sổ in riêng.','ok');
    if(pacLabels.length)openLabelPrintWindow(pacLabels,[o],'pac');
    if(classicLabels.length)openLabelPrintWindow(classicLabels,[o],'classic');
  };
  const printLabelsForOrders=(ordersToPrint,mode='auto')=>{
    const printOrders=(ordersToPrint||[]).filter(Boolean);
    if(!printOrders.length){window.showToast('Chọn ít nhất 1 đơn để in tem!','warn');return;}
    const labels=printOrders.flatMap(o=>labelLinesForOrder(o));
    if(!labels.length){window.showToast('Các đơn đã chọn chưa có dữ liệu để in tem!','warn');return;}
    const pacLabels=labels.filter(it=>mode!=='classic'&&isPacPackageLine(it?.line));
    const classicLabels=labels.filter(it=>mode!=='pac'&&!isPacPackageLine(it?.line));
    if(!pacLabels.length&&!classicLabels.length){window.showToast('Không có sản phẩm phù hợp với mẫu tem đã chọn.','warn');return;}
    if(pacLabels.length&&classicLabels.length)window.showToast('Danh sách đang có cả tem PAC kho vận 10x10 và tem thường. Hệ thống sẽ mở 2 cửa sổ in riêng.','ok');
    if(pacLabels.length)openLabelPrintWindow(pacLabels,printOrders,'pac');
    if(classicLabels.length)openLabelPrintWindow(classicLabels,printOrders,'classic');
  };
  const orderTableRows=[];
  const [summaryInvoiceId,setSummaryInvoiceId]=useState('');
  const [summaryInvoiceSide,setSummaryInvoiceSide]=useState(0);
  const summaryInvoiceTrip=tripById.get(summaryInvoiceId);
  const summaryInvoiceFaces=summaryInvoiceTrip?[summaryInvoiceTrip.summaryInvoiceImage,summaryInvoiceTrip.summaryInvoiceBackImage].map((src,index)=>({src,index})).filter(face=>face.src):[];
  const summaryInvoiceFace=summaryInvoiceFaces.find(face=>face.index===summaryInvoiceSide)||summaryInvoiceFaces[0];
  const summaryInvoiceButton=group=>{
    const trip=tripById.get(String(group?.tripId||''));
    return (trip?.summaryInvoiceImage||trip?.summaryInvoiceBackImage)?h('button',{type:'button',className:'bi delivery-summary-invoice-view','data-scf-action':'view',title:'Xem hóa đơn tổng chuyến','aria-label':'Xem hóa đơn tổng chuyến',style:{color:'#fff'},onClick:()=>{setSummaryInvoiceSide(0);setSummaryInvoiceId(String(trip.id));}},h('i',{className:'ti ti-photo-check',style:{fontSize:16}})):null;
  };
  let currentGroup=null,currentGroupHeader=null;
  pagedList.forEach(o=>{
    const group=groupInfoForOrder(o);
    if(!currentGroup||group.key!==currentGroup.key){
      currentGroup=group;
      currentGroupHeader={_hdr:true,group,kl:0,cnt:0};
      orderTableRows.push(currentGroupHeader);
    }
    currentGroupHeader.kl+=o._orderedW;
    currentGroupHeader.cnt++;
    orderTableRows.push(o);
  });
  const renderDeliveryDateFields=()=>h(React.Fragment,null,
        h('select',{value:dateFilterMode,onChange:e=>changeDateFilterMode(e.target.value),title:'Kiểu lọc ngày giao',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:112}},
          h('option',{value:'yesterday'},'Hôm qua'),
          h('option',{value:'today'},'Hôm nay'),
          h('option',{value:'tomorrow'},'Ngày mai'),
          h('option',{value:'day'},'Một ngày'),
          h('option',{value:'range'},'Khoảng ngày'),
          h('option',{value:'week'},'Theo tuần'),
          h('option',{value:'month'},'Theo tháng')
        ),
        sortMode==='trip'&&h('select',{value:dateBasis,onChange:e=>setDateBasis(e.target.value),'aria-label':'Lọc theo ngày',title:'Chọn ngày chuyến hoặc ngày đơn',style:{width:142,fontSize:12,padding:'5px 8px'}},
          h('option',{value:'trip'},'Theo ngày chuyến'),h('option',{value:'order'},'Theo ngày đơn')),
        dateFilterMode==='day'&&h('input',{type:'date',value:fDate,onChange:e=>sfDate(e.target.value),title:'Ngày giao','aria-label':'Giá trị lọc Ngày giao',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:130}}),
        dateFilterMode==='range'&&h('div',{className:'delivery-date-range',style:{display:'inline-flex',alignItems:'center',gap:4}},
          h('span',{style:{fontSize:11,color:'var(--tx2)'}},'Từ'),
          h('input',{type:'date',value:fDate,onChange:e=>sfDate(e.target.value),title:'Từ ngày',style:{padding:'5px 6px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:128}}),
          h('span',{style:{fontSize:11,color:'var(--tx2)'}},'Đến'),
          h('input',{type:'date',value:fDateTo,onChange:e=>sfDateTo(e.target.value),title:'Đến ngày',style:{padding:'5px 6px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:128}})
        ),
        dateFilterMode==='week'&&h('input',{type:'week',value:fWeek,onChange:e=>sfWeek(e.target.value),title:'Tuần giao hàng',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:145}}),
        dateFilterMode==='month'&&h('input',{type:'month',value:fMonth,onChange:e=>sfMonth(e.target.value),title:'Tháng giao hàng',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:140}})
  );
  const columnFilterConfigs={point:[fPoint,sfPoint,[...new Set([...pointOptions,...(fPoint?[fPoint]:[])])].map(v=>[v,v])],product:[fProduct,sfProduct,productFilterNames.map(v=>[v,v])],time:[fTime,sfTime,timeFilterValues.map(v=>[v,v])],note:[fNote,sfNote,null],status:[filter==='all'?'':filter,v=>sf(v||'all'),sts.filter(([v])=>v!=='all').map(([v,l])=>[v,l+' ('+statusCount(v)+')'])]};
  const tripDateOptions=tripFilterMeta.filter(meta=>!fTripDate||meta.date===fTripDate);
  const tripShiftOptions=[...new Map(tripDateOptions.map(meta=>[meta.shift,meta.shiftName])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'vi',{numeric:true}));
  const tripShiftScope=tripDateOptions.filter(meta=>!fTripShift||meta.shift===fTripShift);
  const tripDriverOptions=[...new Map(tripShiftScope.map(meta=>[meta.driver,meta.driverName])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'vi'));
  const tripFilteredOptions=tripShiftScope.filter(meta=>!fTripDriver||meta.driver===fTripDriver);
  const clearColumnFilter=key=>{
    if(key==='invoice'){setInvoiceFilter('');return;}
    if(key==='audit'){setAuditFilter({});return;}
    if(key==='date'){sfDate('');sfDateTo('');sfWeek('');sfMonth('');return;}
    if(key==='trip'){sfTripId('');sfTripDate('');sfTripShift('');sfTripDriver('');return;}
    columnFilterConfigs[key]?.[1]('');if(key==='point'){sfArea('');sfCustomer('');}
  };
  const renderColumnFilter=(key,label)=>{
    if(key==='invoice')return h(DeliveryColumnFilter,{key,label,onClear:()=>setInvoiceFilter(''),active:!!invoiceFilter},h('select',{'aria-label':'Lọc hóa đơn',value:invoiceFilter,onChange:e=>{setInvoiceFilter(e.target.value);setCurrentPage(1);}},h('option',{value:''},'Tất cả'),h('option',{value:'yes'},'Có HĐ'),h('option',{value:'no'},'Chưa có HĐ')));
    if(key==='audit')return h(DeliveryColumnFilter,{key,label,onClear:()=>clearColumnFilter(key),active:auditActive},h(DeliveryAuditFilterFields,{value:auditFilter,getActors:getAuditActors,onApply:applyAuditFilter,onClear:()=>setAuditFilter({}),count:list.length}));
    if(key==='trip')return h(DeliveryColumnFilter,{key,label,onClear:()=>clearColumnFilter(key),active:!!(fTripId||fTripDate||fTripShift||fTripDriver)},
      h('label',null,'Hiển thị',h('select',{'aria-label':'Sắp xếp đơn hàng',value:sortMode,onChange:e=>setSortMode(e.target.value)},h('option',{value:'trip'},'Theo chuyến'),h('option',{value:'area'},'Theo khu vực'))),
      h('label',null,'1. Ngày chuyến',h('input',{type:'date','aria-label':'Lọc ngày chuyến',value:fTripDate,onChange:e=>{sfTripDate(e.target.value);sfTripShift('');sfTripDriver('');sfTripId('');}})),
      h('label',null,'2. Ca giao hàng',h('select',{'aria-label':'Lọc ca giao hàng',value:fTripShift,disabled:!fTripDate,onChange:e=>{sfTripShift(e.target.value);sfTripDriver('');sfTripId('');}},h('option',{value:''},'Không giới hạn'),tripShiftOptions.map(([v,l])=>h('option',{key:v,value:v},l)))),
      h('label',null,'3. Lái xe / Người giao hàng',h('select',{'aria-label':'Lọc người giao hàng',value:fTripDriver,onChange:e=>{sfTripDriver(e.target.value);sfTripId('');setCurrentPage(1);}},h('option',{value:''},'Tất cả lái xe'),h('option',{value:'__unassigned'},'Chuyến chưa có lái xe'),tripDriverOptions.filter(([value])=>value!=='__unassigned').map(([v,l])=>h('option',{key:v,value:v},l)))),
      h('label',null,'Chuyến cụ thể',h('select',{'aria-label':'Giá trị lọc Chuyến',value:fTripId,onChange:e=>{sfTripId(e.target.value);if(e.target.value==='__none'){sfTripDate('');sfTripShift('');sfTripDriver('');}}},h('option',{value:''},'Không giới hạn'),!fTripDate&&h('option',{value:'__none'},'Chưa xếp chuyến'),fTripDate&&tripFilteredOptions.map(meta=>h('option',{key:meta.trip.id,value:String(meta.trip.id)},[meta.trip.deliveryDate||meta.trip.date,meta.shiftName,meta.driverName].join(' · '))))),
      h('button',{type:'button',onClick:()=>{sfTripDate('');sfTripShift('');sfTripDriver('');sfTripId('');}},'Xóa lọc')
    );
    if(key==='date')return h(DeliveryColumnFilter,{key,label,onClear:()=>clearColumnFilter(key),active:hasDateFilter},renderDeliveryDateFields(),h('button',{type:'button',onClick:()=>{sfDate('');sfDateTo('');sfWeek('');sfMonth('');}},'Xóa lọc'));
    const [value,setValue,options]=columnFilterConfigs[key];
    return h(DeliveryColumnFilter,{key,label,onClear:()=>clearColumnFilter(key),active:!!value||(key==='point'&&!!(fArea||fCustomer))},key==='point'&&h('label',null,'Khách hàng',h('select',{'aria-label':'Lọc khách hàng',value:fCustomer,onChange:e=>{sfCustomer(e.target.value);sfPoint('');setCurrentPage(1);}},h('option',{value:''},'Tất cả khách hàng'),customerOptions.map(([value,label])=>h('option',{key:value,value},label)))),key==='point'&&h('label',null,'Khu vực',h('select',{'aria-label':'Lọc khu vực',value:fArea,onChange:e=>sfArea(e.target.value)},h('option',{value:''},'Không giới hạn'),areaFilterValues.map(v=>h('option',{key:v,value:v},v)))),options?h('select',{'aria-label':'Giá trị lọc '+label,value,onChange:e=>setValue(e.target.value)},h('option',{value:''},'Không giới hạn'),options.map(([v,l])=>h('option',{key:v,value:v},l))):h('input',{type:key==='date'?'date':'search','aria-label':'Giá trị lọc '+label,value,onChange:e=>setValue(e.target.value),placeholder:key==='note'?'Nhập nội dung chú ý...':undefined}),h('button',{type:'button',onClick:()=>{setValue('');if(key==='point'){sfArea('');sfCustomer('');}}},'Xóa lọc'));
  };
  const renderDeliveryUtilities=()=>h('select',{'aria-label':'Tiện ích đơn hàng',className:'delivery-utility-menu',value:'',onChange:e=>{const action=e.target.value;if(action==='import')document.getElementById('import-from-customer-hidden')?.click();else if(action)sm(action);}},
          h('option',{value:''},'Tiện ích'),h('option',{value:'import'},'Import từ KH'),h('option',{value:'imageImport'},'Lấy đơn từ ảnh'),h('option',{value:'print'},'In phiếu KH'),h('option',{value:'printlabels'},'In tem nhiều đơn'));
  const renderDeliveryOrderActions=()=>h(React.Fragment,null,
        showOrderSelection&&h('button',{
          type:'button',
          disabled:!filteredOrderKeys.length,
          onClick:toggleFilteredSelection,
          title:allFilteredSelected?'Bỏ chọn toàn bộ kết quả đang lọc':'Chọn toàn bộ kết quả đang lọc',
          style:{padding:'5px 9px',fontSize:12,borderRadius:'var(--r)',border:'1px solid #2d6a4f',background:allFilteredSelected?'#e8f5e9':'#fff',color:'#1f5c45',cursor:filteredOrderKeys.length?'pointer':'not-allowed',fontWeight:600,whiteSpace:'nowrap'}
        },h('i',{className:allFilteredSelected?'ti ti-checkbox':'ti ti-square',style:{fontSize:14}}),' ',allFilteredSelected?'Bỏ chọn tất cả':'Chọn tất cả ('+filteredOrderKeys.length+')'),
        showOrderSelection&&(isMobile||selectedOrderKeys.length>0)&&h('button',{
          type:'button',
          disabled:!selectedOrderKeys.length,
          onClick:deleteSelectedOrders,
          title:'Xóa vĩnh viễn các đơn hàng đã chọn',
          style:{padding:'5px 9px',fontSize:12,borderRadius:'var(--r)',border:'1px solid #A32D2D',background:selectedOrderKeys.length?'#A32D2D':'#f4e6e6',color:selectedOrderKeys.length?'#fff':'#9f7777',cursor:selectedOrderKeys.length?'pointer':'not-allowed',fontWeight:700,whiteSpace:'nowrap'}
        },h('i',{className:'ti ti-trash',style:{fontSize:14}}),' Xóa đã chọn ('+selectedOrderKeys.length+')'),
        h('div',{className:'delivery-trip-view-filter'},renderColumnFilter('trip',sortMode==='trip'?'Theo chuyến':'Theo khu vực')),
        h(DeliveryTripGroupSwitch,{value:fTripGroup,onChange:sfTripGroup,exclusive:true}),
        isMobile?h(ExportBtn,{onClick:()=>sm('excel')}):h(DeliveryToolbarButton,{onClick:()=>sm('excel'),icon:'ti-file-spreadsheet',label:'Xuất Excel'}),
        !isMobile&&h('button',{type:'button','data-scf-action':'view','aria-label':menuHidden?'Hiện menu':'Ẩn menu',title:menuHidden?'Hiện menu':'Ẩn menu',onClick:()=>setMenuHidden(value=>!value)},menuHidden?'↓':'↑'),
        !isMobile&&canEditMobileOrder&&!window.__SCF_ACCESS_CONTEXT?.readOnly&&h(DeliveryToolbarButton,{'data-scf-action':'write',onClick:()=>sm('fastEntry'),icon:'ti-plus',label:'Tạo đơn'}),
        !isMobile&&h(DeliveryToolbarButton,{'aria-pressed':compactEntry||hiddenColumns.includes('label'),onClick:()=>{const show=compactEntry||hiddenColumns.includes('label');setCompactEntry(!show);if(show)setHiddenColumns(previous=>previous.filter(key=>key!=='label'));},icon:compactEntry||hiddenColumns.includes('label')?'ti-tags':'ti-tags-off',label:compactEntry||hiddenColumns.includes('label')?'Hiện tem':'Ẩn tem'}),
        !isMobile&&lastCellEdit&&h('button',{type:'button','data-scf-action':'write',title:'Hoàn tác lần sửa ô gần nhất; kiểm tra xung đột trước khi khôi phục',onClick:()=>{try{if(lastCellEdit.field==='note')saveLineNote(lastCellEdit.base,lastCellEdit.lineIndex,lastCellEdit.value);else saveLineQuantity(lastCellEdit.base,lastCellEdit.lineIndex,lastCellEdit.field,lastCellEdit.value);setLastCellEdit(null);}catch(error){window.showToast(error.message,'warn');}}},'Hoàn tác sửa ô'),
        !isMobile&&h('div',{className:'delivery-view-actions'},
          h(DeliveryViewControls,{menuHidden,setMenuHidden,toolsHidden,setToolsHidden,onViewOrderSummary,onViewProduction,menuOnly:true,visibilityControl:h(DeliveryVisibilityMenu,{canSelectOrders:isAdmin,selectionHidden,onSelectionHiddenChange:changeSelectionHidden,menuHidden,setMenuHidden,ordersHidden,setOrdersHidden:changeOrdersHidden,hiddenColumns:effectiveHiddenColumns,setHiddenColumns:changeColumnVisibility}),utility:renderDeliveryUtilities(),onCreate:null}),
          renderPagination('toolbar')
        )
  );
  const renderPagination=position=>h('div',{key:'pagination_'+position,className:'delivery-pagination'},
    h('span',{className:'delivery-pagination-label'},'Mỗi trang'),
    h('select',{value:pageSize,onChange:e=>setPageSize(Number(e.target.value)||100),title:'Số '+pageUnitLabel+' hiển thị mỗi trang'},
      [20,50,100,200].map(size=>h('option',{key:size,value:size},size+' '+pageUnitLabel))
    ),
    h('button',{type:'button',disabled:visiblePage<=1,onClick:()=>setCurrentPage(1),title:'Trang đầu'},'«'),
    h('button',{type:'button',disabled:visiblePage<=1,onClick:()=>setCurrentPage(p=>Math.max(1,p-1)),title:'Trang trước'},'‹'),
    h('span',{className:'delivery-pagination-info'},(totalPageUnits?pageStart+1:0)+'–'+pageEnd+' / '+totalPageUnits+' '+pageUnitLabel+' · Trang '+visiblePage+'/'+totalPages),
    h('button',{type:'button',disabled:visiblePage>=totalPages,onClick:()=>setCurrentPage(p=>Math.min(totalPages,p+1)),title:'Trang sau'},'›'),
    h('button',{type:'button',disabled:visiblePage>=totalPages,onClick:()=>setCurrentPage(totalPages),title:'Trang cuối'},'»')
  );
  return h('div',{ref:deliveryPageRef,className:'delivery-page delivery-compact-toolbar'+(menuHidden?' compact-menu':'')+(toolsHidden?' delivery-tools-hidden':'')+(!isMobile&&toolbarCollapsed?' delivery-toolbar-collapsed':'')},
    h('div',{className:'delivery-sticky-head'},
      !isMobile&&h('button',{type:'button',className:'delivery-toolbar-toggle','data-scf-action':'view','aria-label':toolbarCollapsed?'Hiện thanh công cụ đơn hàng':'Ẩn thanh công cụ đơn hàng','aria-expanded':!toolbarCollapsed,title:toolbarCollapsed?'Hiện thanh công cụ':'Ẩn thanh công cụ',onClick:()=>setToolbarCollapsed(value=>!value)},h('i',{className:toolbarCollapsed?'ti ti-chevron-down':'ti ti-chevron-up','aria-hidden':true})),
      isMobile&&h('div',{className:'delivery-title-row',style:{marginBottom:10}},
        h('div',{className:'delivery-status-row'},sts.map(([v,l])=>h('button',{key:v,className:'pill'+(filter===v?' on':''),onClick:()=>sf(v)},l+' ('+statusCount(v)+')'))),
        h('div',{className:'delivery-title-actions'},
          h('button',{type:'button',className:'mobile-only delivery-mobile-actions-toggle',onClick:()=>setMobileActionsOpen(v=>!v),'aria-expanded':mobileActionsOpen},
            h('i',{className:'ti ti-dots'}),mobileActionsOpen?'Thu gọn':'Tiện ích'
          ),
          h('div',{className:'delivery-secondary-actions'+(mobileActionsOpen?' mobile-open':'')},
          h('button',{
            onClick:()=>sm('imageImport'),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#6D28D9',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-photo-scan',style:{fontSize:14}}),'Lấy đơn từ ảnh'),
          h('button',{
            onClick:()=>sm('print'),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#185FA5',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-printer',style:{fontSize:14}}),'In phiếu KH'),
          h('button',{
            onClick:()=>sm('printlabels'),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#8B5E00',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-tags',style:{fontSize:14}}),'In tem nhiều đơn'),
          h('button',{
            title:'Import đơn hàng từ file Excel của khách hàng',
            onClick:()=>document.getElementById('import-from-customer-hidden')?.click(),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'var(--pri3)',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-file-import',style:{fontSize:14}}),'Import từ KH')
          ),
          canEditMobileOrder&&!window.__SCF_ACCESS_CONTEXT?.readOnly&&h('button',{type:'button',className:'bp',onClick:()=>sm('fastEntry')},'Tạo đơn')
        )
      ),
    isMobile&&h(DeliveryViewControls,{menuHidden,setMenuHidden,toolsHidden,setToolsHidden,onViewOrderSummary,onViewProduction,visibilityControl:h(DeliveryVisibilityMenu,{canSelectOrders:isAdmin,selectionHidden,onSelectionHiddenChange:changeSelectionHidden,menuHidden,setMenuHidden,ordersHidden,setOrdersHidden:changeOrdersHidden,hiddenColumns:effectiveHiddenColumns,setHiddenColumns:changeColumnVisibility})}),
    h('div',{className:'mobile-only delivery-mobile-filter-head'},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm đơn hàng...'}),
      renderColumnFilter('audit','Tạo/sửa'),
      h('button',{type:'button',onClick:()=>setMobileFiltersOpen(v=>!v),'aria-expanded':mobileFiltersOpen},
        h('i',{className:'ti ti-adjustments-horizontal'}),' Bộ lọc',([auditActive,hasDateFilter,fPoint,fCustomer,fProduct,fTime,fArea,fTripGroup].filter(Boolean).length?' ('+[auditActive,hasDateFilter,fPoint,fCustomer,fProduct,fTime,fArea,fTripGroup].filter(Boolean).length+')':'')
      )
    ),
    h('div',{id:'delivery-filter-tools',className:'delivery-filter-panel'+(!isMobile?' delivery-retired-tools':'')+(mobileFiltersOpen?' mobile-open':''),style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{className:'delivery-filter-controls',style:{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',flex:'1 1 760px'}},

        isMobile&&renderDeliveryDateFields(),

        isMobile&&h('div',{id:'delivery-advanced-filters',className:'delivery-advanced-filters'},
        isMobile&&h(React.Fragment,null,
        h('select',{value:fPoint,onChange:e=>sfPoint(e.target.value),title:'Lọc theo địa điểm có trong các đơn đang hiển thị',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:160}},
          h('option',{value:''},'Địa điểm ('+pointOptions.length+')'),
          pointOptions.map(point=>h('option',{key:point,value:point},point))
        ),
        h('select',{value:fProduct,onChange:e=>sfProduct(e.target.value),title:'Lọc theo tên sản phẩm đang có trong đơn hàng',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:160}},
          h('option',{value:''},'Sản phẩm'),
          productFilterNames.map(productName=>
            h('option',{key:productName,value:productName},productName)
          )
        ),
        h('select',{value:fTime,onChange:e=>sfTime(e.target.value),
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:100}},
          h('option',{value:''},'Giờ'),
          timeFilterValues.map(t=>h('option',{key:t,value:t},t))
        )
        ),
        h('select',{value:fArea,onChange:e=>sfArea(e.target.value),
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:120}},
          h('option',{value:''},'Khu vực'),
          areaFilterValues.map(a=>h('option',{key:areaKey(a),value:a},a))
        )
        ),
        (auditActive||hasDateFilter||fPoint||fCustomer||fProduct||fTime||fArea||fTripGroup||fNote||fTripId||fTripDate||fTripShift||fTripDriver||filter!=='all')&&h('button',{
          onClick:resetDeliveryFilters,
          style:{padding:'5px 8px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',cursor:'pointer',color:'var(--tx2)',whiteSpace:'nowrap'}
        },'✕'),
        (auditActive||hasDateFilter||fPoint||fCustomer||fProduct||fTime||fArea||fTripGroup||fNote||fTripId||fTripDate||fTripShift||fTripDriver||filter!=='all')&&h('span',{style:{fontSize:12,color:'var(--pri)',fontWeight:500,whiteSpace:'nowrap'}},
          list.length+' kết quả'
        ),
        isMobile&&list.length>0&&renderPagination('top'),
        isMobile&&renderDeliveryOrderActions(),
        h('button',{
          onClick:()=>sm('imageImport'),
          style:{display:'none'}
        },h('i',{className:'ti ti-photo-scan',style:{fontSize:14}}),'Lấy đơn từ ảnh'),
        h('button',{
          id:'import-from-customer-hidden',
          title:'Import đơn hàng từ file Excel của khách hàng',
          style:{display:'none'},
          onClick:()=>{
            const inp=document.createElement('input');
            inp.type='file';inp.accept='.xlsx,.xls';
            inp.onchange=async e=>{
              const file=e.target.files[0];if(!file)return;
              try{await scfLoadOptionalScript('XLSX','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');}
              catch(error){window.showToast(error.message||'Chưa tải được công cụ Excel. Vui lòng chọn file lại.','error');return;}
              const reader=new FileReader();
              reader.onload=ev=>{
                const wb=XLSX.read(ev.target.result,{type:'binary'});
                const ws=wb.Sheets[wb.SheetNames[0]];
                const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:null});
                // Tự nhận dạng cột đầu tiên rồi đọc: [date, point, productStr, qtyHD, _, time].
                const columnOffset=customerImportColumnOffset(raw);
                const orderMap={};
                const invalidDateRows=[];
                const suspiciousDateRows=[];
                raw.forEach((r,idx)=>{
                  const cells=(r||[]).slice(columnOffset);
                  const sourceCells=cells.slice(0,9);
                  if(!sourceCells.some(v=>v!==null&&v!==undefined&&String(v).trim()!==''))return;
                  const headerText=normalizeLookupText(sourceCells.join(' '));
                  if(headerText.includes('ngay')&&(headerText.includes('san pham')||headerText.includes('ten hang'))&&(headerText.includes('so luong')||headerText.includes('sl')))return;
                  // Format date
                  let dStr='';
                  if(cells[0] instanceof Date||typeof cells[0]==='number'){
                    const d=typeof cells[0]==='number'?new Date(Math.round((cells[0]-25569)*86400*1000)):cells[0];
                    const excelDate=XLSX.SSF.parse_date_code(cells[0]);
                    if(excelDate){dStr=String(excelDate.d).padStart(2,'0')+'/'+String(excelDate.m).padStart(2,'0')+'/'+excelDate.y;}
                    else{dStr=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();}
                  } else if(typeof cells[0]==='string') dStr=cells[0];
                  const point=(cells[1]||'').toString().trim();
                  // Sau cột ngày/địa điểm/sản phẩm/SL SX/SL HĐ, cột thứ 6 là "Thời gian".
                  // Không quét ngược cột SL HĐ: các số 13.5, 7.5 từng bị hiểu nhầm phần .5
                  // là 0.5 ngày Excel và biến thành 12:00.
                  const invoiceQtyCell=cells[4];
                  const timeCell=cells[5];
                  const timeText=String(timeCell??'').trim();
                  const explicitTime=/(?:^\d{1,2}\s*[hH](?:\s*\d{1,2})?$|^\d{1,2}\s*(?:giờ|gio)(?:\s*\d{1,2})?$|^\d{1,2}\s*[:.]\s*\d{1,2}$)/i.test(timeText);
                  const excelTime=typeof timeCell==='number'&&timeCell>=0&&timeCell<1;
                  const time=normalizeCustomerImportTime(explicitTime||excelTime?timeCell:'');
                  const dParts=(dStr||'').split('/');
                  const dd=(dParts[0]||'').toString().padStart(2,'0');
                  const mm=(dParts[1]||'').toString().padStart(2,'0');
                  const yyyy=(dParts[2]||'').toString();
                  const validDate=isValidCustomerImportDate(dStr);
                  if(!validDate){
                    invalidDateRows.push(idx+1);
                  }else if(!isPlausibleCustomerImportYear(dStr)){
                    suspiciousDateRows.push({row:idx+1,date:dStr});
                  }
                  const yy=validDate?yyyy.slice(-2):'00';
                  const dateCode=validDate?yy+dd+mm:'000000';
                  const key=validDate&&point&&time?dStr+'|'+point+'|'+time:'__incomplete_row_'+idx;
      if(!orderMap[key]){
                    const autoProdShift=getProdShiftForOrder({deliveryTime:time,pointName:point,area:'',address:'',customer:''},prodShifts||[],customers||[]);
                    orderMap[key]={
                      id:'D'+dateCode+String(Object.keys(orderMap).length+1).padStart(3,'0'),
                      deliveryDate:dStr,pointName:point,pointId:'',
                      customer:'',customerId:'',address:'',
                      productionShift:autoProdShift,
                      prodShiftId:autoProdShift?.id||'',
                      deliveryTime:time,status:'pending',
                      note:'',workOut:0,workReturn:0,
                      lines:[],createdAt:fmtDate(),updatedAt:fmtDT(),_importRow:idx+1
                    };
                    // Find matching point in customers
                    customers.forEach(c=>(c.points||[]).forEach(pt=>{
                      if(pt.name.trim().toUpperCase()===point.toUpperCase()){
                        orderMap[key].pointId=pt.id;
                        orderMap[key].pointName=pt.name;
                        orderMap[key].customer=c.name;
                        orderMap[key].customerId=c.id;
                        orderMap[key].address=pt.address||'';
                      }
                    }));
                  }
                  // Parse product
                  const rawProduct=String(cells[2]??'').trim();
                  const safeProduct=/^#(?:N\/A|VALUE!|REF!|NAME\?|DIV\/0!|NULL!|NUM!)$/i.test(rawProduct)?'':rawProduct;
                  const {name,unit}=parseProductStr(safeProduct);
                  const qtyOrdered=parseFloat(String(cells[3]??'').replace(',','.'))||0;
                  const invoiceQtyText=String(invoiceQtyCell??'').trim().replace(',','.');
                  const separateInvoiceQty=invoiceQtyText!==''&&Number.isFinite(Number(invoiceQtyText));
                  const qtyInvoice=separateInvoiceQty?(parseFloat(invoiceQtyText)||0):qtyOrdered;
                  // Find product in catalog
                  const prod=products.find(p=>p.name.toUpperCase()===name.toUpperCase())||{};
                  orderMap[key].lines.push({
                    id:uid(),productId:prod.id||'',productName:name,
                    unit:prod.unit||unit,weightPerUnit:prod.weightPerUnit||0,
                    qtyProd:qtyOrdered,qtyInvoice:qtyInvoice,shift:'day',note:customerImportLineNote(r,raw,columnOffset)
                  });
                });
                const newOrders=Object.values(orderMap).filter(o=>o.lines.length>0);
                if(newOrders.length===0){
                  window.showToast(invalidDateRows.length?'Có '+invalidDateRows.length+' dòng thiếu hoặc sai ngày/năm.':'Không đọc được đơn hàng nào!',invalidDateRows.length?'warn':'error');
                  return;
                }
                const incompleteOrders=newOrders.map(order=>({order,issues:customerImportOrderIssues(order)})).filter(item=>item.issues.length);
                const incompleteIds=new Set(incompleteOrders.map(item=>item.order.id));
                // Check duplicates & unknown points
                const dupOrders=newOrders.filter(o=>!incompleteIds.has(o.id)&&findExistingDeliveryOrder(orders,o));
                const unknownPts=[...new Set(newOrders.filter(o=>!o.customerId&&o.pointName).map(o=>o.pointName))];
                // Store parsed data for modal
                if(invalidDateRows.length){
                  window.showToast('Có '+invalidDateRows.length+' dòng thiếu hoặc sai ngày/năm. Vui lòng kiểm tra trước khi import.','warn');
                }
                window._importData={newOrders,dupOrders,unknownPts,incompleteOrders,invalidDateRows,suspiciousDateRows,columnOffset};
                sm('importPreview');
              };
              reader.readAsBinaryString(file);
            };
            inp.click();
          }
        },h('i',{className:'ti ti-file-import',style:{fontSize:14}}),'Import từ KH'),
        false&&h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Tạo đơn giao'})
      )),
      !isMobile&&h('div',{className:'delivery-persistent-toolbar'},renderDeliveryOrderActions())
    ),
        modal==='print'&&h(PrintByCustomerModal,{orders,customers,products,company,trips,...deliveryPrintInitialDates(dateFilterMode,fDate,fDateTo,fWeek,fMonth),initialDateBasis:sortMode==='trip'?dateBasis:'order',initialGroup:fTripGroup,onClose:()=>sm(null)}),
        modal==='printlabels'&&h(PrintLabelsMultiModal,{orders,customers,trips,...deliveryPrintInitialDates(dateFilterMode,fDate,fDateTo,fWeek,fMonth),initialDateBasis:sortMode==='trip'?dateBasis:'order',initialGroup:fTripGroup,onClose:()=>sm(null),onPrint:printLabelsForOrders}),
        modal==='importPreview'&&window._importData&&h(ImportPreviewModal,{data:window._importData,customers,setCustomers,orders,setOrders,products,prodCats,prodShifts,currentUser,onLocateExisting:locateExistingImportedOrder,onClose:()=>{sm(null);delete window._importData;}}),
        modal==='imageImport'&&h(ImageOrderImportModal,{customers,products,orders,setOrders,prodShifts,currentUser,onClose:()=>sm(null)}),
    toolsHidden&&h('div',{className:'delivery-collapsed-filter-summary','aria-live':'polite'},[dateFilterMode==='day'?fDate:dateFilterMode==='range'?[fDate,fDateTo].filter(Boolean).join(' → '):dateFilterMode==='week'?fWeek:fMonth,fArea,fPoint,fCustomer,fProduct,fTime,fTripGroup,fNote,fTripId,fTripDate,fTripShift,fTripDriver,q].filter(Boolean).join(' · ')+' · '+list.length+' kết quả (giữ nguyên bộ lọc)'),
    modal==='fastEntry'&&h(DeliveryFastEntryModal,{customers,products,prodCats,orders,currentUser,onCommit:saveFastEntries,onWarehouse:previewWarehousePaste,onClose:()=>sm(null)}),
    modal==='excel'&&h(DeliveryExcelExportModal,{orders:list.map(orderContext),trips,products,customers,prodCats,tripForOrder:deliveryTripForOrder,initialGroup:fTripGroup,onExportDetail:exportDetailedExcel,onClose:()=>sm(null)}),
    h('div',{className:'delivery-body'},
      !isMobile&&h('div',{className:'desktop-only tw delivery-table-wrap',ref:deliveryTableScroll},
        h('table',{className:'delivery-orders-table delivery-orders-configurable',style:{width:renderedTableWidth,minWidth:renderedTableWidth}},
        h('colgroup',null,visibleColumns.map(([key])=>h('col',{key,'data-column':key,style:{width:renderedColumnWidths[key]}}))),
        h('thead',null,h('tr',null,visibleColumns.map(([key,label])=>h('th',{key,'data-column':key,className:['qtyInvoice','qtyProd','qtyDelivered','time','productionDate','production','label','invoice','status'].includes(key)?'delivery-center-head':undefined},
          key==='date'?h('div',{className:'delivery-date-header'},showOrderSelection&&h('input',{type:'checkbox',checked:allPageSelected,onChange:e=>setPageSelection(e.target.checked),title:'Chọn hoặc bỏ chọn toàn bộ đơn của trang này'}),renderColumnFilter('date','Ngày'),[-1,1].map(offset=>h('button',{key:offset,type:'button','data-scf-action':'view',title:offset<0?'Lùi lọc 1 ngày':'Tiến lọc 1 ngày',onClick:()=>moveFilterDay(offset)},offset<0?'<':'>')))
          :key==='point'?renderColumnFilter('point','Địa điểm')
          :key==='product'?renderColumnFilter('product','Tên sản phẩm')
          :key==='time'?renderColumnFilter('time','Giờ')
          :key==='note'?renderColumnFilter('note','Chú ý')
          :key==='trip'?renderColumnFilter('trip','Chuyến')
          :key==='invoice'?renderColumnFilter('invoice','HĐ')
          :key==='status'?renderColumnFilter('status','Trạng thái')
          :key==='actions'?renderColumnFilter('audit','Tạo-sửa'):label,
          quantityTotals&&Object.prototype.hasOwnProperty.call(quantityTotals,key)&&h('div',{className:'delivery-column-total',title:'Tổng số lượng trong toàn bộ vùng lọc'},'('+quantityTotals[key].toLocaleString('vi-VN',{maximumFractionDigits:2})+')'),
          h(DeliveryColumnResizeHandle,{column:key,label,width:renderedColumnWidths[key],onResize:width=>resizeColumn(key,width===null?fittedColumnWidths[key]:width)})
        )))),
        h('tbody',null,list.length?orderTableRows.map((o,_i)=>{
          if(o._hdr){
            const photoColumn=visibleColumns.findIndex(([key])=>key==='invoice');
            return h('tr',{key:'oh'+_i,className:'delivery-trip-tone-'+toneForGroup(o.group)},photoColumn>0?h('td',{colSpan:photoColumn,className:'delivery-group-header-cell'},h(DeliveryOrderGroupHeader,{group:o.group,...groupDetailProps(o.group),count:o.cnt,weight:o.kl,dispatchButton:groupDispatchButton(o.group),onEditDriver:canChangeTripDriver&&deliveryTripDriverEditable(tripById.get(String(o.group.tripId)))?setDriverEditTripId:null}))
              :h('td',{colSpan:columnCount,className:'delivery-group-header-cell'},h(DeliveryOrderGroupHeader,{group:o.group,...groupDetailProps(o.group),count:o.cnt,weight:o.kl,dispatchButton:groupDispatchButton(o.group),summaryInvoiceButton:summaryInvoiceButton(o.group),printButton:groupPrintButton(o.group),onEditDriver:canChangeTripDriver&&deliveryTripDriverEditable(tripById.get(String(o.group.tripId)))?setDriverEditTripId:null})),
              photoColumn>0&&h('td',{className:'delivery-group-header-cell delivery-center-cell'},summaryInvoiceButton(o.group)),photoColumn>0&&columnCount-photoColumn-1>0&&h('td',{colSpan:columnCount-photoColumn-1,className:'delivery-group-header-cell',style:{textAlign:'right'}},groupPrintButton(o.group)));
          }
          if(groupIsHidden(groupInfoForOrder(o)))return null;
          const ctx=o._ctx||orderContext(o);
          const totalW=o._totalW||calcOrderWeight(ctx);
          const prodShiftMode=o.prodShiftAssignMode==='manual'?'manual':'auto';
          const prodShiftCtx=ctx;
          const tripMode=o.tripAssignMode==='manual'?'manual':'auto';
          const productionData=detailColumnsHidden?null:productionDisplayForOrder(prodShiftCtx);
          const preferredTripDate=o._preferredTripDate||getOrderTripDate(prodShiftCtx,prodShifts||[])||'';
          const preferredTripShiftName=o._preferredTripShiftName||getOrderTripShiftName(prodShiftCtx,prodShifts||[]);
          const autoTrip=o._effectiveTrip===undefined?deliveryTripForOrder(prodShiftCtx):o._effectiveTrip;
          // Chọn tay phải đọc toàn bộ kho chuyến đã đồng bộ; ngày được lọc bên trong ManualTripPicker.
          const tripOptions=pickerTripsForOrder(ctx);
          const selectedTripId=tripMode==='manual'?(ctx.tripId||''):(autoTrip?.id||'');
          const currentTrip=orderTrip(ctx);
          const assignmentStarted=dispatchedTrip(currentTrip)||ctx.status==='delivering';
          const assignmentClosed=closedTrip(currentTrip)||ctx.status==='done';
          const assignmentLocked=assignmentClosed||(assignmentStarted&&!canWithdrawStartedOrder);
          const assignmentTitle=assignmentClosed?'Chuyến đã chờ duyệt/hoàn thành':assignmentLocked?'Đơn đang giao, chỉ Kế toán hoặc Admin được rút/chuyển':assignmentStarted?'Kế toán/Admin: chuyển sang chọn tay để rút hoặc chuyển đơn':'';
          const plansForDisplay=productionData?.plans||[];
          const firstPlanForDisplay=productionData?.firstPlan;
          const planRows=plansForDisplay.length
            ?plansForDisplay.map((plan,pi)=>({key:plan.line?.id||('plan_'+pi),plan,line:plan.line||ctx.lines?.[pi]||{},productName:plan.productName||plan.line?.productName||'Sản phẩm'}))
            :(ctx.lines||[]).map((line,pi)=>({key:line.id||('line_'+pi),plan:null,line,productName:line.productName||'Sản phẩm'}));
          const productionShiftName=firstPlanForDisplay
            ?h('span',{className:'badge delivery-production-shift-name',title:prodShiftMode==='manual'?'Ca SX chọn tay':'Ca SX tự động',style:{background:firstPlanForDisplay.shift.color,color:firstPlanForDisplay.shift.textColor,border:prodShiftMode==='manual'?'1px solid '+firstPlanForDisplay.shift.textColor:'1px dashed '+firstPlanForDisplay.shift.textColor}},scfDeliveryShiftLabel(firstPlanForDisplay.shift.name))
            :h('span',{className:'delivery-table-text',style:{color:'var(--tx2)'}},'Chưa có ca phù hợp');
          const displayRows=planRows.length?planRows:[{key:'empty',line:{},productName:'—',empty:true}];
          const orderRows=displayRows.map((row,pi)=>{
            const tone=toneForGroup(groupInfoForOrder(o)),baseFill=tone==='gray'?'#f2f2f2':tone==='unassigned'?'#fff4cb':'#a9d08e';
            const product=products.find(product=>String(product.id)===String(row.line?.productId));
            const goods=isGoodsProduct(product||{...row.line,code:row.line?.productCode||''},prodCats||[]);
            const lineFill=scfDeliveryOrderLineFill({trip:deliveryTripForOrder(o),date:row.line?.warehouseSourceDeliveryDate||ctx.deliveryDate,time:row.line?.warehouseSourceDeliveryTime||ctx.deliveryTime,productName:product?.name||row.productName,tone,goods,baseFill});
            const coloredCell={background:lineFill};
            return h('tr',{key:o._rowKey+'_'+row.key,className:'delivery-order-row'+(pi===0?' delivery-order-start':'')+(pi===displayRows.length-1?' delivery-order-end':''),'data-delivery-order-key':String(o._rowKey||o.id),'data-delivery-order-id':String(o.id),'data-drag-target':dragTarget===String(o.id)?'true':undefined,onDragOver:event=>{const drag=deliveryDrag.current;if(drag&&canReorderDelivery(autoTrip)&&String(autoTrip.id)===drag.tripId&&drag.orderId!==String(o.id)){event.preventDefault();event.dataTransfer.dropEffect='move';setDragTarget(String(o.id));}},onDrop:event=>dropDeliveryOrder(event,ctx),onMouseEnter:highlightOrderOnHover?e=>scfMarkDeliveryOrder(e,true):undefined,onMouseLeave:highlightOrderOnHover?e=>scfMarkDeliveryOrder(e,false):undefined,onFocus:highlightOrderOnHover?e=>scfMarkDeliveryOrder(e,true):undefined,onBlur:highlightOrderOnHover?e=>scfMarkDeliveryOrder(e,false):undefined},
            ...(()=>{const cells={
              sequence:pi===0&&h('td',{key:'sequence',rowSpan:displayRows.length,className:'delivery-center-cell delivery-sequence-cell',style:{background:baseFill}},h('div',{className:'delivery-sequence-control'},h('b',null,autoTrip?deliverySequenceIndex.get(String(autoTrip.id)+'|'+String(o.id))||'—':'—'),h('button',{type:'button',className:'bi delivery-order-drag',draggable:canReorderDelivery(autoTrip),disabled:!canReorderDelivery(autoTrip),title:'Kéo thả lên đơn khác trong cùng chuyến để đổi vị trí','aria-label':'Kéo đổi thứ tự đơn '+o.id,onDragStart:event=>{if(!canReorderDelivery(autoTrip)){event.preventDefault();return;}deliveryDrag.current={orderId:String(o.id),tripId:String(autoTrip.id)};event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',String(o.id));},onDragEnd:()=>{deliveryDrag.current=null;setDragTarget('');}},h('i',{className:'ti ti-grip-vertical'})))),
              date:h('td',{key:'date',style:{background:baseFill}},
              h('div',{className:'delivery-order-date'},
                showOrderSelection&&(pi===0?h('input',{
                  type:'checkbox',
                  checked:bulkSelected.has(o._rowKey),
                  onChange:()=>toggleBulkOrder(o),
                  onClick:e=>e.stopPropagation(),
                  title:'Chọn đơn '+(o.id||''),
                  style:{width:16,height:16,margin:0,flex:'0 0 auto',cursor:'pointer'}
                }):h('span',{'aria-hidden':true,style:{width:16,flex:'0 0 16px'}})),
                h('span',{title:row.line?.warehouseSourceDeliveryDate||ctx.deliveryDate||''},(()=>{
                  const date=row.line?.warehouseSourceDeliveryDate||ctx.deliveryDate||'';
                  const parts=String(date).split('/');
                  return parts.length>=2?parts.slice(0,2).join('/'):date||'—';
                })())
              )
            ),
              point:h('td',{key:'point',style:coloredCell},h('span',{title:'Địa điểm đã khóa; tạo đơn mới để đổi'},row.line?.warehouseSourcePointName||ctx.pointName||'—')),
              product:h('td',{key:'product',style:coloredCell},row.empty?'—':h('div',{className:'delivery-catalog-product'},h(DeliveryCatalogCell,{order:o,lineIndex:row.line?.id?(o.lines||[]).findIndex(line=>String(line.id)===String(row.line.id)):pi,kind:'product',label:row.productName,choices:catalogProductChoices,canEdit:canEditCatalogOrder(ctx),onSave:saveCatalogCell}))),
              ...Object.fromEntries(['qtyInvoice','qtyProd','qtyDelivered'].map(field=>[field,h('td',{key:field,className:'delivery-center-cell',style:coloredCell},row.empty?'—':field==='qtyDelivered'&&!canMobileEditDelivered(o)?numFmt(row.line?.qtyDelivered!==undefined&&row.line?.qtyDelivered!==null&&row.line?.qtyDelivered!==''?row.line.qtyDelivered:row.line?.qtyProd??row.line?.qty??row.line?.quantity??row.line?.qtyInvoice??0).toLocaleString('vi-VN',{maximumFractionDigits:2}):h(DeliveryQuantityCell,{order:o,lineIndex:row.line?.id?(o.lines||[]).findIndex(line=>String(line.id)===String(row.line.id)):pi,field,canEdit:canEditMobileOrder&&!window.__SCF_ACCESS_CONTEXT?.readOnly,onSave:saveLineQuantity}))])),
              time:h('td',{key:'time',className:'delivery-center-cell',style:coloredCell},o.warehouseMerged?(row.line?.warehouseSourceDeliveryTime||ctx.deliveryTime||'—'):h(DeliveryGridCell,{order:o,lineIndex:null,field:'deliveryTime',canEdit:canEditMobileOrder&&!window.__SCF_ACCESS_CONTEXT?.readOnly&&!assignmentClosed&&(!assignmentStarted||canWithdrawStartedOrder),onSave:saveGridDeliveryTime})),
              note:h('td',{key:'note',className:'delivery-line-note-cell'},h('div',{className:'delivery-line-note-row'},h(DeliveryLineNoteCell,{order:o,lineIndex:row.empty?null:row.line?.id?(o.lines||[]).findIndex(line=>String(line.id)===String(row.line.id)):pi,canEdit:canEditMobileOrder&&!window.__SCF_ACCESS_CONTEXT?.readOnly,onSave:saveLineNote}))),
              production:pi===0&&h('td',{key:'production',rowSpan:displayRows.length,className:'delivery-center-cell delivery-production-cell'},h('button',{type:'button',className:'delivery-production-open delivery-schedule-inline','aria-label':'Chuyển chuyến + ca SX '+(ctx.pointName||ctx.id),title:[firstPlanForDisplay?.prodDate,firstPlanForDisplay?.shift?.name].filter(Boolean).join(' · '),onClick:()=>toggleOrderSchedule(o.id)},h('span',{className:'delivery-production-mode','data-mode':prodShiftMode},prodShiftMode==='manual'?'BT':'TĐ'),h('span',null,mobileDeliveryDate(firstPlanForDisplay?.prodDate)||'—'),h('span',{'aria-hidden':true},'·'),productionShiftName),productionData?.scheduleIssue&&h('small',{role:'alert'},productionData.scheduleIssue)),
              label:pi===0&&h('td',{key:'label',rowSpan:displayRows.length,className:'delivery-center-cell delivery-label-cell'},h('button',{type:'button',className:'delivery-production-open delivery-schedule-inline','aria-label':'Chỉnh chuyến SX và tem '+(ctx.pointName||ctx.id),title:[firstPlanForDisplay?.labelDate,firstPlanForDisplay?.labelTime].filter(Boolean).join(' · '),onClick:()=>toggleOrderSchedule(o.id)},h('span',{className:'delivery-production-mode','data-mode':prodShiftMode},prodShiftMode==='manual'?'BT':'TĐ'),h('span',null,mobileDeliveryDate(firstPlanForDisplay?.labelDate)||'—'),h('span',{'aria-hidden':true},'·'),h('span',null,firstPlanForDisplay?.labelTime||'—'))),
              invoice:pi===0&&h('td',{key:'invoice',rowSpan:displayRows.length,className:'delivery-center-cell delivery-invoice-cell'},
                String(o.invoiceImage||'').trim()
                  ?h('button',{className:'bi delivery-invoice-view',onClick:()=>setInvoiceView(o),title:'Xem ảnh hóa đơn','aria-label':'Xem ảnh hóa đơn'},h('i',{className:'ti ti-photo-check',style:{fontSize:15,color:'var(--pri)'}}))
                  :typeof scfWarehouseOrders!=='undefined'&&scfWarehouseOrders.photo(ctx,autoTrip,products,shifts)?.inherited?h('button',{className:'bi',title:'Dùng hóa đơn tổng chuyến',onClick:()=>{setSummaryInvoiceSide(0);setSummaryInvoiceId(String(autoTrip.id));}},h('i',{className:'ti ti-photo-check',style:{color:'var(--pri)'}})):null
              ),
              status:pi===0&&h('td',{key:'status',rowSpan:displayRows.length,className:'delivery-center-cell'},h(StatusBadge,{s:ctx.status})),
              actions:pi===0&&h('td',{key:'actions',className:'delivery-order-actions',rowSpan:displayRows.length},h('div',{style:{display:'flex',gap:2,justifyContent:'center',alignItems:'center'}},
                h('button',{className:'bi',onClick:()=>spr(o),title:'In hóa đơn'},h('i',{className:'ti ti-printer',style:{fontSize:14}})),
                h('button',{className:'bi',onClick:()=>printLabels(o),title:'In tem'},h('i',{className:'ti ti-tag',style:{fontSize:14}})),
                h('button',{className:'bi',onClick:()=>setHistoryView(o),title:'Lịch sử đơn hàng'},h('i',{className:'ti ti-history',style:{fontSize:15}})),
                h('button',{className:'bi',disabled:!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly||assignmentClosed||['done','cancelled'].includes(ctx.status),onClick:()=>addProductsToOrder(o),title:'Thêm sản phẩm vào đơn này'},h('i',{className:'ti ti-plus',style:{fontSize:15}})),
                h('button',{className:'bi',onClick:()=>copyOrder(o),title:'Nhân bản thành đơn mới'},h('i',{className:'ti ti-copy',style:{fontSize:15}})),
                canDel(currentUser.role,'delivery',currentUser.permLevels)&&h('button',{type:'button',className:'bi','data-scf-action':'delete',title:'Xóa đơn hàng','aria-label':'Xóa đơn hàng '+o.id,disabled:!scfCanDeleteDeliveryOrder(currentUser,ctx,currentTrip)||!!window.__SCF_ACCESS_CONTEXT?.readOnly,onClick:()=>del(o.id)},h('i',{className:'ti ti-trash',style:{fontSize:15,color:'#b42318'}}))
              ))
            };return visibleColumns.map(([key])=>cells[key]);})()
          );
          });
          return [...orderRows,tripTransferOrderId===String(o.id)&&h('tr',{key:'transfer_'+o._rowKey,className:'delivery-transfer-row'},h('td',{colSpan:columnCount},h(DeliveryOrderTripModal,{key:String(o.id),compactWidth:transferPanelWidth,order:ctx,trips:tripOptions,trip:autoTrip,defaultDate:preferredTripDate||ctx.deliveryDate,disabled:!canEditMobileOrder||window.__SCF_ACCESS_CONTEXT?.readOnly||assignmentLocked||['done','cancelled'].includes(ctx.status),prodShiftRules,prodShifts,customers,productionPlan:productionDisplayForOrder(ctx).firstPlan||{},onConfirm:(tripId,production)=>assignTripManually(ctx,tripId,production),onClose:()=>setTripTransferOrderId('')}))),copyDraft?._inlineSourceKey===o._rowKey&&h(DeliveryInlineCopyRows,{key:copyDraft._draftKey,draft:copyDraft,customers,products,prodCats,detailColumnsHidden,productColumnWidth,layoutColumns:visibleColumns,canEdit:canEditMobileOrder&&!window.__SCF_ACCESS_CONTEXT?.readOnly,onSave:saveRecognizedInline,onClose:()=>setCopyDraft(null)})];
        }):h('tr',null,h('td',{colSpan:columnCount,className:'empty-st'},'Chưa có đơn giao hàng nào.')))
        )
      )
    ),
    isMobile&&h('div',{className:'mobile-only mobile-card-list delivery-order-mobile-list'},
      list.length?orderTableRows.map((o,_i)=>{
        if(o._hdr)return h(DeliveryOrderGroupHeader,{key:'mobile-header-'+_i,group:o.group,...groupDetailProps(o.group),count:o.cnt,weight:o.kl,mobile:true,tone:toneForGroup(o.group),dispatchButton:groupDispatchButton(o.group),summaryInvoiceButton:summaryInvoiceButton(o.group),printButton:groupPrintButton(o.group),onEditDriver:canChangeTripDriver&&deliveryTripDriverEditable(tripById.get(String(o.group.tripId)))?setDriverEditTripId:null});
        if(groupIsHidden(groupInfoForOrder(o)))return null;
        const ctx=o._ctx||orderContext(o);
        const tripMode=o.tripAssignMode==='manual'?'manual':'auto';
        const preferredTripDate=o._preferredTripDate||getOrderTripDate(ctx,prodShifts||[])||'';
        const preferredTripShiftName=o._preferredTripShiftName||getOrderTripShiftName(ctx,prodShifts||[]);
        const autoTrip=o._autoTrip===undefined?autoTripForOrder(ctx):o._autoTrip;
        const currentTrip=orderTrip(ctx);
        const displayTrip=o._effectiveTrip===undefined?deliveryTripForOrder(ctx):o._effectiveTrip;
        const assignmentStarted=dispatchedTrip(currentTrip)||ctx.status==='delivering';
        const assignmentClosed=closedTrip(currentTrip)||ctx.status==='done';
        const assignmentLocked=assignmentClosed||(assignmentStarted&&!canWithdrawStartedOrder)||!canEditMobileOrder;
        const assignmentTitle=assignmentClosed?'Chuyến đã chờ duyệt/hoàn thành':assignmentLocked?'Bạn không có quyền chuyển đơn này':'';
        const {plans,firstPlan}=productionDisplayForOrder(ctx);
        return h(DeliveryMobileOrderCard,{key:'mod_'+o._rowKey,rowKey:o._rowKey,order:ctx,catalogOrder:o,onSaveCatalog:saveCatalogCell,pointChoices:catalogPointChoices,productChoices:catalogProductChoices,catalogEditable:canEditCatalogOrder(ctx),trip:displayTrip,tripMode,preferredTripDate,preferredTripShiftName,plans,firstPlan,
          canEditDelivered:canMobileEditDelivered(o),canEdit:canEditMobileOrder,onEdit:()=>setMobileEdit(cleanDeliveryOrderRecord(o)),onSaveQuantity:saveLineQuantity,onSaveProduction:saveMobileProduction,productionLocked:assignmentLocked||window.__SCF_ACCESS_CONTEXT?.readOnly,
          selection:showOrderSelection&&h('input',{type:'checkbox',checked:bulkSelected.has(o._rowKey),onChange:()=>toggleBulkOrder(o),'aria-label':'Chọn đơn '+(ctx.pointName||'')+' '+(ctx.deliveryTime||'')}),
          renderTripControls:()=>{
            if(!canEditMobileOrder)return null;
            const tripOptions=pickerTripsForOrder(ctx);
            return h(DeliveryMobileTripControls,{trips:tripOptions,trip:displayTrip,mode:tripMode,defaultDate:preferredTripDate||ctx.deliveryDate,
              disabled:assignmentLocked||window.__SCF_ACCESS_CONTEXT?.readOnly,modeDisabled:assignmentStarted&&tripMode==='manual',
              onModeChange:()=>setOrderTripMode(o,tripMode==='manual'?'auto':'manual'),onConfirm:tripId=>assignTripManually(o,tripId)});
          }
        });
      }):h('div',{className:'empty-st delivery-empty-state'},
        (auditActive||hasDateFilter||fPoint||fCustomer||fProduct||fTime||fArea||fTripGroup||fNote||fTripId||fTripDate||fTripShift||fTripDriver||filter!=='all'||q)?'Không có đơn phù hợp với bộ lọc hiện tại.':'Chưa có đơn giao hàng nào.',
        (auditActive||hasDateFilter||fPoint||fCustomer||fProduct||fTime||fArea||fTripGroup||fNote||fTripId||fTripDate||fTripShift||fTripDriver||filter!=='all')&&h('button',{type:'button',onClick:resetDeliveryFilters},h('i',{className:'ti ti-filter-x'}),' Xóa bộ lọc')
      )
    ),
    summaryPrintTrip&&h(TripSummaryPrintOptions,{trip:summaryPrintTrip,onClose:()=>setSummaryPrintTrip(null),onPrint:include=>{scfPrintTripSummary(summaryPrintTrip,orders,products,customers,shifts,include);setSummaryPrintTrip(null);}}),
    driverEditTripId&&tripById.get(String(driverEditTripId))&&h(DeliveryTripDriverModal,{key:driverEditTripId,trip:tripById.get(String(driverEditTripId)),employees,onSave:saveGroupDriver,onClose:()=>setDriverEditTripId('')}),
    mobileEdit&&h(DeliveryMobileOrderEditor,{key:mobileEdit.id,order:mobileEdit,customers,canEditDelivered:canMobileEditDelivered(mobileEdit),onSave:saveMobileOrder,onClose:()=>setMobileEdit(null)}),
    isMobile&&totalPages>1&&renderPagination('bottom'),
        modal==='f'&&h(OrderForm,{order:edit||copyDraft,copyMode:!!copyDraft,customers,products,prodCats,quotes,employees,currentUser,prodShifts,trips,resolveAutomaticTrip:autoTripForOrder,onSave:save,onClose:()=>{sm(null);se(null);setCopyDraft(null);}}),
    print&&h(PrintTemplateModal,{order:print,company,initialTemplate:resolveOrderPrintTemplate(print,(customers||[]).find(customer=>String(customer.id||'')===String(print.customerId||''))),onClose:()=>spr(null)}),
    summaryInvoiceFace&&h(TripInvoicePreview,{key:'summary-'+summaryInvoiceId+'-'+summaryInvoiceFace.index,src:summaryInvoiceFace.src,label:'Hóa đơn tổng · '+(summaryInvoiceTrip.shiftName||summaryInvoiceTrip.id)+' · '+(summaryInvoiceFace.index===0?'Mặt trước':'Mặt sau'),landscape:true,openAsDialog:true,dialogSize:'xl',onClose:()=>setSummaryInvoiceId(''),toolbar:summaryInvoiceFaces.length>1?h('div',{className:'invoice-zoom-controls'},summaryInvoiceFaces.map(face=>h('button',{key:face.index,type:'button',className:'bs','aria-pressed':face.index===summaryInvoiceFace.index,onClick:()=>setSummaryInvoiceSide(face.index)},face.index===0?'Mặt trước':'Mặt sau'))):null}),
    invoiceView&&h(TripInvoicePreview,{key:invoiceView.id+'-'+invoiceView.invoiceImage,src:invoiceView.invoiceImage,orderId:invoiceView.id,kind:'invoice',label:'Ảnh hóa đơn - '+invoiceView.id,landscape:true,openAsDialog:true,dialogSize:'xl',onClose:()=>setInvoiceView(null),
      toolbar:h('div',{style:{fontSize:13,color:'var(--tx2)',marginBottom:10}},h('b',null,invoiceView.pointName||invoiceView.customer||''),' — ',invoiceView.deliveryDate||'',invoiceView.deliveryTime?' · '+invoiceView.deliveryTime:'',invoiceView.invoiceUploadedAt?(' · Upload: '+invoiceView.invoiceUploadedAt):'')
    }),
    historyView&&h(Modal,{title:'Lịch sử đơn hàng - '+historyView.id,lg:true,onClose:()=>setHistoryView(null)},
      h('div',{style:{padding:10,background:'var(--bg2)',marginBottom:10}},'Tạo: '+(auditMetaForOrder(historyView).created?.precise?new Date(auditMetaForOrder(historyView).created.ms).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'}):auditMetaForOrder(historyView).created?.day?.split('-').reverse().join('/')||'Chưa ghi nhận')+' · Người tạo: '+(auditMetaForOrder(historyView).creator||'Không rõ')+' · Người sửa cuối: '+(auditMetaForOrder(historyView).editor||'Không rõ')),
      h('div',{className:'order-history-list'},
        deliveryOrderHistoryItems(historyView).length?deliveryOrderHistoryItems(historyView).slice().reverse().map(item=>h('div',{key:item.id,className:'order-history-item'},
          h('div',{className:'order-history-marker'},h('i',{className:'ti ti-history'})),
          h('div',{className:'order-history-body'},h('b',null,item.action||'Cập nhật đơn hàng'),h('div',{className:'order-history-meta'},(item.at||'')+' · '+(item.by||'Hệ thống')),(item.changes||[]).map((change,index)=>h('div',{key:index,className:'order-history-change'},change)))
        )):h('div',{className:'empty-st',style:{padding:35}},'Đơn hàng cũ chưa có lịch sử được lưu.'),
        h(Row,null,h('button',{className:'bp',onClick:()=>setHistoryView(null)},'Đóng'))
      )
    )
  );
}
