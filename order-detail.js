/* ─── ĐƠN HÀNG CHI TIẾT ─── */
function OrderDetailListTab({orders,setOrders,products,customers,shifts,trips,currentUser,prodShifts,quotes,financeDebts,setFinanceDebts,menuHidden,setMenuHidden}){
  const todayVN=fmtDate();
  const todayISO=todayVN.split('/').reverse().join('-');
  const[periodMode,setPeriodMode]=useState('day');
  const[anchorDate,setAnchorDate]=useState(todayISO);
  const[rangeFrom,setRangeFrom]=useState(todayISO);
  const[rangeTo,setRangeTo]=useState(todayISO);
  const[shiftF,setShiftF]=useState('all');
  const[areaF,setAreaF]=useState('all');
  const[customerF,setCustomerF]=useState('all');
  const[tripF,setTripF]=useState('all');
  const[driverF,setDriverF]=useState('all');
  const[groupMode,setGroupMode]=useLS('scf_order_detail_group_mode','area');
  const[pageSize,setPageSize]=useState(25);
  const[page,setPage]=useState(1);
  const[mobileFiltersHidden,setMobileFiltersHidden]=useLS('scf_order_detail_mobile_filters_hidden',window.innerWidth<=768);

  const cleanShiftName=name=>{
    const n=String(name||'').trim();
    return n.toLowerCase().includes('ngày')?'Ca sáng':n;
  };
  const toISO=value=>{
    const s=String(value||'').trim();
    if(!s)return'';
    if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
    const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):'';
  };
  const localISO=date=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  const periodRange=(()=>{
    if(periodMode==='range')return{from:rangeFrom,to:rangeTo};
    const base=new Date((anchorDate||todayISO)+'T12:00:00');
    if(periodMode==='week'){
      const monday=new Date(base);monday.setDate(base.getDate()-((base.getDay()+6)%7));
      const sunday=new Date(monday);sunday.setDate(monday.getDate()+6);
      return{from:localISO(monday),to:localISO(sunday)};
    }
    if(periodMode==='month'){
      const first=new Date(base.getFullYear(),base.getMonth(),1,12);
      const last=new Date(base.getFullYear(),base.getMonth()+1,0,12);
      return{from:localISO(first),to:localISO(last)};
    }
    return{from:anchorDate,to:anchorDate};
  })();

  const pointAreaById=new Map(),pointAreaByName=new Map();
  (customers||[]).forEach(c=>(c.points||[]).forEach(pt=>{
    if(pt.id)pointAreaById.set(String(pt.id),pt.area||'');
    if(pt.name)pointAreaByName.set(String(pt.name),pt.area||'');
  }));
  const shiftById=new Map((shifts||[]).filter(s=>s?.id).map(s=>[String(s.id),s]));
  const areaCache=new WeakMap();
  const resolveArea=o=>{const cached=areaCache.get(o);if(cached!==undefined)return cached;const area=o.area||pointAreaById.get(String(o.pointId||''))||pointAreaByName.get(String(o.pointName||''))||(shiftById.get(String(o.shiftId||''))?.area||'');areaCache.set(o,area);return area;};
  const orderDateCache=new WeakMap();
  const orderDate=o=>{const cached=orderDateCache.get(o);if(cached!==undefined)return cached;const value=toISO(o.deliveryDate);orderDateCache.set(o,value);return value;};

  const tripById=new Map(),tripByOrder=new Map();
  (trips||[]).forEach(t=>{
    tripById.set(String(t.id),t);
    (t.orderIds||[]).forEach(orderId=>{if(!tripByOrder.has(String(orderId)))tripByOrder.set(String(orderId),t);});
  });
  const tripForOrder=o=>tripById.get(String(o.tripId||''))||tripByOrder.get(String(o.id||''))||null;

  const isDriver=currentUser?.role==='driver';
  const deptKey=String(currentUser?.dept||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const isAccounting=deptKey.includes('ke toan');
  const cleanName=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
  const isOwnTrip=t=>!isDriver||String(t?.driverId||'')===String(currentUser?.id||'')||cleanName(t?.driverName)===cleanName(currentUser?.name);
  const scopedTrips=isDriver?(trips||[]).filter(t=>isOwnTrip(t)&&t.status!=='cancelled'):(trips||[]);
  const scopedTripIds=new Set(scopedTrips.map(t=>String(t.id)));
  const scopedTripById=new Map(scopedTrips.map(t=>[String(t.id),t]));
  const scopedTripByOrder=new Map();
  scopedTrips.forEach(t=>(t.orderIds||[]).forEach(orderId=>{if(!scopedTripByOrder.has(String(orderId)))scopedTripByOrder.set(String(orderId),t);}));
  const visibleTripForOrder=o=>{
    if(!isDriver)return tripForOrder(o);
    const storedTripId=String(o?.tripId||'').trim();
    if(storedTripId)return scopedTripById.get(storedTripId)||null;
    return scopedTripByOrder.get(String(o?.id||''))||null;
  };
  const scopedOrders=isDriver?(orders||[]).filter(o=>scopedTripIds.has(String(visibleTripForOrder(o)?.id||''))):(orders||[]);

  const customerOptions=[...new Set(scopedOrders.map(o=>o.customer).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const areaOptions=[...new Set([
    ...scopedOrders.map(resolveArea),
    ...(!isDriver?(customers||[]).flatMap(c=>(c.points||[]).map(pt=>pt.area)):[]),
    ...(!isDriver?(shifts||[]).map(s=>s.area):[])
  ].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const deliveryShiftById=new Map((shifts||[]).filter(s=>s?.id).map(s=>[String(s.id),s]));
  const cleanDeliveryShiftName=value=>String(value||'').trim()
    .replace(/^CH[a-z0-9_-]+\s*[·|\-–—:]\s*/i,'')
    .replace(/^CH[a-z0-9_-]+$/i,'')
    .trim();
  const deliveryTripShiftName=t=>cleanDeliveryShiftName(deliveryShiftById.get(String(t?.shiftId||''))?.name||t?.shiftName)||'Chưa đặt ca giao';
  const deliveryTripLabel=t=>[deliveryTripShiftName(t),t?.deliveryDate,t?.driverName].filter(Boolean).join(' · ');
  const deliveryShiftMetaCache=new WeakMap();
  const deliveryShiftForOrder=o=>{
    const cached=deliveryShiftMetaCache.get(o);if(cached)return cached;
    const trip=visibleTripForOrder(o);
    let plannedId='',plannedName='';
    if(!trip){
      const manualShift=o?.prodShiftAssignMode==='manual'&&o?.prodShiftId?(prodShifts||[]).find(s=>s.id===o.prodShiftId):null;
      const plannedShift=manualShift||getProdShiftForOrder(o,prodShifts||[],customers||[]);
      const currentShift=resolveCurrentDeliveryShift(o,plannedShift);
      plannedId=String(currentShift?.id||plannedShift?.tripShiftId||'').trim();
      plannedName=String(currentShift?.name||resolveArea(o)||plannedShift?.tripShiftName||'').trim();
    }
    const id=String(trip?.shiftId||plannedId||'').trim();
    const name=cleanDeliveryShiftName(deliveryShiftById.get(id)?.name||trip?.shiftName||plannedName);
    const normalizedName=name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
    const meta={id,name,key:id?'id:'+id:(normalizedName?'name:'+normalizedName:'')};deliveryShiftMetaCache.set(o,meta);return meta;
  };
  // Dựng danh sách ca từ cấu hình/chuyến thay vì tính lại ca cho hàng nghìn đơn.
  // Chỉ khi người dùng chọn một ca cụ thể mới tính ca của từng đơn để lọc.
  const tripOptionMap=new Map();
  const addTripOption=(idValue,nameValue)=>{
    const id=String(idValue||'').trim();const name=cleanDeliveryShiftName(nameValue||deliveryShiftById.get(id)?.name||'');
    const normalizedName=name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
    const key=id?'id:'+id:(normalizedName?'name:'+normalizedName:'');if(key&&!tripOptionMap.has(key))tripOptionMap.set(key,{id,name,key});
  };
  (prodShifts||[]).filter(shift=>shift?.active!==false).forEach(shift=>addTripOption(shift.tripShiftId,shift.tripShiftName));
  (shifts||[]).forEach(shift=>addTripOption(shift.id,shift.name));
  scopedTrips.forEach(trip=>{const date=toISO(trip.deliveryDate);if(periodRange.from&&date&&date<periodRange.from)return;if(periodRange.to&&date&&date>periodRange.to)return;addTripOption(trip.shiftId,trip.shiftName);});
  const tripOptions=[...tripOptionMap.values()].sort((a,b)=>a.name.localeCompare(b.name,'vi'));
  const driverOptions=[...new Set(scopedTrips.map(t=>t.driverName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const shiftOrder=name=>{
    const n=String(name||'').toLowerCase();
    if(n.includes('sáng')||n.includes('sang'))return 1;
    if(n.includes('chiều')||n.includes('chieu'))return 2;
    if(n.includes('đêm')||n.includes('dem'))return 3;
    return 9;
  };
  const shiftOptions=[...new Set((prodShifts||[]).filter(s=>s.active!==false).map(s=>cleanShiftName(s.name)).filter(Boolean))].sort((a,b)=>shiftOrder(a)-shiftOrder(b)||a.localeCompare(b,'vi'));

  const groupInfoForOrder=o=>{
    const trip=visibleTripForOrder(o);
    if(groupMode==='trip'){
      const label=trip?deliveryTripLabel(trip):'Chưa có chuyến';
      return {key:trip?'trip:'+String(trip.id):'trip:~',label,sortKey:trip?(toISO(trip.deliveryDate)+'|'+deliveryTripShiftName(trip)+'|'+String(trip.id||'')):'9999-99-99|~'};
    }
    if(groupMode==='driver'){
      const driver=String(trip?.driverName||'').trim();
      return {key:'driver:'+(driver||'~'),label:driver||'Chưa có lái xe',sortKey:driver||'~'};
    }
    const area=resolveArea(o)||'Chưa phân khu vực';
    return {key:'area:'+area,label:area,sortKey:area};
  };

  // Lọc ở cấp đơn trước để không phải dựng hàng nghìn dòng sản phẩm.
  const groupInfoCache=new WeakMap();
  const groupInfoCached=o=>{const cached=groupInfoCache.get(o);if(cached)return cached;const info=groupInfoForOrder(o);groupInfoCache.set(o,info);return info;};
  const filteredOrders=scopedOrders.filter(o=>{
    if(o.status==='cancelled')return false;
    const date=orderDate(o);
    if(periodRange.from&&date&&date<periodRange.from)return false;
    if(periodRange.to&&date&&date>periodRange.to)return false;
    if(customerF!=='all'&&o.customer!==customerF)return false;
    if(areaF!=='all'&&resolveArea(o)!==areaF)return false;
    const trip=visibleTripForOrder(o);
    if(tripF!=='all'&&deliveryShiftForOrder(o).key!==tripF)return false;
    if(driverF!=='all'&&String(trip?.driverName||'')!==driverF)return false;
    if(shiftF!=='all'){
      const plans=prodShiftPlansForOrder(o,prodShifts||[]);
      const plan=prodShiftPlan(o,prodShifts||[]);
      const matched=(o.lines||[]).some(line=>{
        if(!line.productId)return false;
        const linePlan=plans.find(p=>p.line===line||p.line?.id===line.id)||plan;
        return cleanShiftName(linePlan?.shift?.name||'')===shiftF;
      });
      if(!matched)return false;
    }
    return true;
  }).sort((a,b)=>{
    const ag=groupInfoCached(a),bg=groupInfoCached(b);
    const gc=ag.sortKey.localeCompare(bg.sortKey,'vi');
    if(gc!==0)return gc;
    const dc=orderDate(a).localeCompare(orderDate(b));
    if(dc!==0)return dc;
    const pc=String(a.pointName||'').localeCompare(String(b.pointName||''),'vi');
    return pc!==0?pc:String(a.deliveryTime||'').localeCompare(String(b.deliveryTime||''));
  });

  const totalOrders=filteredOrders.length;
  const totalPages=Math.max(1,Math.ceil(totalOrders/pageSize));
  const safePage=Math.min(page,totalPages);
  useEffect(()=>setPage(1),[periodMode,anchorDate,rangeFrom,rangeTo,shiftF,areaF,customerF,tripF,driverF,groupMode,pageSize]);
  useEffect(()=>{if(tripF!=='all'&&!tripOptions.some(t=>t.key===tripF))setTripF('all');},[tripF,tripOptions.map(t=>t.key).join('|')]);
  useEffect(()=>{if(page>totalPages)setPage(totalPages);},[page,totalPages]);
  const pageOrders=filteredOrders.slice((safePage-1)*pageSize,safePage*pageSize);

  // Chỉ chuyển các đơn của trang hiện tại thành dòng chi tiết.
  const rows=[];
  pageOrders.forEach(o=>{
    const plan=prodShiftPlan(o,prodShifts||[]);
    const linePlans=prodShiftPlansForOrder(o,prodShifts||[]);
    const area=resolveArea(o);
    const group=groupInfoForOrder(o);
    const trip=visibleTripForOrder(o);
    (o.lines||[]).forEach(l=>{
      if(!l.productId)return;
      const linePlan=linePlans.find(p=>p.line===l||p.line?.id===l.id)||plan;
      const lineShiftName=cleanShiftName(linePlan?.shift?.name||'');
      if(shiftF!=='all'&&lineShiftName!==shiftF)return;
      rows.push({
        orderId:o.id,lineId:l.id,date:o.deliveryDate||'',point:o.pointName||'',customer:o.customer||'',
        product:l.productName||'',unit:l.unit||'',qtyProd:numFmt(l.qtyProd)||0,qtyInvoice:numFmt(l.qtyInvoice)||0,
        qtyDelivered:l.qtyDelivered,shift:l.shift||(lineShiftName.toLowerCase().includes('đêm')||lineShiftName.toLowerCase().includes('dem')?'night':'day'),
        shiftName:lineShiftName,time:o.deliveryTime||'',prodDate:linePlan?.prodDate||'',labelDate:linePlan?.labelDate||'',
        note:l.note||o.note||'',status:o.status,prodColor:(products.find(p=>p.id===l.productId)||{}).color||'',area,
        groupKey:group.key,groupLabel:group.label,groupSortKey:group.sortKey,tripId:trip?.id||'',driverName:trip?.driverName||''
      });
    });
  });

  const sorted=[...rows].sort((a,b)=>{
    const gc=(a.groupSortKey||'~').localeCompare(b.groupSortKey||'~','vi');
    if(gc!==0)return gc;
    const dc=toISO(a.date).localeCompare(toISO(b.date));
    if(dc!==0)return dc;
    const pc=(a.point||'').localeCompare(b.point||'','vi');
    return pc!==0?pc:(a.time||'').localeCompare(b.time||'');
  });
  const tableRows=[];
  let curGroup=null,groupLabel='',areaSX=0,areaHD=0,areaDG=0;
  sorted.forEach((r,i)=>{
    if(r.groupKey!==curGroup){
      if(curGroup!==null)tableRows.push({_sub:true,label:groupLabel,sx:areaSX,hd:areaHD,dg:areaDG});
      curGroup=r.groupKey;groupLabel=r.groupLabel;areaSX=0;areaHD=0;areaDG=0;
      tableRows.push({_hdr:true,label:r.groupLabel});
    }
    areaSX+=Number(r.qtyProd||0);areaHD+=Number(r.qtyInvoice||0);areaDG+=Number(r.qtyDelivered||0);
    tableRows.push(r);
    if(i===sorted.length-1)tableRows.push({_sub:true,label:groupLabel,sx:areaSX,hd:areaHD,dg:areaDG});
  });

  const tripAgeDays=trip=>{
    const iso=toISO(trip?.deliveryDate);
    if(!iso)return 0;
    return Math.max(0,Math.floor((new Date(todayISO+'T12:00:00')-new Date(iso+'T12:00:00'))/86400000));
  };
  const canEditDeliveredForOrder=order=>{
    const trip=visibleTripForOrder(order);
    if(!trip)return false;
    if(currentUser?.role==='admin'||isAccounting)return true;
    if(currentUser?.role==='manager')return trip.status!=='completion_pending'&&trip.status!=='completed'&&tripAgeDays(trip)<2;
    if(isDriver)return isOwnTrip(trip)&&trip.status==='active'&&!trip.driverConfirmedAt&&tripAgeDays(trip)<2;
    return false;
  };
  const syncTripReceivables=(trip,nextOrders)=>{
    if(!trip||!['completion_pending','completed'].includes(trip.status)||typeof financeTripReceivableDrafts!=='function'||!setFinanceDebts)return;
    const result=financeTripReceivableDrafts(trip,nextOrders,products||[],quotes||[],customers||[],currentUser);
    setFinanceDebts(prev=>{
      const oldByCustomer=new Map((prev||[]).filter(d=>String(d.sourceTripId||'')===String(trip.id)).map(d=>[String(d.partnerId||d.partnerName||''),d]));
      const keep=(prev||[]).filter(d=>String(d.sourceTripId||'')!==String(trip.id));
      const rows=result.rows.map(row=>{const old=oldByCustomer.get(String(row.partnerId||row.partnerName||''));if(!old)return row;const paid=Number(old.paidAmount)||0;return{...row,id:old.id,paidAmount:paid,dueDate:old.dueDate||row.dueDate,createdBy:old.createdBy||row.createdBy,createdAt:old.createdAt||row.createdAt,status:paid>=row.amount?'paid':paid>0?'partial':'unpaid'};});
      return [...keep,...rows];
    });
  };
  const updateDeliveredQty=(orderId,lineId,value)=>{
    const order=(orders||[]).find(o=>String(o.id)===String(orderId));
    if(!order||!canEditDeliveredForOrder(order))return;
    const qty=numFmt(value);
    const nextOrders=(orders||[]).map(o=>o.id===orderId?{...o,lines:(o.lines||[]).map(l=>l.id===lineId?{...l,qtyDelivered:qty,deliveredAt:fmtDT(),deliveredBy:currentUser?.name||''}:l)}:o);
    setOrders&&setOrders(nextOrders);
    syncTripReceivables(visibleTripForOrder(order),nextOrders);
  };
  const firstOrder=totalOrders?(safePage-1)*pageSize+1:0;
  const lastOrder=Math.min(safePage*pageSize,totalOrders);
  const totalProd=rows.reduce((s,r)=>s+Number(r.qtyProd||0),0);
  const totalInvoice=rows.reduce((s,r)=>s+Number(r.qtyInvoice||0),0);
  const totalDelivered=rows.reduce((s,r)=>s+Number(r.qtyDelivered||0),0);
  const diff=totalProd-totalInvoice;

  return h('div',null,
    h('div',{className:'detail-filter-toolbar'},
      h('button',{
        type:'button',
        className:mobileFiltersHidden?'':'bp',
        onClick:()=>setMobileFiltersHidden(!mobileFiltersHidden),
        title:mobileFiltersHidden?'Hiện bộ lọc đơn hàng':'Ẩn bộ lọc đơn hàng'
      },h('i',{className:'ti '+(mobileFiltersHidden?'ti-filter':'ti-filter-off')}),mobileFiltersHidden?'Hiện bộ lọc':'Ẩn bộ lọc'),
      h('span',{className:'detail-mobile-summary'},
        'Đang xem: '+vnDateFromISO(periodRange.from)+(periodRange.to!==periodRange.from?' — '+vnDateFromISO(periodRange.to):'')
      ),
      h('span',{className:'detail-count-badge'},totalOrders+' đơn · '+rows.length+' dòng trên trang')
    ),
    h('div',{className:'detail-filter-card'+(mobileFiltersHidden?' mobile-collapsed':'')},
      h('div',{className:'detail-filter-grid'},
        h(F,{label:'Thời gian'},h('select',{value:periodMode,onChange:e=>setPeriodMode(e.target.value)},h('option',{value:'day'},'Theo ngày'),h('option',{value:'week'},'Theo tuần'),h('option',{value:'month'},'Theo tháng'),h('option',{value:'range'},'Khoảng ngày'))),
        periodMode==='month'?h(F,{label:'Chọn tháng'},h('input',{type:'month',value:(anchorDate||todayISO).slice(0,7),onChange:e=>setAnchorDate((e.target.value||todayISO.slice(0,7))+'-01')})):
        periodMode!=='range'?h(F,{label:periodMode==='week'?'Chọn ngày trong tuần':'Chọn ngày'},h('input',{type:'date',value:anchorDate,onChange:e=>setAnchorDate(e.target.value)})):
        h(F,{label:'Từ ngày'},h('input',{type:'date',value:rangeFrom,onChange:e=>setRangeFrom(e.target.value)})),
        periodMode==='range'&&h(F,{label:'Đến ngày'},h('input',{type:'date',value:rangeTo,onChange:e=>setRangeTo(e.target.value)})),
        h(F,{label:'Khách hàng'},h('select',{value:customerF,onChange:e=>setCustomerF(e.target.value)},h('option',{value:'all'},'Tất cả khách hàng'),customerOptions.map(c=>h('option',{key:c,value:c},c)))),
        h(F,{label:'Ca SX'},h('select',{value:shiftF,onChange:e=>setShiftF(e.target.value)},h('option',{value:'all'},'Tất cả ca'),shiftOptions.map(name=>h('option',{key:name,value:name},name)))),
        h(F,{label:'Khu vực'},h('select',{value:areaF,onChange:e=>setAreaF(e.target.value)},h('option',{value:'all'},'Tất cả khu vực'),areaOptions.map(a=>h('option',{key:a,value:a},a)))),
        h(F,{label:'Chuyến giao hàng'},h('select',{value:tripF,onChange:e=>setTripF(e.target.value)},h('option',{value:'all'},'Tất cả chuyến giao'),tripOptions.map(t=>h('option',{key:t.key,value:t.key},t.name)))),
        h(F,{label:'Lái xe'},h('select',{value:driverF,onChange:e=>setDriverF(e.target.value)},h('option',{value:'all'},'Tất cả lái xe'),driverOptions.map(name=>h('option',{key:name,value:name},name)))),
        h(F,{label:'Sắp xếp'},h('select',{value:groupMode,onChange:e=>setGroupMode(e.target.value)},
          h('option',{value:'area'},'Theo khu vực'),
          h('option',{value:'trip'},'Theo chuyến'),
          h('option',{value:'driver'},'Theo lái xe')
        ))
      )
    ),
    h('div',{className:'detail-pagination'},
      h('span',null,'Mỗi trang'),
      h('select',{value:pageSize,onChange:e=>setPageSize(Number(e.target.value))},[25,50,75].map(n=>h('option',{key:n,value:n},n+' đơn'))),
      h('button',{disabled:safePage<=1,onClick:()=>setPage(1),title:'Trang đầu'},'«'),
      h('button',{disabled:safePage<=1,onClick:()=>setPage(p=>Math.max(1,p-1)),title:'Trang trước'},'‹'),
      h('b',null,firstOrder+'–'+lastOrder+' / '+totalOrders+' · Trang '+safePage+'/'+totalPages),
      h('button',{disabled:safePage>=totalPages,onClick:()=>setPage(p=>Math.min(totalPages,p+1)),title:'Trang sau'},'›'),
      h('button',{disabled:safePage>=totalPages,onClick:()=>setPage(totalPages),title:'Trang cuối'},'»')
    ),
    rows.length>0&&h('div',{className:'detail-summary-row'},
      h('div',{style:{background:'#EAF3DE',border:'.5px solid #52b788',borderRadius:'var(--r)',padding:'10px 18px'}},h('div',{style:{fontSize:11,color:'#3B6D11',fontWeight:500,marginBottom:3}},'∑ SL ĐẶT TRÊN TRANG'),h('div',{style:{fontSize:22,fontWeight:700,color:'#2D5A0E'}},totalProd.toLocaleString())),
      h('div',{style:{background:'#E6F1FB',border:'.5px solid #5B9BD5',borderRadius:'var(--r)',padding:'10px 18px'}},h('div',{style:{fontSize:11,color:'#185FA5',fontWeight:500,marginBottom:3}},'∑ SL HĐ TRÊN TRANG'),h('div',{style:{fontSize:22,fontWeight:700,color:'#185FA5'}},totalInvoice.toLocaleString())),
      h('div',{style:{background:'#FFF7E6',border:'.5px solid #E0A800',borderRadius:'var(--r)',padding:'10px 18px'}},h('div',{style:{fontSize:11,color:'#8A5A00',fontWeight:500,marginBottom:3}},'∑ SL ĐÃ GIAO TRÊN TRANG'),h('div',{style:{fontSize:22,fontWeight:700,color:'#8A5A00'}},totalDelivered.toLocaleString())),
      h('div',{style:{background:diff===0?'#EAF3DE':'#FCEBEB',border:'.5px solid '+(diff===0?'#52b788':'#E06060'),borderRadius:'var(--r)',padding:'10px 18px'}},h('div',{style:{fontSize:11,color:diff===0?'#3B6D11':'#A32D2D',fontWeight:500,marginBottom:3}},diff===0?'✓ KHỚP':'⚠ CHÊNH LỆCH SX-HĐ'),h('div',{style:{fontSize:22,fontWeight:700,color:diff===0?'#2D5A0E':'#A32D2D'}},(diff>0?'+':'')+diff.toLocaleString()))
    ),
    h('div',{className:'tw detail-orders-wrap'},
      h('table',{style:{minWidth:1080}},
        h('thead',null,h('tr',null,...['Ngày giao','Địa điểm','Sản phẩm','SL ĐẶT','SL HĐ','SL đã giao','Giờ','Ngày SX','Ngày in tem','Chú ý'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,sorted.length?tableRows.map((r,i)=>{
          if(r._hdr){const prefix=groupMode==='trip'?'🚚 Chuyến: ':groupMode==='driver'?'👤 Lái xe: ':'📍 Khu vực: ';return h('tr',{key:'h'+i,className:'area-sticky'},h('td',{colSpan:10,style:{background:'#2d6a4f',color:'#fff',fontWeight:700,fontSize:13,padding:'5px 12px'}},prefix+r.label));}
          if(r._sub)return h('tr',{key:'s'+i},h('td',{colSpan:3,style:{background:'#e8f5e9',fontWeight:600,fontSize:12,padding:'4px 12px',color:'#2d6a4f',textAlign:'right'}},'Tổng '+r.label+':'),h('td',{style:{background:'#e8f5e9',fontWeight:700,color:'var(--pri)',fontSize:14,padding:'4px 8px'}},r.sx.toLocaleString()),h('td',{style:{background:'#e8f5e9',fontWeight:700,fontSize:14,padding:'4px 8px'}},r.hd.toLocaleString()),h('td',{style:{background:'#e8f5e9',fontWeight:700,color:'#8A5A00',fontSize:14,padding:'4px 8px'}},r.dg.toLocaleString()),h('td',{colSpan:4,style:{background:'#e8f5e9'}}));
          const sourceOrder=(orders||[]).find(o=>String(o.id)===String(r.orderId));
          const canInput=canEditDeliveredForOrder(sourceOrder)&&(r.status==='delivering'||r.status==='done'||r.status==='completed');
          return h('tr',{key:r.orderId+'-'+r.lineId,style:{background:r.prodColor||(r.shift==='night'?'rgba(83,52,131,.04)':'')}},
            h('td',null,h('span',{style:{fontWeight:500}},r.date)),h('td',null,h('div',{style:{fontWeight:600}},r.point||'—')),h('td',null,h('div',{style:{fontWeight:500}},r.product)),
            h('td',null,h('span',{style:{fontWeight:600,color:'var(--pri)',fontSize:15}},r.qtyProd.toLocaleString())),h('td',null,h('span',{style:{fontWeight:600,fontSize:15}},r.qtyInvoice.toLocaleString())),
            h('td',null,canInput?h('input',{type:'number',min:0,step:'0.01',value:r.qtyDelivered??'',placeholder:String(r.qtyInvoice||0),onChange:e=>updateDeliveredQty(r.orderId,r.lineId,e.target.value),style:{fontSize:13,padding:'4px 6px',width:86,borderColor:(r.qtyDelivered!==undefined&&numFmt(r.qtyDelivered)!==numFmt(r.qtyInvoice))?'#E0A800':'var(--bd)'}}):h('span',{style:{fontWeight:600,color:r.qtyDelivered!==undefined?'#8A5A00':'var(--tx2)',fontSize:15}},r.qtyDelivered!==undefined?numFmt(r.qtyDelivered).toLocaleString():'—')),
            h('td',null,r.time||'—'),h('td',null,h('span',{style:{fontSize:12,fontWeight:600,color:'var(--pri3)',whiteSpace:'nowrap'}},r.prodDate||'—')),h('td',null,h('span',{style:{fontSize:12,fontWeight:600,color:'#8A5A00',whiteSpace:'nowrap'}},r.labelDate||'—')),h('td',null,h('span',{style:{fontSize:12,color:'var(--tx2)'}},r.note||'—'))
          );
        }):h('tr',null,h('td',{colSpan:10,className:'empty-st'},'Không có dữ liệu phù hợp.')))
      )
    )
  );
}
