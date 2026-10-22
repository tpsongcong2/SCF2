/* ─── Tổng hợp sản xuất ─── */
function ProductionSummaryPreviewModal({loadData,onClose,currentUser,...summaryProps}){
  const[status,setStatus]=useState('loading'),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const loadRef=useRef(loadData),closeRef=useRef(onClose);loadRef.current=loadData;closeRef.current=onClose;
  const accessKey=JSON.stringify([currentUser?.id,currentUser?.role,currentUser?.permissions,currentUser?.dept,currentUser?.departments,currentUser?.permLevels]);
  useEffect(()=>{
    let active=true;setStatus('loading');setError('');
    Promise.resolve().then(()=>loadRef.current()).then(()=>{if(active)setStatus('ready');}).catch(e=>{if(active){setError(e.message||'Chưa tải được khối lượng sản xuất.');setStatus('error');}});
    return()=>{active=false;};
  },[accessKey,attempt]);
  useEffect(()=>{
    const opener=document.activeElement;
    document.querySelector('.production-summary-preview-modal .mclose')?.focus();
    const escape=event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeRef.current();}};
    document.addEventListener('keydown',escape,true);
    return()=>{document.removeEventListener('keydown',escape,true);if(opener?.isConnected)opener.focus();};
  },[]);
  return h(Modal,{title:'Khối lượng sản xuất',lg:'xl',className:'production-summary-preview-modal',onClose},
    status==='loading'&&h('p',{role:'status'},'Đang tải dữ liệu sản xuất…'),
    status==='error'&&h('div',null,h('p',{role:'alert'},error),h('button',{type:'button',onClick:()=>setAttempt(n=>n+1)},'Thử tải lại')),
    status==='ready'&&h(ProductionSummaryTab,{...summaryProps,currentUser}),
    h('div',{className:'production-preview-close-row'},h('button',{type:'button','data-scf-action':'view',onClick:onClose},'Đóng cửa sổ'))
  );
}
function canViewProductionShiftWeight(user){
  return ['admin','administrator'].includes(String(user?.role||'').trim().toLowerCase())||user?.productionShiftWeight===true;
}
function scfClosingGroupSafe(group){const n=String(group||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();return n==='ca dem'?'night':n==='ca chieu'?'afternoon':'';}
function scfProductionShiftChoices(rules){
  const choices=[{value:'all',label:'Tất cả ca'}],seen=new Set();
  for(const rule of rules){
    const group=normalizeLookupText(rule.group||'');
    const option=group==='ca dem'?{value:'__group_night',label:'Ca đêm',major:true}:group==='ca chieu'?{value:'__group_afternoon',label:'Ca chiều',major:true}:null;
    if(option&&!seen.has(option.value)){choices.push(option);seen.add(option.value);}
    choices.push({value:rule.id,label:rule.name});
  }
  return choices;
}
function scfProductionShiftMatches(row,value){
  if(value==='all')return true;
  if(value==='__group_night'||value==='__group_afternoon')return normalizeLookupText(row.shiftGroup||row.rule?.group||'')===(value==='__group_night'?'ca dem':'ca chieu');
  return row.shift===value;
}
function ProductionShiftFilter({value,rules,onChange}){
  const[open,setOpen]=useState(false),root=React.useRef(null),trigger=React.useRef(null);
  const menuId=React.useRef('production-shift-'+Math.random().toString(36).slice(2));
  const choices=scfProductionShiftChoices(rules),selected=choices.find(choice=>choice.value===value);
  useEffect(()=>{
    if(!open)return;
    const outside=event=>{if(!root.current?.contains(event.target))setOpen(false);};
    const escape=event=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[open]);
  const keyboard=event=>{
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();const options=[...(root.current?.querySelectorAll('[role="option"]')||[])];
    let index=options.indexOf(document.activeElement);
    index=event.key==='Home'?0:event.key==='End'?options.length-1:event.key==='ArrowDown'?(index+1)%options.length:(index-1+options.length)%options.length;
    options[index]?.focus();
  };
  return h('div',{className:'production-shift-picker',ref:root},
    h('button',{ref:trigger,type:'button',className:'production-shift-trigger','data-scf-action':'view','aria-label':'Ca sản xuất','aria-haspopup':'listbox','aria-expanded':open,'aria-controls':menuId.current,onClick:()=>setOpen(previous=>!previous)},h('span',null,selected?.label||'Chưa xác định'),h('i',{className:'ti ti-chevron-down','aria-hidden':true})),
    open&&h('div',{id:menuId.current,role:'listbox','aria-label':'Chọn ca sản xuất',className:'production-shift-options',onKeyDown:keyboard},choices.map(choice=>h('button',{key:choice.value,type:'button',role:'option','data-scf-action':'view','aria-selected':choice.value===value,className:(choice.major?'major ':'')+(choice.value===value?'selected':''),onClick:()=>{onChange(choice.value);setOpen(false);trigger.current?.focus();}},choice.label,choice.value===value&&h('i',{className:'ti ti-check','aria-hidden':true}))))
  );
}
function scfProductionWorkshop(name){
  const value=normalizeLookupText(name);
  if(/\b(bot|gao)\b/.test(value))return 'bot';
  if(value.includes('bun'))return 'bun';
  if(value.includes('pho')||value.includes('banh cuon')||value.includes('b cuon'))return 'banh';
  return 'other';
}
function scfProductionLineWeightKg(line,product={}){
  const qty=numFmt(line.qtyProd)||0;
  if(qty===0)return 0;
  const unit=String(line.unit||product.unit||'').trim().toLowerCase();
  if(['kg','kgs','kilogram','kilograms'].includes(unit))return Number.isFinite(qty)?qty:null;
  const perUnit=numFmt(product.weightPerUnit||line.weightPerUnit)||0;
  const weight=qty*perUnit;
  return perUnit>0&&Number.isFinite(weight)?weight:null;
}
function scfProductionLineCodes(line,product={}){
  const name=line.productName||product.name||'',workshop=scfProductionWorkshop(name);
  const qty=numFmt(line.qtyProd)||0;
  const pack=normalizeLookupText(name).includes('pho')?5:workshop==='bun'||workshop==='banh'?10:0;
  const unit=String(line.unit||product.unit||'').trim().toLowerCase();
  const weight=['kg','kgs','kilogram','kilograms'].includes(unit)?qty:qty*(numFmt(product.weightPerUnit||line.weightPerUnit)||0);
  if(!pack||!(weight>0))return {pack,full:0,remainder:0,unknown:qty>0};
  const full=Math.floor((weight+1e-9)/pack),remainder=Number((weight-full*pack).toFixed(3));
  return {pack,full,remainder,unknown:false};
}
function scfProductionOddText(row){
  return Object.entries(row.oddCodes||{}).sort((a,b)=>Number(b[0])-Number(a[0])).map(([kg,count])=>count+' mã × '+Number(kg).toLocaleString('vi-VN')+' kg').join(' · ')||'Không có mã lẻ';
}
function scfProductionProductGroupRank(row){
  if(row.goods)return 4;
  const name=normalizeLookupText(row.productName).replace(/[^a-z0-9]+/g,' ').trim();
  if(scfProductionWorkshop(name)==='bun')return 0;
  if(/\bpho\b/.test(name))return 1;
  if(/^(banh cuon|b cuon)(\s|$)/.test(name))return 2;
  return 3;
}
function scfProductionProductDisplay(product){
  const pac=/\bpac\b/i.test(product.productName||'');
  const kgUnit=['kg','kgs','kilogram','kilograms'].includes(String(product.unit||'').trim().toLowerCase());
  if(!pac||kgUnit)return {pac:false,qty:product.qtyProd,unit:product.unit,stock:product.stockMetrics?.stock??null,needed:product.stockMetrics?.needed??null};
  const unknown=(product.rows||[]).some(row=>(row.displayUnknownWeightLines??row.unknownWeightLines)>0);
  const weight=(product.rows||[]).reduce((sum,row)=>sum+(row.displayWeightKg??row.weightKg??0),0);
  const factor=unknown?null:product.qtyProd>0?weight/product.qtyProd:0;
  const convert=value=>value===null||value===undefined||factor===null?null:Number((value*factor).toFixed(6));
  return {pac:true,qty:unknown?null:weight,unit:'kg',stock:convert(product.stockMetrics?.stock),needed:convert(product.stockMetrics?.needed)};
}
function scfProductionStockMetrics(product,entry,date,shift,rules=[]){
  const rule=rules.find(r=>r.id===shift);
  const group=shift==='__group_night'?'night':shift==='__group_afternoon'?'afternoon':scfClosingGroupSafe(rule?.group);
  const field=group==='night'?'stockEvening':group==='afternoon'?'stockMorning':null;
  if(!field)return {stock:null,needed:null,label:'Tồn',field:null};
  const snapshot=scfStockOnDate(entry,date);
  const unit=value=>String(value||'').trim().toLowerCase();
  const mismatch=entry?.unit&&product.unit&&unit(entry.unit)!==unit(product.unit);
  const stock=mismatch?null:numFmt(snapshot?.[field]||0);
  return {stock,needed:stock===null?null:Number((numFmt(product.qtyProd)-stock).toFixed(6)),label:field==='stockEvening'?'Tồn 1h':'Tồn 9h',field,mismatch:!!mismatch};
}
function ProductionMobileActualEntry({qty,badQty,onSave,canEdit}){
  const[draft,setDraft]=useState({qty:qty??'',badQty:badQty??''});
  const[dirty,setDirty]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  useEffect(()=>{if(!dirty)setDraft({qty:qty??'',badQty:badQty??''});},[qty,badQty,dirty]);
  const commit=()=>{
    const number=value=>Number(String(value).trim().replace(',','.'));
    const actual=number(draft.qty),bad=draft.badQty===''?0:number(draft.badQty);
    if(String(draft.qty).trim()===''||!Number.isFinite(actual)||!Number.isFinite(bad)||actual<0||bad<0||bad>actual){setError('Nhập SL đạt hợp lệ; hàng lỗi không vượt SL đạt.');return;}
    if(!canEdit)return;
    onSave({qty:actual,badQty:bad});setDirty(false);setSaved(true);setError('');
  };
  return h('div',{className:'production-mobile-entry'},
    h('div',{className:'production-mobile-fields'},...['qty','badQty'].map(field=>h('label',{key:field},field==='qty'?'SL SX đạt':'Hàng lỗi',h('input',{type:'text',inputMode:'decimal',value:draft[field],readOnly:!canEdit,placeholder:'Chưa nhập','aria-label':field==='qty'?'Số lượng sản xuất đạt':'Số lượng hàng lỗi',onChange:event=>{setDraft(previous=>({...previous,[field]:event.target.value}));setDirty(true);setSaved(false);setError('');},onKeyDown:event=>{if(event.key==='Enter')commit();}})))),
    error&&h('div',{role:'alert',className:'production-mobile-error'},error),
    canEdit&&h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:!dirty,onClick:commit},h('i',{className:'ti ti-check'}),' Lưu sản lượng'),
    h('small',{role:'status'},dirty?'Chưa lưu thay đổi':saved?'Đã cập nhật trên máy · Theo dõi trạng thái đồng bộ':qty!==''&&qty!==undefined?'Đã có sản lượng':'Chưa có sản lượng')
  );
}
function scfProductionSummaryPrintHtml(groups,date,scope,readQty,readBad){
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const fmt=value=>Number(value||0).toLocaleString('vi-VN',{maximumFractionDigits:3});
  const body=groups.map(({rule,rows})=>'<h3>'+escape(rule.name)+' · '+escape(rule.start||'')+'–'+escape(rule.end||'')+'</h3><table><thead><tr><th>Sản phẩm</th><th>ĐVT</th><th>SL đặt</th><th>Mã chẵn</th><th>Mã lẻ</th><th>SL đạt</th><th>Hàng lỗi</th></tr></thead><tbody>'+rows.map(row=>'<tr><td>'+escape(row.productName)+'</td><td>'+escape(row.unit)+'</td><td>'+fmt(row.qtyProd)+'</td><td>'+(row.pack?row.fullCodes+' × '+row.pack+' kg':'Chưa có quy cách')+(row.unknownCodes?' · Có dòng chưa có quy cách':'')+'</td><td>'+escape(scfProductionOddText(row))+'</td><td>'+escape(readQty(row.prodDate,row.shift,row.productId))+'</td><td>'+escape(readBad(row.prodDate,row.shift,row.productId))+'</td></tr>').join('')+'</tbody></table><p>Tổng mã chẵn: '+rows.reduce((sum,row)=>sum+row.fullCodes,0)+' · Tổng mã lẻ: '+rows.reduce((sum,row)=>sum+Object.values(row.oddCodes||{}).reduce((a,b)=>a+b,0),0)+'</p>').join('');
  return '<!doctype html><html><head><meta charset="utf-8"><title>Đơn sản xuất tổng</title><style>body{font:13px Arial;margin:16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #555;padding:7px;text-align:left}th{background:#edf4ed}tr{break-inside:avoid}h3{break-after:avoid}@page{size:A4 landscape;margin:10mm}</style></head><body><h2>SCFOOD — ĐƠN SẢN XUẤT TỔNG</h2><p>Ngày SX: '+escape(date)+' · '+escape(scope)+'</p>'+body+'<p>Mã lẻ tính theo từng dòng đơn. Tồn kho chỉ tham khảo, chưa trừ vào SL đặt.</p><p>Người sản xuất: ____________________　 Người kiểm tra: ____________________</p></body></html>';
}
function ProductionSummaryTab({orders,products,prodCats=[],prodShifts,prodShiftRules,prodActuals,setProdActuals,stock,currentUser,onOpenClosing,onClosingWorkshopChange}){
  const[date,setDate]=useState(fmtDate());
  const[shift,setShift]=useState('all');
  const[workshop,setWorkshop]=useState('all');
  const canEditActual=canWrite(currentUser?.role,'prodsummary',currentUser?.permLevels);
  const showShiftWeight=canViewProductionShiftWeight(currentUser);
  const canCheckSource=canEditActual&&['admin','administrator','manager'].includes(String(currentUser?.role||'').toLowerCase());
  const[openOrderRows,setOpenOrderRows]=useState(()=>new Set());
  const toggleOrderRow=key=>setOpenOrderRows(prev=>{const next=new Set(prev);next.has(key)?next.delete(key):next.add(key);return next;});
  const rules=(prodShiftRules&&prodShiftRules.length?prodShiftRules:DEF_PROD_SHIFT_RULES);
  const orderById=new Map((orders||[]).map(order=>[String(order.id),order]));
  const stockByProductId=new Map((stock||[]).map(item=>[String(item.productId),item]));
  const orderLabel=id=>{
    const order=orderById.get(String(id));
    if(!order)return 'Không còn thông tin đơn hàng';
    const fullDate=String(order.deliveryDate||'');
    const dateParts=fullDate.match(/^(\d{1,2})\/(\d{1,2})\/\d{4}$/);
    const shortDate=dateParts?dateParts[1]+'/'+dateParts[2]:(fullDate||'Chưa có ngày');
    return [shortDate,order.pointName||order.address||order.customer||'Chưa có địa điểm',normalizeTimeInput(order.deliveryTime||'')||'Chưa có giờ'].join(' · ');
  };
  const stockFieldForShift=rule=>rule.id==='N_EARLY'?'stockEvening':rule.id==='A_EARLY'?'stockMorning':null;
  const actualKey=(prodDate,shiftId,productId)=>[prodDate||'',shiftId||'',productId||''].join('|');
  const readActualQty=(prodDate,shiftId,productId)=>{
    const rec=(prodActuals||{})[actualKey(prodDate,shiftId,productId)];
    return rec&&rec.qty!==undefined&&rec.qty!==null?numFmt(rec.qty):'';
  };
  const readBadQty=(prodDate,shiftId,productId)=>{
    const rec=(prodActuals||{})[actualKey(prodDate,shiftId,productId)];
    return rec&&rec.badQty!==undefined&&rec.badQty!==null?numFmt(rec.badQty):'';
  };
  const saveActuals=(prodDate,shiftId,productId,productName,data)=>{
    if(!canEditActual){window.showToast('Tài khoản chỉ có quyền xem sản xuất.','warn');return;}
    const key=actualKey(prodDate,shiftId,productId);
    if(typeof scfClosingActualDeadline==='function'&&Date.now()>=scfClosingActualDeadline(key,rules)){window.showToast('Ca đã hết hạn sửa sản xuất.','warn');return;}
    const nextQty=data&&data.qty!==undefined?(data.qty===''?'':numFmt(data.qty)):undefined;
    const nextBadQty=data&&data.badQty!==undefined?(data.badQty===''?'':numFmt(data.badQty)):undefined;
    setProdActuals(prev=>{
      const base=prev||{};
      const next={...base};
      const current=next[key]||{};
      const merged={
        ...current,
        ...(nextQty!==undefined?{qty:nextQty}:{}),
        ...(nextBadQty!==undefined?{badQty:nextBadQty}:{})
      };
      const emptyQty=merged.qty===''||merged.qty===undefined||merged.qty===null;
      const emptyBadQty=merged.badQty===''||merged.badQty===undefined||merged.badQty===null;
      if(emptyQty&&emptyBadQty&&!Object.keys(merged.sourceChecks||{}).length){
        delete next[key];
      }else{
        next[key]={...merged,date:prodDate,shiftId,productId,productName,updatedAt:fmtDT(),updatedBy:currentUser?.name||''};
      }
      return next;
    });
  };
  const sourceControl=(row,id)=>{
    const qty=row.sourceQty?.[String(id)]||0;
    const key=actualKey(row.prodDate,row.shift,row.productId);
    const sourceEditable=canCheckSource&&(typeof scfClosingActualDeadline!=='function'||Date.now()<scfClosingActualDeadline(key,rules));
    const check=prodActuals?.[key]?.sourceChecks?.[String(id)];
    const done=check?.completed===true&&Number(check.orderedQty)===qty;
    const toggle=()=>{
      if(!sourceEditable)return;
      setProdActuals(previous=>{
        const record=previous?.[key]||{},old=record.sourceChecks?.[String(id)];
        const completed=!(old?.completed===true&&Number(old.orderedQty)===qty);
        const event={completed,orderedQty:qty,checkedBy:currentUser?.name||currentUser?.username||'',checkedById:currentUser?.id||'',checkedAt:new Date().toISOString()};
        return{...previous,[key]:{...record,date:row.prodDate,shiftId:row.shift,productId:row.productId,productName:row.productName,sourceChecks:{...record.sourceChecks,[String(id)]:{...event,history:[...(old?.history||[]),event]}}}};
      });
    };
    return h('div',{key:id,className:'production-mobile-source'},
      h('div',{className:'production-source-main'},h('span',null,orderLabel(id)),h('b',null,qty.toLocaleString('vi-VN',{maximumFractionDigits:3})+' '+(row.unit||'')),
        h('button',{type:'button',className:'production-source-check '+(done?'done':'pending'),'data-scf-action':sourceEditable?'write':'view',disabled:!sourceEditable,'aria-label':(done?'Đã sản xuất xong: ':'Chưa sản xuất xong: ')+orderLabel(id),'aria-pressed':done,title:sourceEditable?(done?'Bấm để bỏ xác nhận':'Bấm xác nhận đã sản xuất xong'):'Chỉ quản lý có quyền ghi và ca còn hạn sửa mới được xác nhận',onClick:toggle},done?'✓':'✕')),
      check?.checkedBy&&h('small',{className:'production-source-actor'},(check.completed?'Xác nhận: ':'Bỏ xác nhận: ')+check.checkedBy+' · '+new Date(check.checkedAt).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'})),
      check?.completed&&!done&&h('small',{className:'production-mobile-error'},'Lượng đặt đã đổi · cần xác nhận lại'),
      check?.history?.length>0&&h('details',{className:'production-source-history'},h('summary',null,'Lịch sử ('+check.history.length+')'),check.history.slice().reverse().map((event,index)=>h('small',{key:index},(event.completed?'✓ Xác nhận':'✕ Bỏ xác nhận')+' · '+event.checkedBy+' · '+new Date(event.checkedAt).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'}))))
    );
  };

  // Aggregate from delivery orders
  const dayOrders=orders.filter(o=>o.status!=='cancelled');
  const aggMap={};
  dayOrders.forEach(o=>{
    const plans=prodShiftPlansForOrder(o,prodShifts||[]);
    (o.lines||[]).forEach((l,idx)=>{
      if(!l.productId)return;
      const product=products.find(product=>String(product.id)===String(l.productId))||{};
      const goods=isGoodsProduct(product.id?product:{...l,code:l.productCode||l.code||''},prodCats);
      const plan=plans[idx]||prodShiftPlan(o,prodShifts||[]);
      const prodTime=l.shiftOverride?(l.prodTime||plan?.prodTime||''):(plan?.prodTime||'');
      const prodDate=l.shiftOverride?(l.prodDate||plan?.prodDate||o.deliveryDate):(plan?.prodDate||o.deliveryDate);
      if(prodDate!==date)return;
      const rule=getProdWorkShiftRule(prodTime,rules)||{id:'unknown',name:'Chưa xác định',group:'Chưa xác định',color:'#F1EFE8',textColor:'#5F5E5A'};
      const key=l.productId+'_'+rule.id;
      if(!aggMap[key])aggMap[key]={productId:l.productId,productName:l.productName||products.find(product=>String(product.id)===String(l.productId))?.name||'Chưa xác định',unit:l.unit||products.find(product=>String(product.id)===String(l.productId))?.unit||'',shift:rule.id,shiftName:rule.name,shiftGroup:rule.group,rule,goods,qtyProd:0,orders:[],prodDate:date,fullCodes:0,oddCodes:{},pack:0,unknownCodes:0};
      const codes=scfProductionLineCodes(l,product);
      // Hàng hóa vẫn hiện trong danh sách, nhưng không tính vào tổng kg sản xuất.
      const rawWeightKg=scfProductionLineWeightKg(l,product);
      aggMap[key].displayWeightKg=(aggMap[key].displayWeightKg||0)+(rawWeightKg??0);
      aggMap[key].displayUnknownWeightLines=(aggMap[key].displayUnknownWeightLines||0)+(rawWeightKg===null?1:0);
      const weightKg=goods?0:rawWeightKg;
      aggMap[key].weightKg=(aggMap[key].weightKg||0)+(weightKg===null?0:weightKg);
      aggMap[key].unknownWeightLines=(aggMap[key].unknownWeightLines||0)+(weightKg===null?1:0);
      aggMap[key].fullCodes+=codes.full;aggMap[key].pack=codes.pack;
      if(codes.remainder>0)aggMap[key].oddCodes[codes.remainder]=(aggMap[key].oddCodes[codes.remainder]||0)+1;
      if(codes.unknown)aggMap[key].unknownCodes++;
      aggMap[key].sourceQty=aggMap[key].sourceQty||{};
      aggMap[key].sourceQty[String(o.id)]=(aggMap[key].sourceQty[String(o.id)]||0)+numFmt(l.qtyProd);
      aggMap[key].qtyProd+=numFmt(l.qtyProd);
      aggMap[key].orders.push(o.id);
    });
  });
  // Nhóm thành phẩm cùng loại (gồm PAC), hàng hóa cuối; giữ thứ tự danh mục trong nhóm.
  const prodOrder=Object.fromEntries(products.map((p,i)=>[p.id,i]));
  const sortByProdOrder=(a,b)=>{
    const ai=prodOrder[a.productId]??9999;
    const bi=prodOrder[b.productId]??9999;
    return scfProductionProductGroupRank(a)-scfProductionProductGroupRank(b)||ai-bi;
  };
  const rows=Object.values(aggMap).filter(r=>scfProductionShiftMatches(r,shift)&&(workshop==='all'||scfProductionWorkshop(r.productName)===workshop));
  const unknownRule={id:'unknown',name:'Chưa xác định',group:'Chưa xác định',start:'',end:'',color:'#F1EFE8',textColor:'#5F5E5A'};
  const shiftGroups=[...rules,unknownRule].map(rule=>({rule,rows:rows.filter(r=>r.shift===rule.id).sort(sortByProdOrder)})).filter(g=>g.rows.length);
  const sumActualRows=list=>list.reduce((sum,r)=>sum+numFmt(readActualQty(r.prodDate,r.shift,r.productId)),0);
  const sumBadRows=list=>list.reduce((sum,r)=>sum+numFmt(readBadQty(r.prodDate,r.shift,r.productId)),0);
  const isInvalidActualRow=(prodDate,shiftId,productId)=>numFmt(readBadQty(prodDate,shiftId,productId))>numFmt(readActualQty(prodDate,shiftId,productId));
  const calcBadRate=(actualQty,badQty)=>numFmt(actualQty)>0?(numFmt(badQty)/numFmt(actualQty))*100:0;
  const fmtRate=rate=>((Math.round(numFmt(rate)*10)/10).toLocaleString('vi-VN'))+'%';
  const isBanhCuon=name=>/^(banh cuon|b cuon|banh pho cuon)(\s|$)/.test(normalizeLookupText(name).replace(/[^a-z0-9]+/g,' ').trim());
  const hasInvalidRows=list=>list.some(r=>isInvalidActualRow(r.prodDate,r.shift,r.productId));
  const majorGroupMap={};
  const majorGroupOrder=[];
  shiftGroups.forEach(g=>{
    const gName=g.rule.group||'Chưa xác định';
    const qtyProd=g.rows.reduce((sum,r)=>sum+numFmt(r.qtyProd),0);
    const qtyActual=sumActualRows(g.rows);
    const qtyBad=sumBadRows(g.rows);
    const badRate=calcBadRate(qtyActual,qtyBad);
    const hasInvalid=hasInvalidRows(g.rows);
    if(!majorGroupMap[gName]){
      majorGroupMap[gName]={
        name:gName,
        shifts:[],
        qtyProd:0,
        qtyActual:0,
        qtyBad:0,
        badRate:0,
        hasInvalid:false,
        rowCount:0,
        color:g.rule.color||'#EAF3DE',
        textColor:g.rule.textColor||'var(--pri3)'
      };
      majorGroupOrder.push(gName);
    }
    majorGroupMap[gName].shifts.push({...g,qtyProd,qtyActual,qtyBad,badRate,hasInvalid});
    majorGroupMap[gName].qtyProd+=qtyProd;
    majorGroupMap[gName].qtyActual+=qtyActual;
    majorGroupMap[gName].qtyBad+=qtyBad;
    majorGroupMap[gName].badRate=calcBadRate(majorGroupMap[gName].qtyActual,majorGroupMap[gName].qtyBad);
    majorGroupMap[gName].hasInvalid=majorGroupMap[gName].hasInvalid||hasInvalid;
    majorGroupMap[gName].rowCount+=g.rows.length;
  });
  const majorGroups=majorGroupOrder.map(name=>majorGroupMap[name]).filter(Boolean);

  const workshopLabel=workshop==='bun'?'Xưởng bún':workshop==='banh'?'Xưởng bánh':workshop==='bot'?'Xưởng bột gạo':'Tất cả xưởng';
  const selectedShiftLabel=scfProductionShiftChoices(rules).find(choice=>choice.value===shift)?.label||'Chưa xác định';
  const totalWeightKg=rows.reduce((sum,row)=>sum+(row.weightKg||0),0);
  const unknownWeightLines=rows.reduce((sum,row)=>sum+(row.unknownWeightLines||0),0);
  const mobileProductMap=new Map();
  shiftGroups.forEach(group=>group.rows.forEach(row=>{
    const key=JSON.stringify([String(row.productId),String(row.unit||'').trim().toLowerCase()]);
    if(!mobileProductMap.has(key))mobileProductMap.set(key,{key,productId:row.productId,productName:row.productName,unit:row.unit,goods:row.goods,qtyProd:0,rows:[]});
    const product=mobileProductMap.get(key);product.qtyProd+=row.qtyProd;product.rows.push(row);
  }));
  const mobileProducts=[...mobileProductMap.values()].sort(sortByProdOrder).map(product=>{const item={...product,stockMetrics:scfProductionStockMetrics(product,stockByProductId.get(String(product.productId)),date,shift,rules)};return {...item,display:scfProductionProductDisplay(item)};});
  const familyWeights=[0,1,2].map(rank=>({rank,label:['BÚN','PHỞ','BÁNH CUỐN'][rank],kg:rows.filter(row=>scfProductionProductGroupRank(row)===rank).reduce((sum,row)=>sum+(row.weightKg||0),0)}));
  const stockColumnLabel=mobileProducts.find(p=>p.stockMetrics.field)?.stockMetrics.label||'Tồn';
  const stockQtyText=value=>value===null?'—':Number(value).toLocaleString('vi-VN',{maximumFractionDigits:3});
  const printSummary=()=>{
    if(!rows.length)return;
    const html=scfProductionSummaryPrintHtml(shiftGroups,date,workshopLabel+' · '+selectedShiftLabel,readActualQty,readBadQty);
    if(window.scfShouldUsePrintAgent?.()){
      window.scfQueueA4Print(html,{title:'Đơn sản xuất tổng · '+date+' · '+workshopLabel}).then(()=>window.showToast('Đã gửi đơn sản xuất tổng tới máy in.','success')).catch(error=>window.showToast(error?.message||'Chưa in được đơn sản xuất.','error'));return;
    }
    const popup=window.open('','_blank','width=1100,height=800');
    if(!popup){window.showToast('Cho phép cửa sổ in để in đơn sản xuất tổng.','warn');return;}
    popup.document.write(html);popup.document.close();popup.onload=()=>popup.print();
  };
  return h('div',null,
    h('div',{className:'ptitle production-summary-title'},h('span',null,h('i',{className:'ti ti-clipboard-list',style:{fontSize:20}}),'Tổng hợp sản xuất'),onOpenClosing&&h('button',{type:'button',className:'bp','data-scf-action':'view',onClick:()=>onOpenClosing({workshop:['banh','bot'].includes(workshop)?workshop:'bun'})},'Chốt cuối ca')),
    h('div',{className:'card production-summary-filters',style:{marginBottom:'1.25rem'}},
      h('div',{className:'g3'},
        h(F,{label:'Ngày – ca sản xuất'},h('div',{className:'production-date-shift','aria-label':'Lọc ngày và ca sản xuất'},
        h('input',{type:'date','aria-label':'Ngày sản xuất',value:toIsoDate(date),onChange:e=>setDate(vnDateFromISO(e.target.value)||''),placeholder:'DD/MM/YYYY'}),
        h(ProductionShiftFilter,{value:shift,rules,onChange:setShift}))),
        h(F,{label:'Xưởng sản xuất'},h('div',{className:'production-workshop-print'},h('select',{'aria-label':'Xưởng sản xuất',value:workshop,onChange:event=>{setWorkshop(event.target.value);onClosingWorkshopChange?.(['banh','bot'].includes(event.target.value)?event.target.value:'bun');}},h('option',{value:'all'},'Tất cả xưởng'),h('option',{value:'bun'},'Xưởng bún'),h('option',{value:'banh'},'Xưởng bánh · Phở, bánh cuốn'),h('option',{value:'bot'},'Xưởng bột gạo')),h('button',{type:'button',className:'bp production-mobile-print','data-scf-action':'view','aria-label':'In đơn sản xuất tổng',title:'In đơn sản xuất tổng',disabled:!rows.length,onClick:printSummary},h('i',{className:'ti ti-printer'}))))

      )
    ),
    h('button',{type:'button',className:'bp production-summary-print','data-scf-action':'view',disabled:!rows.length,onClick:printSummary},h('i',{className:'ti ti-printer'}),' In đơn sản xuất tổng'),
    rows.length>0&&h('div',{className:'production-mobile-only production-unified-summary'},
      h('div',{className:'production-mobile-scope'},h('b',null,workshopLabel+' · '+selectedShiftLabel),showShiftWeight&&h('strong',{className:'production-scope-weight','aria-label':unknownWeightLines?'Tổng khối lượng đã quy đổi, còn dòng thiếu quy cách':'Tổng khối lượng quy đổi'},(unknownWeightLines?'Đã quy đổi: ':'Tổng: ')+totalWeightKg.toLocaleString('vi-VN',{maximumFractionDigits:3})+' kg')),
      showShiftWeight&&unknownWeightLines>0&&h('small',{className:'production-weight-warning',role:'status'},unknownWeightLines+' dòng chưa có khối lượng quy đổi. Cần khai báo kg/đơn vị trong danh mục sản phẩm để tính đủ tổng.'),
      showShiftWeight&&h('div',{className:'production-family-weights','aria-label':'Khối lượng theo loại sản phẩm'},...familyWeights.map(family=>h('span',{key:family.rank},family.label+': ',h('b',null,stockQtyText(family.kg)+' kg')))),
      h('div',{className:'production-inventory-columns','aria-hidden':true},h('span',null,'Sản phẩm'),h('b',null,'SL SX'),h('b',null,stockColumnLabel),h('b',null,'Cần SX'),h('span')),
      mobileProducts.map(product=>h('details',{key:date+'|'+shift+'|'+workshop+'|'+product.key,className:'production-mobile-product','data-production-yellow':isBanhCuon(product.productName)?'true':undefined},
        h('summary',{className:'production-product-toggle production-inventory-row'},h('span',null,product.productName,product.display.pac&&h('small',{className:'production-pac-count'},' ('+stockQtyText(product.qtyProd)+' '+(product.unit||'Gói')+')')),h('b',{className:'production-demand-qty','aria-label':'SL SX'},product.display.qty===null?'Chưa quy đổi':stockQtyText(product.display.qty)+' '+(product.display.unit||'')),h('b',{className:'production-stock-qty','aria-label':stockColumnLabel,title:product.stockMetrics.mismatch?'Đơn vị tồn kho khác đơn vị sản phẩm':product.stockMetrics.field?'Tồn kho ngày '+date:'Chọn ca đêm hoặc ca chiều'},stockQtyText(product.display.stock)),h('b',{className:'production-needed-qty','aria-label':'Cần SX',title:'SL SX − Tồn'},stockQtyText(product.display.needed)),h('i',{className:'ti ti-chevron-down','aria-hidden':true})),
        h('div',{className:'production-product-expanded'},product.rows.map(row=>h('details',{key:actualKey(row.prodDate,row.shift,row.productId),className:'production-source-shift'},
          h('summary',{className:'production-shift-toggle '+(scfClosingGroupSafe(row.shiftGroup)==='night'?'night':scfClosingGroupSafe(row.shiftGroup)==='afternoon'?'afternoon':'')},h('span',null,row.shiftName),h('b',null,row.qtyProd.toLocaleString('vi-VN',{maximumFractionDigits:3})+' '+(row.unit||'')),h('i',{className:'ti ti-chevron-down','aria-hidden':true})),
          h('div',{className:'production-shift-sections'},
            h('details',{className:'production-source-section'},h('summary',null,h('span',null,'Nhập sản lượng'),h('i',{className:'ti ti-chevron-down','aria-hidden':true})),h(ProductionMobileActualEntry,{qty:readActualQty(row.prodDate,row.shift,row.productId),badQty:readBadQty(row.prodDate,row.shift,row.productId),canEdit:canEditActual&&(typeof scfClosingActualDeadline!=='function'||Date.now()<scfClosingActualDeadline(actualKey(row.prodDate,row.shift,row.productId),rules)),onSave:data=>saveActuals(row.prodDate,row.shift,row.productId,row.productName,data)})),
            h('details',{className:'production-source-section'},
              h('summary',null,h('span',null,'Xem mã lẻ'),h('i',{className:'ti ti-chevron-down','aria-hidden':true})),
              h('div',{className:'production-code-detail'},
                h('small',null,(row.rule.start||'')+' – '+(row.rule.end||'')),
                stockFieldForShift(row.rule)&&h('small',null,'Tồn tham khảo '+(stockFieldForShift(row.rule)==='stockEvening'?'1h':'9h')+': '+numFmt(scfStockOnDate(stockByProductId.get(String(row.productId)),row.prodDate||date)?.[stockFieldForShift(row.rule)]||0).toLocaleString('vi-VN')+' '+(row.unit||'')),
                h('div',{className:'production-mobile-code-grid'},h('div',null,'Mã chẵn',h('strong',null,row.fullCodes+' mã'),h('small',null,row.pack?row.pack+' kg / mã':'Chưa có quy cách')),h('div',null,'Mã lẻ',h('strong',null,Object.values(row.oddCodes).reduce((a,b)=>a+b,0)+' mã'))),
                h('div',{className:'production-source-odd'},scfProductionOddText(row)),
                row.unknownCodes>0&&h('div',{className:'production-mobile-error'},row.unknownCodes+' dòng chưa có quy cách/khối lượng, chưa tính mã.')
              )
            ),
            h('details',{className:'production-source-section'},
              h('summary',null,h('span',null,'Xem nguồn đơn ('+[...new Set(row.orders)].length+')'),h('i',{className:'ti ti-chevron-down','aria-hidden':true})),
              h('small',{className:'production-source-quantities'},(()=>{const confirmed=Object.entries(row.sourceQty||{}).reduce((sum,[id,qty])=>{const check=prodActuals?.[actualKey(row.prodDate,row.shift,row.productId)]?.sourceChecks?.[id];return sum+(check?.completed===true&&Math.abs(Number(check.orderedQty)-qty)<1e-8?qty:0);},0);return 'Đã SX theo đơn: '+confirmed.toLocaleString('vi-VN')+' '+row.unit+' · Còn thiếu: '+Math.max(0,row.qtyProd-confirmed).toLocaleString('vi-VN')+' '+row.unit;})()),
              [...new Set(row.orders)].map(id=>sourceControl(row,id))
            )
          )
        )))
      )),
      h('small',{className:'production-mobile-footnote'},'Cần SX = SL SX − Tồn, cùng đơn vị sản phẩm. Ca đêm lấy tồn 1h; ca chiều lấy tồn 9h cùng ngày. Chọn ca để xem tồn; Tất cả ca không cộng hai mốc tồn. Mã lẻ tính từng dòng đơn.')
    ),
    rows.length===0?h('div',{style:{textAlign:'center',padding:'3rem',color:'var(--tx2)',background:'#fff',borderRadius:'var(--rl)',border:'.5px solid var(--bd)'}},
      h('i',{className:'ti ti-clipboard-x',style:{fontSize:56,display:'block',marginBottom:'1rem',color:'var(--pri2)'}}),
      'Không có dữ liệu sản xuất cho ngày '+date
    ):h('div',{className:'production-desktop-only production-summary-legacy'},
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem',marginBottom:'1.25rem'}},
        majorGroups.map(g=>h('div',{key:'sum_'+g.name,className:'card',style:{padding:'1rem',border:`1px solid ${g.hasInvalid?'#FCA5A5':g.color}`,boxShadow:'none',background:'linear-gradient(180deg,#fff,rgba(255,255,255,.96))'}},
          h('div',{style:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}},
            h('div',null,
              h('div',{style:{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:g.textColor}},g.name),
              h('div',{style:{fontSize:12,color:g.hasInvalid?'#B91C1C':'var(--tx2)',marginTop:4}},g.hasInvalid?'Có dòng nhập lỗi cần kiểm tra':g.shifts.length+' ca nhỏ · '+g.rowCount+' dòng')
            ),
            h('div',{style:{padding:'4px 10px',borderRadius:999,background:g.color,color:g.textColor,fontSize:12,fontWeight:600}},g.shifts.map(s=>s.rule.name.replace((g.name||'')+' ','')).join(' • '))
          ),
          h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginTop:'1rem'}},
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'var(--bg)'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng SL đặt'),
              h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri3)'}},g.qtyProd.toLocaleString())
            ),
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'#F8FBF9'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng SL SX ĐẠT'),
              h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},g.qtyActual.toLocaleString())
            ),
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'#FFF7ED'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng hàng lỗi'),
              h('div',{style:{fontSize:24,fontWeight:700,color:'#C2410C'}},g.qtyBad.toLocaleString())
            ),
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'#EFF6FF'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tỷ lệ lỗi'),
              h('div',{style:{fontSize:24,fontWeight:700,color:g.hasInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(g.badRate))
            )
          )
        ))
      ),
      h('div',{style:{display:'grid',gap:'1.25rem'}},
        majorGroups.map(g=>h('div',{key:g.name,className:'card',style:{padding:'1rem',overflow:'hidden'}},
          h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:'1rem'}},
            h('div',{style:{display:'flex',alignItems:'center',gap:10}},
              h('div',{style:{width:14,height:14,borderRadius:'50%',background:g.textColor}}),
              h('div',null,
                h('div',{style:{fontSize:22,fontWeight:700,color:'var(--pri3)',lineHeight:1.1}},g.name),
                h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:4}},'Gồm '+g.shifts.length+' ca nhỏ')
              )
            ),
            h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'var(--bg)',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL đặt ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri3)'}},g.qtyProd.toLocaleString())
              ),
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'#F8FBF9',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL SX ĐẠT ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri)'}},g.qtyActual.toLocaleString())
              ),
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'#FFF7ED',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Hàng lỗi ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:'#C2410C'}},g.qtyBad.toLocaleString())
              ),
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'#EFF6FF',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Tỷ lệ lỗi ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:g.hasInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(g.badRate))
              )
            )
          ),
          h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1rem'}},
            g.shifts.map(({rule,rows:groupRows,qtyProd,qtyActual,qtyBad,badRate,hasInvalid})=>h('div',{key:rule.id,style:{border:`1px solid ${hasInvalid?'#FCA5A5':(rule.color||'var(--bd)')}`,borderRadius:'var(--rl)',overflow:'hidden',background:'#fff'}},
              h('div',{style:{padding:'12px 14px',background:rule.color||'#F8FBF9',borderBottom:'.5px solid var(--bd)'}},
                h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,flexWrap:'wrap'}},
                  h('div',null,
                    h('div',{style:{fontSize:20,fontWeight:700,color:rule.textColor||'var(--pri3)',lineHeight:1.1}},rule.name),
                    h('div',{style:{fontSize:12,color:hasInvalid?'#B91C1C':'var(--tx2)',marginTop:4}},hasInvalid?'SL lỗi đang lớn hơn SL SX ở một số dòng':((rule.start&&rule.end?rule.start+' - '+rule.end+' · ':'')+groupRows.length+' sản phẩm'))
                  ),
                  h('div',{style:{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'flex-end',marginLeft:'auto'}},
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'rgba(255,255,255,.75)',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL đặt'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri3)'}},qtyProd.toLocaleString())
                    ),
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'rgba(255,255,255,.75)',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL SX ĐẠT'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri)'}},qtyActual.toLocaleString())
                    ),
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'#FFF7ED',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Hàng lỗi'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:'#C2410C'}},qtyBad.toLocaleString())
                    ),
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'#EFF6FF',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Tỷ lệ lỗi'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:hasInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(badRate))
                    )
                  )
                )
              ),
              h('div',{className:'tw production-summary-table'},
                h('table',null,
                  h('thead',null,h('tr',null,...['Sản phẩm','ĐVT','SL Đặt',...(stockFieldForShift(rule)?[stockFieldForShift(rule)==='stockEvening'?'Tồn 1h':'Tồn 9h']:[]),'SL SX ĐẠT','SL hàng lỗi','Tỷ lệ lỗi','Đơn hàng'].map(c=>h('th',{key:c,title:c.startsWith('Tồn ')?'Số tồn theo ngày sản xuất trong mục Tồn kho':undefined},c)))),
                  h('tbody',null,groupRows.map((r,i)=>{
                    const rowInvalid=isInvalidActualRow(r.prodDate,r.shift,r.productId);
                    const rowActualQty=numFmt(readActualQty(r.prodDate,r.shift,r.productId));
                    const rowBadQty=numFmt(readBadQty(r.prodDate,r.shift,r.productId));
                    const rowBadRate=calcBadRate(rowActualQty,rowBadQty);
                    const orderRowKey=[r.prodDate,r.shift,r.productId].join('|');
                    const orderIds=[...new Set(r.orders||[])];
                    const ordersOpen=openOrderRows.has(orderRowKey);
                    return h('tr',{key:i,className:rowInvalid?'production-summary-invalid':isBanhCuon(r.productName)?'production-summary-banh-cuon':undefined},
                    h('td',null,h('div',{style:{fontWeight:500}},r.productName)),
                    h('td',null,h('span',{className:'badge',style:{background:rule.color||'#EAF3DE',color:rule.textColor||'#3B6D11'}},r.unit)),
                    h('td',null,h('span',{style:{fontSize:16,fontWeight:600,color:'var(--pri)'}},r.qtyProd.toLocaleString())),
                    stockFieldForShift(rule)&&h('td',{className:'production-summary-stock',title:'Số tồn theo ngày sản xuất trong mục Tồn kho'},numFmt(scfStockOnDate(stockByProductId.get(String(r.productId)),r.prodDate||date)?.[stockFieldForShift(rule)]||0).toLocaleString('vi-VN')),
                    h('td',null,h('input',{
                      type:'number',
                      min:0,
                      step:'0.01',
                      value:readActualQty(r.prodDate,r.shift,r.productId),
                      onChange:e=>saveActuals(r.prodDate,r.shift,r.productId,r.productName,{qty:e.target.value}),
                      placeholder:'Nhập SL SX ĐẠT',
                      style:{width:110,fontSize:13,padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',textAlign:'right'}
                    })),
                    h('td',null,h('input',{
                      type:'number',
                      min:0,
                      step:'0.01',
                      value:readBadQty(r.prodDate,r.shift,r.productId),
                      onChange:e=>saveActuals(r.prodDate,r.shift,r.productId,r.productName,{badQty:e.target.value}),
                      placeholder:'Nhập SL lỗi',
                      style:{width:110,fontSize:13,padding:'5px 8px',borderRadius:'var(--r)',border:rowInvalid?'1px solid #DC2626':'1px solid #FDBA74',textAlign:'right',background:rowInvalid?'#FEF2F2':'#FFF7ED',color:rowInvalid?'#B91C1C':'inherit'}
                    })),
                    h('td',null,h('div',{style:{fontSize:16,fontWeight:700,color:rowInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(rowBadRate))),
                    h('td',null,
                      h('button',{
                        type:'button',
                        onClick:()=>toggleOrderRow(orderRowKey),
                        'aria-expanded':ordersOpen,
                        title:ordersOpen?'Ẩn danh sách đơn hàng':'Xem danh sách đơn hàng',
                        style:{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 8px',border:'1px solid var(--bd)',borderRadius:'var(--r)',background:ordersOpen?'var(--bg2)':'#fff',color:'var(--pri)',fontSize:11,fontWeight:600,whiteSpace:'nowrap',cursor:'pointer'}
                      },h('i',{className:'ti '+(ordersOpen?'ti-eye-off':'ti-eye'),style:{fontSize:13}}),(ordersOpen?'Ẩn':'Xem')+' ('+orderIds.length+')'),
                      ordersOpen&&h('div',{className:'production-summary-orders'},
                        orderIds.map(id=>sourceControl(r,id))
                      )
                    )
                  )}))
                )
              )
            ))
          )
        ))
      )
    )
  );
}

