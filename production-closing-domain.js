/* Các phép tính dùng chung giữa trình duyệt và scf-auth. Không truy cập dữ liệu máy. */
function scfClosingIso(value){
  const text=String(value||''),vn=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const iso=vn?[vn[3],vn[2].padStart(2,'0'),vn[1].padStart(2,'0')].join('-'):text;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
  const d=new Date(iso+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===iso?iso:'';
}
function scfClosingAddDate(iso,days){const d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
function scfClosingGroup(value){const text=String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().trim();return text==='ca dem'?'night':text==='ca chieu'?'afternoon':'';}
function scfClosingDeadline(scope){const date=scfClosingIso(scope?.date);return date&&['night','afternoon'].includes(scope?.shift)?new Date(date+'T'+(scope.shift==='night'?'07':'18')+':00:00+07:00').getTime():NaN;}
function scfClosingAutoScope(now=new Date()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now).map(part=>[part.type,part.value]));
  const hour=Number(parts.hour),date=parts.year+'-'+parts.month+'-'+parts.day;
  return{date:hour>=18?scfClosingAddDate(date,1):date,shift:hour>=12&&hour<18?'afternoon':'night'};
}
function scfClosingScopeOpen(scope,now=new Date()){
  const end=scfClosingDeadline(scope),start=end-(scope?.shift==='night'?13:6)*3600000;
  return Number.isFinite(end)&&now.getTime()>=start&&now.getTime()<end;
}
function scfClosingLineDate(prodDate,prodTime,group){const iso=scfClosingIso(prodDate);return iso&&group==='night'&&Number(String(prodTime).split(':')[0])>=18?scfClosingAddDate(iso,1):iso;}
function scfClosingKey(scope){return [scope.date,scope.shift,scope.workshop].join('|');}
function scfClosingActualDeadline(key,rules){
  const [date,shift]=String(key).split('|'),rule=(rules||[]).find(item=>String(item.id)===shift),group=scfClosingGroup(rule?.group);
  return group?scfClosingDeadline({date:scfClosingLineDate(date,rule.start,group),shift:group}):Infinity;
}
function scfClosingCalculate(lines,adjustments={}){
  const map=new Map();
  for(const line of lines){
    const id=String(line.productId);if(!map.has(id))map.set(id,{productId:id,productName:line.productName,ordered:0,confirmed:0,missing:0,pending:0,sources:[],unknown:0});
    const row=map.get(id);row.sources.push(line);
    if(line.weightKg===null){row.unknown++;continue;}
    row.ordered+=line.weightKg;if(line.completed)row.confirmed+=line.weightKg;else{row.missing+=line.weightKg;row.pending++;}
  }
  let invalid=false;
  const rows=[...map.values()].map(row=>{
    const a=adjustments[row.productId]||{},extra=Number(String(a.extra??0).trim().replace(',','.')),loss=Number(String(a.loss??0).trim().replace(',','.'));
    if(!Number.isFinite(extra)||extra<0||!Number.isFinite(loss)||loss<0||(row.pending>0&&extra>0))invalid=true;
    return{...row,extra,loss,good:row.confirmed+extra,total:row.confirmed+extra+loss};
  });
  const totals=rows.reduce((a,row)=>{for(const key of ['ordered','confirmed','missing','pending','unknown','extra','loss','good','total'])a[key]+=row[key];return a;},{ordered:0,confirmed:0,missing:0,pending:0,unknown:0,extra:0,loss:0,good:0,total:0});
  return{rows,totals,invalid};
}
/* Dùng cùng lịch với Tổng hợp SX; xác nhận theo ngày/ca/SP/đơn. */
function scfCollectClosingLines({orders=[],products=[],prodCats=[],prodShifts=[],prodShiftRules=[],prodActuals={},scope}){
  const out=[];
  for(const order of orders){
    if(order.status==='cancelled')continue;
    const plans=prodShiftPlansForOrder(order,prodShifts,prodShiftRules);
    (order.lines||[]).forEach((line,index)=>{
      if(!line.productId)return;
      const product=products.find(p=>String(p.id)===String(line.productId))||{};
      if(isGoodsProduct(product.id?product:{...line,code:line.productCode||line.code||''},prodCats))return;
      const name=product.name||line.productName||'',shop=scfProductionWorkshop(name);
      if(shop!==scope.workshop)return;
      const plan=plans[index]||prodShiftPlan(order,prodShifts,prodShiftRules);
      const time=line.shiftOverride?(line.prodTime||plan?.prodTime||''):(plan?.prodTime||'');
      const date=line.shiftOverride?(line.prodDate||plan?.prodDate||order.deliveryDate):(plan?.prodDate||order.deliveryDate);
      const rule=getProdWorkShiftRule(time,prodShiftRules),group=scfClosingGroup(rule?.group);
      if(group!==scope.shift||scfClosingLineDate(date,time,group)!==scope.date)return;
      const qty=Number(String(line.qtyProd??0).replace(',','.'));if(!Number.isFinite(qty)||qty<=0)return;
      const key=[date,rule.id,line.productId].join('|'),orderId=String(order.id),productId=String(line.productId);
      let target=out.find(row=>row.key===key&&row.orderId===orderId);
      if(!target){target={key,orderId,productId,productName:name,pointName:order.pointName||order.address||'',deliveryDate:order.deliveryDate,deliveryTime:order.deliveryTime,qty:0,unit:line.unit||product.unit||'',weightKg:0,completed:false};out.push(target);}
      const weight=scfProductionLineWeightKg({...line,unit:line.unit||product.unit},product);
      target.qty+=qty;target.weightKg=weight===null||target.weightKg===null?null:target.weightKg+weight;
    });
  }
  for(const row of out){const check=prodActuals[row.key]?.sourceChecks?.[row.orderId];row.completed=check?.completed===true&&Math.abs(Number(check.orderedQty)-row.qty)<1e-8;}
  return out;
}
