/* Driver labels: whole orders or one finished product, never modifies order quantities. */
function scfDriverLabelWeight(line,products=[]){
  const product=products.find(p=>String(p.id)===String(line.productId)),qty=tripOrderedQty(line),unit=String(line.unit||product?.unit||'').trim().toLowerCase();
  const pac=/pac|gói|goi|pack/.test(unit)||/kg\s*\/\s*pac/i.test(line.productName||product?.name||'');
  const name=line.productName||product?.name||'',packMatch=String(name).match(/(\d+(?:[.,]\d+)?)\s*kg\s*\/\s*pac/i);
  const perUnit=numFmt(product?.weightPerUnit||line.weightPerUnit||packMatch?.[1]);
  return {product,qty,unit,pac,perUnit,kg:/^(kg|kgs|kilogram|kilograms)$/.test(unit)?qty:qty*perUnit};
}
function scfDriverOrderLabels(trip,orders,products=[],prodShifts=window.__SCF_PROD_SHIFTS||[],prodShiftRules=window.__SCF_PROD_SHIFT_RULES||[]){
 const labels=scfDriverWorkflowMembers(trip,orders).flatMap(order=>scfOrderLabelItems(order,products,prodShifts,prodShiftRules).map(it=>({...it,qty:it.kg,unit:'kg'})));
 if(labels.length>1000)throw Error('Tối đa 1.000 tem mỗi lần. Hãy chọn ít đơn hơn.');return labels;
}
function scfDriverManualLabels(trip,product,raw){
  if(!product||product.active===false||isGoodsProduct(product,[])||!resolveProductLabelPackRule(product,product.name).enabled)throw Error('Chọn một mã thành phẩm được in tem.');
  const text=String(raw??'').trim().replace(',','.');
  if(!/^\d+(?:\.\d+)?$/.test(text)||!Number.isFinite(Number(text))||Number(text)<=0)throw Error('Nhập số lượng kg lớn hơn 0.');
  const rule=resolveProductLabelPackRule(product,product.name),weights=scfLabelPackWeights(Number(text),rule.pack,rule.mergeSmallRemainder);
  if(weights.length>1000)throw Error('Tối đa 1.000 tem mỗi lần. Hãy giảm số lượng.');
  const order={deliveryDate:trip.deliveryDate,deliveryTime:'',tripId:trip.id,shiftId:trip.shiftId};const line={productId:product.id,productName:product.name,productCode:product.code,unit:'kg',qtyProd:Number(text)};const plan=prodShiftPlan({...order,lines:[line]},window.__SCF_PROD_SHIFTS||[],window.__SCF_PROD_SHIFT_RULES||[]);return weights.map(qty=>({order,line,plan,qty,unit:'kg',manual:true}));
}
function scfDriverLabelSvg(trip,label){
 const order=label.order||{deliveryDate:trip.deliveryDate},it={...label,kg:label.qty,plan:label.plan||prodShiftPlan({...order,lines:[label.line]},window.__SCF_PROD_SHIFTS||[],window.__SCF_PROD_SHIFT_RULES||[])};
 return label.isPac?scfBuildPacOrderLabelSvg(it,order,window.__SCF_CUSTOMERS||[]):scfBuildClassicOrderLabelSvg(it,order);
}
function DriverLabelPreview({trip,label}){
  const [url,setUrl]=useState('');
  const svg=label?scfDriverLabelSvg(trip,label):'';
  useEffect(()=>{if(!svg){setUrl('');return;}const value=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));setUrl(value);return()=>URL.revokeObjectURL(value);},[svg]);
  return url?h('img',{className:'dm-label-preview',src:url,alt:'Tem giao hàng xem thử'}):null;
}
function DriverLabelPrintModal({trip,orders,products,prodCats=[],user,onClose,getLatest,previewMode=false}){
  const [mode,setMode]=useState('orders'),[excluded,setExcluded]=useState([]),[productId,setProductId]=useState(''),[qty,setQty]=useState('10'),[settings,setSettings]=useState(false),[preview,setPreview]=useState(false),[confirm,setConfirm]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const saved=scfPrintAgentSettings(),[agent,setAgent]=useState(saved.agentId||'SCF-PC-01'),[printer,setPrinter]=useState(saved.printerRole||'x350');
  const ctx=useRef(null),working=useRef(false);ctx.current={trip,orders,products,user,getLatest};
  const eligible=products.filter(p=>p.active!==false&&!isGoodsProduct(p,prodCats)&&resolveProductLabelPackRule(p,p.name).enabled);
  const effectiveId=productId||String(eligible[0]?.id||''),product=eligible.find(p=>String(p.id)===effectiveId);
  const members=scfDriverWorkflowMembers(trip,orders),chosen=members.filter(o=>!excluded.includes(String(o.id)));
  let labels=[],issue='';try{labels=mode==='orders'?scfDriverOrderLabels(trip,chosen,products):scfDriverManualLabels(trip,product,qty);}catch(e){issue=e.message;}
  const fmt=n=>Number(n||0).toLocaleString('vi-VN',{maximumFractionDigits:3}),kg=labels.filter(l=>l.unit==='kg').reduce((s,l)=>s+l.qty,0);
  const change=fn=>{fn();setConfirm(null);setError('');};
  const check=()=>{
    const current=ctx.current,live=current.getLatest(),access=window.__SCF_ACCESS_CONTEXT;
    if(String(live.user?.id)!==String(user.id)||!previewMode&&access?.employeeId&&String(access.employeeId)!==String(user.id)||access?.readOnly||!live.trip||!scfTripBelongsToDriver(live.trip,live.user)||!scfTripImageDispatched(live.trip)||!canMobileFeature(live.user,'tripPrint')||!canAccess(live.user.role,'trips',live.user.permissions,employeeDepartments(live.user)))throw Error('Chuyến hoặc quyền in đã thay đổi. Hãy mở lại chuyến.');
    return live;
  };
  const prepare=()=>{try{check();if(issue)throw Error(issue);if(!labels.length)throw Error('Chọn ít nhất một đơn có tem để in.');if(!agent.trim())throw Error('Nhập mã SCF trong Chọn máy in.');setConfirm({mode,ids:chosen.map(o=>String(o.id)),productId:effectiveId,qty,svgs:labels.map(label=>scfDriverLabelSvg(trip,label)),pac:labels.map(label=>!!label.isPac),sentGroups:[],agent:agent.trim().toUpperCase(),printer});}catch(e){setError(e.message);}};
  const send=async()=>{
    if(working.current||!confirm)return;working.current=true;setBusy(true);setError('');
    try{
      const request=confirm;
      const validate=()=>{const live=check(),members=scfDriverWorkflowMembers(live.trip,live.orders);let actual;
        if(request.mode==='orders'){if(request.ids.some(id=>!members.some(o=>String(o.id)===id)))throw Error('Đơn đã chuyển khỏi chuyến. Hãy chọn lại.');actual=scfDriverOrderLabels(live.trip,members.filter(o=>request.ids.includes(String(o.id))),live.products||products);}
        else actual=scfDriverManualLabels(live.trip,(live.products||products).find(p=>String(p.id)===request.productId),request.qty);
        const svgs=actual.map(label=>scfDriverLabelSvg(live.trip,label));if(JSON.stringify(svgs)!==JSON.stringify(request.svgs))throw Error('Thông tin đơn, số lượng hoặc quy cách vừa thay đổi. Hãy xem lại trước khi in.');
      };
      validate();for(const pac of [false,true]){const svgs=request.svgs.filter((svg,index)=>request.pac[index]===pac);if(!svgs.length||request.sentGroups.includes(pac))continue;await scfQueueLabelPrint({agentId:request.agent,printerRole:request.printer,title:'Tem giao hàng '+(trip.shiftName||trip.id),paperWidthMm:pac?100:58,paperHeightMm:pac?100:40,svgs,rotate180:!pac,beforeEnqueue:validate,simulate:previewMode,tripContext:{tripId:trip.id,orderIds:request.mode==='orders'?request.ids:[],mode:request.mode}});request.sentGroups.push(pac);}
      if(!previewMode)scfSavePrintAgentSettings({agentId:request.agent,printerRole:request.printer});window.showToast(previewMode?'Trải nghiệm: đã mô phỏng gửi '+request.svgs.length+' tem; không gửi máy in thật.':'Đã gửi '+request.svgs.length+' tem đến Agent máy in.','success');onClose();
    }catch(e){setError((confirm.sentGroups.length?'Đã gửi một phần tem. Bấm xác nhận để gửi phần còn lại. ':'')+(e.message||'Chưa gửi được tem.'));if(!confirm.sentGroups.length)setConfirm(null);}finally{working.current=false;setBusy(false);}
  };
  return h(Modal,{title:'In tem giao hàng',className:'driver-label-modal',onClose:()=>{if(!working.current)onClose();}},
    h('div',{className:'dm-label-trip'},h('div',null,h('b',null,(trip.shiftName||trip.id)+' · '+trip.deliveryDate),h('small',null,members.length+' đơn trong chuyến')),h('button',{type:'button',disabled:busy,'aria-expanded':settings,'aria-controls':'driver-printer-settings',onClick:()=>setSettings(v=>!v)},'Chọn máy in')),
    settings&&h('div',{id:'driver-printer-settings',className:'dm-label-settings'},h('label',{className:'dm-field'},'Mã SCF',h('input',{'aria-label':'Mã SCF',value:agent,disabled:busy,onChange:e=>change(()=>setAgent(e.target.value))})),h('label',{className:'dm-field'},'Máy in tem',h('select',{'aria-label':'Máy in tem',value:printer,disabled:busy,onChange:e=>change(()=>setPrinter(e.target.value))},h('option',{value:'x350'},'X350B'),h('option',{value:'x420'},'X420B')))),
    h('div',{className:'dm-label-tabs',role:'tablist','aria-label':'Cách in tem'},[['orders','In theo đơn'],['manual','In khác đơn']].map(([id,name])=>h('button',{key:id,type:'button',role:'tab','aria-selected':mode===id,disabled:busy,onClick:()=>change(()=>setMode(id))},name))),
    mode==='orders'?h('section',null,h('label',{className:'dm-label-check'},h('input',{type:'checkbox','aria-label':'Chọn tất cả đơn in tem',disabled:busy,checked:members.length>0&&chosen.length===members.length,onChange:e=>change(()=>setExcluded(e.target.checked?[]:members.map(o=>String(o.id))))}),'Chọn tất cả đơn · '+chosen.length+'/'+members.length),members.map(o=>h('label',{key:o.id,className:'dm-label-order'+(!excluded.includes(String(o.id))?' selected':'')},h('span',{className:'dm-label-check'},h('input',{type:'checkbox','aria-label':'In cả đơn '+(o.pointName||o.id),checked:!excluded.includes(String(o.id)),disabled:busy,onChange:e=>change(()=>setExcluded(previous=>e.target.checked?previous.filter(id=>id!==String(o.id)):[...previous,String(o.id)]))}),h('b',null,o.pointName||o.id),h('small',null,o.deliveryTime||'')),h('span',{className:'dm-label-lines'},(o.lines||[]).map((l,i)=>h('span',{key:l.id||i},(l.productName||'Sản phẩm')+' · '+fmt(tripOrderedQty(l))+' '+(l.unit||''))))))):h('section',{className:'dm-label-manual'},h('label',{className:'dm-field'},'Mã thành phẩm',h('select',{'aria-label':'Mã thành phẩm',value:effectiveId,disabled:busy,onChange:e=>change(()=>setProductId(e.target.value))},!eligible.length&&h('option',{value:''},'Chưa có thành phẩm in tem'),eligible.map(p=>h('option',{key:p.id,value:String(p.id)},[p.code,p.name].filter(Boolean).join(' · '))))),h('label',{className:'dm-field'},'Số lượng cần in (kg)',h('input',{'aria-label':'Số lượng cần in (kg)',type:'text',inputMode:'decimal',value:qty,disabled:busy,onChange:e=>change(()=>setQty(e.target.value))})),h('p',{className:'dm-hint'},'In riêng theo số lượng nhập, không thay đổi đơn trong chuyến.')),
    h('button',{type:'button',disabled:!labels.length||busy,'aria-expanded':preview,onClick:()=>setPreview(v=>!v)},preview?'Ẩn xem thử':'Xem thử tem'),
    preview&&labels.length>0&&h('div',{className:'dm-label-preview-box'},h(DriverLabelPreview,{trip,label:labels[labels.length-1]}),h('small',null,'Tem cuối · '+fmt(labels[labels.length-1].qty)+' '+labels[labels.length-1].unit)),
    h('div',{className:'dm-label-total',role:'status'},h('b',null,(mode==='orders'?chosen.length+' đơn':'1 thành phẩm')+' · '+labels.length+' tem'),kg>0&&h('span',null,fmt(kg)+' kg')),
    issue&&h('p',{className:'dm-hint'},issue),error&&h('p',{role:'alert',className:'dm-error'},error),
    confirm?h('section',{className:'dm-label-confirm'},h('b',null,'Xác nhận gửi '+confirm.svgs.length+' tem'),h('p',null,confirm.agent+' · '+(confirm.printer==='x420'?'X420B':'X350B')),h(Row,null,h('button',{disabled:busy,onClick:()=>setConfirm(null)},'Quay lại'),h('button',{className:'bp',disabled:busy,onClick:send},busy?'Đang gửi tem…':'Xác nhận gửi in'))):h('button',{className:'bp dm-label-send',disabled:busy||!!issue||!labels.length,onClick:prepare},'Gửi in '+labels.length+' tem')
  );
}