/* ─── Đơn sản xuất ─── */
function ProdOrderForm({po,products,currentUser,onSave,onClose}){
  const[f,sf]=useState(po?{...po}:{shift:'day',date:fmtDate(),status:'planning',note:'',lines:[]});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const addLine=()=>sf(p=>({...p,lines:[...p.lines,{id:uid(),productId:'',productName:'',unit:'',qtyRequired:0,qtyProduced:0,note:''}]}));
  const updLine=(id,data)=>sf(p=>({...p,lines:p.lines.map(l=>l.id===id?data:l)}));
  const delLine=id=>sf(p=>({...p,lines:p.lines.filter(l=>l.id!==id)}));
  const submit=()=>{
    if(f.lines.length===0){window.showToast('Thêm ít nhất 1 sản phẩm cần sản xuất!','warn');return;}
    onSave({...f,updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:po?'Sửa đơn sản xuất':'Tạo đơn sản xuất',onClose},
    h('div',{className:'g3'},
      h(F,{label:'Ngày sản xuất'},h('input',{value:f.date,onChange:e=>s('date',e.target.value),placeholder:'DD/MM/YYYY'})),
      h(F,{label:'Ca sản xuất'},h('select',{value:f.shift,onChange:e=>s('shift',e.target.value)},
        h('option',{value:'day'},'☀️ Ca sáng'),
        h('option',{value:'night'},'🌙 Ca đêm')
      )),
      h(F,{label:'Trạng thái'},h('select',{value:f.status,onChange:e=>s('status',e.target.value)},
        [['planning','Lên kế hoạch'],['in_progress','Đang sản xuất'],['done','Hoàn thành'],['cancelled','Hủy']].map(([v,l])=>h('option',{key:v,value:v},l))
      )),
    ),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),
    h('div',{className:'divider'}),
    h('div',{style:{fontWeight:500,fontSize:13,color:'var(--pri3)',marginBottom:8}},'Danh sách sản phẩm cần sản xuất'),
    h('div',{style:{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:6,marginBottom:4}},
      ['Sản phẩm','ĐVT','SL cần SX','SL đã SX',''].map(c=>h('span',{key:c,style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},c))
    ),
    f.lines.map(l=>h('div',{key:l.id,style:{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:6,marginBottom:6,alignItems:'center'}},
      h('select',{value:l.productId,onChange:e=>{const p=products.find(x=>x.id===e.target.value)||{};updLine(l.id,{...l,productId:e.target.value,productName:p.name||'',unit:p.unit||''});},style:{fontSize:13}},
        h('option',{value:''},'— Chọn SP —'),products.map(p=>h('option',{key:p.id,value:p.id},p.name))
      ),
      h('input',{value:l.unit,readOnly:true,style:{fontSize:13,background:'var(--bg2)',cursor:'default'}}),
      h('input',{type:'number',min:0,value:l.qtyRequired,onChange:e=>updLine(l.id,{...l,qtyRequired:numFmt(e.target.value)}),style:{fontSize:13}}),
      h('input',{type:'number',min:0,value:l.qtyProduced,onChange:e=>updLine(l.id,{...l,qtyProduced:numFmt(e.target.value)}),style:{fontSize:13,borderColor:numFmt(l.qtyProduced)>=numFmt(l.qtyRequired)&&numFmt(l.qtyRequired)>0?'#52b788':''}}),
      h('button',{className:'bi',onClick:()=>delLine(l.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:14}}))
    )),
    h('button',{onClick:addLine,style:{fontSize:12,padding:'5px 12px',marginBottom:8}},h('i',{className:'ti ti-plus',style:{fontSize:13,marginRight:4}}),'Thêm sản phẩm'),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu đơn SX'))
  );
}
function ProdOrdersTab({prodOrders,setProdOrders,orders,products,employees,prodShifts,prodShiftRules,currentUser}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[filter,sf]=useState('all');const[q,sq]=useState('');
  const[showLegacy,setShowLegacy]=useState(false);
  const legacyOrders=prodOrders.filter(item=>item.kind!=='workshop_assignment');
  let pSeq=legacyOrders.length+1;
  const save=d=>{if(edit)setProdOrders(p=>p.map(x=>x.id===edit.id?d:x));else{const id='SX'+String(pSeq++).toString().padStart(4,'0');setProdOrders(p=>[...p,{...d,id,createdBy:currentUser.name,createdAt:fmtDT()}]);}sm(null);se(null);};
  const del=id=>window.scfConfirm('Bạn có chắc muốn xóa đơn sản xuất này?','Xóa đơn sản xuất',true).then(ok=>ok&&setProdOrders(p=>p.filter(x=>x.id!==id)));
  const sts=[['all','Tất cả'],['planning','Kế hoạch'],['in_progress','Đang SX'],['done','Hoàn thành']];
  const list=legacyOrders.filter(x=>(filter==='all'||x.status===filter)&&(!q||x.id.toLowerCase().includes(q.toLowerCase())||x.date.includes(q)));
  const statusMap={planning:['#E6F1FB','#185FA5','Kế hoạch'],in_progress:['#FAEEDA','#854F0B','Đang SX'],done:['#EAF3DE','#3B6D11','Hoàn thành'],cancelled:['#FCEBEB','#A32D2D','Hủy']};
  return h('div',null,
    h(WorkshopAssignmentsTab,{prodOrders,setProdOrders,orders,products,employees,prodShifts,prodShiftRules,currentUser}),
    h('button',{type:'button',onClick:()=>setShowLegacy(value=>!value),style:{margin:'16px 0'}},showLegacy?'Ẩn đơn sản xuất cũ':'Xem đơn sản xuất cũ ('+legacyOrders.length+')'),
    showLegacy&&h(React.Fragment,null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-building-factory',style:{fontSize:20}}),'Đơn sản xuất'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{display:'flex',gap:5,flexWrap:'wrap'}},sts.map(([v,l])=>h('button',{key:v,className:'pill'+(filter===v?' on':''),onClick:()=>sf(v)},l+' ('+(v==='all'?legacyOrders.length:legacyOrders.filter(x=>x.status===v).length)+')'))),
      h('div',{style:{display:'flex',gap:6}},
        h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm đơn SX...'}),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Tạo đơn SX'})
      )
    ),
    list.length?h('div',{style:{display:'flex',flexDirection:'column',gap:'1rem'}},
      list.map(po=>{
        const [bg,tx,label]=statusMap[po.status]||['#F1EFE8','#5F5E5A',po.status];
        const done=po.lines?po.lines.filter(l=>numFmt(l.qtyProduced)>=numFmt(l.qtyRequired)&&numFmt(l.qtyRequired)>0).length:0;
        const total=po.lines?po.lines.length:0;
        return h('div',{key:po.id,className:'card'},
          h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}},
            h('div',null,
              h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:4}},
                h('span',{style:{fontWeight:600,fontSize:15,color:'var(--pri3)'}},po.id),
                h('span',{className:'badge',style:{background:po.shift==='day'?'#FFF9C4':'#EDE9FE',color:po.shift==='day'?'#854F0B':'#5B21B6'}},(po.shift==='day'?'☀️ Ca sáng':'🌙 Ca đêm')),
                h('span',{className:'badge',style:{background:bg,color:tx}},label)
              ),
              h('div',{style:{fontSize:12,color:'var(--tx2)',display:'flex',gap:12}},
                h('span',null,h('i',{className:'ti ti-calendar',style:{fontSize:12,marginRight:3}}),po.date),
                h('span',null,h('i',{className:'ti ti-list-check',style:{fontSize:12,marginRight:3}}),done+'/'+total+' SP hoàn thành'),
                po.updatedBy&&h('span',null,h('i',{className:'ti ti-user',style:{fontSize:12,marginRight:3}}),po.updatedBy)
              )
            ),
            h('div',{style:{display:'flex',gap:4}},
              h('button',{className:'bi',onClick:()=>{se(po);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              h('button',{className:'bi',onClick:()=>del(po.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            )
          ),
          po.lines&&po.lines.length>0&&h('div',{className:'tw'},
            h('table',null,
              h('thead',null,h('tr',null,...['Sản phẩm','Đơn vị','SL cần SX','SL đã SX','Tiến độ'].map(c=>h('th',{key:c},c)))),
              h('tbody',null,po.lines.map(l=>{
                const pct=numFmt(l.qtyRequired)>0?Math.min(100,Math.round(numFmt(l.qtyProduced)/numFmt(l.qtyRequired)*100)):0;
                const done2=numFmt(l.qtyProduced)>=numFmt(l.qtyRequired)&&numFmt(l.qtyRequired)>0;
                return h('tr',{key:l.id,style:{background:done2?'rgba(82,183,136,.05)':''}},
                  h('td',null,h('div',{style:{fontWeight:500}},l.productName||'—')),
                  h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},l.unit||'—')),
                  h('td',null,h('span',{style:{fontWeight:500}},numFmt(l.qtyRequired).toLocaleString())),
                  h('td',null,h('span',{style:{fontWeight:600,color:done2?'var(--pri)':'var(--tx)'}},numFmt(l.qtyProduced).toLocaleString())),
                  h('td',null,
                    h('div',{style:{display:'flex',alignItems:'center',gap:8}},
                      h('div',{style:{flex:1,height:6,background:'var(--bg2)',borderRadius:3,overflow:'hidden'}},
                        h('div',{style:{height:'100%',width:pct+'%',background:done2?'var(--pri)':'#f8c30f',borderRadius:3,transition:'width .3s'}})
                      ),
                      h('span',{style:{fontSize:12,fontWeight:500,color:done2?'var(--pri)':'var(--tx2)',minWidth:35}},pct+'%')
                    )
                  )
                );
              }))
            )
          ),
          po.note&&h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:'1rem',padding:'6px 10px',background:'var(--bg2)',borderRadius:4}},'📝 '+po.note)
        );
      })
    ):h('div',{style:{textAlign:'center',padding:'3rem',color:'var(--tx2)',background:'#fff',borderRadius:'var(--rl)',border:'.5px solid var(--bd)'}},
      h('i',{className:'ti ti-building-factory',style:{fontSize:56,display:'block',marginBottom:'1rem',color:'var(--pri2)'}}),
      'Chưa có đơn sản xuất nào.'
    ),
    modal==='f'&&h(ProdOrderForm,{po:edit,products,currentUser,onSave:save,onClose:()=>{sm(null);se(null);}})
    )
  );
}

