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
  if(order.deliveryTime===deliveryTime&&order.prodShiftAssignMode===prodShiftAssignMode)return order;
  return {...order,deliveryTime,prodShiftAssignMode};
}
function normalizeOrdersForStorage(list){
  if(!Array.isArray(list))return list;
  let changed=false;
  const next=list.map(order=>{const normalized=normalizeOrderForStorage(order);if(normalized!==order)changed=true;return normalized;});
  return changed?next:list;
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
      (pt.mergedPointIds||[]).forEach(id=>add(byPointId,String(id).trim(),row));
      (pt.nameAliases||[]).forEach(name=>add(byPointName,normalizeLookupText(name),row));
      add(byPointId,String(pt.id||'').trim(),row);add(byPointName,row.pName,row);add(byAddress,row.pAddress,row);add(byCustomerId,String(c.id||'').trim(),row);add(byCustomerName,cName,row);
    });
  });
  const index={all,byPointId,byPointName,byAddress,byCustomerId,byCustomerName};ORDER_POINT_INDEX_CACHE.set(customers,index);return index;
}
function scfPointCoversOrder(point,order){
  const text=String(order?.deliveryDate||order?.date||'');
  const vn=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/),iso=text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(!vn&&!iso)return !point.customerAddedAt&&!point.customerStoppedAt;
  const day=vn?new Date(+vn[3],+vn[2]-1,+vn[1]):new Date(+iso[1],+iso[2]-1,+iso[3]);
  const time=String(order.deliveryTime||'').match(/^(\d{1,2}):(\d{2})/);
  if(time)day.setHours(+time[1],+time[2],0,0);
  const start=point.customerAddedAt?new Date(point.customerAddedAt):null,end=point.customerStoppedAt?new Date(point.customerStoppedAt):null;
  return (!start||!Number.isFinite(start.getTime())||day>=start)&&(!end||!Number.isFinite(end.getTime())||day<end);
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
  let best=null,bestScore=-1,ambiguous=false;
  candidates.forEach(row=>{
    const {c,pt,cName,pName,pAddress}=row;
    if(customerId&&String(c.id)!==customerId)return;
    if(!customerId&&customerName&&cName!==customerName)return;
    if(!scfPointCoversOrder(pt,order))return;
    const customerScore=customerId&&String(c.id||'')===customerId?1000:(customerName&&cName===customerName?700:(customerName&&(cName.includes(customerName)||customerName.includes(cName))?350:0));
    let score=customerScore,hit=false;
    if(pointId&&(String(pt.id||'')===pointId||(pt.mergedPointIds||[]).some(id=>String(id)===pointId))){score+=5000;hit=true;}
    if(pointName&&(pName===pointName||(pt.nameAliases||[]).some(name=>normalizeLookupText(name)===pointName))){score+=800;hit=true;}
    else if(pointName&&pName&&(pName.includes(pointName)||pointName.includes(pName))){score+=500;hit=true;}
    if(address&&pAddress===address){score+=300;hit=true;}
    else if(address&&pAddress&&(pAddress.includes(address)||address.includes(pAddress))){score+=180;hit=true;}
    if(hit&&score>bestScore){bestScore=score;best={customer:c,point:pt,score};ambiguous=false;}
    else if(hit&&score===bestScore&&best&&String(best.customer.id)!==String(c.id))ambiguous=true;
  });
  return ambiguous?null:best;
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
const PROD_ORDER_SHIFT_CACHE=new WeakMap();
const PROD_ORDER_EMPTY_CUSTOMERS=[];
function getProdShiftForOrder(order,prodShifts,customers){
  if(!order||!Array.isArray(prodShifts))return null;
  const points=Array.isArray(customers)?customers:PROD_ORDER_EMPTY_CUSTOMERS;
  let byCustomers=PROD_ORDER_SHIFT_CACHE.get(prodShifts);
  if(!byCustomers){byCustomers=new WeakMap();PROD_ORDER_SHIFT_CACHE.set(prodShifts,byCustomers);}
  let matches=byCustomers.get(points);
  if(!matches){matches=new Map();byCustomers.set(points,matches);}
  // Ngày giao ảnh hưởng quyền sở hữu địa điểm; chỉ dùng lại kết quả trong cùng ngày.
  const key=JSON.stringify([order.deliveryDate,normalizeTimeInput(order.deliveryTime),order.pointId,order.ptId,order.pointName,order.address,order.customerId,order.custId,order.customer,order.area]);
  if(matches.has(key))return matches.get(key);
  const shift=scfMatchProdShiftForOrder(order,prodShifts,points);
  if(matches.size>=4096)matches.clear();
  matches.set(key,shift);return shift;
}
function scfMatchProdShiftForOrder(order,prodShifts,customers){
  if(!order||!prodShifts)return null;
  if(!/^\d{1,2}:\d{2}$/.test(normalizeTimeInput(order.deliveryTime)))return null;
  const tMin=timeToMin(order.deliveryTime);
  const {resolved,pt,aliases}=resolveOrderPointAliases(order,customers||[]);
  const matchesTime=sh=>{
    const from=sh.orderTimeFrom||sh.startTime||sh.orderTime;
    const to=sh.orderTimeTo||sh.endTime||sh.orderTime;
    return (from&&to&&from!==to)?timeInRange(order.deliveryTime,from,to):(sh.orderTime&&tMin===timeToMin(sh.orderTime));
  };
  const active=(prodShifts||[]).filter(sh=>sh.active!==false);
  // Ưu tiên định danh cụ thể: điểm giao > địa chỉ > khách hàng > khu vực.
  // Tránh trường hợp khu vực cũ (ví dụ BN/SS TN) có điểm bằng tên điểm giao và thắng do thứ tự ID.
  const aliasGroups=[
    {values:[order.pointName,pt.name],exact:10000,partial:6000},
    {values:[order.address,pt.address],exact:8000,partial:4800},
    {values:[order.customer,resolved?.customer?.name],exact:4000,partial:2400},
    {values:[order.area,pt.area],exact:1000,partial:600}
  ].map(group=>({...group,values:[...new Set(group.values.map(normalizeLookupText).filter(Boolean))]}));
  const scored=active.map(sh=>{
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
    // Chọn cấu hình địa điểm trước, rồi mới xét giờ. Nếu điểm đã có lịch
    // riêng nhưng giờ nằm ngoài lịch, không lấy ca chung của khu vực thay thế.
    const bestScore=Math.max(...scored.map(item=>item.score));
    const matches=scored.filter(item=>item.score===bestScore&&matchesTime(item.sh));
    if(!matches.length)return null;
    return matches.sort((a,b)=>{
      const ad=(Number(a.sh.startTime?timeToMin(a.sh.startTime):timeToMin(a.sh.orderTime))||0);
      const bd=(Number(b.sh.startTime?timeToMin(b.sh.startTime):timeToMin(b.sh.orderTime))||0);
      const byScore=b.score-a.score;
      if(byScore)return byScore;
      return ad-bd||(String(a.sh.id||'').localeCompare(String(b.sh.id||''),'vi'));
    })[0].sh;
  }
  const matches=active.filter(matchesTime);
  return matches.find(sh=>!normalizeLookupText(sh.location||''))||matches[0];
}
// Lưu cùng một kế hoạch SX cho mở danh sách, tạo đơn và cập nhật lại.
// Chỉ sửa trường kế hoạch; ảnh, số lượng và các dòng chọn ca tay được giữ lại.
function scfDeliveryProductionSchedule(shift,prodShifts=window.__SCF_PROD_SHIFTS||[]){
  if(shift?.productionSchedule)return shift.productionSchedule;
  if(!shift)return null;
  const candidates=(prodShifts||[]).filter(s=>s.active!==false&&(s.tripShiftName?normalizeLookupText(s.tripShiftName)===normalizeLookupText(shift.name):String(s.tripShiftId||'')===String(shift.id))).map(s=>({
    actualProdTime:s.actualProdTime||'',prodDateOffset:Number(s.prodDateOffset||0)-Number(s.tripDateOffset||0),
    labelPrintTime:s.labelPrintTime||'',labelPrintDateOffset:Number(s.labelPrintDateOffset||0)-Number(s.tripDateOffset||0)
  }));
  const unique=[...new Map(candidates.map(s=>[JSON.stringify(s),s])).values()];
  return unique.length===1?unique[0]:null;
}
function scfProductionScheduleKey(schedule){
  return JSON.stringify([schedule?.prodWorkShiftId?'shift:'+schedule.prodWorkShiftId:schedule?.actualProdTime||'',Number(schedule?.prodDateOffset||0),schedule?.labelPrintTime||'',Number(schedule?.labelPrintDateOffset||0)]);
}
function scfProductionRuleTimeMatches(rule,time){
  const from=rule.deliveryTimeFrom||'',to=rule.deliveryTimeTo||from;
  if(!from&&!to)return true;
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time||''))return false;
  return timeInRange(time,from,to);
}
function scfProductionRuleTimesOverlap(a,b){
  const af=a.deliveryTimeFrom||'',at=a.deliveryTimeTo||af,bf=b.deliveryTimeFrom||'',bt=b.deliveryTimeTo||bf;
  if(!af&&!at||!bf&&!bt)return true;
  return timeInRange(af,bf,bt)||timeInRange(at,bf,bt)||timeInRange(bf,af,at)||timeInRange(bt,af,at);
}
function scfProductionRuleRank(rule,order,trip){
  if(rule?.active===false)return 0;
  if(rule.tripId&&String(rule.tripId)!==String(trip?.id||''))return 0;
  if(!scfProductionRuleTimeMatches(rule,order?.deliveryTime))return 0;
  const scoped=rule.tripId?1:0;
  const resolved=findOrderPointMatch(order,window.__SCF_CUSTOMERS||[]);
  const point=resolved?.point||{},customerId=String(order?.customerId||order?.custId||resolved?.customer?.id||'');
  if(rule.scope==='orders')return rule.tripId&&(rule.orderIds||[]).some(id=>String(id)===String(order?.id||''))?401:0;
  if(rule.scope==='points'){
    const matched=(rule.points||[]).some(p=>{
      if(p.customerId&&String(p.customerId)!==customerId)return false;
      const pointId=String(order?.pointId||order?.ptId||point.id||'');
      if(p.pointId)return String(p.pointId)===pointId||(point.mergedPointIds||[]).some(id=>String(id)===String(p.pointId));
      return !!p.customerId&&normalizeLookupText(p.pointName)===normalizeLookupText(order?.pointName||point.name);
    });
    return matched?300+scoped*10+(rule.deliveryTimeFrom?2:0):0;
  }
  if(rule.scope==='areas')return (rule.areas||[]).some(area=>normalizeLookupText(area)===normalizeLookupText(order?.area||point.area))?200+scoped:0;
  return rule.scope==='default'?100+scoped:0;
}
function scfProductionRulesOverlap(a,b){
  if(a.active===false||b.active===false||a.scope!==b.scope||String(a.tripId||'')!==String(b.tripId||''))return false;
  if(a.scope==='points'&&!!a.deliveryTimeFrom!==!!b.deliveryTimeFrom||!scfProductionRuleTimesOverlap(a,b))return false;
  if(a.scope==='default')return true;
  if(a.scope==='orders')return (a.orderIds||[]).some(id=>(b.orderIds||[]).some(other=>String(id)===String(other)));
  if(a.scope==='areas')return (a.areas||[]).some(area=>(b.areas||[]).some(other=>normalizeLookupText(area)===normalizeLookupText(other)));
  if(a.scope==='points')return (a.points||[]).some(p=>(b.points||[]).some(q=>String(p.customerId||'')===String(q.customerId||'')&&(p.pointId&&q.pointId?String(p.pointId)===String(q.pointId):normalizeLookupText(p.pointName)===normalizeLookupText(q.pointName))));
  return false;
}
function scfResolveTripProductionSchedule(shift,order,trip,prodShifts=window.__SCF_PROD_SHIFTS||[]){
  if(!shift)return {schedule:null,issue:'Chưa xác định được ca giao hàng'};
  const matches=(shift.productionScheduleRules||[]).map(rule=>({rule,rank:scfProductionRuleRank(rule,order,trip)})).filter(x=>x.rank>0);
  if(matches.length){
    const best=Math.max(...matches.map(x=>x.rank)),top=matches.filter(x=>x.rank===best);
    if(new Set(top.map(x=>scfProductionScheduleKey(x.rule))).size>1)return {schedule:null,issue:'Xung đột lịch SX/tem: '+top.map(x=>x.rule.name||x.rule.id).join(', '),conflict:true,ruleIds:top.map(x=>x.rule.id)};
    return {schedule:top[0].rule,source:top[0].rule.name||top[0].rule.id,ruleIds:top.map(x=>x.rule.id)};
  }
  if(shift.productionSchedule)return {schedule:shift.productionSchedule,source:'Lịch mặc định của chuyến'};
  // Giữ khác biệt theo bếp/giờ trong dữ liệu cũ; không gom thành một giờ chung.
  const legacy=(prodShifts||[]).filter(s=>s.active!==false&&(s.tripShiftName?normalizeLookupText(s.tripShiftName)===normalizeLookupText(shift.name):String(s.tripShiftId||'')===String(shift.id)));
  const selected=getProdShiftForOrder(order,legacy,window.__SCF_CUSTOMERS||[]);
  if(selected){
    const peers=legacy.filter(s=>normalizeLookupText(s.location)===normalizeLookupText(selected.location)&&timeInRange(order.deliveryTime,s.orderTimeFrom||s.startTime||s.orderTime,s.orderTimeTo||s.endTime||s.orderTime));
    const convert=s=>({actualProdTime:s.actualProdTime||'',prodDateOffset:Number(s.prodDateOffset||0)-Number(s.tripDateOffset||0),labelPrintTime:s.labelPrintTime||'',labelPrintDateOffset:Number(s.labelPrintDateOffset||0)-Number(s.tripDateOffset||0)});
    if(new Set(peers.map(s=>scfProductionScheduleKey(convert(s)))).size>1)return {schedule:null,conflict:true,issue:'Các lịch cũ của bếp trùng giờ nhưng khác lịch SX/tem'};
    return {schedule:convert(selected),source:'Kế thừa lịch cũ: '+(selected.location||'chung')};
  }
  const common=scfDeliveryProductionSchedule(shift,prodShifts);
  return common?{schedule:common,source:'Kế thừa lịch cũ thống nhất'}:{schedule:null,issue:'Chưa có lịch SX/tem phù hợp với đơn trong chuyến'};
}
function scfOrderProductionResolution(order,plannedShift,trips=window.__SCF_TRIPS||[]){
  const trip=(trips||[]).find(t=>String(t.id)===String(order?.tripId||''));
  const shifts=window.__SCF_SHIFTS||[];
  const deliveryShift=trip
    ?shifts.find(s=>String(s.id)===String(trip.shiftId))||shifts.find(s=>normalizeLookupText(s.name)===normalizeLookupText(trip.shiftName))
    :order?.tripAssignMode==='manual'?null:resolveCurrentDeliveryShift(order,plannedShift);
  const resolved=scfResolveTripProductionSchedule(deliveryShift,order,trip);
  const baseDate=trip?.deliveryDate|| (plannedShift?addDaysVN(order.deliveryDate,plannedShift.tripDateOffset||0):'');
  return {...resolved,trip,deliveryShift,baseDate};
}
function scfTripProductionPlan(order,plannedShift,trips=window.__SCF_TRIPS||[],prodShiftRules=window.__SCF_PROD_SHIFT_RULES){
  const resolved=scfOrderProductionResolution(order,plannedShift,trips);
  const {schedule,baseDate,deliveryShift}=resolved;
  if(!schedule||!baseDate||!schedule.labelPrintTime)return null;
  const rules=prodShiftRules?.length?prodShiftRules:(typeof DEF_PROD_SHIFT_RULES==='undefined'?[]:DEF_PROD_SHIFT_RULES);
  const selected=schedule.prodWorkShiftId?rules.find(r=>String(r.id)===String(schedule.prodWorkShiftId)&&r.active!==false):null;
  if(schedule.prodWorkShiftId&&!selected)return null;
  if(!selected&&!schedule.actualProdTime)return null;
  // A representative time is retained for older reports; the selected shift ID is authoritative.
  const prodTime=selected?selected.start:schedule.actualProdTime;
  return {shift:{...(plannedShift||{id:'',name:deliveryShift.name}),...(selected?{prodWorkShiftId:selected.id}: {})},prodTime,prodWorkShiftId:selected?.id||'',
    prodDate:addDaysVN(baseDate,schedule.prodDateOffset||0),labelTime:schedule.labelPrintTime,
    labelDate:addDaysVN(baseDate,schedule.labelPrintDateOffset||0),manual:false,source:resolved.source};
}
function scfApplyAutomaticProduction(order,plannedShift,trips){
  if(window.scfProductionConfigurationPending?.())return order;
  if(order?.prodShiftAssignMode==='manual')return order;
  if(scfOrderProductionResolution(order,plannedShift,trips).conflict)return order;
  const plan=scfTripProductionPlan(order,plannedShift,trips);
  const values={
    prodShiftAssignMode:'auto',prodShiftId:plannedShift?.id||'',
    prodDate:plan?.prodDate||'',prodTime:plan?.prodTime||'',
    prodWorkShiftId:plan?.prodWorkShiftId||'',
    labelDate:plan?.labelDate||'',labelTime:plan?.labelTime||''
  };
  let touched=Object.entries(values).some(([key,value])=>String(order[key]||'')!==String(value));
  const lineValues={prodDate:values.prodDate,prodTime:values.prodTime,prodWorkShiftId:values.prodWorkShiftId,labelDate:values.labelDate,labelTime:values.labelTime};
  const lines=(order.lines||[]).map(line=>{
    if(line.shiftOverride||!Object.entries(lineValues).some(([key,value])=>String(line[key]||'')!==String(value)))return line;
    touched=true;return {...line,...lineValues};
  });
  return touched?{...order,...values,lines}:order;
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
  const autoShift=getProdShiftForOrder(order,prodShifts||[],window.__SCF_CUSTOMERS||[]);
  const shift=autoShift;
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
  const autoShift=getProdShiftForOrder(order,prodShifts||[],window.__SCF_CUSTOMERS||[]);
  const plannedShift=autoShift;
  if(!plannedShift)return '';
  return String(resolveCurrentDeliveryShift(order,plannedShift)?.id||plannedShift?.tripShiftId||'');
}
function getOrderTripShiftName(order,prodShifts){
  const autoShift=getProdShiftForOrder(order,prodShifts||[],window.__SCF_CUSTOMERS||[]);
  const plannedShift=autoShift;
  if(!plannedShift)return '';
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
  const rules=prodShiftRules?.length?prodShiftRules:(window.__SCF_PROD_SHIFT_RULES?.length?window.__SCF_PROD_SHIFT_RULES:DEF_PROD_SHIFT_RULES);
  const rule=(sh?.prodWorkShiftId?rules.find(r=>String(r.id)===String(sh.prodWorkShiftId)):null)||getProdWorkShiftRule(prodTime,rules);
  if(!rule)return prodShiftDisplay(sh);
  return {...(sh||{}),name:rule.name,color:rule.color,textColor:rule.textColor,smallShiftId:rule.id,group:rule.group};
}
function prodShiftPlan(order,prodShifts,prodShiftRules){
  if(!order||order._hdr||order._sub)return null;
  const trip=(window.__SCF_TRIPS||[]).find(t=>String(t.id)===String(order.tripId||''));
  const locked=['done','cancelled','failed','delivering'].includes(order.status)||trip&&(trip.driverDispatchedAt||['active','completion_pending','completed','cancelled'].includes(trip.status));
  if(locked&&order.prodTime)return {shift:prodShiftSmallDisplay({name:'Ca SX đã lưu',prodWorkShiftId:order.prodShiftAssignMode==='manual'?'':order.prodWorkShiftId},order.prodTime,prodShiftRules),prodWorkShiftId:order.prodShiftAssignMode==='manual'?'':order.prodWorkShiftId||'',prodTime:order.prodTime,prodDate:order.prodDate||'',labelTime:order.labelTime||'',labelDate:order.labelDate||'',manual:order.prodShiftAssignMode==='manual',frozen:true};
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
  if(!manualOrder){
    if(window.scfProductionConfigurationPending?.())return order.prodTime?{shift:prodShiftSmallDisplay({name:'Ca SX đã lưu',prodWorkShiftId:order.prodShiftAssignMode==='manual'?'':order.prodWorkShiftId},order.prodTime,prodShiftRules),prodWorkShiftId:order.prodShiftAssignMode==='manual'?'':order.prodWorkShiftId||'',prodTime:order.prodTime,prodDate:order.prodDate||'',labelTime:order.labelTime||'',labelDate:order.labelDate||'',manual:false,source:'Chờ máy chủ xác nhận cấu hình'}:null;
    const plan=scfTripProductionPlan(order,sh,undefined,prodShiftRules);
    const resolution=scfOrderProductionResolution(order,sh);
    if(resolution.conflict&&order.prodTime)return {shift:prodShiftSmallDisplay({name:'Ca SX đã lưu',prodWorkShiftId:order.prodShiftAssignMode==='manual'?'':order.prodWorkShiftId},order.prodTime,prodShiftRules),prodWorkShiftId:order.prodShiftAssignMode==='manual'?'':order.prodWorkShiftId||'',prodTime:order.prodTime,prodDate:order.prodDate||'',labelTime:order.labelTime||'',labelDate:order.labelDate||'',manual:false,scheduleIssue:resolution.issue};
    return plan?{...plan,shift:prodShiftSmallDisplay(plan.shift,plan.prodTime,prodShiftRules)}:null;
  }
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
  const defaultOrder=hasLineOverrides?{...order,prodShiftAssignMode:'auto',prodShiftId:''}:order;
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
const PROD_SHIFT_AUDIT_FIELDS=[
  ['location','Địa điểm'],['startTime','Giờ ĐH từ'],['endTime','Giờ ĐH đến'],
  ['name','Tên ca'],['actualProdTime','Giờ SX'],['prodDateOffset','Ngày sản xuất'],
  ['tripDateOffset','Ngày chuyến'],['tripShiftName','Ca giao hàng'],
  ['labelPrintDateOffset','Ngày in tem'],['labelPrintTime','Giờ in tem'],
  ['active','Trạng thái'],['color','Màu nền'],['textColor','Màu chữ']
];
function prodShiftAuditChanges(before,after){
  const display=(key,value)=>key==='active'?(value?'Đang hoạt động':'Tạm tắt'):String(value??'—');
  return PROD_SHIFT_AUDIT_FIELDS.filter(([key])=>String(before?.[key]??'')!==String(after?.[key]??''))
    .map(([key,label])=>label+': '+display(key,before?.[key])+' → '+display(key,after?.[key]));
}
function ProdShiftsTab({prodShifts,setProdShifts,prodShiftRules,setProdShiftRules,orders,customers,shifts,setShifts,currentUser}){
  const[modal,sm]=useState(null);
  const[edit,se]=useState(null);
  const[auditShiftId,setAuditShiftId]=useState(null);
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
  const[locationSearch,setLocationSearch]=useState('');
  const pointOptions=[...new Set((customers||[]).flatMap(c=>(c.points||[]).flatMap(pt=>[pt.name,pt.area]).filter(Boolean)))].sort((a,b)=>a.localeCompare(b));
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
  const locationSearchKey=normalizeLookupText(locationSearch);
  const groupedShifts=[...prodShifts].map(normalize).filter(r=>(areaFilter==='all'||areaOfLocation(r.location)===areaFilter)&&(!locationSearchKey||normalizeLookupText(r.location).includes(locationSearchKey))).sort((a,b)=>{
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
    if(!(form.startTime||form.orderTime)||!(form.endTime||form.orderTime)||!form.tripShiftId){window.showToast('Nhập đủ khoảng giờ đơn hàng và chọn ca giao hàng!','warn');return;}
    const autoRule=shiftRuleFromProdTime(form.actualProdTime);
    const autoName=autoRule?.name||'';
    const {_missingCount,_missingReason,_missingOrderIds,_missingSummary,...cleanForm}=form;
    const chosenTripShift=(shifts||[]).find(x=>x.id===form.tripShiftId);
    const data={...cleanForm,name:autoName||form.tripShiftName||'Chọn chuyến',color:autoRule?.color||form.color,textColor:autoRule?.textColor||form.textColor,orderTime:form.startTime||form.orderTime,startTime:form.startTime||form.orderTime,endTime:form.endTime||form.orderTime,prodDateOffset:Number(form.prodDateOffset||0),tripDateOffset:Number(form.tripDateOffset||0),tripShiftId:String(form.tripShiftId||''),tripShiftName:chosenTripShift?.name||form.tripShiftName||'',labelPrintDateOffset:Number(form.labelPrintDateOffset||0)};
    const stamp=fmtDT(),atIso=new Date().toISOString(),actor=currentUser?.name||'Người dùng',actorId=currentUser?.id||'';
    if(edit) setProdShifts(p=>p.map(s=>{
      if(s.id!==edit.id)return s;
      const changes=prodShiftAuditChanges(normalize(s),data);
      if(!changes.length)return s;
      return {...s,...data,id:s.id,createdAt:s.createdAt||'',createdBy:s.createdBy||'',createdById:s.createdById||'',updatedAt:stamp,updatedBy:actor,updatedById:actorId,
        shiftHistory:[...(s.shiftHistory||[]),{id:'PSHLOG'+uid(),action:'Sửa dòng cài đặt ca',changes,at:stamp,atIso,by:actor,byId:actorId}]};
    }));
    else setProdShifts(p=>[...p,{...data,id:'PSH'+uid(),createdAt:stamp,createdBy:actor,createdById:actorId,updatedAt:stamp,updatedBy:actor,updatedById:actorId,
      shiftHistory:[{id:'PSHLOG'+uid(),action:'Tạo dòng cài đặt ca',changes:['Địa điểm: '+(data.location||'—'),'Giờ ĐH: '+(data.startTime||'—')+' - '+(data.endTime||'—'),'Giờ SX: '+(data.actualProdTime||'—')],at:stamp,atIso,by:actor,byId:actorId}]}]);
    sm(null);
  };
  const auditShift=(prodShifts||[]).find(s=>s.id===auditShiftId);
  const del=sh=>window.scfConfirm('Bạn có chắc muốn xóa ca "'+sh.name+'"?','Xóa ca sản xuất',true).then(ok=>ok&&setProdShifts(p=>p.filter(s=>s.id!==sh.id)));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-clock-play',style:{fontSize:20}}),'Cài đặt ca SX + ca GH tự động'),
    h('h3',null,'1. Từ đơn hàng → tự động chọn chuyến'),
    h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:'1rem',gap:8,flexWrap:'wrap',alignItems:'center'}},
      h('input',{value:locationSearch,onChange:e=>setLocationSearch(e.target.value),placeholder:'Tìm địa điểm...',type:'search',style:{padding:'7px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',fontSize:13,minWidth:240}}),
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
      'Bảng 1 chọn ngày chuyến và ca giao hàng theo địa điểm/khu vực, giờ đơn hàng. Bảng 2 quyết định lịch SX và in tem theo chuyến. Cấu hình cũ khác nhau trong cùng ca giao hàng cần được cài đặt lại tại bảng 2.',
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
          ['Tên ca','Địa điểm / khu vực','Giờ ĐH','Ngày chuyến','Ca giao hàng','Trạng thái',''].map((x,i)=>h('th',{key:x,style:{textAlign:'left',padding:'10px 12px',borderBottom:'1px solid var(--bd)',fontSize:12,color:'var(--tx2)',background:'var(--bg2)',whiteSpace:'nowrap',width:i===0?130:(i===2?96:undefined)}},x))
        )),
        h('tbody',null,
          (()=>{let lastGroup=null;const rows=[];groupedShiftRows.forEach(item=>{
            if(item.type==='group'){
              lastGroup=item.label;
              rows.push(h('tr',{key:item.key},
                h('td',{colSpan:7,style:{padding:'8px 12px',background:'#E6F1FB',color:'#185FA5',fontWeight:700,borderTop:'1px solid var(--bd)',borderBottom:'1px solid var(--bd)'}},
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
              h('td',{style:{padding:'10px 12px'}},dateOffsetLabel(r.tripDateOffset)),
              h('td',{style:{padding:'10px 12px'}},r.tripShiftName||'—'),
              h('td',{style:{padding:'10px 12px'}},h('span',{className:'badge',style:{background:r.active?'#E8F5E9':'#F1EFE8',color:r.active?'#1B5E20':'#777'}},r.active?'Đang hoạt động':'Tạm tắt')),
              h('td',{style:{padding:'8px 12px',textAlign:'right',whiteSpace:'nowrap'}},
                h('button',{className:'bi',onClick:()=>setAuditShiftId(r.id),title:'Xem người tạo và lịch sử sửa'},h('i',{className:'ti ti-history',style:{fontSize:15}})),
                h('button',{className:'bi',onClick:()=>open(r),title:'Sửa'},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
                h('button',{className:'bi',onClick:()=>del(r),title:'Xóa',style:{color:'#A32D2D',marginLeft:4}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
              )
            ));
          });if(!rows.length)rows.push(h('tr',{key:'empty-area-filter'},h('td',{colSpan:7,className:'empty-st'},'Không có dòng cài đặt thuộc khu vực đã chọn.')));return rows;})()
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
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Ngày chuyến'),h('span',null,dateOffsetLabel(r.tripDateOffset))),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Ca giao hàng'),h('span',null,r.tripShiftName||'—')),
          ),
          h('div',{className:'mobile-data-actions'},
            h('button',{className:'bi',onClick:()=>setAuditShiftId(r.id),title:'Xem người tạo và lịch sử sửa'},h('i',{className:'ti ti-history',style:{fontSize:15}})),
            h('button',{className:'bi',onClick:()=>open(r),title:'Sửa'},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
            h('button',{className:'bi',onClick:()=>del(r),title:'Xóa',style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
          )
        );
      })
    ),
    h(TripProductionSettings,{shifts,setShifts,prodShifts,prodShiftRules:rules,currentUser,orders,customers}),
    auditShift&&h(Modal,{title:'Lịch sử cài đặt ca — '+(auditShift.location||auditShift.name||auditShift.id),onClose:()=>setAuditShiftId(null)},
      h('div',{style:{display:'grid',gap:8,fontSize:13}},
        h('div',null,h('b',null,'Người tạo: '),auditShift.createdBy||'Chưa ghi nhận (dữ liệu cũ)',auditShift.createdAt?' · '+auditShift.createdAt:''),
        h('div',null,h('b',null,'Người sửa gần nhất: '),auditShift.updatedBy||'Chưa ghi nhận',auditShift.updatedAt?' · '+auditShift.updatedAt:''),
        h('div',{style:{borderTop:'1px solid var(--bd)',paddingTop:10,marginTop:4,fontWeight:700}},'Các lần thay đổi'),
        (auditShift.shiftHistory||[]).length
          ?[...auditShift.shiftHistory].reverse().map((entry,i)=>h('div',{key:entry.id||i,style:{padding:'9px 12px',background:'var(--bg2)',borderRadius:'var(--r)',border:'1px solid var(--bd)'}},
            h('div',{style:{fontWeight:700}},entry.action||'Cập nhật',' · ',entry.by||'Không rõ người sửa',' · ',entry.at||'Không rõ thời gian'),
            (entry.changes||[]).map((change,j)=>h('div',{key:j,style:{marginTop:4,color:'var(--tx2)'}},change))
          ))
          :h('div',{style:{color:'var(--tx2)'}},'Dòng này được tạo trước khi bật lịch sử, nên chưa có bản ghi thay đổi.')
      )
    ),
    modal==='f'&&h(Modal,{title:edit?'Sửa quy tắc chọn chuyến':'Thêm quy tắc chọn chuyến',onClose:()=>sm(null)},
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

function TripProductionSettings({shifts,setShifts,prodShifts,prodShiftRules,currentUser,orders=[],customers=[]}){
  const [editing,setEditing]=useState(null),[config,setConfig]=useState(null),[mode,setMode]=useState('shift'),[tripId,setTripId]=useState(''),[day,setDay]=useState(''),[error,setError]=useState('');
  const workRules=prodShiftRules?.length?prodShiftRules:(window.__SCF_PROD_SHIFT_RULES?.length?window.__SCF_PROD_SHIFT_RULES:DEF_PROD_SHIFT_RULES);
  const workRule=p=>p?.prodWorkShiftId?workRules.find(r=>String(r.id)===String(p.prodWorkShiftId)):getProdWorkShiftRule(p?.actualProdTime||p?.prodTime,workRules);
  const shiftName=p=>workRule(p)?.name||'Chưa chọn ca';
  const empty={prodDateOffset:0,prodWorkShiftId:'',labelPrintDateOffset:0,labelPrintTime:''};
  const normalize=p=>({...empty,...p,prodWorkShiftId:workRule(p)?.id||''});
  const clean=p=>{const {actualProdTime,...rest}=p;return rest;};
  const current=(shifts||[]).find(s=>String(s.id)===String(editing?.id));
  const locked=t=>!!t&&(t.driverDispatchedAt||['active','completion_pending','completed','cancelled'].includes(t.status));
  const trips=(window.__SCF_TRIPS||[]).filter(t=>String(t.shiftId)===String(current?.id)||(!t.shiftId&&normalizeLookupText(t.shiftName)===normalizeLookupText(current?.name)));
  const contextId=mode==='trip'?tripId:'';
  const selectedTrip=trips.find(t=>String(t.id)===String(contextId));
  const blocked=mode==='trip'&&(!selectedTrip||locked(selectedTrip));
  const pointKey=p=>JSON.stringify([String(p.customerId||''),String(p.pointId||''),p.pointId?'':normalizeLookupText(p.pointName)]);
  const allPoints=[...new Map(customers.flatMap(c=>(c.points||[]).map(p=>({customerId:String(c.id||''),customerName:c.name||'',pointId:String(p.id||''),pointName:p.name||'',area:p.area||''}))).filter(p=>p.customerId&&(p.pointId||p.pointName)).map(p=>[pointKey(p),p])).values()];
  const contextRules=(config?.rules||[]).filter(r=>String(r.tripId||'')===String(contextId));
  const general=mode==='shift'?config?.base:contextRules.find(r=>r.scope==='default');
  const exceptions=contextRules.filter(r=>r.scope!=='default');
  const members=orders.filter(o=>o.status!=='cancelled'&&trips.some(t=>String(t.id)===String(o.tripId))&&(!contextId||String(o.tripId)===String(contextId)));
  const setRule=(id,patch)=>{setConfig(c=>({...c,rules:c.rules.map(r=>r.id===id?{...r,...patch}:r)}));setError('');};
  const setGeneral=(key,value)=>{
    setError('');setConfig(c=>{
      if(mode==='shift')return {...c,baseTouched:true,base:{...normalize(c.base),[key]:value}};
      const prior=c.rules.find(r=>r.scope==='default'&&String(r.tripId||'')===String(contextId));
      return {...c,rules:prior?c.rules.map(r=>r===prior?{...r,[key]:value}:r):[...c.rules,{...empty,id:uid(),scope:'default',tripId:contextId,name:'Quy tắc chung của chuyến',active:true,[key]:value}]};
    });
  };
  const open=s=>{
    setEditing(s);setConfig({base:s.productionSchedule?normalize(s.productionSchedule):null,rules:(s.productionScheduleRules||[]).map(r=>({...r,...normalize(r)}))});
    setMode('shift');setTripId('');setDay(new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}));setError('');
  };
  const addException=()=>{setConfig(c=>({...c,rules:[...c.rules,{...empty,...general,id:uid(),name:'Ngoại lệ địa điểm và giờ giao',scope:'points',tripId:contextId,points:[],orderIds:[],areas:[],deliveryTimeFrom:'',deliveryTimeTo:'',active:true}]}));setError('');};
  const proposed=current&&config?{...current,productionSchedule:config.base,productionScheduleRules:config.rules}:null;
  const preview=members.map(order=>{const trip=trips.find(t=>String(t.id)===String(order.tripId));return {order,trip,result:scfResolveTripProductionSchedule(proposed,order,trip,prodShifts)};});
  const offsetText=n=>Number(n)===0?'Cùng ngày ca giao (0)':Number(n)<0?'Trước ngày ca giao 1 ngày (-1)':'Sau ngày ca giao 1 ngày (+1)';
  const scheduleFields=(plan,update,key)=>h('tr',{key},
    h('td',{'data-label':'Ngày SX'},h('select',{'aria-label':'Ngày SX '+key,value:plan?.prodDateOffset??0,onChange:e=>update('prodDateOffset',Number(e.target.value))},[-1,0,1].map(n=>h('option',{key:n,value:n},offsetText(n))),![undefined,-1,0,1].includes(plan?.prodDateOffset)&&h('option',{value:plan.prodDateOffset},'Giữ ngày cũ ('+plan.prodDateOffset+')'))),
    h('td',{'data-label':'Ca SX'},h('select',{'aria-label':'Ca SX '+key,value:plan?.prodWorkShiftId||'',onChange:e=>update('prodWorkShiftId',e.target.value)},h('option',{value:''},'— Chọn ca SX —'),workRules.filter(r=>r.active!==false).map(r=>h('option',{key:r.id,value:r.id},r.name)))),
    h('td',{'data-label':'Ngày in tem'},h('select',{'aria-label':'Ngày in tem '+key,value:plan?.labelPrintDateOffset??0,onChange:e=>update('labelPrintDateOffset',Number(e.target.value))},[-1,0,1].map(n=>h('option',{key:n,value:n},offsetText(n))),![undefined,-1,0,1].includes(plan?.labelPrintDateOffset)&&h('option',{value:plan.labelPrintDateOffset},'Giữ ngày cũ ('+plan.labelPrintDateOffset+')'))),
    h('td',{'data-label':'Giờ in tem'},h('input',{'aria-label':'Giờ in tem '+key,type:'time',value:plan?.labelPrintTime||'',onChange:e=>update('labelPrintTime',e.target.value)})));
  const validPlan=p=>p&&workRules.some(r=>String(r.id)===String(p.prodWorkShiftId)&&r.active!==false)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(p.labelPrintTime||'');
  const save=()=>{
    if(blocked){setError('Chọn chuyến chưa giao lái xe và chưa khóa để cài đặt.');return;}
    if(JSON.stringify(current.productionSchedule)!==JSON.stringify(editing.productionSchedule)||JSON.stringify(current.productionScheduleRules)!==JSON.stringify(editing.productionScheduleRules)){setError('Cài đặt vừa thay đổi. Đóng và mở lại bảng để kiểm tra trước khi lưu.');return;}
    if(!validPlan(general)){setError('Điền đủ ca SX và giờ in tem cho quy tắc chung.');return;}
    const changedRules=config.rules.filter(r=>JSON.stringify(r)!==JSON.stringify((editing.productionScheduleRules||[]).map(x=>({...x,...normalize(x)})).find(x=>x.id===r.id)));
    if((editing.productionScheduleRules||[]).some(r=>r.tripId&&!config.rules.some(x=>x.id===r.id)&&locked(trips.find(t=>String(t.id)===String(r.tripId))))){setError('Không thể xóa quy tắc của chuyến đã khóa.');return;}
    for(const rule of changedRules){
      if(rule.active===false)continue;
      if(!validPlan(rule)){setError('Điền đủ lịch SX và tem cho các dòng ngoại lệ.');return;}
      if(rule.scope==='points'&&!(rule.points||[]).length){setError('Chọn địa điểm cho từng dòng ngoại lệ.');return;}
      if(rule.scope==='points'&&((!rule.deliveryTimeFrom)!==(!rule.deliveryTimeTo))){setError('Nhập đủ giờ giao từ và đến cho ngoại lệ, hoặc để trống cả hai để áp dụng mọi giờ.');return;}
      if(rule.tripId&&locked(trips.find(t=>String(t.id)===String(rule.tripId)))){setError('Không thể thay quy tắc của chuyến đã khóa.');return;}
    }
    for(let i=0;i<config.rules.length;i++)for(let j=i+1;j<config.rules.length;j++){
      const a=config.rules[i],b=config.rules[j];
      if(scfProductionRulesOverlap(a,b)&&scfProductionScheduleKey(a)!==scfProductionScheduleKey(b)){setError('Ngoại lệ chồng chéo: cùng địa điểm và giờ giao nhưng khác lịch SX/tem. Sửa hoặc xóa dòng trùng trước khi lưu.');return;}
    }
    if(preview.some(row=>row.result.conflict)){setError('Có đơn khớp nhiều lịch khác nhau. Kiểm tra ngoại lệ trước khi lưu.');return;}
    setShifts(previous=>previous.map(s=>{
      if(String(s.id)!==String(current.id))return s;
      if(JSON.stringify(s.productionSchedule)!==JSON.stringify(editing.productionSchedule)||JSON.stringify(s.productionScheduleRules)!==JSON.stringify(editing.productionScheduleRules)){window.showToast('Cài đặt vừa thay đổi. Mở lại bảng để kiểm tra trước khi lưu.','warn');return s;}
      const originalRules=editing.productionScheduleRules||[];
      const rules=config.rules.map(r=>{const original=originalRules.find(x=>x.id===r.id);return original&&JSON.stringify({...original,...normalize(original)})===JSON.stringify(r)?original:clean(r);});
      const originalBase=editing.productionSchedule;
      const base=!config.baseTouched&&JSON.stringify(config.base)===JSON.stringify(originalBase?normalize(originalBase):null)?originalBase:clean(config.base);
      return {...s,productionSchedule:base,productionScheduleRules:rules,updatedAt:new Date().toISOString(),updatedBy:currentUser?.name||'',productionScheduleHistory:[...(s.productionScheduleHistory||[]),{at:new Date().toISOString(),by:currentUser?.name||'',action:'Lưu quy tắc chung và ngoại lệ',before:{productionSchedule:s.productionSchedule,productionScheduleRules:s.productionScheduleRules},after:{productionSchedule:base,productionScheduleRules:rules}}]};
    }));setEditing(null);
  };
  return h('section',{style:{marginBottom:24}},
    h('h3',null,'2. Từ ca giao hàng / chuyến → lịch SX và in tem'),
    h('p',null,'Đặt quy tắc chung, sau đó thêm ngoại lệ theo địa điểm và giờ giao. Đơn không khớp ngoại lệ sẽ theo lịch chung. Ngày SX và ngày tem tính theo ngày của ca giao hàng / chuyến.'),
    h('div',{style:{overflowX:'auto'}},h('table',{className:'tbl',style:{width:'100%'}},h('thead',null,h('tr',null,['Ca giao hàng','Quy tắc chung','Ngoại lệ',''].map(x=>h('th',{key:x},x)))),h('tbody',null,(shifts||[]).map(s=>h('tr',{key:s.id},h('td',null,s.name),h('td',null,s.productionSchedule?shiftName(s.productionSchedule)+' / Tem '+s.productionSchedule.labelPrintTime:'Chưa cài quy tắc chung'),h('td',null,(s.productionScheduleRules||[]).filter(r=>r.scope!=='default'&&r.active!==false).length+' dòng'),h('td',null,h('button',{onClick:()=>open(s)},'Cài đặt'))))))),
    editing&&h(Modal,{title:'Lịch SX và in tem — '+current.name,className:'production-schedule-modal',lg:'xl',onClose:()=>setEditing(null)},
      h('div',{style:{display:'flex',gap:20,flexWrap:'wrap',marginBottom:12}},[['shift','Theo ca giao hàng'],['trip','Theo chuyến giao hàng']].map(([value,label])=>h('label',{key:value,style:{display:'flex',alignItems:'center',gap:6}},h('input',{type:'radio',name:'production-context',value,checked:mode===value,onChange:()=>{setMode(value);setError('');},style:{width:18,height:18,margin:0}}),label))),
      mode==='trip'&&h('div',{className:'g2'},h(F,{label:'Ngày của chuyến'},h('input',{type:'date',value:day,onChange:e=>{setDay(e.target.value);setTripId('');setError('');}})),h(F,{label:'Chuyến giao hàng'},h('select',{value:tripId,onChange:e=>{setTripId(e.target.value);setError('');}},h('option',{value:''},'— Chọn chuyến —'),trips.filter(t=>toIsoDate(t.deliveryDate)===day||String(t.id)===String(tripId)).map(t=>h('option',{key:t.id,value:String(t.id)},t.deliveryDate+' · '+(t.shiftName||current.name)+' · '+t.id+(locked(t)?' · Đã khóa':'')))))),
      h('p',null,mode==='shift'?'Quy tắc dùng cho các chuyến thuộc ca này.':'Quy tắc chỉ dùng cho chuyến đã chọn. Ngày SX và tem lấy mốc ngày của chuyến.'),
      blocked&&h('p',{role:'status'},selectedTrip?'Chuyến đã khóa: chỉ xem lịch, giữ lịch đã lưu của đơn.':'Chọn ngày và chuyến để cài đặt.'),
      h('fieldset',{disabled:blocked,style:{border:0,padding:0,minWidth:0}},
        h('h4',null,'Quy tắc chung'),
        h('p',null,'Áp dụng cho tất cả đơn chưa khớp ngoại lệ bên dưới.'),
        h('div',{style:{overflowX:'auto'}},h('table',{className:'tbl schedule-edit-table',style:{width:'100%',minWidth:650}},h('thead',null,h('tr',null,['Ngày SX','Ca SX','Ngày in tem','Giờ in tem'].map(x=>h('th',{key:x},x)))),h('tbody',null,scheduleFields(general,setGeneral,'chung')))),
        mode==='trip'&&!general&&h('p',null,'Chưa có lịch chung riêng cho chuyến. Đang kế thừa quy tắc của ca; điền bảng trên để đặt lịch riêng.'),
        h('h4',null,'Đơn ngoại lệ theo địa điểm và giờ giao'),
        h('p',null,'Có thể thêm nhiều dòng. Giờ giao trống nghĩa là mọi giờ; khoảng giờ qua nửa đêm được hỗ trợ. Dòng có giờ cụ thể được ưu tiên hơn dòng mọi giờ của cùng địa điểm.'),
        h('div',{style:{overflowX:'auto'}},h('table',{className:'tbl schedule-edit-table schedule-exceptions-table',style:{minWidth:1100,width:'100%'}},
          h('thead',null,h('tr',null,['Địa điểm / phạm vi','Giờ giao từ','Đến giờ','Ngày SX','Ca SX','Ngày in tem','Giờ in tem',''].map((x,i)=>h('th',{key:i},x)))),
          h('tbody',null,exceptions.map((r,index)=>{
            const fields=scheduleFields(r,(key,value)=>setRule(r.id,{[key]:value}),r.id).props.children;
            const pointValue=(r.points||[]).length===1?pointKey(r.points[0]):'legacy';
            return h('tr',{key:r.id,style:r.active===false?{opacity:.55}:{}},
              h('td',{'data-label':'Địa điểm / phạm vi'},r.scope==='points'?h('select',{'aria-label':'Địa điểm ngoại lệ '+(index+1),value:pointValue,onChange:e=>setRule(r.id,{points:[allPoints.find(p=>pointKey(p)===e.target.value)].filter(Boolean)})},h('option',{value:'legacy'},r.points?.length?r.points.map(p=>p.pointName||p.pointId).join(', '):'— Chọn địa điểm —'),allPoints.map(p=>h('option',{key:pointKey(p),value:pointKey(p)},p.customerName+' · '+p.pointName)),r.points?.length===1&&!allPoints.some(p=>pointKey(p)===pointValue)&&h('option',{value:pointValue},r.points[0].pointName||r.points[0].pointId)):h('span',null,r.name||r.id,' · ',r.scope==='orders'?'Đơn: '+(r.orderIds||[]).join(', '):'Khu vực: '+(r.areas||[]).join(', '))),
              h('td',{'data-label':'Giờ giao từ'},h('input',{'aria-label':'Giờ giao từ ngoại lệ '+(index+1),type:'time',value:r.deliveryTimeFrom||'',onChange:e=>setRule(r.id,{deliveryTimeFrom:e.target.value})})),
              h('td',{'data-label':'Đến giờ'},h('input',{'aria-label':'Đến giờ ngoại lệ '+(index+1),type:'time',value:r.deliveryTimeTo||'',onChange:e=>setRule(r.id,{deliveryTimeTo:e.target.value})})),
              ...fields,
              h('td',null,h('button',{onClick:()=>setRule(r.id,{active:r.active===false})},r.active===false?'Bật':'Tắt'),h('button',{'aria-label':'Xóa ngoại lệ '+(index+1),onClick:()=>{setConfig(c=>({...c,rules:c.rules.filter(x=>x.id!==r.id)}));setError('');}},'Xóa')));
          }),!exceptions.length&&h('tr',null,h('td',{colSpan:8},'Chưa có ngoại lệ. Các đơn dùng quy tắc chung.'))))),
        h('button',{onClick:addException,style:{marginTop:10}},'+ Thêm trường hợp ngoại lệ'),
        mode==='trip'&&h('details',{style:{marginTop:10}},h('summary',null,'Quy tắc kế thừa từ ca giao hàng'),h('p',null,config.base?shiftName(config.base)+' / Tem '+config.base.labelPrintTime:'Ca chưa có lịch chung.'),(config.rules||[]).filter(r=>!r.tripId&&r.scope!=='default').map(r=>h('p',{key:r.id},r.name||r.id,' · ',(r.points||[]).map(p=>p.pointName||p.pointId).join(', ')||r.areas?.join(', '),' · ',shiftName(r),' / Tem ',r.labelPrintTime)))),
      h('h4',null,'Xem trước lịch từng đơn ('+preview.length+' đơn)'),
      h('div',{style:{maxHeight:230,overflow:'auto'}},h('table',{className:'tbl',style:{minWidth:700,width:'100%'}},h('thead',null,h('tr',null,['Đơn / địa điểm','Giờ giao','Ngày / ca SX','Ngày / giờ tem','Áp dụng'].map(x=>h('th',{key:x},x)))),h('tbody',null,preview.map(({order,trip,result})=>{
        const frozen=locked(trip)||['done','delivering','failed'].includes(order.status),p=result.schedule;
        return h('tr',{key:order.id,style:result.conflict?{background:'#FFF0F0'}:{}},h('td',null,order.id+' · '+(order.pointName||order.customer||'')),h('td',null,order.deliveryTime||'—'),h('td',null,frozen?(order.prodDate||'—')+' · '+shiftName(order):p?addDaysVN(trip.deliveryDate,p.prodDateOffset)+' · '+shiftName(p):'—'),h('td',null,frozen?(order.labelDate||'—')+' '+(order.labelTime||'—'):p?addDaysVN(trip.deliveryDate,p.labelPrintDateOffset)+' '+p.labelPrintTime:'—'),h('td',null,frozen?'Đã khóa — giữ lịch đã lưu':result.issue||result.source));
      })))),
      error&&h('div',{role:'alert',style:{color:'#A32D2D',padding:10}},error),
      h(Row,null,h('button',{onClick:()=>setEditing(null)},'Hủy'),h('button',{className:'bp',disabled:blocked,onClick:save},'Lưu quy tắc')))
  );
}
