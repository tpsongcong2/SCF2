/* ─── PRODUCTION SHIFTS TAB ─── */
function timeToMin(t){
  const norm=normalizeTimeInput(t);
  if(!/^\d{1,2}:\d{2}$/.test(norm))return 0;
  const[h,m]=norm.split(':').map(Number);
  return h*60+(m||0);
}
function normalizeTimeInput(t){
  const raw=String(t??'').trim();
  if(!raw)return '';
  const hTime=raw.match(/^(\d{1,2})\s*[hH]\s*(\d{1,2})?$/);
  if(hTime){
    const hour=Math.min(23,Number(hTime[1]));
    const minute=Math.min(59,Number(hTime[2]||0));
    return hour+':'+String(minute).padStart(2,'0');
  }
  if(/^[-+]?\d+(?:[.,]\d+)?$/.test(raw)){
    const num=Number(raw.replace(',','.'));
    if(Number.isFinite(num)&&(/[.,]/.test(raw)||(num>0&&num<1))){
      const frac=((num%1)+1)%1;
      const totalMinutes=Math.round(frac*24*60)%1440;
      const hh=String(Math.floor(totalMinutes/60)).padStart(2,'0');
      const mm=String(totalMinutes%60).padStart(2,'0');
      return hh+':'+mm;
    }
  }
  const m=raw.match(/^(\d{1,2})(?::|h|H|\.)(\d{1,2})(?::\d{1,2})?$/);
  if(!m)return raw;
  return String(Math.min(23,Number(m[1]))).padStart(2,'0')+':'+String(Math.min(59,Number(m[2]))).padStart(2,'0');
}
function normalizeCustomerImportTime(t){
  const raw=String(t??'').trim()
    .replace(/\s*(?:giờ|gio)\s*/gi,'H')
    .replace(/\s+/g,'');
  if(!raw)return '';
  const normalized=normalizeTimeInput(raw);
  return normalized.replace(/^0(?=\d:)/,'');
}
function normalizeOrderForStorage(order){
  if(!order||typeof order!=='object')return order;
  const raw=String(order.deliveryTime??'').trim();
  const deliveryTime=/^\d{1,2}:\d{2}$/.test(raw)?raw:normalizeTimeInput(raw);
  const prodShiftAssignMode=order.prodShiftAssignMode==='manual'?'manual':'auto';
  return {...order,deliveryTime,prodShiftAssignMode};
}
function normalizeOrdersForStorage(list){
  return Array.isArray(list)?list.map(normalizeOrderForStorage):list;
}
function ordersNeedTimeNormalization(list){
  return Array.isArray(list)&&list.some(o=>{
    const normalized=normalizeOrderForStorage(o);
    return normalized?.deliveryTime!==String(o?.deliveryTime??'').trim()||normalized?.prodShiftAssignMode!==o?.prodShiftAssignMode;
  });
}
function normalizeLookupText(v){
  return String(v||'')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/Đ/g,'D')
    .replace(/đ/g,'d')
    .replace(/[^a-zA-Z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
}
const ORDER_POINT_INDEX_CACHE=new WeakMap();
function getOrderPointIndex(customers){
  if(!Array.isArray(customers))return null;
  const cached=ORDER_POINT_INDEX_CACHE.get(customers);if(cached)return cached;
  const all=[],byPointId=new Map(),byPointName=new Map(),byAddress=new Map(),byCustomerId=new Map(),byCustomerName=new Map();
  const add=(map,key,row)=>{if(!key)return;const list=map.get(key)||[];list.push(row);map.set(key,list);};
  customers.forEach(c=>{
    const cName=normalizeLookupText(c.name||'');
    (c.points||[]).forEach(pt=>{
      const row={c,pt,cName,pName:normalizeLookupText(pt.name||''),pAddress:normalizeLookupText(pt.address||'')};all.push(row);
      add(byPointId,String(pt.id||'').trim(),row);add(byPointName,row.pName,row);add(byAddress,row.pAddress,row);add(byCustomerId,String(c.id||'').trim(),row);add(byCustomerName,cName,row);
    });
  });
  const index={all,byPointId,byPointName,byAddress,byCustomerId,byCustomerName};ORDER_POINT_INDEX_CACHE.set(customers,index);return index;
}
function findOrderPointMatch(order,customers){
  if(!order||!(customers&&customers.length))return null;
  const pointId=String(order.pointId||order.ptId||'').trim();
  const pointName=normalizeLookupText(order.pointName||'');
  const address=normalizeLookupText(order.address||'');
  const customerId=String(order.customerId||order.custId||'').trim();
  const customerName=normalizeLookupText(order.customer||'');
  const index=getOrderPointIndex(customers);if(!index)return null;
  const candidateSet=new Set();
  const include=list=>(list||[]).forEach(row=>candidateSet.add(row));
  include(index.byPointId.get(pointId));include(index.byPointName.get(pointName));include(index.byAddress.get(address));
  if(!candidateSet.size){include(index.byCustomerId.get(customerId));include(index.byCustomerName.get(customerName));}
  const candidates=candidateSet.size?[...candidateSet]:index.all;
  let best=null,bestScore=-1;
  candidates.forEach(row=>{
    const {c,pt,cName,pName,pAddress}=row;
    const customerScore=customerId&&String(c.id||'')===customerId?1000:(customerName&&cName===customerName?700:(customerName&&(cName.includes(customerName)||customerName.includes(cName))?350:0));
    let score=customerScore,hit=false;
    if(pointId&&String(pt.id||'')===pointId){score+=5000;hit=true;}
    if(pointName&&pName===pointName){score+=800;hit=true;}
    else if(pointName&&pName&&(pName.includes(pointName)||pointName.includes(pName))){score+=500;hit=true;}
    if(address&&pAddress===address){score+=300;hit=true;}
    else if(address&&pAddress&&(pAddress.includes(address)||address.includes(pAddress))){score+=180;hit=true;}
    if(hit&&score>bestScore){bestScore=score;best={customer:c,point:pt,score};}
  });
  return best;
}function getProdShift(deliveryTime, prodShifts, location){
  if(!deliveryTime||!prodShifts)return null;
  const tMin=timeToMin(deliveryTime);
  const loc=normalizeLookupText(location||'');
  const inRange=(t,start,end)=>{
    const s=timeToMin(start), e=timeToMin(end);
    if(!start||!end)return false;
    // Trường "Đến giờ" là mốc bao gồm. Khi hai khoảng cùng chạm mốc,
    // bộ chấm điểm sẽ ưu tiên địa điểm cụ thể hơn khu vực chung.
    if(s<=e)return t>=s&&t<=e;
    return t>=s||t<=e; // qua nửa đêm
  };
  const matches=(prodShifts||[]).filter(sh=>{
    if(sh.active===false)return false;
    const from=sh.orderTimeFrom||sh.startTime||sh.orderTime;
    const to=sh.orderTimeTo||sh.endTime||sh.orderTime;
    return (from&&to&&from!==to)?inRange(tMin,from,to):(sh.orderTime&&tMin===timeToMin(sh.orderTime));
  });
  if(!matches.length)return null;
  if(loc){
    const exact=matches.find(sh=>normalizeLookupText(sh.location||'')===loc);
    if(exact)return exact;
    const loose=matches.find(sh=>{
      const shLoc=normalizeLookupText(sh.location||'');
      return shLoc&&(shLoc.includes(loc)||loc.includes(shLoc));
    });
    if(loose)return loose;
    return null;
  }
  return matches.find(sh=>!normalizeLookupText(sh.location||''))||matches[0];
}
function resolveOrderPointAliases(order,customers){
  const resolved=findOrderPointMatch(order,customers||[]);
  const pt=resolved?.point||{};
  const aliases=[order?.area,pt.area,order?.pointName,pt.name,order?.address,pt.address,order?.customer,resolved?.customer?.name]
    .map(normalizeLookupText)
    .filter(Boolean);
  return {resolved,pt,aliases:[...new Set(aliases)]};
}
function getProdShiftForOrder(order,prodShifts,customers){
  if(!order||!prodShifts)return null;
  const tMin=timeToMin(order.deliveryTime);
  const {resolved,pt,aliases}=resolveOrderPointAliases(order,customers||[]);
  const matches=(prodShifts||[]).filter(sh=>{
    if(sh.active===false)return false;
    const from=sh.orderTimeFrom||sh.startTime||sh.orderTime;
    const to=sh.orderTimeTo||sh.endTime||sh.orderTime;
    return (from&&to&&from!==to)?timeInRange(order.deliveryTime,from,to):(sh.orderTime&&tMin===timeToMin(sh.orderTime));
  });
  if(!matches.length)return null;
  // Ưu tiên định danh cụ thể: điểm giao > địa chỉ > khách hàng > khu vực.
  // Tránh trường hợp khu vực cũ (ví dụ BN/SS TN) có điểm bằng tên điểm giao và thắng do thứ tự ID.
  const aliasGroups=[
    {values:[order.pointName,pt.name],exact:10000,partial:6000},
    {values:[order.address,pt.address],exact:8000,partial:4800},
    {values:[order.customer,resolved?.customer?.name],exact:4000,partial:2400},
    {values:[order.area,pt.area],exact:1000,partial:600}
  ].map(group=>({...group,values:[...new Set(group.values.map(normalizeLookupText).filter(Boolean))]}));
  const scored=matches.map(sh=>{
    const shLoc=normalizeLookupText(sh.location||'');
    if(!aliases.length){
      return {sh,score:shLoc?10:1};
    }
    let score=0;
    if(!shLoc)return {sh,score:0};
    aliasGroups.forEach(group=>{
      group.values.forEach(alias=>{
        if(shLoc===alias)score=Math.max(score,group.exact);
        else if(shLoc.includes(alias)||alias.includes(shLoc))score=Math.max(score,group.partial);
      });
    });
    if(score===0)return {sh,score:0};
    return {sh,score};
  }).filter(x=>x.score>0);
  if(aliases.length){
    if(!scored.length)return null;
    return scored.sort((a,b)=>{
      const ad=(Number(a.sh.startTime?timeToMin(a.sh.startTime):timeToMin(a.sh.orderTime))||0);
      const bd=(Number(b.sh.startTime?timeToMin(b.sh.startTime):timeToMin(b.sh.orderTime))||0);
      const byScore=b.score-a.score;
      if(byScore)return byScore;
      return ad-bd||(String(a.sh.id||'').localeCompare(String(b.sh.id||''),'vi'));
    })[0].sh;
  }
  return matches.find(sh=>!normalizeLookupText(sh.location||''))||matches[0];
}
function getProdShiftByProdTime(prodTime, prodShifts){
  if(!prodTime||!prodShifts)return null;
  const exact=(prodShifts||[]).find(sh=>sh.active!==false&&sh.actualProdTime===prodTime);
  return exact||getProdShift(prodTime,prodShifts);
}
function timeInRange(t,start,end){
  if(!t||!start||!end)return false;
  const tm=timeToMin(t), s=timeToMin(start), e=timeToMin(end);
  if(s<=e)return tm>=s&&tm<=e;
  return tm>=s||tm<=e;
}
function getProdWorkShiftRule(prodTime,rules){
  if(!prodTime)return null;
  const activeRules=(rules&&rules.length)?rules:DEF_PROD_SHIFT_RULES;
  const tm=timeToMin(prodTime);
  // Các khoảng ca nhỏ nối tiếp nhau: mốc giao thuộc ca bắt đầu tại mốc đó.
  return activeRules.find(r=>{
    if(r.active===false||!r.start||!r.end)return false;
    const start=timeToMin(r.start),end=timeToMin(r.end);
    if(start<=end)return tm>=start&&tm<end;
    return tm>=start||tm<end;
  })||null;
}
function addDaysVN(dateStr,offset){
  if(!dateStr)return '';
  const p=dateStr.split('/').map(Number);
  if(p.length!==3||!p[0]||!p[1]||!p[2])return dateStr;
  const d=new Date(p[2],p[1]-1,p[0]);
  d.setDate(d.getDate()+Number(offset||0));
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
}
function getOrderTripDateOffset(order,prodShifts){
  const manualShift=order?.prodShiftAssignMode==='manual'&&order?.prodShiftId?(prodShifts||[]).find(s=>s.id===order.prodShiftId):null;
  const autoShift=getProdShiftForOrder(order,prodShifts||[],window.__SCF_CUSTOMERS||[]);
  const shift=manualShift||autoShift;
  return shift==null?null:Number(shift.tripDateOffset??0);
}
function getOrderTripDate(order,prodShifts){
  if(!order?.deliveryDate)return '';
  const offset=getOrderTripDateOffset(order,prodShifts);
  if(offset===null||offset===undefined||Number.isNaN(offset))return '';
  return addDaysVN(order.deliveryDate,offset);
}
function resolveCurrentDeliveryShift(order,plannedShift){
  const shifts=window.__SCF_SHIFTS||[];
  const plannedId=String(plannedShift?.tripShiftId||'');
  const byId=plannedId?shifts.find(s=>String(s?.id||'')===plannedId):null;
  const plannedName=normalizeLookupText(plannedShift?.tripShiftName||'');
  const byName=plannedName?shifts.find(s=>normalizeLookupText(s?.name||'')===plannedName):null;
  if(byName)return byName;
  if(byId)return byId;
  const resolved=findOrderPointMatch(order,window.__SCF_CUSTOMERS||[]);
  const area=normalizeLookupText(order?.area||resolved?.point?.area||'');
  if(!area)return null;
  return shifts.find(s=>normalizeLookupText(s?.name||'')===area)
    ||shifts.find(s=>normalizeLookupText(s?.area||'')===area)
    ||null;
}
function getOrderTripShiftId(order,prodShifts){
  const manualShift=order?.prodShiftAssignMode==='manual'&&order?.prodShiftId?(prodShifts||[]).find(s=>s.id===order.prodShiftId):null;
  const autoShift=getProdShiftForOrder(order,prodShifts||[],window.__SCF_CUSTOMERS||[]);
  const plannedShift=manualShift||autoShift;
  return String(resolveCurrentDeliveryShift(order,plannedShift)?.id||plannedShift?.tripShiftId||'');
}
function getOrderTripShiftName(order,prodShifts){
  const manualShift=order?.prodShiftAssignMode==='manual'&&order?.prodShiftId?(prodShifts||[]).find(s=>s.id===order.prodShiftId):null;
  const autoShift=getProdShiftForOrder(order,prodShifts||[],window.__SCF_CUSTOMERS||[]);
  const plannedShift=manualShift||autoShift;
  const currentShift=resolveCurrentDeliveryShift(order,plannedShift);
  const resolved=findOrderPointMatch(order,window.__SCF_CUSTOMERS||[]);
  const area=String(order?.area||resolved?.point?.area||'');
  return String(currentShift?.name||area||plannedShift?.tripShiftName||'');
}
function prodShiftDisplay(sh){
  if(!sh)return sh;
  if(String(sh.name||'').toLowerCase().includes('chiều')||String(sh.name||'').toLowerCase().includes('chieu')){
    return {...sh,color:'#FEF3C7',textColor:'#92400E'};
  }
  return sh;
}
function prodShiftSmallDisplay(sh,prodTime,prodShiftRules){
  const rule=getProdWorkShiftRule(prodTime,prodShiftRules||DEF_PROD_SHIFT_RULES);
  if(!rule)return prodShiftDisplay(sh);
  return {...(sh||{}),name:rule.name,color:rule.color,textColor:rule.textColor,smallShiftId:rule.id,group:rule.group};
}
function prodShiftPlan(order,prodShifts,prodShiftRules){
  if(!order||order._hdr||order._sub)return null;
  const manualLine=(order.lines||[]).find(l=>l.shiftOverride&&(l.prodTime||l.prodDate||l.labelTime||l.labelDate));
  if(manualLine){
    const manualShift=getProdShiftByProdTime(manualLine.prodTime,prodShifts||[]);
    return {
      shift:manualShift?prodShiftSmallDisplay(manualShift,manualLine.prodTime,prodShiftRules):{name:'Ca SX tay',color:'#FFF8E1',textColor:'#8A5A00'},
      prodTime:manualLine.prodTime||'',
      prodDate:manualLine.prodDate||(manualShift?addDaysVN(order.deliveryDate,manualShift.prodDateOffset||0):order.deliveryDate)||'',
      labelTime:manualLine.labelTime||manualShift?.labelPrintTime||'',
      labelDate:manualLine.labelDate||(manualShift?addDaysVN(order.deliveryDate,manualShift.labelPrintDateOffset||0):order.deliveryDate)||'',
      manual:true
    };
  }
  const manualOrder=order?.prodShiftAssignMode==='manual'&&order?.prodShiftId;
  const sh=manualOrder?(prodShifts||[]).find(s=>s.id===order.prodShiftId):getProdShiftForOrder(order,prodShifts||[],window.__SCF_CUSTOMERS||[]);
  if(!sh)return null;
  const prodTime=manualOrder?normalizeTimeInput(order.prodTime||sh.actualProdTime||sh.endTime||''):(sh.actualProdTime||sh.endTime||'');
  return {
    shift:prodShiftSmallDisplay(sh,prodTime,prodShiftRules),
    prodTime,
    prodDate:manualOrder?(order.prodDate||addDaysVN(order.deliveryDate,sh.prodDateOffset||0)):addDaysVN(order.deliveryDate,sh.prodDateOffset||0),
    labelTime:manualOrder?normalizeTimeInput(order.labelTime||sh.labelPrintTime||''):(sh.labelPrintTime||''),
    labelDate:manualOrder?(order.labelDate||addDaysVN(order.deliveryDate,sh.labelPrintDateOffset||0)):addDaysVN(order.deliveryDate,sh.labelPrintDateOffset||0),
    manual:!!manualOrder
  };
}
function prodShiftPlansForOrder(order,prodShifts,prodShiftRules){
  if(!order||order._hdr||order._sub)return [];
  const hasLineOverrides=(order.lines||[]).some(l=>!!l.shiftOverride);
  const defaultOrder=hasLineOverrides?{...order,prodShiftAssignMode:'auto',prodShiftId:'',prodTime:'',prodDate:'',labelTime:'',labelDate:''}:order;
  const defaultPlan=prodShiftPlan({...defaultOrder,lines:(order.lines||[]).filter(l=>!l.shiftOverride)},prodShifts,prodShiftRules);
  return (order.lines||[]).map((l,i)=>{
    if(l.shiftOverride&&(l.prodTime||l.prodDate||l.labelTime||l.labelDate)){
      const manualShift=getProdShiftByProdTime(l.prodTime,prodShifts||[]);
      return {
        line:l,
        index:i,
        productName:l.productName||('Sản phẩm '+(i+1)),
        shift:manualShift?prodShiftSmallDisplay(manualShift,l.prodTime,prodShiftRules):{name:'Ca SX tay',color:'#FFF8E1',textColor:'#8A5A00'},
        prodTime:l.prodTime||'',
        prodDate:l.prodDate||(manualShift?addDaysVN(order.deliveryDate,manualShift.prodDateOffset||0):order.deliveryDate)||'',
        labelTime:l.labelTime||manualShift?.labelPrintTime||'',
        labelDate:l.labelDate||(manualShift?addDaysVN(order.deliveryDate,manualShift.labelPrintDateOffset||0):order.deliveryDate)||'',
        manual:true
      };
    }
    return defaultPlan?{...defaultPlan,line:l,index:i,productName:l.productName||('Sản phẩm '+(i+1))}:null;
  }).filter(Boolean);
}
function ProdShiftsTab({prodShifts,setProdShifts,prodShiftRules,setProdShiftRules,orders,customers,shifts}){
  const[modal,sm]=useState(null);
  const[edit,se]=useState(null);
  const empty={name:'',location:'',orderTime:'',startTime:'',endTime:'',actualProdTime:'',prodDateOffset:0,tripDateOffset:0,tripShiftId:'',tripShiftName:'',labelPrintTime:'',labelPrintDateOffset:0,color:'#FFF8E1',textColor:'#333',active:true};
  const shiftNamePresets=[
    {name:'Ca sáng',orderTime:'03:00',startTime:'03:00',endTime:'12:00',actualProdTime:'03:00',prodDateOffset:0,tripDateOffset:0,tripShiftId:'',tripShiftName:'',labelPrintTime:'04:00',labelPrintDateOffset:0,color:'#FFF8E1',textColor:'#E65100'},
    {name:'Ca chiều',orderTime:'20:00',startTime:'12:00',endTime:'22:00',actualProdTime:'20:00',prodDateOffset:0,tripDateOffset:0,tripShiftId:'',tripShiftName:'',labelPrintTime:'21:00',labelPrintDateOffset:0,color:'#FEF3C7',textColor:'#92400E'},
    {name:'Ca đêm',orderTime:'01:00',startTime:'22:00',endTime:'03:00',actualProdTime:'01:00',prodDateOffset:-1,tripDateOffset:-1,tripShiftId:'',tripShiftName:'',labelPrintTime:'22:00',labelPrintDateOffset:-1,color:'#EDE7F6',textColor:'#4527A0'}
  ];
  const normalize=sh=>{
    const base={...empty,...sh,name:(sh?.name||'').toLowerCase().includes('ngày')?'Ca sáng':(sh?.name||'')};
    const start=sh?.orderTimeFrom||sh?.startTime||sh?.orderTime||'';
    const end=sh?.orderTimeTo||sh?.endTime||sh?.orderTime||start;
    const storedTripShiftId=String(sh?.tripShiftId||'');
    const storedTripShiftName=String(sh?.tripShiftName||'');
    const tripShiftByName=storedTripShiftName?(shifts||[]).find(s=>normalizeLookupText(s?.name||'')===normalizeLookupText(storedTripShiftName)):null;
    const tripShiftById=storedTripShiftId?(shifts||[]).find(s=>String(s?.id||'')===storedTripShiftId):null;
    const currentTripShift=tripShiftByName||tripShiftById;
    return prodShiftDisplay({...base,orderTime:sh?.orderTime||start,startTime:start,endTime:end,actualProdTime:sh?.actualProdTime||'',prodDateOffset:Number(sh?.prodDateOffset??0),tripDateOffset:Number(sh?.tripDateOffset??0),tripShiftId:String(currentTripShift?.id||storedTripShiftId),tripShiftName:String(currentTripShift?.name||storedTripShiftName),labelPrintTime:sh?.labelPrintTime||'',labelPrintDateOffset:Number(sh?.labelPrintDateOffset??0)});
  };
  const orderTimeText=sh=>{
    const r=normalize(sh);
    return r.startTime&&r.endTime&&r.startTime!==r.endTime ? r.startTime+' - '+r.endTime : (r.orderTime||r.startTime||'—');
  };
  const rules=(prodShiftRules&&prodShiftRules.length?prodShiftRules:DEF_PROD_SHIFT_RULES);
  const updateRule=(id,data)=>setProdShiftRules(p=>(p&&p.length?p:DEF_PROD_SHIFT_RULES).map(r=>r.id===id?{...r,...data}:r));
  const shiftRuleFromProdTime=t=>getProdWorkShiftRule(t,rules);
  const shiftNameFromProdTime=t=>shiftRuleFromProdTime(t)?.name||'';
  const[form,sf]=useState(empty);
  const[sortMode,setSortMode]=useState('area');
  const[areaFilter,setAreaFilter]=useState('all');
  const pointOptions=[...new Set((customers||[]).flatMap(c=>(c.points||[]).map(pt=>pt.name).filter(Boolean)))].sort((a,b)=>a.localeCompare(b));
  const dateOffsetLabel=v=>{
    const n=Number(v||0);
    if(n===-1)return 'Trước ngày ĐH 1 ngày (-1)';
    if(n===1)return 'Sau ngày ĐH 1 ngày (+1)';
    return 'Cùng ngày ĐH (0)';
  };
  const areaOfLocation=loc=>{
    const name=(loc||'').trim().toUpperCase();
    if(!name)return 'Chưa phân khu vực';
    for(const c of customers||[]){
      const pt=(c.points||[]).find(p=>(p.name||'').trim().toUpperCase()===name);
      if(pt)return pt.area||'Chưa phân khu vực';
    }
    for(const c of customers||[]){
      const pt=(c.points||[]).find(p=>(p.area||'').trim().toUpperCase()===name);
      if(pt)return pt.area||'Chưa phân khu vực';
    }
    return 'Chưa phân khu vực';
  };
  const areaFilterOptions=[...new Set((prodShifts||[]).map(sh=>areaOfLocation(normalize(sh).location)).filter(Boolean))]
    .sort((a,b)=>(a==='Chưa phân khu vực'?1:0)-(b==='Chưa phân khu vực'?1:0)||a.localeCompare(b,'vi'));
  const groupLabelForShift=r=>{
    if(sortMode==='prod'){
      return r.name||'Chưa có ca SX';
    }
    if(sortMode==='trip'){
      return r.tripShiftName||'Chưa có ca GH';
    }
    return areaOfLocation(r.location);
  };
  const groupTitleForShift=group=>{
    if(sortMode==='prod'){
      return group||'Chưa có ca SX';
    }
    if(sortMode==='trip'){
      return group||'Chưa có ca GH';
    }
    return group||'Chưa phân khu vực';
  };
  const groupSortLabel=sortMode==='area'?'Khu vực':(sortMode==='prod'?'Ca sản xuất':'Ca giao hàng');
  const sortPriorityForGroup=group=>{
    if(sortMode==='prod'){
      return group==='Chưa có ca SX'?9999:0;
    }
    if(sortMode==='trip'){
      return group==='Chưa có ca GH'?9999:0;
    }
    return group==='Chưa phân khu vực'?9999:0;
  };
  const groupedShifts=[...prodShifts].map(normalize).filter(r=>areaFilter==='all'||areaOfLocation(r.location)===areaFilter).sort((a,b)=>{
    const ga=groupLabelForShift(a),gb=groupLabelForShift(b);
    const gp=sortPriorityForGroup(ga)-sortPriorityForGroup(gb);
    if(gp)return gp;
    return ga.localeCompare(gb,'vi')||(a.location||'').localeCompare(b.location||'','vi')||timeToMin(a.startTime||a.orderTime)-timeToMin(b.startTime||b.orderTime)||(a.name||'').localeCompare(b.name||'','vi');
  });
  const groupedShiftRows=[];
  let lastGroup=null;
  groupedShifts.forEach(r=>{
    const group=groupLabelForShift(r);
    if(group!==lastGroup){
      lastGroup=group;
      groupedShiftRows.push({type:'group',key:'group-'+sortMode+'-'+group,label:groupTitleForShift(group)});
    }
    groupedShiftRows.push({type:'row',key:r.id,row:r});
  });
  const open=(sh)=>{sf(sh?normalize(sh):{...empty});se(sh||null);sm('f');};
  const presetForTime=t=>{
    const exact=shiftNamePresets.find(x=>x.orderTime===t);
    if(exact)return exact;
    const m=timeToMin(t);
    if(m<360)return shiftNamePresets.find(x=>x.name==='Ca đêm');
    if(m>=1080)return shiftNamePresets.find(x=>x.name==='Ca chiều');
    if(m>=360&&m<720)return shiftNamePresets.find(x=>x.name==='Ca sáng');
    return shiftNamePresets.find(x=>x.name==='Ca chiều')||shiftNamePresets[0];
  };
  const autoUpdateFromOrders=()=>{
    const map={};
    (orders||[]).forEach(o=>{
      const loc=(o.pointName||o.address||'').trim();
      const time=normalizeTimeInput(o.deliveryTime||'');
      if(!loc||!time)return;
      const key=(loc+'|'+time).toUpperCase();
      if(!map[key])map[key]={location:loc,orderTime:time,orderIds:[],count:0};
      map[key].count+=1;
      if(o.id)map[key].orderIds.push(o.id);
    });
    const pairs=Object.values(map);
    if(!pairs.length){window.showToast('Chưa tìm thấy địa điểm có giờ giao trong danh sách đơn hàng.','warn');return;}
    const sameLoc=(a,b)=>String(a||'').trim().toUpperCase()===String(b||'').trim().toUpperCase();
    const hasLocation=loc=>prodShifts.map(normalize).some(sh=>sameLoc(sh.location,loc));
    const hitShift=(loc,time)=>prodShifts.map(normalize).find(sh=>{
      const r=normalize(sh);
      const startMin=timeToMin(r.startTime||r.orderTime), endMin=timeToMin(r.endTime||r.orderTime), t=timeToMin(time);
      const hit=(r.startTime&&r.endTime&&r.startTime!==r.endTime)?(startMin<=endMin?t>=startMin&&t<endMin:t>=startMin||t<endMin):r.orderTime===time;
      return sameLoc(r.location,loc)&&hit;
    });
    const missing=pairs.filter(p=>!hitShift(p.location,p.orderTime)).map(p=>({...p,reason:hasLocation(p.location)?'Giờ ĐH nằm ngoài khoảng đã cấu hình':'Địa điểm mới chưa có trong bảng'}));
    if(!missing.length){window.showToast('Tất cả địa điểm và giờ giao đã có trong bảng cài đặt ca SX + ca GH tự động.','info');return;}
    const p=missing[0];
    const sameTime=prodShifts.map(normalize).find(s=>s.orderTime===p.orderTime||s.startTime===p.orderTime);
    const preset=sameTime||presetForTime(p.orderTime)||empty;
    window.showToast('Có '+missing.length+' địa điểm/giờ giao cần kiểm tra. Đang mở dòng đầu tiên: '+p.reason+'.','warn',7000);
    sf({
      ...empty,
      ...preset,
      location:p.location,
      orderTime:p.orderTime,
      startTime:p.orderTime,
      endTime:p.orderTime,
      actualProdTime:preset.actualProdTime||p.orderTime,
      labelPrintTime:preset.labelPrintTime||p.orderTime,
      name:shiftNameFromProdTime(preset.actualProdTime||p.orderTime)||preset.name||'',
      active:true,
      _missingCount:missing.length,
      _missingReason:p.reason,
      _missingOrderIds:[...new Set(p.orderIds||[])],
      _missingSummary:missing.slice(0,8).map(x=>x.location+' '+x.orderTime+' ('+x.reason+', đơn: '+[...new Set(x.orderIds||[])].slice(0,5).join(', ')+(x.orderIds?.length>5?', ...':'')+')')
    });
    se(null);
    sm('f');
  };
  const save=()=>{
    if(!(form.startTime||form.orderTime)||!(form.endTime||form.orderTime)||!form.actualProdTime){window.showToast('Nhập đủ khoảng giờ đơn hàng và giờ sản xuất thực tế!','warn');return;}
    const autoRule=shiftRuleFromProdTime(form.actualProdTime);
    const autoName=autoRule?.name||'';
    if(!autoName){window.showToast('Giờ sản xuất chưa nằm trong khung ca SX nhỏ nào. Hãy chỉnh bảng cài đặt ca SX + ca GH tự động.','warn');return;}
    const {_missingCount,_missingReason,_missingOrderIds,_missingSummary,...cleanForm}=form;
    const chosenTripShift=(shifts||[]).find(x=>x.id===form.tripShiftId);
    const data={...cleanForm,name:autoName,color:autoRule?.color||form.color,textColor:autoRule?.textColor||form.textColor,orderTime:form.startTime||form.orderTime,startTime:form.startTime||form.orderTime,endTime:form.endTime||form.orderTime,prodDateOffset:Number(form.prodDateOffset||0),tripDateOffset:Number(form.tripDateOffset||0),tripShiftId:String(form.tripShiftId||''),tripShiftName:chosenTripShift?.name||form.tripShiftName||'',labelPrintDateOffset:Number(form.labelPrintDateOffset||0)};
    if(edit) setProdShifts(p=>p.map(s=>s.id===edit.id?{...s,...data}:s));
    else setProdShifts(p=>[...p,{...data,id:'PSH'+uid()}]);
    sm(null);
  };
  const del=sh=>window.scfConfirm('Bạn có chắc muốn xóa ca "'+sh.name+'"?','Xóa ca sản xuất',true).then(ok=>ok&&setProdShifts(p=>p.filter(s=>s.id!==sh.id)));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-clock-play',style:{fontSize:20}}),'Cài đặt ca SX + ca GH tự động'),
    h('div',{style:{marginBottom:'1rem',padding:'12px 16px',background:'#EAF4EF',borderRadius:'var(--r)',fontSize:13}},
      h('div',{style:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:8}},
        h('b',null,'Cài đặt khung giờ SX → ca SX + ca GH tự động:'),
        h('span',{style:{fontSize:12,color:'var(--tx2)'}},'Sửa khoảng giờ để hệ thống tự gom đơn vào đúng ca')
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:8}},
        rules.map(r=>h('div',{key:r.id,style:{background:r.color||'#fff',border:'1px solid var(--bd)',borderRadius:'var(--r)',padding:'8px 10px'}},
          h('div',{style:{fontWeight:700,color:r.textColor||'var(--tx)',marginBottom:6}},r.name),
          h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}},
            h(F,{label:'Từ'},h('input',{type:'time',value:r.start||'',onChange:e=>updateRule(r.id,{start:e.target.value}),style:{fontSize:12,padding:'5px 6px'}})),
            h(F,{label:'Đến'},h('input',{type:'time',value:r.end||'',onChange:e=>updateRule(r.id,{end:e.target.value}),style:{fontSize:12,padding:'5px 6px'}}))
          ),
          h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:6}},
            h(F,{label:'Ca lớn'},h('select',{value:r.group||'',onChange:e=>updateRule(r.id,{group:e.target.value}),style:{fontSize:12,padding:'5px 6px'}},
              ['Ca đêm','Ca sáng','Ca chiều'].map(x=>h('option',{key:x,value:x},x))
            )),
            h(F,{label:'Tên ca'},h('input',{value:r.name||'',onChange:e=>updateRule(r.id,{name:e.target.value}),style:{fontSize:12,padding:'5px 6px'}}))
          )
        ))
      )
    ),
    h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:'1rem',gap:8,flexWrap:'wrap',alignItems:'center'}},
      h('span',{style:{fontSize:12,color:'var(--tx2)',fontWeight:600}},'Lọc khu vực'),
      h('select',{value:areaFilter,onChange:e=>setAreaFilter(e.target.value),style:{padding:'7px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',fontSize:13,minWidth:180}},
        h('option',{value:'all'},'Tất cả khu vực ('+(prodShifts||[]).length+')'),
        areaFilterOptions.map(area=>h('option',{key:area,value:area},area+' ('+(prodShifts||[]).filter(sh=>areaOfLocation(normalize(sh).location)===area).length+')'))
      ),
      h('span',{style:{fontSize:12,color:'var(--tx2)',fontWeight:600}},'Sắp xếp theo'),
      h('select',{value:sortMode,onChange:e=>setSortMode(e.target.value),style:{padding:'7px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',fontSize:13}},
        h('option',{value:'area'},'Khu vực'),
        h('option',{value:'prod'},'Ca sản xuất'),
        h('option',{value:'trip'},'Ca giao hàng')
      )
    ),
    h('div',{style:{marginBottom:'1rem',padding:'12px 16px',background:'#f0f7f0',borderRadius:'var(--r)',border:'1px solid #c8e6c9',fontSize:13}},
      h('b',null,'Cách hoạt động: '),
      'Bảng này quy định từ khoảng giờ đơn hàng sang giờ sản xuất thực tế, ngày sản xuất, ngày chuyến giao, ca giao hàng, giờ in tem và ngày in tem. Hệ thống sẽ tự chọn ca sản xuất và chuyến giao theo cấu hình của đơn.',
      h('br'),
      h('span',{style:{color:'var(--tx2)',fontSize:12}},'Ngày -1 là làm/in trước ngày đơn hàng 1 ngày; ngày 0 là cùng ngày với ngày đơn hàng.')
    ),
    h('div',{style:{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:'1rem',flexWrap:'wrap'}},
      h('button',{onClick:autoUpdateFromOrders},h('i',{className:'ti ti-refresh',style:{fontSize:14}}),'Cập nhật từ đơn hàng'),
      h(AddBtn,{onClick:()=>open(null),label:'Thêm dòng'})
    ),
    h('div',{className:'desktop-only',style:{overflowX:'auto',background:'#fff',border:'1px solid var(--bd)',borderRadius:'var(--r)',marginBottom:'1.5rem'}},
        h('table',{style:{width:'100%',borderCollapse:'collapse',minWidth:980}},
        h('thead',null,h('tr',null,
          ['Tên ca','Địa điểm','Giờ ĐH','Ngày sản xuất','Giờ SX','Ngày chuyến','Ca giao hàng','Ngày in tem','Giờ in tem','Trạng thái',''].map((x,i)=>h('th',{key:x,style:{textAlign:'left',padding:'10px 12px',borderBottom:'1px solid var(--bd)',fontSize:12,color:'var(--tx2)',background:'var(--bg2)',whiteSpace:'nowrap',width:i===0?130:(i===2?96:undefined)}},x))
        )),
        h('tbody',null,
          (()=>{let lastGroup=null;const rows=[];groupedShiftRows.forEach(item=>{
            if(item.type==='group'){
              lastGroup=item.label;
              rows.push(h('tr',{key:item.key},
                h('td',{colSpan:11,style:{padding:'8px 12px',background:'#E6F1FB',color:'#185FA5',fontWeight:700,borderTop:'1px solid var(--bd)',borderBottom:'1px solid var(--bd)'}},
                  h('i',{className:'ti ti-category',style:{fontSize:14,marginRight:6}}),
                  groupSortLabel+': '+item.label
                )
              ));
              return;
            }
            const r=item.row;
            const smallRule=shiftRuleFromProdTime(r.actualProdTime);
            const rowName=smallRule?.name||r.name;
            const rowTextColor=smallRule?.textColor||r.textColor||'#333';
            const rowBgColor=smallRule?.color||r.color||'';
            rows.push(h('tr',{key:r.id,style:{borderBottom:'1px solid var(--bd)',background:rowBgColor?rowBgColor+'55':''}},
              h('td',{style:{padding:'10px 12px',fontWeight:700,color:rowTextColor,whiteSpace:'nowrap',minWidth:120}},rowName),
              h('td',{style:{padding:'10px 12px'}},r.location||'—'),
              h('td',{style:{padding:'10px 12px',fontWeight:600,whiteSpace:'nowrap',width:96}},orderTimeText(r)),
              h('td',{style:{padding:'10px 12px'}},dateOffsetLabel(r.prodDateOffset)),
              h('td',{style:{padding:'10px 12px'}},r.actualProdTime||'—'),
              h('td',{style:{padding:'10px 12px'}},dateOffsetLabel(r.tripDateOffset)),
              h('td',{style:{padding:'10px 12px'}},r.tripShiftName||'—'),
              h('td',{style:{padding:'10px 12px'}},dateOffsetLabel(r.labelPrintDateOffset)),
              h('td',{style:{padding:'10px 12px'}},r.labelPrintTime||'—'),
              h('td',{style:{padding:'10px 12px'}},h('span',{className:'badge',style:{background:r.active?'#E8F5E9':'#F1EFE8',color:r.active?'#1B5E20':'#777'}},r.active?'Đang hoạt động':'Tạm tắt')),
              h('td',{style:{padding:'8px 12px',textAlign:'right',whiteSpace:'nowrap'}},
                h('button',{className:'bi',onClick:()=>open(r),title:'Sửa'},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
                h('button',{className:'bi',onClick:()=>del(r),title:'Xóa',style:{color:'#A32D2D',marginLeft:4}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
              )
            ));
          });if(!rows.length)rows.push(h('tr',{key:'empty-area-filter'},h('td',{colSpan:11,className:'empty-st'},'Không có dòng cài đặt thuộc khu vực đã chọn.')));return rows;})()
        )
      )
    ),
    h('div',{className:'mobile-card-list',style:{marginBottom:'1.5rem'}},
      groupedShiftRows.length===0&&h('div',{className:'empty-st',style:{padding:'1rem'}},'Không có dòng cài đặt thuộc khu vực đã chọn.'),
      groupedShiftRows.map(item=>{
        if(item.type==='group'){
          return h('div',{key:item.key,style:{padding:'8px 12px',background:'#E6F1FB',color:'#185FA5',fontWeight:700,borderRadius:10,marginBottom:8}},
            groupSortLabel+': '+item.label
          );
        }
        const r=item.row;
        const smallRule=shiftRuleFromProdTime(r.actualProdTime);
        const rowName=smallRule?.name||r.name;
        const rowTextColor=smallRule?.textColor||r.textColor||'#333';
        return h('div',{key:'m-'+r.id,className:'prodshift-mobile-card'},
          h('div',{className:'prodshift-mobile-head'},
            h('div',null,
              h('div',{className:'prodshift-mobile-name',style:{color:rowTextColor}},rowName),
              h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:2}},r.location||'—')
            ),
            h('span',{className:'badge',style:{background:r.active?'#E8F5E9':'#F1EFE8',color:r.active?'#1B5E20':'#777'}},r.active?'Đang hoạt động':'Tạm tắt')
          ),
          h('div',{className:'prodshift-mobile-grid'},
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Giờ ĐH'),h('span',null,orderTimeText(r))),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Ngày SX'),h('span',null,dateOffsetLabel(r.prodDateOffset))),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Giờ SX'),h('span',null,r.actualProdTime||'—')),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Ngày chuyến'),h('span',null,dateOffsetLabel(r.tripDateOffset))),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Ca giao hàng'),h('span',null,r.tripShiftName||'—')),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Ngày in tem'),h('span',null,dateOffsetLabel(r.labelPrintDateOffset))),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Giờ in tem'),h('span',null,r.labelPrintTime||'—'))
          ),
          h('div',{className:'mobile-data-actions'},
            h('button',{className:'bi',onClick:()=>open(r),title:'Sửa'},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
            h('button',{className:'bi',onClick:()=>del(r),title:'Xóa',style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
          )
        );
      })
    ),
    modal==='f'&&h(Modal,{title:edit?'Sửa ca sản xuất':'Thêm ca sản xuất',onClose:()=>sm(null)},
      h('div',{style:{marginBottom:10,padding:'8px 12px',background:'#EAF4EF',borderRadius:'var(--r)',fontSize:13,color:'var(--pri3)'}},
        h('b',null,'Tên ca tự động: '),
        shiftNameFromProdTime(form.actualProdTime)||'Chưa xác định theo giờ SX'
      ),
      form._missingReason&&h('div',{style:{marginBottom:10,padding:'10px 12px',background:'#FFF8E1',border:'1px solid #F8C30F',borderRadius:'var(--r)',fontSize:12,lineHeight:1.45,color:'#6B4A00'}},
        h('div',{style:{fontWeight:700,marginBottom:4}},form._missingReason),
        h('div',null,'Địa điểm: ',h('b',null,form.location||'—'),' · Giờ ĐH: ',h('b',null,form.orderTime||form.startTime||'—')),
        h('div',null,'Mã đơn liên quan: ',h('b',null,(form._missingOrderIds||[]).join(', ')||'—')),
        (form._missingSummary||[]).length>1&&h('details',{style:{marginTop:6}},
          h('summary',{style:{cursor:'pointer',fontWeight:600}},'Xem thêm các dòng cần kiểm tra ('+(form._missingCount||0)+')'),
          h('div',{style:{marginTop:5,color:'#7A5A00'}},(form._missingSummary||[]).map((s,i)=>h('div',{key:i},'• '+s)))
        )
      ),
      h(F,{label:'Địa điểm'},h('select',{value:form.location||'',onChange:e=>sf(p=>({...p,location:e.target.value}))},
        h('option',{value:''},'— Chọn địa điểm —'),
        pointOptions.map(pt=>h('option',{key:pt,value:pt},pt))
      )),
      h('div',{className:'g3'},
        h(F,{label:'Giờ đơn hàng từ *'},h('input',{type:'time',value:form.startTime||form.orderTime||'',onChange:e=>sf(p=>({...p,startTime:e.target.value,orderTime:e.target.value}))})),
        h(F,{label:'Đến giờ *'},h('input',{type:'time',value:form.endTime||form.orderTime||'',onChange:e=>sf(p=>({...p,endTime:e.target.value}))}))
      ),
      h('div',{className:'prodshift-pair-grid'},
        h(F,{label:'Ngày sản xuất'},h('select',{value:String(form.prodDateOffset??0),onChange:e=>sf(p=>({...p,prodDateOffset:Number(e.target.value)}))},
          h('option',{value:'-1'},'Trước ngày ĐH 1 ngày (-1)'),
          h('option',{value:'0'},'Cùng ngày ĐH (0)')
        )),
        h(F,{label:'Giờ sản xuất thực tế *'},h('input',{type:'time',value:form.actualProdTime,onChange:e=>{const rule=shiftRuleFromProdTime(e.target.value);sf(p=>({...p,actualProdTime:e.target.value,name:rule?.name||p.name,color:rule?.color||p.color,textColor:rule?.textColor||p.textColor}));}}))
      ),
      h('div',{className:'prodshift-pair-grid'},
        h(F,{label:'Ngày chuyến'},h('select',{value:String(form.tripDateOffset??0),onChange:e=>sf(p=>({...p,tripDateOffset:Number(e.target.value)}))},
          h('option',{value:'-1'},'Trước ngày ĐH 1 ngày (-1)'),
          h('option',{value:'0'},'Cùng ngày ĐH (0)'),
          h('option',{value:'1'},'Sau ngày ĐH 1 ngày (+1)')
        )),
        h(F,{label:'Ca giao hàng'},h('select',{value:form.tripShiftId||'',onChange:e=>{
          const sh=(shifts||[]).find(x=>x.id===e.target.value);
          sf(p=>({...p,tripShiftId:e.target.value,tripShiftName:sh?.name||''}));
        }},
          h('option',{value:''},'— Chưa chọn ca giao —'),
          (shifts||[]).map(sh=>h('option',{key:sh.id,value:sh.id},sh.name||sh.id))
        ))
      ),
      h('div',{className:'prodshift-pair-grid'},
        h(F,{label:'Ngày in tem'},h('select',{value:String(form.labelPrintDateOffset??0),onChange:e=>sf(p=>({...p,labelPrintDateOffset:Number(e.target.value)}))},
          h('option',{value:'-1'},'Trước ngày ĐH 1 ngày (-1)'),
          h('option',{value:'0'},'Cùng ngày ĐH (0)')
        )),
        h(F,{label:'Giờ in tem'},h('input',{type:'time',value:form.labelPrintTime,onChange:e=>sf(p=>({...p,labelPrintTime:e.target.value}))}))
      ),
      h('div',{className:'g2'},
        h(F,{label:'Màu nền'},h('input',{type:'color',value:form.color||'#FFF8E1',onChange:e=>sf(p=>({...p,color:e.target.value})),style:{height:36,cursor:'pointer'}})),
        h(F,{label:'Màu chữ'},h('input',{type:'color',value:form.textColor||'#333333',onChange:e=>sf(p=>({...p,textColor:e.target.value})),style:{height:36,cursor:'pointer'}}))
      ),
      h('label',{style:{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:12}},
        h('input',{type:'checkbox',checked:!!form.active,onChange:e=>sf(p=>({...p,active:e.target.checked}))}),
        'Đang hoạt động'
      ),
      h(Row,null,
        h('button',{onClick:()=>sm(null)},'Hủy'),
        h('button',{className:'bp',onClick:save,style:{padding:'8px 20px'}},'Lưu ca')
      )
    )
  );
}