/* ─── Tồn kho ─── */
function StockForm({entry,currentUser,onSave,onClose}){
    const[f,sf]=useState(entry?{...entry}:{stockMorning:0,stockEvening:0,note:''});
    const submit=()=>{onSave({...entry,...f,stockMorning:numFmt(f.stockMorning||0),stockEvening:numFmt(f.stockEvening||0),updatedBy:currentUser?.name||'',updatedAt:fmtDT()});};
    return h(Modal,{title:'Cập nhật tồn kho — '+entry.productName,onClose},
      h('div',{style:{background:'var(--bg2)',padding:'10px 14px',borderRadius:'var(--r)',marginBottom:'1rem',fontSize:13}},
        h('div',{style:{fontWeight:500}},entry.productName),
        h('div',{style:{color:'var(--tx2)',fontSize:12}},entry.unit)
      ),
      h('div',{className:'g2'},
        h(F,{label:'Tồn kho 9h sáng'},h('input',{type:'number',min:0,value:f.stockMorning,onChange:e=>sf(p=>({...p,stockMorning:numFmt(e.target.value)}))})),
        h(F,{label:'Tồn kho 1h đêm'},h('input',{type:'number',min:0,value:f.stockEvening,onChange:e=>sf(p=>({...p,stockEvening:numFmt(e.target.value)}))})),
      ),
      h(F,{label:'Ghi chú'},h('input',{value:f.note||'',onChange:e=>sf(p=>({...p,note:e.target.value}))})),
      h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Cập nhật tồn kho'))
    );
  }
