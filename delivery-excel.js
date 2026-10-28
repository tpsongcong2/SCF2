/* Excel summary uses the same trip, stop, product ordering and colors as PNGs. */
function scfDeliveryExcelGroups({orders=[],trips=[],products=[],customers=[],prodCats=[],group='all',tripForOrder}){
  const resolve=tripForOrder||scfCreateOrderTripIndex(orders,trips).tripForOrder;
  const groups=new Map(),productById=new Map(products.map(p=>[String(p.id),p]));
  orders.forEach(order=>{
    const assigned=resolve(order);
    // Unassigned orders remain visible in the all-groups export, without inventing a trip.
    if(group!=='all'&&(!assigned||scfTripImageGroup(assigned)!==group))return;
    const key=assigned?'trip:'+assigned.id:'pending:'+String(order.deliveryDate||'');
    if(!groups.has(key))groups.set(key,{trip:assigned||{id:key,deliveryDate:order.deliveryDate,shiftName:'Chưa xếp chuyến'},orders:[],rows:[]});
    groups.get(key).orders.push(order);
  });
  const byTrip=new Map([...groups.values()].map(item=>[item.trip,item]));
  return scfSortTripImageTrips([...byTrip.keys()]).map((trip,index)=>{
    const item=byTrip.get(trip),fill=scfTripImageGroup(trip)==='dt'?'#ffffff':index%2===0?'#a9d08e':'#ffffff';
    const rows=sortTripOrdersByDeliveryOrder(trip,item.orders,customers).flatMap(order=>{
      const lines=order.lines?.length?order.lines:[null];
      return lines.map(line=>{
        const product=productById.get(String(line?.productId||''));
        const note=[order.status==='cancelled'?'Đã hủy':'',order.isAdditionalTripOrder?'Đơn PS':'',order.note,line?.note].filter(Boolean).join(' · ');
        const row=[line?.warehouseSourceDeliveryDate||order.deliveryDate||trip.deliveryDate||'',line?.warehouseSourcePointName||order.pointName||order.address||'—',line?.productName||product?.name||'',line?mobileDeliveryQty(line,'qtyProd'):null,line?.unit||product?.unit||'',normalizeTimeInput(line?.warehouseSourceDeliveryTime||order.deliveryTime||trip.deliveryTime||''),note];
        row.isGoods=!!line&&isGoodsProduct(product||line,prodCats);
        row.qtyInvoice=line?mobileDeliveryQty(line,'qtyInvoice'):null;
        const unit=String(line?.unit||product?.unit||'').trim().toLowerCase();
        const pack=String(line?.productName||product?.name||'').match(/(\d+(?:[.,]\d+)?)\s*kg\s*\/\s*pac\b/i);
        const weight=Number(product?.weightPerUnit)||Number(line?.weightPerUnit)|| (pack?Number(pack[1].replace(',','.')):0);
        row.kgPerUnit=!line||row.isGoods||order.status==='cancelled'?0:/^(kg|kgs|kilogram|kilograms)$/.test(unit)?1:weight>0?weight:!unit&&!pack?1:0;
        row.orderId=order.id;
        row.fill=scfTripSummaryRowFill(trip,row,fill);
        return row;
      });
    });
    return {...item,fill,rows:scfSortTripImageRows(trip,rows),weight:item.orders.filter(o=>o.status!=='cancelled').reduce((sum,o)=>sum+tripImageOrderWeight(o,products),0)};
  });
}
function scfDeliveryExcelDate(value){
  const raw=String(value||'').trim();
  const vn=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/),iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!vn&&!iso)return raw;
  const [year,month,day]=vn?[+vn[3],+vn[2],+vn[1]]:[+iso[1],+iso[2],+iso[3]];
  const date=new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?date:raw;
}
function scfCreateDeliveryExcelWorkbook(Excel,groups,{group='all'}={}){
  const wb=new Excel.Workbook();wb.creator='SCFOOD';
  wb.calcProperties.fullCalcOnLoad=true;
  const sheet=wb.addWorksheet('Don giao hang',{views:[{showGridLines:false,state:'frozen',ySplit:2}],pageSetup:{paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.25,right:.25,top:.35,bottom:.35,header:.15,footer:.15}}});
  const widths=[24,16,28,32,13,13,12,42];sheet.columns=[...widths.map(width=>({width})),{width:16,hidden:true}];
  const border={style:'thin',color:{argb:'FF777777'}};
  const paint=(row,fill,bold=false)=>{
    for(let col=1;col<=8;col++){
      const cell=row.getCell(col);
      cell.font={name:'Arial',size:11,bold,color:{argb:'FF000000'}};
      cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+fill.replace('#','').toUpperCase()}};
      cell.border={top:border,bottom:border,left:border,right:border};
      cell.alignment={vertical:'middle',horizontal:col>=5&&col<=6?'right':'left',wrapText:true};
    }
  };
  const label=group==='dt'?'ĐIỀM THỤY':group==='samsung'?'SAMSUNG':'TẤT CẢ NHÓM CHUYẾN';
  sheet.mergeCells('A1:H1');sheet.getCell('A1').value='ĐƠN GIAO HÀNG — '+label;
  sheet.getCell('A1').font={name:'Arial',size:16,bold:true};sheet.getRow(1).height=30;
  sheet.mergeCells('A2:H2');sheet.getCell('A2').value=groups.reduce((n,g)=>n+g.orders.length,0)+' đơn theo bộ lọc · '+groups.length+' nhóm chuyến';
  sheet.getCell('A2').font={name:'Arial',size:11};sheet.getRow(2).height=24;
  groups.forEach(({trip,orders,rows,fill})=>{
    const totalFill=scfTripImageGroup(trip)==='dt'?'#9dc3e6':fill;
    const header=sheet.addRow(['','Ngày giao','Bếp','Hàng hóa','SL đặt','SL HĐ','Giờ giao','Chú ý']);
    paint(header,totalFill,true);header.height=25;
    const firstDetailRow=header.number+1;
    rows.forEach(data=>{
      const time=/^\d{1,2}:\d{2}$/.test(data[5])?data[5].split(':').map(Number):null;
      const timeValue=time&&time[0]<24&&time[1]<60?(time[0]*60+time[1])/1440:data[5];
      const values=[null,scfDeliveryExcelDate(data[0]),data[1],data[2],data[3],data.qtyInvoice,timeValue,data[6]||null];
      const row=sheet.addRow(values);paint(row,fill);
      row.getCell(9).value=data.kgPerUnit??0;
      const setFill=(col,color)=>{row.getCell(col).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+color.replace('#','').toUpperCase()}};};
      setFill(1,'#ffffff');setFill(8,'#ffffff');
      if(['#ffff00','#f4af86'].includes(String(data.fill).toLowerCase()))[3,4,5,6].forEach(col=>setFill(col,data.fill));
      if(data[6])row.getCell(8).font={name:'Arial',size:11,bold:true,color:{argb:'FFC00000'}};
      row.getCell(2).numFmt='dd/mm/yyyy';row.getCell(7).numFmt='hh:mm';
      [5,6].forEach(col=>row.getCell(col).numFmt=Number.isInteger(values[col-1])?'#,##0':'#,##0.########');
      const wrapped=Math.max(1,...[2,3,7].map(col=>String(values[col]||'').split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/(widths[col]-2))),0)));
      row.height=Math.min(409,Math.max(23,wrapped*15+8));
    });
    const lastDetailRow=sheet.rowCount;
    const driver=tripImageDriverName(trip.driverName);
    const total=sheet.addRow([driver,scfDeliveryExcelDate(trip.deliveryDate),trip.shiftName||trip.shiftCode||trip.shiftId||'Chưa có ca giao']);
    paint(total,totalFill,true);total.height=Math.max(28,Math.ceil(driver.length/(widths[0]-2))*15+8);
    total.getCell(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFF00'}};
    total.getCell(2).numFmt='dd/mm/yyyy';
    [5,6].forEach(col=>{
      const letter=String.fromCharCode(64+col);
      const result=rows.reduce((sum,data)=>{
        const value=col===5?data[3]:data.qtyInvoice;
        return sum+(typeof value==='number'&&Number.isFinite(value)?value:0)*(data.kgPerUnit??0);
      },0);
      total.getCell(col).value={formula:rows.length?'SUMPRODUCT('+letter+firstDetailRow+':'+letter+lastDetailRow+',I'+firstDetailRow+':I'+lastDetailRow+')':'SUM(0)',result};
      total.getCell(col).numFmt='#,##0.########" kg"';
    });
  });
  sheet.pageSetup.printArea='A1:H'+sheet.rowCount;
  return wb;
}
async function scfExportDeliverySummary(groups,group){
  if(!groups.length)throw new Error('Không có đơn phù hợp để xuất Excel.');
  await scfLoadOptionalScript('ExcelJS','./vendor/exceljs-4.4.0.min.js');
  const workbook=scfCreateDeliveryExcelWorkbook(window.ExcelJS,groups,{group});
  const bytes=await workbook.xlsx.writeBuffer();
  const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='Don_giao_hang_theo_chuyen_'+group+'_'+isoDate()+'.xlsx';
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function DeliveryExcelExportModal({orders,trips,products,customers,prodCats,tripForOrder,initialGroup='all',onExportDetail,onClose}){
  const [format,setFormat]=useState('summary'),[group,setGroup]=useState(initialGroup||'all'),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const working=React.useRef(false);
  const groups=React.useMemo(()=>scfDeliveryExcelGroups({orders,trips,products,customers,prodCats,tripForOrder,group}),[orders,trips,products,customers,prodCats,tripForOrder,group]);
  const count=format==='summary'?groups.reduce((sum,g)=>sum+g.orders.length,0):orders.length;
  const save=async()=>{
    if(working.current)return;working.current=true;setBusy(true);setError('');
    try{if(format==='summary')await scfExportDeliverySummary(groups,group);else await onExportDetail();onClose();}
    catch(e){setError(e.message||'Chưa xuất được Excel. Hãy thử lại.');}
    finally{working.current=false;setBusy(false);}
  };
  return h(Modal,{title:'Xuất Excel đơn hàng',onClose:()=>{if(!working.current)onClose();}},
    h(F,{label:'Mẫu xuất'},h('select',{'aria-label':'Mẫu xuất',value:format,disabled:busy,onChange:e=>setFormat(e.target.value)},h('option',{value:'summary'},'Theo chuyến, tô màu như ảnh đơn tổng'),h('option',{value:'detail'},'Dữ liệu đầy đủ (mẫu cũ)'))),
    format==='summary'&&h(F,{label:'Nhóm chuyến'},h('select',{'aria-label':'Nhóm chuyến',value:group,disabled:busy,onChange:e=>setGroup(e.target.value)},h('option',{value:'all'},'Tất cả nhóm chuyến'),h('option',{value:'samsung'},'Samsung'),h('option',{value:'dt'},'Điềm Thụy'))),
    h('p',{style:{margin:'12px 0'}},count+' đơn theo bộ lọc hiện tại, gồm tất cả các trang.'),
    format==='summary'&&h('p',{style:{marginBottom:12}},'Hai cột số lượng: SL đặt, SL HĐ.'),
    error&&h('p',{role:'alert',style:{color:'var(--danger)',marginBottom:12}},error),
    h(Row,null,h('button',{disabled:busy,onClick:onClose},'Hủy'),h('button',{className:'bp',disabled:busy||!count,onClick:save},busy?'Đang xuất…':'Tải Excel'))
  );
}
