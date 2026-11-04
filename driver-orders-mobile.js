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
function scfDriverMobileCompletionIssues(trip,orders){
  if(!scfDriverWorkflowRequired()||trip?.driverMobileWorkflowVersion!==1)return [];
  const members=scfDriverWorkflowMembers(trip,orders),issues=[];
  if((trip.orderIds||[]).some(id=>!(orders||[]).some(order=>String(order.id)===String(id))))issues.push('chưa tải đủ đơn trong chuyến');
  if(members.some(order=>!order.driverDeliveredAt))issues.push('chưa tích đủ đơn đã giao');
  if(!trip.driverReturnedAt)issues.push('chưa xác nhận đã về');
  if(!Number.isInteger(trip.workReturnTotal)||trip.workReturnTotal<0)issues.push('chưa nhập công rổ mang về');
  if(!trip.cargoAfterImage)issues.push('chưa chụp thùng xe khi về');
  return issues;
}
function scfDriverMobileChange({trip,orders,user,command,orderId,value,base,stamp=fmtDT()}){
  if(!trip||!scfTripBelongsToDriver(trip,user)||!scfTripImageDispatched(trip))throw Error('Chuyến chưa được giao cho bạn hoặc đã chuyển lái xe.');
  if(!canTripAction(user,'driverWorkflow')||!canMobileFeature(user,'tripUpdate'))throw Error('Bạn chưa được cấp quyền thao tác giao hàng trên điện thoại.');
  const key=scfTripDateKey(trip.deliveryDate),today=scfTripDateKey(fmtDate()),limit=tripActualQtyLimitDays(user);
  const day=raw=>raw?Date.UTC(+raw.slice(0,4),+raw.slice(4,6)-1,+raw.slice(6,8)):0;
  if(!key||limit>0&&!trip.driverConfirmedAt&&(day(today)-day(key))/86400000>=limit)throw Error('Chuyến đã ngoài thời hạn được sửa. Hãy liên hệ kế toán.');
  const members=scfDriverWorkflowMembers(trip,orders),order=members.find(row=>String(row.id)===String(orderId||''));
  const pending=trip.status==='completion_pending';
  const invoiceRetry=pending&&((command==='invoice'&&order?.driverInvoiceReviewStatus==='rejected')||(command==='summary'&&trip.summaryInvoiceReviewStatus==='rejected'));
  if(!['assigned','active'].includes(trip.status)&&!invoiceRetry)throw Error('Chuyến đã khóa hoặc đã gửi kế toán duyệt.');
  const changes={trip:null,order:null};
  const patchTrip=patch=>{changes.trip={...trip,...patch,updatedAt:stamp,updatedBy:user.name||''};};
  const patchOrder=patch=>{if(!order)throw Error('Đơn không còn thuộc chuyến này.');changes.order={...order,...patch,updatedAt:stamp,updatedBy:user.name||''};};
  const required=scfDriverWorkflowRequired();
  const requirePhase=phase=>{if(required&&trip.status!==phase)throw Error(phase==='active'?'Hãy bắt đầu giao trước.':'Chỉ sửa phần xếp xe trước khi bắt đầu giao.');};
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
  const actualPhase=!trip?0:submitted&&!retry?4:trip.status==='active'||retry?returned||retry?3:2:trip.driverAcceptedAt?1:0;
  const phase=!workflowRequired&&workflowTab!==null&&!submitted?(workflowTab===2?(returned?3:2):workflowTab):actualPhase;
  const canWrite=!!trip&&!busy&&!submitted&&canTripAction(user,'driverWorkflow')&&canMobileFeature(user,'tripUpdate')&&!window.__SCF_ACCESS_CONTEXT?.readOnly;
  const fmt=value=>Number(value||0).toLocaleString('vi-VN',{maximumFractionDigits:2});
  const weight=(order,delivered=false)=> (order.lines||[]).reduce((sum,line)=>{const product=products.find(p=>String(p.id)===String(line.productId)),unit=String(line.unit||product?.unit||'').toLowerCase();const qty=delivered?tripDeliveredQty(line):tripOrderedQty(line);return sum+qty*(/^(kg|kgs|kilogram)$/.test(unit)?1:numFmt(line.weightPerUnit||product?.weightPerUnit||0));},0);
  const guard=()=>{const latest=context.current,access=window.__SCF_ACCESS_CONTEXT;if(String(latest.user?.id)!==String(user.id)||!previewMode&&access?.employeeId&&String(access.employeeId)!==String(user.id)||access?.readOnly)throw Error('Tài khoản hoặc quyền đã thay đổi. Hãy mở lại chuyến.');return latest;};
  const execute=(command,value,orderId='',base=null,targetId=trip?.id)=>{
    const latest=guard();let failure=null;
    const orderCommand=['load','delivered','quantity','noInvoice','invoice'].includes(command);
    ReactDOM.flushSync(()=>{const setter=orderCommand?latest.setOrders:latest.setTrips;setter(previous=>{
      try{const liveTrips=orderCommand?context.current.trips:previous,live=liveTrips.find(item=>String(item.id)===String(targetId));
        const change=scfDriverMobileChange({trip:live,orders:orderCommand?previous:context.current.orders,user:context.current.user,command,orderId,value,base});
        const record=orderCommand?change.order:change.trip;if(!record)return previous;
        return previous.map(item=>String(item.id)===String(record.id)?record:item);
      }catch(error){failure=error;return previous;}
    });});
    if(failure)throw failure;
  };
  const act=(command,value,orderId='',base=null)=>{try{setError('');execute(command,value,orderId,base);return true;}catch(error){setError(error.message);return false;}};
  const checkOrder=(order,value,command)=>{
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
  const invoiceAllowed=order=>!busy&&canMobileFeature(user,'tripUpdate')&&canTripAction(user,'driverWorkflow')&&!window.__SCF_ACCESS_CONTEXT?.readOnly&&(trip?.status==='active'||!workflowRequired&&trip?.status==='assigned'||trip?.status==='completion_pending'&&order.driverInvoiceReviewStatus==='rejected');
  const photoControl=(command,label,src)=>h('div',{className:'dm-photo'},h('div',null,h('b',null,label),h('small',null,src?'Đã có ảnh':'Chưa chụp')),src&&h('button',{type:'button','data-scf-action':'view',onClick:()=>setGallery({images:[src],label})},'Xem'),h('button',{type:'button','data-scf-action':'write',disabled:!canWrite,onClick:()=>photo(command)},h('i',{className:'ti ti-camera'}),src?' Chụp lại':' Chụp ảnh'));
  const orderCard=(order,loading)=>{
    const checked=loading?!!order.driverLoadedAt:!!order.driverDeliveredAt,images=scfDriverPhotoList(order,'driver');
    return h('article',{key:order.id,className:'dm-order'+(checked?' checked':''),'data-driver-order-id':order.id},
      h('div',{className:'dm-order-head'},h('input',{type:'checkbox',checked,disabled:!canWrite,'aria-label':(loading?'Đã xếp ':'Đã giao ')+(order.pointName||order.id)+' '+(order.deliveryTime||''),onChange:event=>checkOrder(order,event.target.checked,loading?'load':'delivered')}),
        loading?h('div',{className:'dm-order-name'},h('b',null,order.pointName||order.customer||order.id),h('small',null,(order.deliveryTime||'')+' · '+(checked?'Đã xếp lên xe':'Chưa xếp'))):h('button',{type:'button',className:'dm-order-name','data-scf-action':'view',disabled:busy,'aria-label':'Sửa SL giao '+(order.pointName||order.id)+' '+(order.deliveryTime||''),onClick:()=>openQty(order)},h('b',null,order.pointName||order.customer||order.id),h('small',null,(order.deliveryTime||'')+' · '+(checked?'Đã giao':'Chưa giao'))),h('b',null,fmt(weight(order,!loading))+' kg')),
      (order.lines||[]).map((line,index)=>h('div',{key:line.id||index,className:'dm-product'},h('span',null,line.productName||'Sản phẩm'),h('span',null,loading?fmt(tripOrderedQty(line))+' '+(line.unit||''):'Đặt '+fmt(tripOrderedQty(line))+' · Giao '+fmt(tripDeliveredQty(line))+' '+(line.unit||'')))),
      !loading&&order.driverInvoiceReviewStatus==='rejected'&&h('p',{className:'dm-error'},'HĐ cần chụp lại: '+(order.driverInvoiceReviewReason||'Kế toán chưa duyệt ảnh')),
      !loading&&h('div',{className:'dm-order-docs'},h('small',null,images.length?images.length+' ảnh HĐ':'Chụp HĐ nếu có'),images.length>0&&canMobileFeature(user,'tripInvoices')&&h('button',{type:'button','data-scf-action':'view',onClick:()=>viewPhotos(order,'driver','HĐ '+(order.pointName||order.id))},'Xem'),h('button',{type:'button','data-scf-action':'write',disabled:!invoiceAllowed(order),onClick:()=>photo('invoice',order.id)},h('i',{className:'ti ti-camera'}),images.length?' Chụp thêm HĐ':' Chụp HĐ'))
    );
  };
  const invoiceTotal=()=>h('section',{className:'dm-panel dm-total-invoice'},h('div',{className:'dm-row'},h('h3',null,'Hóa đơn tổng chuyến'),h('small',null,summaryImages.length?summaryImages.length+' ảnh':'Chưa chụp')),trip.summaryInvoiceReviewStatus==='rejected'&&h('p',{className:'dm-error'},'HĐ tổng cần chụp lại: '+(trip.summaryInvoiceReviewReason||'Kế toán chưa duyệt ảnh')),h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:busy||!canMobileFeature(user,'tripUpdate')||!canTripAction(user,'summaryInvoice')||!canTripAction(user,'driverWorkflow')||window.__SCF_ACCESS_CONTEXT?.readOnly||(trip.status!=='active'&&(workflowRequired||trip.status!=='assigned')&&!(trip.status==='completion_pending'&&trip.summaryInvoiceReviewStatus==='rejected')),onClick:()=>photo('summary')},h('i',{className:'ti ti-camera'}),summaryImages.length?' Chụp thêm hóa đơn tổng':' Chụp ảnh đơn tổng chuyến'),h('small',null,'Có thể chụp thêm ảnh đơn tổng · Tối đa 10 ảnh.'),summaryImages.length>0&&canMobileFeature(user,'tripInvoices')&&h('button',{type:'button','data-scf-action':'view',onClick:()=>viewPhotos(trip,'summary','Hóa đơn tổng chuyến')},'Xem ảnh hóa đơn tổng'));
  return h('div',{className:'driver-mobile-page'},
    h('div',{className:'dm-body'},h('label',{className:'dm-field'},'Ngày chuyến',h('input',{type:'date',value:date,disabled:busy,onChange:event=>{onDateChange(event.target.value);onTripChange('');}})),
      h('label',{className:'dm-field'},'Ca giao',h('select',{'aria-label':'Chuyến của tôi',value:trip?.id||'',disabled:busy,onChange:event=>{setError('');onTripChange(event.target.value);}},!todayTrips.length&&h('option',{value:''},'Không có chuyến được giao trong ngày'),todayTrips.map(row=>h('option',{key:row.id,value:row.id},(row.shiftName||row.id)+' · '+(row.status==='active'?'Đang giao':row.status==='completion_pending'?'Chờ kế toán':row.status==='completed'?'Đã hoàn thành':row.driverAcceptedAt?'Đang xếp':'Chờ nhận'))))),
      !trip?h('section',{className:'dm-panel'},'Chỉ hiển thị chuyến đã giao cho đúng tài khoản của bạn.'):h(React.Fragment,null,
        h('section',{className:'dm-panel'},h('div',{className:'dm-row'},h('h3',null,trip.shiftName||trip.id),h('small',null,['Chờ nhận đơn','Đang xếp xe','Đang giao','Khi về','Chờ kế toán'][phase])),h('p',null,members.length+' đơn · '+fmt(members.reduce((sum,order)=>sum+weight(order),0))+' kg đặt'),
          h('div',{className:'dm-tools'},(canMobileFeature(user,'tripSummary')||canMobileFeature(user,'tripPrint'))&&h('button',{type:'button','data-scf-action':'view',onClick:()=>setPrintMode('summary')},h('i',{className:'ti ti-file-search'}),' Đơn tổng'),canMobileFeature(user,'tripPrint')&&printTool===1&&h('button',{type:'button','data-scf-action':'view',onClick:()=>setPrintMode('labels')},h('i',{className:'ti ti-tags'}),' Tem giao'),canMobileFeature(user,'tripPrint')&&printTool===2&&h('button',{type:'button','data-scf-action':'view',onClick:()=>setPrintMode('delivery')},h('i',{className:'ti ti-printer'}),' Phiếu giao'),canMobileFeature(user,'tripPrint')&&h('button',{type:'button','data-scf-action':'view','aria-label':printTool===0?'Hiện Tem giao':printTool===1?'Hiện Phiếu giao':'Ẩn nút in',onClick:()=>{setPrintMode('');setPrintTool(value=>(value+1)%3);}},printTool===0?'>>':printTool===1?'>':'<<'))),
        h('div',{className:'dm-steps'},['Nhận đơn','Kiểm & xếp','Giao & về'].map((label,index)=>h(workflowRequired?'span':'button',{key:label,type:workflowRequired?undefined:'button',className:(phase===0?0:phase===1?1:2)===index?'on':'',disabled:!workflowRequired&&(busy||submitted),onClick:workflowRequired?undefined:()=>{setWorkflowTab(index);setError('');},'aria-label':workflowRequired?undefined:'Mở phần '+label},(index+1)+'. '+label))),
        phase===0&&h(React.Fragment,null,members.map(order=>h('section',{key:order.id,className:'dm-panel'},h('b',null,order.pointName||order.id),h('p',null,(order.deliveryTime||'')+' · '+fmt(weight(order))+' kg'))),h('button',{className:'bp',disabled:!canWrite||!members.length,onClick:()=>act('receive')},'Nhận đơn chuyến này')),
        phase===1&&h(React.Fragment,null,h('h3',null,'Kiểm hàng trước khi giao · '+loaded.length+'/'+members.length),
          [...loaded,...members.filter(order=>!order.driverLoadedAt)].map(order=>orderCard(order,true)),
          (!workflowRequired||loaded.length===members.length)&&members.length>0&&h('section',{className:'dm-panel dm-form'},h(DriverBasketField,{tripId:trip.id,label:'Tổng công rổ mang đi',value:trip.workOutTotal,disabled:!canWrite,onSave:value=>act('basketOut',value)}),photoControl('cargoBefore','Thùng xe trước giao',trip.cargoBeforeImage)),
          readyStart.length>0&&h('p',{className:'dm-hint'},readyStart.join('; ')),h('button',{className:'bp',disabled:!canWrite||!!readyStart.length,onClick:start},'Bắt đầu giao')),
        (phase===2||phase===3)&&h(React.Fragment,null,invoiceTotal(),h('h3',null,'Giao từng đơn · '+delivered.length+'/'+members.length),h('p',{className:'dm-hint'},'Tích đơn đã giao; bấm tên đơn để thay đổi SL giao.'),[...delivered,...members.filter(order=>!order.driverDeliveredAt)].map(order=>orderCard(order,false)),
          phase===2&&h('button',{className:'bp',disabled:!canWrite,onClick:()=>act('return')},'Đã về — Nộp hóa đơn'),
          (phase===3||!workflowRequired)&&h('section',{className:'dm-panel dm-form'},h(DriverBasketField,{tripId:trip.id,label:'Tổng công rổ mang về',value:trip.workReturnTotal,disabled:!canWrite,onSave:value=>act('basketReturn',value)}),h('p',null,'Mang đi '+(trip.workOutTotal??'—')+' · Mang về '+(trip.workReturnTotal??'—')),photoControl('cargoAfter','Thùng xe khi về',trip.cargoAfterImage)),
          (phase===3||!workflowRequired)&&completeMissing.length>0&&h('p',{className:'dm-hint'},completeMissing.join('; ')),(phase===3||!workflowRequired)&&h('button',{className:'bp',disabled:!canWrite||!!completeMissing.length,onClick:finish},'Hoàn thành chuyến')),
        phase===4&&h('section',{className:'dm-panel'},h('h3',null,trip.status==='completed'?'Đã được kế toán duyệt':'Đã báo hoàn thành · Chờ kế toán'),h(DriverTripEvidence,{trip,orders,showInvoices:canMobileFeature(user,'tripInvoices')})),
        !canTripAction(user,'driverWorkflow')&&h('p',{className:'dm-hint'},'Tài khoản chưa có quyền nhận và hoàn thành chuyến.'),busy&&h('p',{role:'status'},'Đang tải ảnh…'),error&&h('p',{role:'alert',className:'dm-error'},error)
      )
    ),
    trip&&editBase&&h(Modal,{title:'SL giao · '+(editBase.pointName||editBase.id),onClose:()=>setEditBase(null)},h('p',null,'SL giao mặc định theo SL đặt. Chỉ sửa sản phẩm có thay đổi.'),(editBase.lines||[]).map((line,index)=>h('label',{key:line.id||index,className:'dm-field'},line.productName+' · Đặt '+fmt(tripOrderedQty(line))+' '+(line.unit||''),h('input',{type:'text',inputMode:'decimal',value:qtyDraft[index],disabled:!canWrite||!canTripAction(user,'actualQty'),'aria-label':'SL giao '+line.productName,onChange:event=>{const value=event.target.value;setQtyDraft(previous=>previous.map((item,i)=>i===index?value:item));}}))),error&&h('p',{role:'alert',className:'dm-error'},error),h('button',{className:'bp',disabled:!canWrite||!canTripAction(user,'actualQty'),onClick:saveQty},'Xong')),
    afterOrder&&h(Modal,{title:'Đã ghi nhận giao đơn',onClose:()=>setAfterOrder('')},h('p',null,'Chụp hóa đơn nếu có, hoặc bổ sung sau.'),h(Row,null,h('button',{className:'bp',onClick:()=>{const id=afterOrder;setAfterOrder('');photo('invoice',id);}},'Chụp hóa đơn'),h('button',{onClick:()=>setAfterOrder('')},'Đóng'))),
    gallery&&h(Modal,{title:gallery.label,lg:true,onClose:()=>setGallery(null)},gallery.images.map((src,index)=>h(TripInvoicePreview,{key:src,src,landscape:true,label:gallery.label+' · '+(index+1)}))),
    trip&&printMode==='summary'&&h(Modal,{title:'Đơn tổng chuyến',onClose:()=>setPrintMode('')},canMobileFeature(user,'tripSummary')&&h('button',{onClick:()=>{setPrintMode('');onViewSummary(trip);}},'Xem ảnh đơn tổng'),canMobileFeature(user,'tripPrint')&&h('button',{className:'bp',onClick:()=>{setPrintMode('');onSummary(trip);}},'In đơn tổng chuyến')),
    trip&&printMode==='delivery'&&h(PrintByCustomerModal,{key:trip.id,tripOnlyId:trip.id,simulate:previewMode,orders:members,customers,products,company,trips:[trip],initialDate:trip.deliveryDate.split('/').reverse().join('-'),initialDateBasis:'trip',onClose:()=>setPrintMode('')}),
    trip&&printMode==='labels'&&h(DriverLabelPrintModal,{key:trip.id,trip,orders:members,products,prodCats,user,previewMode,onClose:()=>setPrintMode(''),getLatest:()=>{const latest=guard();return {...latest,trip:latest.trips.find(row=>String(row.id)===String(trip.id)),products};}})
  );
}
