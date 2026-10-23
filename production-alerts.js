/* Only production-relevant order fields trigger the bell; invoice/delivery confirmations do not. */
function scfProductionOrderProjection(o){
 return {id:String(o.id),cancelled:o.status==='cancelled',deliveryDate:o.deliveryDate||'',deliveryTime:o.deliveryTime||'',pointName:o.pointName||'',pointId:String(o.pointId||o.ptId||''),customerId:String(o.customerId||o.custId||''),customer:o.customer||'',address:o.address||'',area:o.area||'',prodShiftAssignMode:o.prodShiftAssignMode==='manual'?'manual':'auto',prodShiftId:o.prodShiftId||'',prodDate:o.prodDate||'',prodTime:o.prodTime||'',note:o.note||'',lines:(o.lines||[]).map(l=>({productId:String(l.productId||''),productName:l.productName||'',unit:l.unit||'',qtyProd:l.qtyProd??l.qty??l.quantity??0,shiftOverride:!!l.shiftOverride,prodDate:l.prodDate||'',prodTime:l.prodTime||'',note:l.note||''}))};
}
function scfProductionOrderSnapshot(orders){return new Map((orders||[]).map(o=>[String(o.id),scfProductionOrderProjection(o)]));}
function scfProductionOrderChanges(before,after,ids){
 const changes=[];
 for(const id of ids){const a=before.get(id),b=after.get(id);if(JSON.stringify(a)===JSON.stringify(b))continue;
  const label=[b?.pointName||a?.pointName||id,b?.deliveryDate||a?.deliveryDate,b?.deliveryTime||a?.deliveryTime].filter(Boolean).join(' · ');
  const state=!a?'Thêm đơn':!b?'Xóa đơn':!a.cancelled&&b.cancelled?'Hủy đơn':a.cancelled&&!b.cancelled?'Khôi phục đơn':'Sửa đơn';
  const qty=o=>(o?.lines||[]).map(l=>(l.productName||l.productId)+': '+l.qtyProd+' '+l.unit).join('; ');
  changes.push({id,text:state+' · '+label,before:qty(a),after:qty(b)});
 }
 return changes;
}
async function scfProductionPushRequest(operation,data={}){
 const {data:result,error}=await invokeScfAuth({body:{action:'production_push',operation,...data}},30000);
 if(error||!result?.ok)throw Error(result?.error||'Chưa kết nối được thông báo điện thoại. Cần cập nhật/cấu hình máy chủ.');
 return result;
}
async function scfProductionPushRegistration(){
 if(!window.isSecureContext||!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw Error('Thiết bị chưa hỗ trợ thông báo đẩy. Trên iPhone, thêm SCFOOD vào Màn hình chính và mở từ biểu tượng đó.');
 const registration=await navigator.serviceWorker.getRegistration();
 if(!registration?.active)throw Error('App chưa sẵn sàng nhận thông báo. Tải lại app rồi thử bật lại.');
 return registration;
}
function scfProductionPushBind(registration,employeeId){registration?.active?.postMessage({type:'scf-production-push-owner',employeeId:String(employeeId||'')});}
let scfProductionPushIdentityEpoch=0;
async function scfDetachProductionPush(){
 scfProductionPushIdentityEpoch++;
 if(!('serviceWorker' in navigator))return;
 try{
  const reg=await navigator.serviceWorker.getRegistration();if(!reg?.active)return;
  await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(resolve,1500);channel.port1.onmessage=()=>{clearTimeout(timer);channel.port1.close();resolve();};reg.active.postMessage({type:'scf-production-push-owner',employeeId:''},[channel.port2]);});
  const sub=await reg.pushManager?.getSubscription();if(sub)await sub.unsubscribe();
 }catch{}
}
function useProductionPushIdentity(user,onOpen){
 const openRef=useRef(onOpen);openRef.current=onOpen;
 const allowed=!!user&&canAccess(user.role,'prodsummary',user.permissions,employeeDepartments(user));
 useEffect(()=>{
  if(!('serviceWorker' in navigator))return;
  let active=true,registration;const epoch=++scfProductionPushIdentityEpoch;
  const restore=async()=>{try{registration=await navigator.serviceWorker.getRegistration();if(!registration||!active||epoch!==scfProductionPushIdentityEpoch)return;scfProductionPushBind(registration,'');if(!allowed)return;const sub=await registration.pushManager?.getSubscription();if(!sub)return;const status=await scfProductionPushRequest('status',{endpoint:sub.endpoint});if(active&&epoch===scfProductionPushIdentityEpoch&&status.enabled)scfProductionPushBind(registration,user.id);}catch{}};
  restore();
  const receive=event=>{if(event.data?.type==='scf-production-push-open'&&allowed)openRef.current?.();};
  navigator.serviceWorker.addEventListener('message',receive);
  const url=new URL(location.href);if(allowed&&url.searchParams.has('scfProductionAlert')){url.searchParams.delete('scfProductionAlert');history.replaceState(null,'',url);openRef.current?.();}
  return()=>{active=false;scfProductionPushBind(registration,'');navigator.serviceWorker.removeEventListener('message',receive);};
 },[user?.id,allowed]);
}
function ProductionPushIdentity({currentUser,onOpen}){useProductionPushIdentity(currentUser,onOpen);return null;}
async function scfEnableProductionPush(user){
 const epoch=scfProductionPushIdentityEpoch,stillCurrent=()=>{if(epoch!==scfProductionPushIdentityEpoch)throw Error('Tài khoản vừa thay đổi. Hãy bật thông báo lại.');};
 if(!window.isSecureContext||!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw Error('Thiết bị chưa hỗ trợ thông báo đẩy. Trên iPhone, thêm SCFOOD vào Màn hình chính và mở từ biểu tượng đó.');
 // Request directly from the user's click, before the server round trip (required on iOS).
 const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Chưa được cấp quyền thông báo. Hãy cho phép thông báo SCFOOD trong cài đặt trình duyệt/điện thoại.');
 stillCurrent();const registration=await scfProductionPushRegistration();stillCurrent();
 const config=await scfProductionPushRequest('config');if(!config.configured)throw Error('Máy chủ chưa bật Web Push. Quản trị cần hoàn tất hướng dẫn cấu hình thông báo điện thoại.');
 stillCurrent();
 const raw=atob(config.publicKey.replace(/-/g,'+').replace(/_/g,'/')),key=Uint8Array.from(raw,c=>c.charCodeAt(0));
 const subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
 stillCurrent();await scfProductionPushRequest('subscribe',{subscription:subscription.toJSON()});stillCurrent();scfProductionPushBind(registration,user.id);
 return subscription;
}
async function scfDisableProductionPush(){
 const registration=await scfProductionPushRegistration(),subscription=await registration.pushManager.getSubscription();
 scfProductionPushBind(registration,'');
 if(subscription){await scfProductionPushRequest('unsubscribe',{endpoint:subscription.endpoint});await subscription.unsubscribe();}
}
function ProductionOrderAlerts({orders,scopeOrderIds,scopeKey,currentUser}){
 const[unread,setUnread]=useState(0),[messages,setMessages]=useState([]),[expanded,setExpanded]=useState(false),[sound,setSound]=useState(false),[error,setError]=useState(''),[pushBusy,setPushBusy]=useState(false);
 const previous=useRef(null),audio=useRef(null),soundRef=useRef(false);
 const ring=()=>{try{const ctx=audio.current;if(!ctx||ctx.state!=='running')return;[0,.25,.5].forEach((delay,index)=>{const oscillator=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+delay;oscillator.type='sine';oscillator.frequency.value=index===1?880:660;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.18,at+.02);gain.gain.exponentialRampToValueAtTime(.001,at+.2);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(at);oscillator.stop(at+.22);});}catch{}};
 useEffect(()=>{
  const next=scfProductionOrderSnapshot(orders),ids=new Set(scopeOrderIds||[]),old=previous.current;
  previous.current={snapshot:next,ids,scopeKey};
  if(!old||old.scopeKey!==scopeKey){setUnread(0);setMessages([]);return;}
  const changes=scfProductionOrderChanges(old.snapshot,next,new Set([...old.ids,...ids]));if(!changes.length)return;
  setMessages(items=>[{at:new Date().toLocaleTimeString('vi-VN'),changes},...items].slice(0,20));setUnread(n=>n+changes.length);
  if(soundRef.current)ring();
 },[orders,scopeKey,JSON.stringify(scopeOrderIds)]);
 useEffect(()=>()=>{audio.current?.close().catch(()=>{});},[]);
 const enableSound=async()=>{setError('');if(soundRef.current){soundRef.current=false;setSound(false);return;}try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Thiết bị chưa hỗ trợ chuông trong app.');audio.current=audio.current||new Audio();await audio.current.resume();if(audio.current.state!=='running')throw Error('Chưa bật được âm thanh. Kiểm tra chế độ im lặng và thử lại.');soundRef.current=true;setSound(true);ring();}catch(e){setError(e.message);}};
 const enablePush=async()=>{if(pushBusy)return;setPushBusy(true);setError('');try{await scfEnableProductionPush(currentUser);window.showToast('Đã đăng ký thông báo điện thoại. Có thể khóa màn hình để nhận thông báo khi có đơn đổi.','success');}catch(e){setError(e.message);}finally{setPushBusy(false);}};
 const latest=messages[0];
 return h('section',{className:'production-order-alerts'+(unread?' has-changes':''),'aria-label':'Thông báo thay đổi đơn hàng sản xuất'},
  h('div',{className:'production-alert-controls'},h('button',{type:'button',className:'production-alert-bell','aria-label':'Chuông thay đổi đơn hàng','aria-expanded':expanded,onClick:()=>setExpanded(v=>!v)},h('span',{className:'production-alert-symbol','aria-hidden':true},'🔔'),unread?h('b',null,unread+' thay đổi chưa xem'):h('span',null,'Theo dõi đơn hàng')),
   h('button',{type:'button','aria-pressed':sound,onClick:enableSound},sound?'Tắt chuông':'Bật chuông'),h('button',{type:'button',disabled:pushBusy,onClick:enablePush},pushBusy?'Đang bật…':'Bật thông báo điện thoại'),h('button',{type:'button',disabled:pushBusy,onClick:async()=>{setPushBusy(true);try{await scfDisableProductionPush();setError('Đã tắt thông báo sản xuất trên điện thoại này.');}catch(e){setError(e.message);}finally{setPushBusy(false);}}},'Tắt thông báo điện thoại')),
  latest&&h('div',{role:'status','aria-live':'polite',className:'production-alert-banner'},h('b',null,'ĐƠN HÀNG THAY ĐỔI · '+latest.at),h('div',null,latest.changes.slice(0,3).map(c=>c.text).join(' | ')),h('small',null,'Số liệu KL sản xuất đã tính lại theo dữ liệu vừa nhận. Kiểm tra chi tiết trước khi tiếp tục.')),
  error&&h('p',{role:'alert'},error),
  expanded&&h('div',{className:'production-alert-history'},messages.length?messages.map((m,i)=>h('div',{key:i},h('b',null,m.at),m.changes.map(c=>h('div',{key:c.id},h('strong',null,c.text),c.before&&h('div',null,'Trước: '+c.before),c.after&&h('div',null,'Sau: '+c.after))))):h('p',null,'Chưa phát hiện thay đổi đơn hàng trong phạm vi đang xem kể từ khi mở màn hình.'),h('button',{onClick:()=>{setUnread(0);setExpanded(false);}},'Đã xem'))
 );
}
