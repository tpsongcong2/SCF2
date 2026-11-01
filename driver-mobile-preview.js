/* Admin sandbox: uses the real phone component with isolated in-memory sample records. */
function scfDriverPreviewData(){
 const date=fmtDate(),user={id:'DEMO-DRIVER',name:'LÁI XE TRẢI NGHIỆM',role:'driver',permissions:['trips'],tripActualQtyLimitDays:0};
 const products=[{id:'DEMO-BUN',code:'TP01',name:'BÚN TƯƠI',unit:'kg'},{id:'DEMO-PHO',code:'TP04',name:'BÁNH PHỞ TƯƠI',unit:'kg'}];
 const orders=[['SEVT2','15:00',22,0],['SEVT1','10:00',12,1],['SEVT1','16:00',35,0]].map(([point,time,qty,index],i)=>({id:'DEMO-O'+i,tripId:'DEMO-T',pointName:point,deliveryTime:time,deliveryDate:date,status:'assigned',lines:[{id:'DEMO-L'+i,productId:products[index].id,productName:products[index].name,unit:'kg',qtyProd:qty,qtyInvoice:qty,qtyDelivered:qty}]}));
 return {user,products,orders,trips:[{id:'DEMO-T',shiftName:'SS C1 · Trải nghiệm',driverId:user.id,driverName:user.name,deliveryDate:date,status:'assigned',driverDispatchedAt:new Date().toISOString(),orderIds:orders.map(o=>o.id)}],date};
}
function DriverMobilePreview({currentUser}){
 const [sample,setSample]=useState(scfDriverPreviewData),[orders,setOrders]=useState(()=>sample.orders),[trips,setTrips]=useState(()=>sample.trips),[summary,setSummary]=useState(false),[instance,setInstance]=useState(0);
 if(!['admin','administrator'].includes(String(currentUser?.role||'').toLowerCase()))return null;
 const reset=()=>{const next=scfDriverPreviewData();setSample(next);setOrders(next.orders);setTrips(next.trips);setSummary(false);setInstance(v=>v+1);};
 const start=trip=>setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,status:'active',driverConfirmedAt:fmtDT()}:t));
 const finish=trip=>{setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,status:'completion_pending'}:t));setOrders(prev=>prev.map(o=>({...o,status:'done'})));};
 return h('div',{className:'driver-demo'},
  h('div',{className:'card'},h('b',null,'Trải nghiệm giao diện lái xe'),h('p',null,'Dữ liệu mẫu. Thao tác chỉ chạy tại đây; không đổi chuyến, tải ảnh hoặc gửi máy in thật. Nút chụp ảnh dùng ảnh minh họa.'),h('button',{onClick:reset},'Làm lại từ đầu')),
  h(DriverOrdersMobile,{key:instance,trips,orders,products:sample.products,prodCats:[],customers:[],shifts:[],company:{},user:sample.user,setTrips,setOrders,date:sample.date.split('/').reverse().join('-'),onDateChange:()=>{},tripId:'DEMO-T',onTripChange:()=>{},onStart:start,onComplete:finish,onSummary:()=>window.showToast('Trải nghiệm: đã mô phỏng in đơn tổng.','success'),onViewSummary:()=>setSummary(true),previewMode:true}),
  summary&&h(Modal,{title:'Đơn tổng chuyến mẫu',onClose:()=>setSummary(false)},h('button',{onClick:()=>setSummary(false)},'Thoát về chuyến lái xe'),orders.map(o=>h('div',{key:o.id,className:'dm-panel'},h('b',null,o.pointName+' · '+o.deliveryTime),(o.lines||[]).map(l=>h('p',{key:l.id},l.productName+' · '+tripOrderedQty(l)+' kg')))))
 );
}
