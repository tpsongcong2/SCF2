// Photos are durable before recognition: local IndexedDB until trip receipt,
// then trip.invoiceInbox on the server. No OCR text or image bytes in orders.
function scfInvoiceMatchNormalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');}
function scfInvoiceInboxOrders(trip,orders){return (orders||[]).filter(o=>!['cancelled','failed'].includes(o.status)&&(String(o.tripId||'')===String(trip.id)||(trip.orderIds||[]).includes(o.id)));}
function scfMatchInvoiceToOrder(result,trip,orders){
  if(result?.status!=='ready'||Number(result.confidence)<75)return {status:'review',reason:'Chưa đọc rõ nội dung ảnh'};
  const text=' '+scfInvoiceMatchNormalize(result.text)+' ',has=value=>{const key=scfInvoiceMatchNormalize(value);return key.length>=3&&text.includes(' '+key+' ');};
  const members=scfInvoiceInboxOrders(trip,orders);
  const ranked=members.map(order=>{
    const id=has(order.id),point=has(order.pointName);
    const date=String(order.deliveryDate||'').split('/'),dateOk=date.length===3&&[date.join('/'),date.map((v,i)=>i<2?String(Number(v)):v).join('/')].some(has);
    const time=String(order.deliveryTime||'').match(/^(\d{1,2}):(\d{2})/),timeOk=!!time&&[time[1]+':'+time[2],String(Number(time[1]))+':'+time[2]].some(has);
    const lineOk=(order.lines||[]).some(line=>{
      const product=scfInvoiceMatchNormalize(line.productName).split(' ').filter(w=>w.length>2).slice(0,3).join(' ');
      const qty=Number(line.qtyInvoice??line.qtyProd);return product.length>=4&&has(product)&&qty>0&&new RegExp('(?:^| )'+String(qty).replace('.', ' ')+'(?: |$)').test(text);
    });
    return {order,id,point,dateOk,timeOk,lineOk,score:(id?12:0)+(point?5:0)+(dateOk?3:0)+(timeOk?2:0)+(lineOk?2:0)};
  }).filter(x=>(x.id&&(x.point||x.dateOk))||(x.point&&x.dateOk&&x.timeOk&&x.lineOk)).sort((a,b)=>b.score-a.score);
  if(!ranked.length)return {status:'review',reason:'Không tìm được đơn khớp chắc chắn trong chuyến'};
  if(ranked[1]&&ranked[0].score-ranked[1].score<3)return {status:'review',reason:'Có nhiều đơn gần giống nhau; cần chọn đơn'};
  return {status:'matched',orderId:ranked[0].order.id};
}
function scfInvoiceInboxField(photo){return photo.kind==='driver'?'driverInvoiceImage':'invoiceImage';}
function scfInvoiceInboxReceipt(tripId,photo){
  return typeof scfRemoteSnapshots!=='undefined'&&(scfRemoteSnapshots.get('scf_trips')||[]).find(t=>String(t.id)===String(tripId))?.invoiceInbox?.find(p=>p.id===photo.id&&p.url===photo.url);
}
function scfInvoiceInboxOrderReceipt(photo,orderId){
  const prefix=photo.kind==='driver'?'driverInvoice':'invoice';
  return typeof scfRemoteSnapshots!=='undefined'&&(scfRemoteSnapshots.get('scf_orders')||[]).find(o=>String(o.id)===String(orderId)&&o[prefix+'InboxPhotoId']===photo.id&&o[scfInvoiceInboxField(photo)]===photo.url);
}
function scfInvoiceInboxAssign(orders,trip,photo,targetId,{replace=false,manual=true,actor='',stamp=''}={}){
  const target=scfInvoiceInboxOrders(trip,orders).find(o=>String(o.id)===String(targetId));
  if(!target)throw new Error('Đơn không còn thuộc chuyến này.');
  const field=scfInvoiceInboxField(photo),prefix=photo.kind==='driver'?'driverInvoice':'invoice',marker=prefix+'InboxPhotoId';
  if(target[field]&&target[field]!==photo.url&&!replace)throw new Error('Đơn đã có ảnh hóa đơn.');
  // A manual choice always wins over a delayed automatic result.
  if(!manual&&photo.manual)throw new Error('Ảnh đã được xếp tay.');
  return orders.map(order=>{
    if(String(order.id)===String(target.id))return {...order,[field]:photo.url,[prefix+'ImageName']:photo.name,[prefix+'UploadedAt']:stamp,[prefix+'UploadedBy']:actor,[marker]:photo.id,...(photo.kind==='driver'?{driverInvoiceReviewStatus:'pending',driverInvoiceReviewReason:'',driverInvoiceReviewedAt:'',driverInvoiceReviewedBy:''}:{})};
    if(order[marker]===photo.id&&order[field]===photo.url)return {...order,[field]:'',[prefix+'ImageName']:'',[marker]:''};
    return order;
  });
}
(function(){
  let database;
  const db=()=>database||(database=new Promise((resolve,reject)=>{const request=indexedDB.open('scf-invoice-inbox-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('photos',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('Không lưu được hàng chờ ảnh trên thiết bị.'));}));
  const transaction=async(mode,task)=>{const storeDb=await db();return new Promise((resolve,reject)=>{const tx=storeDb.transaction('photos',mode),request=task(tx.objectStore('photos'));let result;request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(tx.error||new Error('Không lưu được hàng chờ ảnh.'));});};
  window.scfInvoiceInboxDrafts={list:()=>transaction('readonly',s=>s.getAll()),put:row=>transaction('readwrite',s=>s.put(row)),remove:id=>transaction('readwrite',s=>s.delete(id))};
  window.scfCaptureInvoiceInbox=async(trip,file,currentUser,kind='invoice')=>{
    if(!file?.type?.startsWith('image/'))throw new Error('Hãy chọn tệp ảnh hóa đơn.');
    const row={id:'IP-'+(crypto.randomUUID?crypto.randomUUID():uid()),tripId:String(trip.id),employeeId:String(currentUser.id),kind,name:file.name||'hoa-don.jpg',file,createdAt:new Date().toISOString(),uploadedBy:currentUser.name||''};
    await window.scfInvoiceInboxDrafts.put(row);
    window.dispatchEvent(new CustomEvent('scf-invoice-inbox-change'));
    window.showToast('Đã giữ ảnh trên thiết bị. App sẽ tải lên và xác nhận trước khi nhận diện.','info');
  };
})();
function InvoiceInboxWorker({trips,orders,setTrips,setOrders,currentUser}){
  const latest=React.useRef();latest.current={trips,orders,setTrips,setOrders,currentUser};
  useEffect(()=>{
    let stopped=false,running=false,timer,lastInput=Date.now();const retries=new Map();
    const actor=String(currentUser?.id||'');
    const synced=()=>{const state=window.scfGetSyncState?.();return !state?.pending&&state?.status!=='syncing'&&state?.status!=='error';};
    const active=()=>!stopped&&String(window.__SCF_ACCESS_CONTEXT?.employeeId||'')===actor&&navigator.onLine!==false;
    const idle=()=>active()&&document.visibilityState!=='hidden'&&Date.now()-lastInput>10000&&!navigator.scheduling?.isInputPending?.()&&synced();
    const eligible=()=>window.scfCanRunInvoiceOrientationBackground?.()===true&&canTripAction(latest.current.currentUser,'manage')&&canWrite(latest.current.currentUser.role,'delivery',latest.current.currentUser.permLevels);
    const updatePhoto=(tripId,id,patch)=>latest.current.setTrips(prev=>prev.map(t=>String(t.id)===String(tripId)?{...t,invoiceInbox:(t.invoiceInbox||[]).map(p=>p.id===id&&!p.manual&&p.status==='pending'?{...p,...patch}:p)}:t));
    const schedule=ms=>{clearTimeout(timer);if(!stopped)timer=setTimeout(run,ms);};
    async function run(){
      if(running)return;running=true;let delay=15000;
      try{
        if(!active())return;
        const drafts=(await window.scfInvoiceInboxDrafts.list()).filter(p=>p.employeeId===actor);
        const draft=drafts.find(p=>(retries.get(p.id)||0)<Date.now());
        if(draft){
          const trip=latest.current.trips.find(t=>String(t.id)===draft.tripId);if(!trip)return;
          let row=draft;
          if(!row.url){if(!synced())return;const url=await uploadPhoto(row.file,'trip-invoice-inbox/'+row.tripId,{requireRemote:true});row={...row,url};await window.scfInvoiceInboxDrafts.put(row);}
          if(!active())return;
          const {file,...metadata}=row;
          latest.current.setTrips(prev=>prev.map(t=>String(t.id)===row.tripId&&!(t.invoiceInbox||[]).some(p=>p.id===row.id)?{...t,invoiceInbox:[...(t.invoiceInbox||[]),{...metadata,status:'pending',reason:'Chưa nhận diện'}]}:t));
          await new Promise(resolve=>setTimeout(resolve,0));persistSyncQueueNow();
          if(await window.scfWaitForCollectionSync('scf_trips',50000)&&scfInvoiceInboxReceipt(row.tripId,row)){if(active())await window.scfInvoiceInboxDrafts.remove(row.id);delay=1500;}
          else retries.set(row.id,Date.now()+60000);
          return;
        }
        if(!idle()||!eligible()||window.__scfInvoiceOrientationRunning||window.__scfInvoiceMatchingBusy)return;
        const entry=latest.current.trips.filter(t=>!['completed','cancelled'].includes(t.status)).flatMap(trip=>(trip.invoiceInbox||[]).filter(p=>p.status==='pending'&&!p.manual&&(retries.get(p.id)||0)<Date.now()).map(photo=>({trip,photo})))[0];
        if(!entry)return;
        window.__scfInvoiceMatchingBusy=true;
        const {trip,photo}=entry;const isActive=()=>idle()&&eligible();
        const path=storagePhotoPathFromUrl(photo.url),src=path?await createPrivatePhotoUrl(path):photo.url;
        const result=await window.scfReadInvoiceMatchText(src,{isActive});
        if(!isActive()||result.status==='cancelled')return;
        const fresh=latest.current.trips.find(t=>t.id===trip.id),current=fresh?.invoiceInbox?.find(p=>p.id===photo.id);
        if(!current||current.manual||current.status!=='pending')return;
        const match=scfMatchInvoiceToOrder(result,fresh,latest.current.orders);
        if(match.status!=='matched'){updatePhoto(trip.id,photo.id,{status:'review',reason:match.reason});return;}
        const target=scfInvoiceInboxOrders(fresh,latest.current.orders).find(o=>o.id===match.orderId),field=scfInvoiceInboxField(photo),marker=(photo.kind==='driver'?'driverInvoice':'invoice')+'InboxPhotoId';
        if(target?.[field]&&target[marker]!==photo.id){updatePhoto(trip.id,photo.id,{status:'review',reason:'Đơn khớp đã có ảnh; cần kiểm tra'});return;}
        latest.current.setOrders(prev=>{
          const now=latest.current.trips.find(t=>t.id===trip.id)?.invoiceInbox?.find(p=>p.id===photo.id);
          if(!now||now.manual||now.status!=='pending')return prev;
          try{return scfInvoiceInboxAssign(prev,fresh,now,match.orderId,{manual:false,actor:'Nhận diện tự động',stamp:fmtDT()});}catch{return prev;}
        });
        await new Promise(resolve=>setTimeout(resolve,0));persistSyncQueueNow();
        if(!await window.scfWaitForCollectionSync('scf_orders',50000))return;
        const receipt=latest.current.orders.find(o=>o.id===match.orderId);
        if(receipt?.[marker]!==photo.id||!scfInvoiceInboxOrderReceipt(photo,match.orderId))return;
        updatePhoto(trip.id,photo.id,{status:'matched',orderId:match.orderId,manual:false,reason:'Đã ghép tự động'});
        if(result.angle!==undefined)window.scfSaveSharedInvoiceOrientation?.({orderId:String(match.orderId),kind:photo.kind,photoSource:scfInvoicePhotoSource(photo.url)},result.angle,{mode:'auto'}).catch(()=>{});
      }catch(error){console.warn('Invoice inbox:',error?.message||error);}
      finally{window.__scfInvoiceMatchingBusy=false;running=false;schedule(delay);}
    }
    const input=()=>{lastInput=Date.now();},wake=()=>{if(!running)schedule(1500);};
    for(const event of ['keydown','pointerdown','wheel','touchstart'])document.addEventListener(event,input,{passive:true,capture:true});
    window.addEventListener('scf-invoice-inbox-change',wake);window.addEventListener('online',wake);schedule(3000);
    return()=>{stopped=true;clearTimeout(timer);for(const event of ['keydown','pointerdown','wheel','touchstart'])document.removeEventListener(event,input,true);window.removeEventListener('scf-invoice-inbox-change',wake);window.removeEventListener('online',wake);};
  },[currentUser?.id]);
  return null;
}
function InvoiceInboxModal({trip,orders,setOrders,setTrips,currentUser,canCapture=false,canArrange=false,kind='invoice',onClose}){
  const [selected,setSelected]=useState(''),[choosing,setChoosing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[preview,setPreview]=useState(null),[drafts,setDrafts]=useState([]);
  const fresh=React.useRef();fresh.current={trip,orders};
  useEffect(()=>{let alive=true;const load=()=>window.scfInvoiceInboxDrafts.list().then(rows=>{if(alive)setDrafts(rows.filter(p=>p.employeeId===String(currentUser.id)&&p.tripId===String(trip.id)));}).catch(e=>{if(alive)setError(e.message);});load();const timer=setInterval(load,5000);window.addEventListener('scf-invoice-inbox-change',load);return()=>{alive=false;clearInterval(timer);window.removeEventListener('scf-invoice-inbox-change',load);};},[trip.id,currentUser.id]);
  const photos=trip.invoiceInbox||[],members=scfInvoiceInboxOrders(trip,orders),linkedToOrder=p=>members.some(o=>o.id===p.orderId&&o[scfInvoiceInboxField(p)]===p.url),waiting=photos.filter(p=>!['matched','manual'].includes(p.status)||!linkedToOrder(p));
  const capture=source=>scfPickPhoto(file=>window.scfCaptureInvoiceInbox(trip,file,currentUser,kind).catch(e=>setError(e.message)),source);
  const patchPhoto=(id,patch)=>setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,invoiceInbox:(t.invoiceInbox||[]).map(p=>p.id===id?{...p,...patch}:p)}:t));
  const assign=async(photoId,orderId)=>{
    if(!canArrange||busy)return;
    const photo=fresh.current.trip.invoiceInbox?.find(p=>p.id===photoId),target=scfInvoiceInboxOrders(fresh.current.trip,fresh.current.orders).find(o=>o.id===orderId);
    if(!photo||!target){setError('Ảnh hoặc đơn đã thay đổi. Hãy chọn lại.');return;}
    const field=scfInvoiceInboxField(photo),replace=!!target[field]&&target[field]!==photo.url;
    if(replace&&!await window.scfConfirm('Đơn '+(target.pointName||target.id)+' đã có ảnh. Thay bằng ảnh đang chọn? Ảnh cũ sẽ được giữ trong Ảnh chờ xếp.','Thay ảnh hóa đơn'))return;
    setBusy(true);setError('');
    try{
      // Persist the manual reservation first. A delayed OCR result must stop.
      setTrips(prev=>prev.map(t=>{
        if(t.id!==trip.id)return t;let inbox=(t.invoiceInbox||[]).map(p=>p.id===photo.id?{...p,manual:true,orderId,status:'assigning',reason:'Đang xếp tay'}:p);
        if(replace){const old=inbox.find(p=>p.url===target[field]&&p.kind===photo.kind);if(old)inbox=inbox.map(p=>p.id===old.id?{...p,status:'review',orderId:'',manual:true,reason:'Ảnh cũ được giữ khi thay ảnh'}:p);else inbox=[...inbox,{id:'IP-'+uid(),url:target[field],kind:photo.kind,name:'Ảnh trước khi thay',status:'review',manual:true,reason:'Ảnh cũ được giữ khi thay ảnh',createdAt:new Date().toISOString()}];}
        return {...t,invoiceInbox:inbox};
      }));
      await new Promise(resolve=>setTimeout(resolve,0));persistSyncQueueNow();
      if(!await window.scfWaitForCollectionSync('scf_trips',50000)||scfInvoiceInboxReceipt(trip.id,photo)?.manual!==true)throw new Error('Chưa xác nhận được hàng chờ trên máy chủ. Ảnh vẫn được giữ; hãy kiểm tra đồng bộ rồi thử lại.');
      const currentTarget=fresh.current.orders.find(o=>o.id===orderId);
      if(currentTarget?.[field]!==target[field])throw new Error('Ảnh của đơn vừa thay đổi trên máy khác. Hãy kiểm tra và chọn lại.');
      const next=scfInvoiceInboxAssign(fresh.current.orders,fresh.current.trip,{...photo,manual:true},orderId,{replace,manual:true,actor:currentUser.name,stamp:fmtDT()});
      const changed=new Map(next.filter((o,i)=>o!==fresh.current.orders[i]).map(o=>[o.id,o]));
      const beforeImages=new Map(fresh.current.orders.map(o=>[o.id,o[field]]));
      setOrders(prev=>{
        if(prev.some(o=>changed.has(o.id)&&o[field]!==beforeImages.get(o.id)))return prev;
        return prev.map(o=>{
        const update=changed.get(o.id);if(!update)return o;
        // Change only image fields; retain quantities and concurrent order edits.
        const prefix=photo.kind==='driver'?'driverInvoice':'invoice';const keys=[field,prefix+'ImageName',prefix+'UploadedAt',prefix+'UploadedBy',prefix+'InboxPhotoId',...(photo.kind==='driver'?['driverInvoiceReviewStatus','driverInvoiceReviewReason','driverInvoiceReviewedAt','driverInvoiceReviewedBy']:[])];
        return {...o,...Object.fromEntries(keys.filter(key=>Object.prototype.hasOwnProperty.call(update,key)).map(key=>[key,update[key]]))};
        });
      });
      await new Promise(resolve=>setTimeout(resolve,0));persistSyncQueueNow();
      if(!await window.scfWaitForCollectionSync('scf_orders',50000)||!scfInvoiceInboxOrderReceipt(photo,orderId))throw new Error('Ảnh đang chờ xác nhận vào đơn. Không cần tải lại ảnh; kiểm tra đồng bộ rồi mở lại.');
      patchPhoto(photo.id,{status:'manual',manual:true,orderId,reason:'Đã xếp tay'});
      setSelected('');setChoosing(false);window.showToast('Đã xếp ảnh vào đơn.','success');
    }catch(e){setError(e.message||String(e));}finally{setBusy(false);}
  };
  const photoCard=p=>h('article',{key:p.id,className:'invoice-inbox-photo'+(selected===p.id?' selected':''),draggable:canArrange&&!busy,onDragStart:e=>{setSelected(p.id);e.dataTransfer.setData('application/scf-invoice-photo',p.id);e.dataTransfer.effectAllowed='move';}},
    h('button',{type:'button',className:'invoice-inbox-thumb',onClick:()=>setPreview(p),'aria-label':'Xem '+(p.name||'ảnh hóa đơn')},h('img',{src:p.url,alt:p.name||'Ảnh hóa đơn',loading:'lazy'})),
    h('div',{className:'invoice-inbox-photo-text'},h('span',null,p.name||'Ảnh hóa đơn'),h('small',null,p.reason||'Chưa nhận diện'),canArrange&&h('button',{type:'button',disabled:busy,onClick:()=>{setSelected(p.id);setChoosing(true);}},'Chọn đơn')));
  return h(React.Fragment,null,h(Modal,{title:'Xếp ảnh hóa đơn · '+(trip.shiftName||trip.id)+' · '+trip.deliveryDate,lg:'xl',className:'invoice-inbox-modal',onClose},
    h('div',{className:'invoice-inbox-toolbar'},h('span',null,'Lái xe: '+(trip.driverName||'Chưa có lái xe')),canCapture&&h('div',null,h('button',{type:'button',onClick:()=>capture('camera')},h('i',{className:'ti ti-camera'}),' Chụp tiếp'),h('button',{type:'button',onClick:()=>capture('upload')},'Chọn ảnh'))),
    error&&h('div',{role:'alert',className:'invoice-inbox-error'},error),
    h('div',{className:'invoice-inbox-layout'},h('aside',null,h('div',{className:'invoice-inbox-heading'},'Ảnh chờ xếp ('+waiting.length+')'),
      drafts.map(p=>h('div',{key:p.id,className:'invoice-inbox-local'},p.name,h('small',null,'Đang giữ trên thiết bị · chờ máy chủ xác nhận'))),waiting.map(photoCard),!waiting.length&&!drafts.length&&h('p',null,'Không có ảnh chờ xếp.')),
      h('section',null,h('div',{className:'invoice-inbox-heading'},'Đơn trong chuyến',canArrange&&h('small',null,'Kéo ảnh vào đơn hoặc bấm Chọn đơn')),
        members.map(order=>{const linked=photos.filter(p=>p.orderId===order.id&&order[scfInvoiceInboxField(p)]===p.url&&['manual','matched'].includes(p.status));return h('article',{key:order.id,className:'invoice-inbox-order',onDragOver:e=>{if(canArrange&&!busy&&e.dataTransfer.types.includes('application/scf-invoice-photo')){e.preventDefault();e.dataTransfer.dropEffect='move';}},onDrop:e=>{e.preventDefault();const id=e.dataTransfer.getData('application/scf-invoice-photo');if(photos.some(p=>p.id===id))assign(id,order.id);}},
          h('div',{className:'invoice-inbox-order-title'},h('span',null,order.pointName||order.id),h('small',null,order.invoiceImage||order.driverInvoiceImage?'Có ảnh hóa đơn':'Chưa có ảnh')),
          h('small',null,order.deliveryDate+' · '+order.deliveryTime+' · '+order.id),h('div',{className:'invoice-inbox-lines'},(order.lines||[]).map(l=>(l.productName||'')+' · '+(l.qtyInvoice??l.qtyProd??0)+' '+(l.unit||'kg')).join(' / ')),
          linked.map(p=>h('div',{key:p.id,className:'invoice-inbox-linked'},h('button',{type:'button',onClick:()=>setPreview(p)},h('i',{className:'ti ti-photo'}),' '+(p.manual?'Đã xếp tay':'Đã ghép tự động')),canArrange&&h('button',{type:'button',disabled:busy,onClick:()=>{setSelected(p.id);setChoosing(true);}},'Chuyển ảnh'))),
          choosing&&selected&&canArrange&&h('button',{type:'button',className:'bp',disabled:busy,onClick:()=>assign(selected,order.id)},busy?'Đang lưu…':'Xếp ảnh vào đơn này'));
        }))),
    h('div',{className:'invoice-inbox-footer',role:'status'},busy?'Đang xác nhận trên máy chủ…':canArrange?'Ảnh xếp tay được giữ nguyên; nhận diện nền không tự chuyển lại.':'Ảnh đã tải lên sẽ được kế toán kiểm tra và xếp vào đơn.')),
    preview&&h(TripInvoicePreview,{src:preview.url,label:preview.name||'Ảnh hóa đơn',landscape:true,openAsDialog:true,dialogSize:'xl',onClose:()=>setPreview(null)}));
}
