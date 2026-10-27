function scfWarehouseOrderTools(){
  const text=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').trim().toLowerCase();
  const warehouse=(trip,shifts=[])=>[trip?.shiftName,...shifts.filter(s=>String(s.id)===String(trip?.shiftId)).flatMap(s=>[s.name,s.code])].some(v=>{const n=text(v).replace(/[^a-z0-9]+/g,' ');return n==='kv'||n.includes('kho van');});
  const additional=order=>!!order?.isAdditionalTripOrder||order?.tripAssignMode==='driver_additional';
  const catalogs=new WeakMap();
  const pac=(line,products=[])=>{
    let catalog=catalogs.get(products);if(!catalog){catalog=new Map(products.map(p=>[String(p.id),p]));catalogs.set(products,catalog);}
    const product=catalog.get(String(line?.productId))||{};
    return [line?.productCode,product.code,line?.productName,product.name].some(value=>/PAC\s*$/i.test(String(value||'')));
  };
  const photo=(order,trip,products=[],shifts=[],kind='invoice')=>{
    const own=kind==='driver'?order?.driverInvoiceImage:order?.invoiceImage;
    if(String(own||'').trim())return{src:own,inherited:false};
    if(trip&&warehouse(trip,shifts)&&!additional(order)&&(order?.lines||[]).length&&(order.lines||[]).every(line=>!line.isAdditionalProduct&&pac(line,products))){
      const src=trip.summaryInvoiceImage||trip.summaryInvoiceBackImage;
      if(src)return{src,inherited:true};
    }
    return null;
  };
  const merge=({orders,trips,tripId,products=[],shifts=[],mode='manual',actor='',actorId='',stamp='',atIso=''})=>{
    const trip=trips.find(t=>String(t.id)===String(tripId));
    const fail=reason=>({ok:false,reason});
    if(!trip||!warehouse(trip,shifts))return fail('Chỉ gộp PAC trong chuyến KV kho vận.');
    if(trip.driverDispatchedAt||!['planning','assigned',''].includes(String(trip.status||'')))return fail('Chuyến đã giao lái xe hoặc đã đóng; chưa thể gộp dữ liệu.');
    const members=orders.filter(o=>String(o.tripId||'')===String(trip.id)||(trip.orderIds||[]).map(String).includes(String(o.id)));
    if(members.some(o=>o.tripId&&String(o.tripId)!==String(trip.id)))return fail('Liên kết đơn/chuyến đang lệch. Hãy đồng bộ lại trước khi gộp.');
    const targets=members.filter(o=>o.warehouseMerged===true);
    if(targets.length>1)return fail('Chuyến đang có nhiều đơn kho vận gộp; cần kiểm tra trước.');
    const existing=targets[0];
    const selected=members.filter(o=>o!==existing&&!additional(o)&&!['done','cancelled','failed'].includes(String(o.status||''))&&(mode!=='auto'||o.warehouseMergePending===true))
      .map(order=>({order,lines:(order.lines||[]).filter(line=>!line.isAdditionalProduct&&pac(line,products))})).filter(item=>item.lines.length);
    if(!selected.length)return fail('Không có dòng PAC thường cần gộp. Đơn phát sinh giữ hóa đơn riêng.');
    const participants=[...(existing?[existing]:[]),...selected.map(item=>item.order)];
    const assignmentMode=value=>value==='manual'?'manual':'auto';
    if(new Set(participants.map(o=>assignmentMode(o.tripAssignMode))).size>1)return fail('Các đơn khác chế độ BT/TĐ xếp chuyến. Giữ nguyên, không gộp để tránh đổi chế độ.');
    if(new Set(participants.map(o=>assignmentMode(o.prodShiftAssignMode))).size>1)return fail('Các đơn khác chế độ BT/TĐ ca SX. Giữ nguyên, không gộp để tránh đổi chế độ.');
    const sourceSet=new Set(selected.map(item=>item.order));
    const duplicates=importRows(orders.filter(o=>!sourceSet.has(o)&&!additional(o)),selected.map(item=>({...item.order,lines:item.lines})),products);
    if(duplicates.skipped.length)return fail('Có '+duplicates.skipped.length+' dòng PAC trùng theo ngày, địa điểm, giờ và sản phẩm. Giữ nguyên dữ liệu để đối chiếu trước khi gộp.');
    if(selected.some(item=>item.order.invoiceImage||item.order.driverInvoiceImage||item.order.accountingConfirmedAt||item.order.driverCompletedAt))return fail('Có đơn đã lưu hóa đơn riêng hoặc đã xác nhận giao. Cần kiểm tra chứng từ trước khi gộp.');
    const id=existing?.id||('DGH-KV-'+String(trip.id));
    if(!existing&&orders.some(o=>String(o.id)===String(id)))return fail('Mã đơn kho vận đã tồn tại.');
    const sourceOrders=[...(existing?.warehouseSourceOrders||[])],lines=[...(existing?.lines||[])],replacements=new Map(),removed=new Set();
    for(const item of selected){
      const picked=new Set(item.lines),remaining=(item.order.lines||[]).filter(line=>!picked.has(line));
      const source={...item.order,lines:item.lines,...(remaining.length?{workOut:0,workReturn:0}:{})};
      sourceOrders.push(source);
      item.lines.forEach((line,index)=>{
        const plan=Object.fromEntries(Object.entries(item.order).filter(([key])=>/^(prod|label)/.test(key)));
        const product=catalogs.get(products)?.get(String(line.productId))||{};
        lines.push({...plan,...line,productName:line.productName||product.name||'',productCode:line.productCode||product.code||'',unit:line.unit||product.unit||'',id:String(item.order.id)+'::'+String(line.id??index),warehouseSourceTripAssignMode:assignmentMode(item.order.tripAssignMode),warehouseSourceProdShiftAssignMode:line.shiftOverride?'manual':assignmentMode(line.prodShiftAssignMode||item.order.prodShiftAssignMode),warehouseSourceOrderId:String(item.order.id),warehouseSourceLineId:String(line.id??index),warehouseSourcePointName:item.order.pointName||item.order.address||'',warehouseSourceDeliveryDate:item.order.deliveryDate||'',warehouseSourceDeliveryTime:item.order.deliveryTime||''});
      });
      if(remaining.length)replacements.set(String(item.order.id),{...item.order,lines:remaining,warehouseMergePending:false,updatedAt:stamp,updatedBy:actor});
      else removed.add(String(item.order.id));
    }
    const customers=[...new Set(sourceOrders.map(o=>String(o.customerId||o.custId||o.customer||'')))];
    const base=existing||selected[0].order;
    const merged={...base,id,pointId:'',ptId:'',pointName:'KHO VẬN',address:'Giao tại kho vận',tripId:trip.id,tripAssignMode:assignmentMode(base.tripAssignMode),
      deliveryDate:trip.deliveryDate||base.deliveryDate,deliveryTime:trip.deliveryTime||base.deliveryTime||'',status:base.status||'assigned',
      customerId:customers.length===1?(base.customerId||base.custId||''):'',customer:customers.length===1?(base.customer||base.customerName||''):'Kho vận',
      lines,warehouseMerged:true,warehouseMergePending:false,automaticPlanningPending:false,warehouseSourceOrders:sourceOrders,
      warehouseSourceOrderIds:sourceOrders.map(o=>String(o.id)),invoiceImage:existing?.invoiceImage||'',driverInvoiceImage:existing?.driverInvoiceImage||'',
      workOut:(Number(existing?.workOut)||0)+sourceOrders.slice(existing?.warehouseSourceOrders?.length||0).reduce((s,o)=>s+(Number(o.workOut)||0),0),workReturn:(Number(existing?.workReturn)||0)+sourceOrders.slice(existing?.warehouseSourceOrders?.length||0).reduce((s,o)=>s+(Number(o.workReturn)||0),0),
      note:[existing?.note||'Đơn PAC giao tại kho vận',...selected.map(({order})=>order.note?String(order.pointName||order.id)+': '+order.note:'')].filter(Boolean).join(' · '),
      createdAt:existing?.createdAt||stamp,createdAtIso:existing?.createdAtIso||atIso,createdBy:existing?.createdBy||actor,createdById:existing?.createdById||actorId,
      updatedAt:stamp,updatedBy:actor,updatedById:actorId,
      orderHistory:[...(existing?.orderHistory||[]),{id:'KV-'+atIso,action:'Gộp đơn PAC kho vận',at:stamp,atIso,by:actor,byId:actorId,changes:selected.map(({order,lines})=>String(order.id)+' · '+(order.pointName||'')+' · '+lines.length+' dòng PAC')}]};
    const nextOrders=orders.filter(o=>!removed.has(String(o.id))&&String(o.id)!==String(existing?.id||'')).map(o=>replacements.get(String(o.id))||o).concat(merged);
    const memberIds=new Set(members.map(o=>String(o.id))),newMembers=nextOrders.filter(o=>String(o.tripId||'')===String(trip.id)||memberIds.has(String(o.id)));
    const nextTrip={...trip,orderIds:[...new Set(newMembers.map(o=>o.id))],updatedAt:stamp,updatedBy:actor};
    return{ok:true,orders:nextOrders,trips:trips.map(t=>String(t.id)===String(trip.id)?nextTrip:t),merged,selected:selected.map(i=>i.order),affectedOrderIds:[...selected.map(i=>String(i.order.id)),...(existing?[String(existing.id)]:[])],summary:{orders:selected.length,lines:selected.reduce((sum,item)=>sum+item.lines.length,0),remainingOrders:newMembers.length}};
  };
  const accounting=orders=>(orders||[]).flatMap(order=>{
    if(!order.warehouseMerged||!order.warehouseSourceOrders?.length)return[order];
    const grouped=new Map();
    for(const line of order.lines||[]){const id=String(line.warehouseSourceOrderId||'');if(!grouped.has(id))grouped.set(id,[]);grouped.get(id).push(line);}
    const rows=order.warehouseSourceOrders.map(source=>({...source,id:String(order.id)+'#'+String(source.id),warehouseOrderId:order.id,tripId:order.tripId,status:order.status,
      lines:grouped.get(String(source.id))||[],invoiceImage:order.invoiceImage||'',warehouseMerged:true,warehouseSourceOrders:undefined})).filter(o=>o.lines.length);
    const unassigned=grouped.get('');if(unassigned?.length)rows.push({...order,warehouseSourceOrders:undefined,lines:unassigned});
    return rows;
  });
  const invoiceView=(orders,trips,products=[],shifts=[])=>{
    const tripMap=new Map((trips||[]).map(t=>[String(t.id),t]));
    return(orders||[]).map(order=>{const image=photo(order,tripMap.get(String(order.tripId)),products,shifts);return image?.inherited?{...order,invoiceImage:image.src,warehouseInvoiceInherited:true}:order;});
  };
  const importRows=(existing,incoming,products=[])=>{
    const known=new Map(),skipped=[],conflicts=[];
    const date=value=>{const m=String(value||'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):String(value||'').slice(0,10);};
    const names=new Map(products.map(p=>[text(p.name),String(p.id)]));
    const byId=new Map(products.map(p=>[String(p.id),p]));
    const quantity=line=>[line.qtyProd??line.qty??line.quantity??line.qtyInvoice??0,line.qtyInvoice??line.qtyOrder??line.qty??0].map(v=>Number(String(v).replace(',','.'))||0).join('|');
    const key=(order,line)=>{
      const rawTime=String(line.warehouseSourceDeliveryTime||order.deliveryTime||'').trim(),time=rawTime.replace(/^(\d):/,'0$1:');
      const point=text(line.warehouseSourcePointName||order.pointName||order.address);
      const product=String(line.productId||names.get(text(line.productName))||text(line.productName));
      return point&&time&&product?JSON.stringify([date(line.warehouseSourceDeliveryDate||order.deliveryDate),point,time,product,text(line.unit||byId.get(product)?.unit)]):'';
    };
    accounting(existing).filter(o=>!['cancelled','failed'].includes(o.status)).forEach(order=>(order.lines||[]).forEach(line=>{const id=key(order,line);if(id)known.set(id,line);}));
    const orders=[];
    for(const order of incoming){
      if(!(order.lines||[]).some(line=>pac(line,products))){orders.push(order);continue;}
      const lines=(order.lines||[]).filter(line=>{
        const id=key(order,line),old=known.get(id);
        if(old){skipped.push({orderId:order.id,pointName:order.pointName,deliveryTime:order.deliveryTime,productName:line.productName});if(quantity(old)!==quantity(line))conflicts.push({orderId:order.id,pointName:order.pointName,productName:line.productName});return false;}
        if(id)known.set(id,line);return true;
      });
      if(lines.length)orders.push({...order,lines,warehouseImportLineChecked:true});
    }
    return{orders,skipped,conflicts};
  };
  return{warehouse,additional,pac,photo,merge,accounting,invoiceView,importRows};
}
const scfWarehouseOrders=scfWarehouseOrderTools();