function scfStockDateKey(value){
  let text=String(value||'').trim();
  if(typeof value==='number'&&Number.isFinite(value))text=new Date(Date.UTC(1899,11,30)+Math.floor(value)*86400000).toISOString().slice(0,10);
  const slash=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(slash)text=slash[3]+'-'+slash[2].padStart(2,'0')+'-'+slash[1].padStart(2,'0');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return '';
  const date=new Date(text+'T00:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===text?text:'';
}
function scfStockOnDate(entry,date){
  if(!entry)return {};
  const key=scfStockDateKey(date);
  if(!key)return entry.undatedStock||(!entry.stockDate?entry:{});
  return entry.dailyStock?.[key]||(scfStockDateKey(entry.stockDate)===key?entry:{});
}
function applyStockQuickEdits(stock,rows,drafts,actor,stamp,date=''){
  const dateKey=scfStockDateKey(date);
  if(date&&!dateKey)throw new Error('Ngày tồn kho không hợp lệ.');
  const map=new Map((stock||[]).map(item=>[String(item.productId),item]));
  rows.forEach(row=>{
    const draft=drafts[row.productId];if(!draft)return;
    const current=map.get(String(row.productId))||{};
    const saved=dateKey?scfStockOnDate(current,dateKey):current;
    const next={...saved,productId:row.productId,productName:row.productName,unit:row.unit,updatedBy:actor,updatedAt:stamp};
    for(const field of ['stockMorning','stockEvening']){
      if(Object.prototype.hasOwnProperty.call(draft,field)){
        const raw=String(draft[field]).trim().replace(',','.');
        if(raw!==''&&!/^\d+(?:\.\d*)?$/.test(raw))throw new Error('Số tồn phải là số không âm.');
        const value=raw===''?0:Number(raw);
        if(!Number.isFinite(value))throw new Error('Số tồn không hợp lệ.');
        next[field]=value;
      }else next[field]=saved[field]??0;
    }
    if(dateKey){
      const dailyStock={...(current.dailyStock||{}),[dateKey]:next};
      const undatedStock=current.undatedStock||(!current.stockDate&&(current.stockMorning!==undefined||current.stockEvening!==undefined)?{stockMorning:current.stockMorning,stockEvening:current.stockEvening,updatedAt:current.updatedAt,updatedBy:current.updatedBy,note:current.note}:undefined);
      const latest=Object.keys(dailyStock).sort().pop();
      map.set(String(row.productId),{...current,...dailyStock[latest],stockDate:latest,dailyStock,...(undatedStock?{undatedStock}:{})});
    }else map.set(String(row.productId),next);
  });
  return [...map.values()];
}
function StockTab({stock,setStock,products,prodCats,currentUser}){
  const[q,sq]=useState('');
  const[stockType,setStockType]=useState('finished');
  const[goodsGroup,setGoodsGroup]=useState('all');
  const[draftsByDate,setDraftsByDate]=useState({});
  const[stockDate,setStockDate]=useState(()=>scfStockDateKey(fmtDate()));
  const[showUndated,setShowUndated]=useState(false);
  const quickEdits=showUndated?{}:draftsByDate[stockDate]||{};
  const setQuickEdits=update=>setDraftsByDate(prev=>({...prev,[stockDate]:typeof update==='function'?update(prev[stockDate]||{}):update}));
  const canEdit=!showUndated&&canWrite(currentUser?.role,'stock',currentUser?.permLevels);

  // Ensure all products have a stock entry
  const stockMap={};(stock||[]).forEach(s=>{stockMap[s.productId]=scfStockOnDate(s,showUndated?'':stockDate);});
  const hasUndated=(stock||[]).some(s=>s.undatedStock||(!s.stockDate&&(s.stockMorning!==undefined||s.stockEvening!==undefined)));



  const exportCols=[['stockDate','Ngày tồn kho'],['stockTypeName','Loại'],['goodsGroup','Nhóm hàng hóa'],['productId','Mã SP'],['productName','Tên SP'],['unit','ĐVT'],['stockEvening','Tồn 1h đêm'],['stockMorning','Tồn 9h sáng'],['updatedBy','Người cập nhật'],['updatedAt','Thời gian']];
  const allStockRows=(products||[]).map(p=>{
    const saved=stockMap[p.id]||{};
    const goods=isGoodsProduct(p,prodCats||[]);
    return {...saved,stockDate:showUndated?'':stockDate,productId:p.id,productCode:p.code||'',productName:p.name,unit:p.unit||'',goodsGroup:goods?String(p.goodsGroup||'').trim():'',stockType:goods?'goods':'finished',stockTypeName:goods?'Hàng hóa':'Thành phẩm',stockMorning:numFmt(saved.stockMorning||0),stockEvening:numFmt(saved.stockEvening||0),updatedBy:saved.updatedBy||'',updatedAt:saved.updatedAt||''};
  });
  const goodsGroups=[...new Set(allStockRows.filter(x=>x.stockType==='goods').map(x=>x.goodsGroup).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi',{numeric:true}));
  const typeRows=allStockRows.filter(x=>x.stockType===stockType);
  const filtered=typeRows.filter(x=>(stockType!=='goods'||goodsGroup==='all'||(goodsGroup==='__ungrouped__'?!x.goodsGroup:x.goodsGroup===goodsGroup))&&(!q||String(x.productName||'').toLowerCase().includes(q.toLowerCase())||String(x.productCode||'').toLowerCase().includes(q.toLowerCase())));
  const finishedCount=allStockRows.filter(x=>x.stockType==='finished').length;
  const goodsCount=allStockRows.length-finishedCount;
  const quickValue=(row,field)=>Object.prototype.hasOwnProperty.call(quickEdits[row.productId]||{},field)?quickEdits[row.productId][field]:row[field]||0;
  const changeQuick=(row,field,value)=>{
    if(!canEdit||!/^\d*(?:[.,]\d*)?$/.test(value))return;
    setQuickEdits(prev=>({...prev,[row.productId]:{...(prev[row.productId]||{}),[field]:value}}));
  };
  const pendingCount=allStockRows.filter(row=>quickEdits[row.productId]).length;
  const stockInput=(row,field,label)=>h('input',{type:'text',inputMode:'decimal','aria-label':label+' — '+row.productName,readOnly:!canEdit,value:quickValue(row,field),onChange:e=>changeQuick(row,field,e.target.value),onFocus:e=>e.target.select(),className:'stock-quick-input'});
  const saveQuick=()=>{
    if(!canEdit)return;
    const changed=allStockRows.filter(row=>quickEdits[row.productId]);
    if(!changed.length){window.showToast('Chưa có số tồn kho nào được thay đổi','warning');return;}
    const now=fmtDT();
    try{applyStockQuickEdits(stock,changed,quickEdits,currentUser?.name||'',now,stockDate);}catch(error){window.showToast(error.message,'warn');return;}
    setStock(prev=>applyStockQuickEdits(prev,changed,quickEdits,currentUser?.name||'',now,stockDate));
    setQuickEdits(prev=>{const next={...prev};changed.forEach(row=>delete next[row.productId]);return next;});
    window.showToast('Đã cập nhật '+changed.length+' sản phẩm. Xem trạng thái đồng bộ ở đầu màn hình.','success');
  };

  return h('div',{className:'stock-page'},
    h('div',{className:'ptitle'},h('i',{className:'ti ti-package',style:{fontSize:20}}),'Quản lý tồn kho'),
    h('div',{className:'stock-date-toolbar',style:{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:'1rem'}},
      h('label',null,'Ngày tồn kho ',h('input',{type:'date','aria-label':'Ngày tồn kho',value:stockDate,onChange:e=>{if(scfStockDateKey(e.target.value)){setStockDate(e.target.value);setShowUndated(false);}},style:{width:170,marginLeft:8}})),
      h('button',{type:'button',onClick:()=>{setStockDate(scfStockDateKey(fmtDate()));setShowUndated(false);}},'Hôm nay'),
      hasUndated&&h('button',{type:'button',onClick:()=>setShowUndated(v=>!v)},showUndated?'Trở lại ngày đã chọn':'Xem số tồn cũ chưa có ngày'),
      showUndated&&h('span',{role:'status'},'Dữ liệu cũ chưa xác định ngày · Chỉ xem'),
      !showUndated&&h('small',null,'Số tồn được lưu riêng cho từng ngày. Nháp được giữ khi đổi ngày.')
    ),
    h('div',{style:{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap'}},
      h('button',{className:'pill'+(stockType==='finished'?' on':''),onClick:()=>{setStockType('finished');setGoodsGroup('all');}},'Thành phẩm ('+finishedCount+')'),
      h('button',{className:'pill'+(stockType==='goods'?' on':''),onClick:()=>setStockType('goods')},'Hàng hóa ('+goodsCount+')')
    ),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:stockType==='goods'?'Tìm hàng hóa...':'Tìm thành phẩm...'}),
      h('div',{style:{display:'flex',gap:6}},
        h(ExportBtn,{onClick:()=>xlsxExport(allStockRows,exportCols,'Ton_kho')}),
        canEdit&&h(ImportBtn,{onFile:rows=>{
          try{
            const groups=new Map();
            rows.forEach(r=>{const id=String(r['Mã SP']||'').trim();if(!id)return;const rawDate=r['Ngày tồn kho'];const day=rawDate===undefined||rawDate===null||String(rawDate).trim()===''?stockDate:scfStockDateKey(rawDate);if(!day)throw new Error('Ngày tồn kho không hợp lệ trong file Excel.');const group=groups.get(day)||{rows:[],drafts:{}};group.rows.push({productId:id,productName:r['Tên SP']||'',unit:r['ĐVT']||''});group.drafts[id]={stockEvening:r['Tồn 1h đêm']??'',stockMorning:r['Tồn 9h sáng']??''};groups.set(day,group);});
            const now=fmtDT(),apply=prev=>{let next=prev;groups.forEach((g,day)=>{next=applyStockQuickEdits(next,g.rows,g.drafts,currentUser?.name||'',now,day);});return next;};
            apply(stock);setStock(apply);
            window.showToast('Đã nhập tồn kho theo ngày trong file; dòng thiếu ngày dùng ngày đang chọn.','success');
          }catch(error){window.showToast(error.message,'warn');}
        }})
      )
    ),
    h('div',{style:{background:'#E6F1FB',border:'.5px solid #93c5fd',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:'1rem',fontSize:12,color:'#185FA5'}},
      h('i',{className:'ti ti-info-circle',style:{fontSize:13,marginRight:6}}),
      'Tồn kho được cập nhật 2 lần/ngày: lúc ',h('b',null,'1:00 đêm'),' và ',h('b',null,'9:00 sáng'),'. Số tồn chưa nhập mặc định là ',h('b',null,'0'),'.'
    ),
    stockType==='goods'&&h('div',{style:{display:'flex',alignItems:'end',justifyContent:'space-between',gap:10,flexWrap:'wrap',padding:'12px 14px',marginBottom:'1rem',background:'var(--bg2)',border:'.5px solid var(--bd)',borderRadius:'var(--r)'}},
      h(F,{label:'Nhóm hàng hóa'},h('select',{value:goodsGroup,onChange:e=>setGoodsGroup(e.target.value),style:{minWidth:240}},
        h('option',{value:'all'},'Tất cả nhóm hàng hóa'),
        ...goodsGroups.map(group=>h('option',{key:group,value:group},group)),
        allStockRows.some(x=>x.stockType==='goods'&&!x.goodsGroup)&&h('option',{value:'__ungrouped__'},'Chưa có nhóm')
      )),
      h('span',{style:{fontSize:12,color:'var(--tx2)'}},filtered.length+' sản phẩm')
    ),
    h('div',{className:'stock-entry-help'},canEdit?'Nhập trực tiếp số tồn, sau đó bấm Lưu thay đổi. Ô để trống được lưu là 0.':'Bạn đang xem tồn kho.'),
    h('div',{className:'stock-mobile-list'},filtered.length?filtered.map(row=>h('article',{key:row.productId,className:'stock-mobile-card'+(quickEdits[row.productId]?' is-dirty':'')},
      h('div',{className:'stock-card-heading'},h('div',null,h('strong',null,row.productName),h('small',null,[row.productCode,row.goodsGroup].filter(Boolean).join(' · '))),h('span',{className:'badge'},row.unit||'—')),
      h('div',{className:'stock-card-fields'},h('label',null,h('span',null,'Tồn 1h đêm'),stockInput(row,'stockEvening','Tồn 1h đêm')),h('label',null,h('span',null,'Tồn 9h sáng'),stockInput(row,'stockMorning','Tồn 9h sáng'))),
      h('div',{className:'stock-card-footer'},quickEdits[row.productId]?h('b',null,'Chưa lưu'):h('span',null,row.updatedAt||'Chưa cập nhật'),h('span',null,row.updatedBy||'—'))
    )):h('p',{className:'empty-st'},'Không có sản phẩm phù hợp.')),
    h('div',{className:'tw stock-desktop-table'},
      h('table',null,
        h('thead',null,h('tr',null,...[...(stockType==='goods'?['Nhóm hàng hóa']:[]),stockType==='goods'?'Hàng hóa':'Thành phẩm','Đơn vị','Tồn 1h đêm','Tồn 9h sáng','Cập nhật lúc','Người cập nhật'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,filtered.length?filtered.map(row=>{
          const s=stockMap[row.productId];
          const morning=s?s.stockMorning:0;
          const evening=s?s.stockEvening:0;
          const low=morning<50||evening<50;
          return h('tr',{key:row.productId,style:{background:low&&(morning>0||evening>0)?'rgba(252,235,235,.3)':''}},
            stockType==='goods'&&h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},row.goodsGroup||'Chưa có nhóm')),
            h('td',null,h('div',{style:{fontWeight:500}},row.productName),(low&&(morning>0||evening>0))&&h('span',{className:'badge',style:{background:'#FCEBEB',color:'#A32D2D',marginLeft:6,fontSize:10}},'Sắp hết')),
            h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},row.unit)),
            h('td',null,stockInput(row,'stockEvening','Tồn 1h đêm')),
            h('td',null,stockInput(row,'stockMorning','Tồn 9h sáng')),
            h('td',null,h('span',{style:{fontSize:11,color:'var(--tx2)'}},s?.updatedAt||'Chưa cập nhật')),
            h('td',null,h('span',{style:{fontSize:12}},s?.updatedBy||'—')),
          );
        }):h('tr',null,h('td',{colSpan:stockType==='goods'?7:6,className:'empty-st'},stockType==='goods'?'Chưa có hàng hóa trong nhóm này.':'Chưa có thành phẩm nào.')))
      )
    ),
    canEdit&&h('div',{className:'stock-save-bar'},h('span',{role:'status'},pendingCount?pendingCount+' sản phẩm chưa lưu (tất cả nhóm)':'Chưa có thay đổi'),h('button',{className:'bp',disabled:!pendingCount,onClick:saveQuick},'Lưu thay đổi'+(pendingCount?' ('+pendingCount+')':''))),
  );
}


/* === ERROR BOUNDARY === */
class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(e){return{error:e};}
  componentDidCatch(e,i){console.error(e,i);}
  render(){
    if(this.state.error){
      const e=this.state.error;
      return h('div',{style:{padding:'2rem',fontFamily:'monospace',background:'#fff',minHeight:'100vh'}},
        h('h2',{style:{color:'#A32D2D',marginBottom:'1rem'}},'LỖI RENDER: '+e.message),
        h('pre',{style:{fontSize:11,background:'#f5f5f5',padding:'1rem',borderRadius:4,overflow:'auto',whiteSpace:'pre-wrap'}},e.stack),
        h('p',{style:{marginTop:'1rem',fontSize:13,color:'#666'}},'Chup man hinh nay gui lai de fix!')
      );
    }
    return this.props.children;
  }
}
