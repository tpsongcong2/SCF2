/* ─── DELIVERY ORDERS ─── */
function OrderDetailLine({line,products,prodCats,prodShifts,deliveryDate,deliveryTime,pointName,area,inheritedShift,inheritedTiming,inheritedMode,onChange,onRemove}){
  const prod=products.find(p=>p.id===line.productId)||{};
  const showPurchasePrice=isGoodsProduct(prod,prodCats||[]);
  const pickProduct=p=>{
    onChange({...line,productId:p?.id||'',productName:p?.name||'',unit:p?.unit||'',weightPerUnit:p?.weightPerUnit||0});
  };
  // Tự động tính ca SX từ giờ giao
  const autoShift=getProdShiftForOrder({deliveryTime,area,pointName,address:pointName,customer:''},prodShifts||[],window.__SCF_CUSTOMERS||[]);
  const followShift=inheritedShift||autoShift;
  const dispShift=followShift?{
    name:followShift.name||'',
    prodTime:inheritedTiming?.prodTime||followShift.actualProdTime||followShift.endTime||'',
    prodDate:inheritedTiming?.prodDate||addDaysVN(deliveryDate,followShift.prodDateOffset||0),
    labelTime:inheritedTiming?.labelTime||followShift.labelPrintTime||'',
    labelDate:inheritedTiming?.labelDate||addDaysVN(deliveryDate,followShift.labelPrintDateOffset||0),
  }:null;
  // override: nếu line.shiftOverride=true thì dùng giá trị tay
  const isOverride=!!line.shiftOverride;
  const manualShift=isOverride?getProdShiftByProdTime(line.prodTime,prodShifts||[]):null;
  const setManualProdTime=v=>{
    const sh=getProdShiftByProdTime(v,prodShifts||[]);
    onChange({
      ...line,
      prodTime:v,
      prodDate:sh?addDaysVN(deliveryDate,sh.prodDateOffset||0):(line.prodDate||''),
      labelTime:sh?.labelPrintTime||line.labelTime||'',
      labelDate:sh?addDaysVN(deliveryDate,sh.labelPrintDateOffset||0):(line.labelDate||'')
    });
  };
  const toggleOverride=()=>onChange({...line,shiftOverride:!isOverride,
    prodTime:dispShift?.prodTime||'',
    prodDate:dispShift?.prodDate||'',
    labelTime:dispShift?.labelTime||'',
    labelDate:dispShift?.labelDate||'',
  });
  return h('div',{className:'order-detail-line-grid',style:{display:'grid',gridTemplateColumns:showPurchasePrice?'2fr 80px 80px 90px 60px minmax(360px,1.3fr) 30px':'2fr 80px 80px 60px minmax(360px,1.3fr) 30px',gap:6,alignItems:'end',marginBottom:6,padding:'8px 10px',background:'var(--bg2)',borderRadius:'var(--r)'}},
    // Sản phẩm — thu nhỏ
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'Sản phẩm'),
      h(ImportProductSearch,{
        products:products||[],
        prodCats:prodCats||[],
        value:line.productId||'',
        onChange:productId=>pickProduct((products||[]).find(p=>String(p.id)===String(productId))||null),
        showCategoryFilters:true,
        compact:true
      }),
      h('div',{style:{fontSize:10,color:'var(--tx2)',margin:'5px 0 3px'}},'Ghi chú dòng'),
      h('input',{value:line.note||'',onChange:e=>onChange({...line,note:e.target.value}),placeholder:'Ghi chú riêng cho sản phẩm này...',style:{fontSize:12,width:'100%'}})
    ),
    // SL Dat
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'SL Đặt'),
      h('input',{type:'number',min:0,value:line.qtyProd,onChange:e=>onChange({...line,qtyProd:numFmt(e.target.value)}),style:{fontSize:13}})
    ),
    // SL HĐ
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'SL HĐ'),
      h('input',{type:'number',min:0,value:line.qtyInvoice,onChange:e=>onChange({...line,qtyInvoice:numFmt(e.target.value)}),style:{fontSize:13}})
    ),
    // Giá mua
    showPurchasePrice&&h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'Giá mua'),
      h(NumInput,{value:line.purchasePrice||line.price||0,onChange:v=>onChange({...line,purchasePrice:v,price:v}),placeholder:'0',style:{fontSize:13}})
    ),
    // ĐVT
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'ĐVT'),
      h('input',{value:prod.unit||line.unit||'',readOnly:true,style:{fontSize:13,background:'var(--card)',cursor:'default',textAlign:'center'}})
    ),
    // Ca SX — hiển thị tự động hoặc cho nhập tay
    h('div',{style:{padding:'6px 8px',background:isOverride?'#FFF8E1':'var(--card)',borderRadius:'var(--r)',border:'1px solid '+(isOverride?'#f8c30f':'var(--bd)')}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}},
        h('div',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},isOverride?'Ca SX (tay)':(inheritedMode==='manual'?'Ca SX (tay theo đơn)':'Ca SX (tự động)')),
        h('button',{type:'button',onClick:toggleOverride,title:isOverride?'Dùng tự động cho dòng này':'Nhập tay riêng cho dòng này',
          style:{fontSize:10,padding:'1px 6px',borderRadius:10,background:isOverride?'#f8c30f':'var(--bg2)',color:isOverride?'#5a3e00':'var(--tx2)',border:'none',cursor:'pointer',fontWeight:500}
        },isOverride?'↺ Tự động':'✎ Tay riêng')
      ),
      !isOverride&&dispShift?h('div',null,
        h('div',{style:{fontSize:12,fontWeight:600,color:'var(--pri3)',marginBottom:2}},dispShift.name||'—'),
        h('div',{style:{fontSize:11,color:'var(--tx2)'}},
          h('span',{style:{marginRight:6}},'⚙ SX: '+dispShift.prodTime+(dispShift.prodDate?' ('+dispShift.prodDate+')':''))
        ),
        h('div',{style:{fontSize:11,color:'var(--tx2)'}},
          h('span',null,'🏷 Tem: '+dispShift.labelTime+(dispShift.labelDate?' ('+dispShift.labelDate+')':''))
        )
      ):!isOverride?h('div',{style:{fontSize:11,color:'#A32D2D'}},'⚠ Không tìm thấy ca'):null,
      isOverride&&manualShift&&h('div',{style:{fontSize:11,fontWeight:600,color:manualShift.textColor||'var(--pri3)',marginBottom:3}},
        manualShift.name||'—'
      ),
      isOverride&&h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1.1fr 1fr 1.1fr',gap:4,marginTop:2}},
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'⚙ Giờ SX thực tế'),
          h('input',{value:line.prodTime||'',onChange:e=>setManualProdTime(e.target.value),placeholder:'07:00',style:{fontSize:12,padding:'3px 6px'}})
        ),
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'Ngày SX'),
          h('input',{value:line.prodDate||dispShift?.prodDate||'',onChange:e=>onChange({...line,prodDate:e.target.value}),placeholder:'DD/MM/YYYY',style:{fontSize:12,padding:'3px 6px'}})
        ),
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'🏷 Giờ in tem'),
          h('input',{value:line.labelTime||'',onChange:e=>onChange({...line,labelTime:e.target.value}),placeholder:'06:00',style:{fontSize:12,padding:'3px 6px'}})
        ),
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'Ngày in tem'),
          h('input',{value:line.labelDate||dispShift?.labelDate||'',onChange:e=>onChange({...line,labelDate:e.target.value}),placeholder:'DD/MM/YYYY',style:{fontSize:12,padding:'3px 6px'}})
        )
      )
    ),
    // Nút xóa
    h('button',{className:'bi',onClick:onRemove,style:{color:'#A32D2D',alignSelf:'flex-end',marginBottom:2}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
  );
}

function PrintModal({order,company,onClose}){
  return h('div',{className:'overlay',onClick:e=>{if(e.target===e.currentTarget)onClose()}},
    h('div',{style:{background:'#fff',borderRadius:'var(--rl)',width:700,maxWidth:'95vw',maxHeight:'92vh',overflow:'auto',padding:'2rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem'}},
        h('div',{style:{display:'flex',alignItems:'center',gap:12}},
          h('img',{src:LOGO_SRC,style:{width:50,height:50}}),
          h('div',null,
            h('div',{style:{fontSize:16,fontWeight:700,color:'var(--pri3)'}},company&&company.name||'Công ty SCF'),
            company&&company.address&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},company.address),
            company&&company.phone&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},'ĐT: '+company.phone)
          )
        ),
        h('div',{style:{textAlign:'right'}},
          h('div',{style:{fontSize:20,fontWeight:700,color:'var(--pri3)'}},'HÓA ĐƠN GIAO HÀNG'),
          h('div',{style:{fontSize:13,color:'var(--tx2)'}},order.id),
          order.invoiceNo&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Số HĐ: '+order.invoiceNo)
        )
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,background:'var(--bg2)',padding:'12px 16px',borderRadius:'var(--r)',marginBottom:'1.5rem',fontSize:13}},
        h('div',null,h('b',null,'Khách hàng: '),order.customer),
        h('div',null,h('b',null,'Ngày giao: '),order.deliveryDate+(order.deliveryTime?' lúc '+order.deliveryTime:'')),
        h('div',{style:{gridColumn:'1/-1'}},h('b',null,'Địa chỉ: '),order.address||order.pointName||'—')
      ),
      h('table',{style:{width:'100%',borderCollapse:'collapse',marginBottom:'1rem',fontSize:13}},
        h('thead',null,h('tr',{style:{background:'var(--pri3)',color:'#fff'}},
          ...[['STT','40px'],['Tên sản phẩm',''],['Đơn vị','80px'],['SL Đặt','100px'],['SL hóa đơn','100px'],['Ca SX','80px']].map(([c,w])=>h('th',{key:c,style:{padding:'8px 10px',textAlign:'left',width:w||'auto'}},c))
        )),
        h('tbody',null,(order.lines||[]).map((l,i)=>h('tr',{key:l.id,style:{borderBottom:'.5px solid var(--bd)',background:i%2?'var(--bg2)':'#fff'}},
          h('td',{style:{padding:'7px 10px'}},(i+1)),
          h('td',{style:{padding:'7px 10px',fontWeight:500}},l.productName||'—'),
          h('td',{style:{padding:'7px 10px'}},l.unit||'—'),
          h('td',{style:{padding:'7px 10px',textAlign:'center'}},l.qtyProd||0),
          h('td',{style:{padding:'7px 10px',textAlign:'center'}},l.qtyInvoice||0),
          h('td',{style:{padding:'7px 10px'}},l.shift==='night'?'Ca đêm':'Ca sáng')
        )))
      ),
      order.note&&h('div',{style:{fontSize:13,marginBottom:'1rem'}},h('b',null,'Ghi chú: '),order.note),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,marginTop:'2rem',fontSize:12,textAlign:'center'}},
        h('div',null,h('div',{style:{borderTop:'.5px solid #333',paddingTop:8,fontWeight:500}},'Người giao hàng'),h('div',{style:{color:'var(--tx2)'}},'(Ký và ghi rõ họ tên)')),
        h('div',null,h('div',{style:{borderTop:'.5px solid #333',paddingTop:8,fontWeight:500}},'Người nhận hàng'),h('div',{style:{color:'var(--tx2)'}},'(Ký và ghi rõ họ tên)')),
        h('div',null,h('div',{style:{borderTop:'.5px solid #333',paddingTop:8,fontWeight:500}},'Xác nhận công ty'),h('div',{style:{color:'var(--tx2)'}},'(Ký tên và đóng dấu)'))
      ),
      h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'1.5rem'}},
        window.scfShouldUsePrintAgent?.()&&h('button',{className:'bp',onClick:function(){
          var html=buildPrintHTML('welstory',order,company);
          window.scfQueueA4Print(html,{title:'Phiếu giao hàng · '+(order.pointName||order.customer||order.id||'SCF')})
            .then(function(){window.showToast('Đã gửi đơn tới Canon 2900.','success');})
            .catch(function(error){window.showToast(error&&error.message||'Chưa gửi được lệnh in tới Canon 2900.','error');});
        }},h('i',{className:'ti ti-printer',style:{fontSize:14}}),'Gửi Canon 2900'),
        h('button',{onClick:function(){var co=company||{};var LOGO='data:image/png;base64,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';var pD=function(d){if(!d)return null;var p=d.split('/');return new Date(p[2],p[1]-1,p[0]);};var fD=function(d){return d?String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear():'';};var gd=pD(order.deliveryDate);var ngDat=gd?fD(new Date(gd.getTime()-86400000)):'';var tot=(order.lines||[]).reduce(function(s,l){return s+(l.qtyInvoice||0);},0);var emCells='<td style="border:1px solid #555;height:40px"></td>'.repeat(10);var rows=(order.lines||[]).map(function(l,i){return '<tr><td style="border:1px solid #555;text-align:center;padding:4px;font-size:13px">'+(i+1)+'</td><td style="border:1px solid #555;padding:4px 8px;font-size:14px;text-align:left">'+(l.productName||'')+'</td><td style="border:1px solid #555;text-align:center;font-weight:bold;font-size:15px">'+(l.qtyInvoice||0)+'</td><td style="border:1px solid #555"></td><td style="border:1px solid #555;text-align:center;font-size:13px">'+(l.unit||'')+'</td>'+emCells+'</tr>';}).join('');var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Phieu giao hang</title><style>body{font-family:Arial,sans-serif;font-size:13px;margin:12px 20px}.hdr{display:flex;align-items:flex-start;margin-bottom:4px}table{width:100%;border-collapse:collapse}.it td{padding:3px 4px;font-size:14px;vertical-align:top}.lbl{font-size:13px;white-space:nowrap;width:200px}.val{font-weight:bold;font-size:15px}.mt th,.mt td{border:1px solid #555;text-align:center;font-size:12px;padding:3px 4px}.mt th{font-weight:bold;background:#f0f0f0}@media print{@page{margin:8mm;size:A4}body{margin:0}}<\/style><\/head><body><div class="hdr"><div style="width:85px;min-width:85px"><img src="'+LOGO+'" style="height:65px;width:auto"/></div><div style="flex:1;padding-left:10px"><div style="font-size:15px;font-weight:bold">'+(co.name||'CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG')+'</div><div style="font-size:12px;color:#333;margin-top:3px">'+(co.address||'Tổ 1, P.Mỏ Chè, Tp Sông Công, Thái Nguyên')+'</div></div></div><div style="text-align:center;font-size:26px;font-weight:bold;letter-spacing:2px;margin:8px 0 10px;border-bottom:2px solid #000;padding-bottom:6px">PHIẾU GIAO HÀNG</div><table class="it" style="margin-bottom:8px"><tr><td class="lbl">Tên khách hàng&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</td><td class="val">'+order.customer+'</td><td style="width:20px"></td><td></td></tr><tr><td class="lbl">Địa điểm giao hàng :</td><td class="val">'+(order.pointName||order.address||'')+'</td></tr><tr><td class="lbl">Ngày giao hàng&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</td><td class="val">'+order.deliveryDate+'</td><td class="lbl" style="padding-left:20px">Ngày đặt hàng :</td><td class="val">'+ngDat+'</td></tr><tr><td class="lbl">Giờ giao&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</td><td class="val">'+(order.deliveryTime||'')+'</td></tr></table><table class="mt"><thead><tr><th rowspan="2" style="width:30px">STT</th><th rowspan="2" style="min-width:180px;text-align:left;padding-left:6px">Tên hàng</th><th rowspan="2" style="width:65px">Số lượng</th><th rowspan="2" style="width:65px">Thực nhận</th><th rowspan="2" style="width:40px">ĐVT</th><th colspan="2">Kiểm tra</th><th colspan="4">Xuất đi</th><th colspan="4">Thu về</th></tr><tr><th style="width:32px;font-size:11px" class="th2">Đạt</th><th style="width:40px;font-size:11px" class="th2">Không đạt</th><th style="width:38px;font-size:11px" class="th2">T.trắng</th><th style="width:35px;font-size:11px" class="th2">T.xanh</th><th style="width:28px;font-size:11px" class="th2">Rổ</th><th style="width:32px;font-size:11px" class="th2">INOX</th><th style="width:38px;font-size:11px" class="th2">T.trắng</th><th style="width:35px;font-size:11px" class="th2">T.xanh</th><th style="width:28px;font-size:11px" class="th2">Rổ</th><th style="width:32px;font-size:11px" class="th2">INOX</th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr style="font-weight:bold;background:#f5f5f5"><td colspan="2" style="text-align:center;font-size:14px">Tổng</td><td style="font-size:15px">'+tot+'</td><td colspan="12"></td></tr></tfoot></table><table style="width:100%;margin-top:20px;border:none"><tr><td style="width:50%;text-align:center;border:none;font-size:14px;font-weight:bold">Người giao</td><td style="width:50%;text-align:center;border:none;font-size:14px;font-weight:bold">Người nhận</td></tr><tr><td style="text-align:center;border:none;font-size:12px;color:#555">(Ký, họ tên)</td><td style="text-align:center;border:none;font-size:12px;color:#555">(Ký, họ tên)</td></tr><tr><td style="height:60px;border:none"></td><td style="height:60px;border:none"></td></tr></table><\/body><\/html>';var w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(function(){w.print();},500);}},h('i',{className:'ti ti-printer',style:{fontSize:14}}),'In ngay'),
        h('button',{className:'bp',onClick:onClose},'Đóng')
      )
    )
  );
}
function OrderForm({order,copyMode=false,customers,products,quotes,employees,currentUser,prodShifts,prodCats,onSave,onClose}){
  const[f,sf]=useState(order?{...order,prodShiftAssignMode:order.prodShiftAssignMode==='manual'?'manual':'auto'}:{orderId:'',customerId:'',customer:'',pointId:'',pointName:'',address:'',deliveryDate:fmtDate(),deliveryTime:'08:00',prodShiftAssignMode:'auto',note:'',status:'pending',invoiceNo:'',workOut:'',workReturn:'',lines:[]});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const selCust=customers.find(c=>c.id===f.customerId);
  const matchedPoint=(f.pointId?(selCust?.points||[]).find(x=>x.id===f.pointId):null)||findOrderPointMatch(f,customers||[])?.point||null;
  const matchedPointArea=matchedPoint?.area||f.area||'';
  const resolvedPointName=matchedPoint?.name||f.pointName||f.address||'';
  const normPoint=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ');
  const allPoints=customers.flatMap(c=>(c.points||[]).filter(pt=>pt&&String(pt.name||'').trim()).map((pt,index)=>({...pt,
    customerId:c.id,customerName:c.name,
    pointKey:String(c.id||'')+'\u001f'+String(pt.id||('name_'+index+'_'+pt.name)),
    searchLabel:pt.name+(c.name?' - '+c.name:'')
  }))).sort((a,b)=>String(a.customerName||'').localeCompare(String(b.customerName||''),'vi')||String(a.name||'').localeCompare(String(b.name||''),'vi'));
  const pointById=allPoints.find(pt=>f.pointId&&String(pt.id||'')===String(f.pointId)&&(!f.customerId||String(pt.customerId||'')===String(f.customerId)));
  const pointNameMatches=allPoints.filter(pt=>normPoint(pt.name)===normPoint(f.pointName));
  const selectedPointOption=pointById||(pointNameMatches.length===1?pointNameMatches[0]:null);
  const [pointAreaFilter,setPointAreaFilter]=useState(()=>selectedPointOption?.area||f.area||'');
  const [pointQuery,setPointQuery]=useState(()=>selectedPointOption?.name||f.pointName||'');
  const [pointSearchOpen,setPointSearchOpen]=useState(false);
  const pointAreas=[...new Set(allPoints.map(pt=>String(pt.area||'').trim()).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'vi'));
  const pointSearchNeedle=normPoint(pointQuery);
  const matchingPointOptions=allPoints.filter(pt=>{
    if(pointAreaFilter&&normPoint(pt.area)!==normPoint(pointAreaFilter))return false;
    if(!pointSearchNeedle)return true;
    return normPoint([pt.name,pt.customerName,pt.address,pt.area].join(' ')).includes(pointSearchNeedle);
  });
  const visiblePointOptions=matchingPointOptions.slice(0,40);
  const pickPoint=pt=>{
    sf(p=>({...p,pointId:pt?.id||'',pointName:pt?.name||'',address:pt?.address||'',area:pt?.area||'',customerId:pt?.customerId||'',customer:pt?.customerName||''}));
  };
  const choosePoint=pt=>{
    pickPoint(pt);
    setPointAreaFilter(pt?.area||'');
    setPointQuery(pt?.name||'');
    setPointSearchOpen(false);
  };
  useEffect(()=>{
    if(!selectedPointOption)return;
    setPointAreaFilter(selectedPointOption.area||'');
    setPointQuery(selectedPointOption.name||'');
    if(String(f.pointId||'')===String(selectedPointOption.id||'')&&String(f.customerId||'')===String(selectedPointOption.customerId||''))return;
    pickPoint(selectedPointOption);
  },[selectedPointOption?.pointKey]);
  const addLine=()=>sf(p=>({...p,lines:[...p.lines,{id:uid(),productId:'',productName:'',unit:'',weightPerUnit:0,qtyProd:0,qtyInvoice:0,shift:'day',price:0,note:''}]}));
  const updLine=(id,data)=>sf(p=>({...p,lines:p.lines.map(l=>l.id===id?data:l)}));
  const delLine=id=>sf(p=>({...p,lines:p.lines.filter(l=>l.id!==id)}));
  const lineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const lineWeight=l=>{const p=products.find(x=>x.id===l.productId);const unit=String(l.unit||p?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');const qty=lineQty(l);if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;return (p?.weightPerUnit||numFmt(l.weightPerUnit)||0)*qty;};
  const totalWeight=f.lines.reduce((s,l)=>s+lineWeight(l),0);
  const totalPurchase=f.lines.reduce((s,l)=>{
    const p=products.find(x=>x.id===l.productId)||{};
    return s+(isGoodsProduct(p,prodCats||[])?lineQty(l)*numFmt(l.purchasePrice||l.price):0);
  },0);
  const hasLineOverrides=(f.lines||[]).some(line=>!!line.shiftOverride);
  // Tự động lấy ca SX từ giờ giao
  const autoShift=getProdShiftForOrder({...f,deliveryTime:f.deliveryTime,area:matchedPointArea||f.area||'',pointName:resolvedPointName||f.pointName||'',address:f.address||''},prodShifts||[],customers||[]);
  const prodShiftMode=f.prodShiftAssignMode==='manual'?'manual':'auto';
  const manualShift=prodShiftMode==='manual'?(prodShifts||[]).find(shift=>shift.id===f.prodShiftId)||null:null;
  const effectiveShift=prodShiftMode==='manual'?manualShift:autoShift;
  const timingForShift=shift=>({
    prodTime:shift?.actualProdTime||shift?.endTime||'',
    prodDate:shift?addDaysVN(f.deliveryDate,shift.prodDateOffset||0):'',
    labelTime:shift?.labelPrintTime||'',
    labelDate:shift?addDaysVN(f.deliveryDate,shift.labelPrintDateOffset||0):''
  });
  const defaultTiming=timingForShift(effectiveShift);
  const effectiveTiming=prodShiftMode==='manual'?{
    prodTime:normalizeTimeInput(f.prodTime||defaultTiming.prodTime),
    prodDate:f.prodDate||defaultTiming.prodDate,
    labelTime:normalizeTimeInput(f.labelTime||defaultTiming.labelTime),
    labelDate:f.labelDate||defaultTiming.labelDate
  }:defaultTiming;
  const submit=()=>{
    if(!f.customerId){window.showToast('Vui lòng chọn khách hàng!','warn');return;}
    const prodShiftAssignMode=hasLineOverrides?'auto':(f.prodShiftAssignMode==='manual'?'manual':'auto');
    const selectedShift=prodShiftAssignMode==='manual'?manualShift:autoShift;
    if(prodShiftAssignMode==='manual'&&!selectedShift){window.showToast('Vui lòng chọn Ca SX khi dùng chế độ chọn tay!','warn');return;}
    const prodShiftId=selectedShift?.id||'';
    const selectedDefaultTiming=timingForShift(selectedShift);
    const selectedTiming=prodShiftAssignMode==='manual'?{
      prodTime:normalizeTimeInput(f.prodTime||selectedDefaultTiming.prodTime),
      prodDate:f.prodDate||selectedDefaultTiming.prodDate,
      labelTime:normalizeTimeInput(f.labelTime||selectedDefaultTiming.labelTime),
      labelDate:f.labelDate||selectedDefaultTiming.labelDate
    }:selectedDefaultTiming;
    const lines=(f.lines||[]).map(line=>line.shiftOverride?line:{
      ...line,
      prodTime:selectedTiming.prodTime,
      prodDate:selectedTiming.prodDate,
      labelTime:selectedTiming.labelTime,
      labelDate:selectedTiming.labelDate
    });
    onSave({...f,area:matchedPointArea,prodShiftAssignMode,prodShiftId,
      prodTime:prodShiftAssignMode==='manual'?selectedTiming.prodTime:'',
      prodDate:prodShiftAssignMode==='manual'?selectedTiming.prodDate:'',
      labelTime:prodShiftAssignMode==='manual'?selectedTiming.labelTime:'',
      labelDate:prodShiftAssignMode==='manual'?selectedTiming.labelDate:'',
      lines,updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:copyMode?'Tạo đơn từ bản sao'+(order?.copySourceId?' · '+order.copySourceId:''):(order?'Sửa đơn '+order.id:'Tạo đơn giao hàng mới'),onClose,lg:true},
    copyMode&&h('div',{className:'order-copy-notice'},h('i',{className:'ti ti-copy'}),' Nội dung đã được sao chép từ đơn cũ. Kiểm tra ngày giao, số lượng rồi lưu để tạo mã đơn mới.'),
    h(F,{label:'Địa điểm giao * ('+customers.reduce((n,c)=>n+(c.points||[]).length,0)+' điểm)'},h('div',null,
      h('div',{className:'order-point-picker'},
        h('select',{className:'order-point-area',value:pointAreaFilter,onChange:e=>{setPointAreaFilter(e.target.value);setPointQuery('');setPointSearchOpen(true);},title:'Lọc địa điểm theo khu vực'},
          h('option',{value:''},'Tất cả khu vực'),
          pointAreas.map(area=>h('option',{key:area,value:area},area))
        ),
        h('div',{className:'order-point-search'},
          h('div',{className:'order-point-input-wrap'},
            h('i',{className:'fas fa-search','aria-hidden':'true'}),
            h('input',{value:pointQuery,onChange:e=>{setPointQuery(e.target.value);setPointSearchOpen(true);},onFocus:e=>{setPointSearchOpen(true);e.target.select();},onBlur:()=>setTimeout(()=>setPointSearchOpen(false),150),placeholder:'Gõ tên điểm giao hoặc khách hàng...',role:'combobox','aria-expanded':pointSearchOpen,'aria-autocomplete':'list'}),
            pointQuery&&h('button',{type:'button',className:'order-point-clear',title:'Xóa từ khóa',onMouseDown:e=>e.preventDefault(),onClick:()=>{setPointQuery('');setPointSearchOpen(true);}},'×')
          ),
          pointSearchOpen&&h('div',{className:'order-point-results',role:'listbox'},
            visiblePointOptions.length?visiblePointOptions.map(pt=>h('button',{type:'button',className:'order-point-option'+(pt.pointKey===selectedPointOption?.pointKey?' active':''),key:pt.pointKey,onMouseDown:e=>{e.preventDefault();choosePoint(pt);},role:'option','aria-selected':pt.pointKey===selectedPointOption?.pointKey},
              h('b',null,pt.name),
              h('small',null,[pt.customerName,pt.area,pt.address].filter(Boolean).join(' · '))
            )):h('div',{className:'order-point-empty'},'Không tìm thấy địa điểm phù hợp'),
            matchingPointOptions.length>40&&h('div',{className:'order-point-more'},'Có '+matchingPointOptions.length+' kết quả — hãy gõ thêm để thu hẹp')
          )
        )
      ),
      (f.pointName||f.customerId)&&h('div',{className:'order-point-current'},'Đã chọn: '+(f.pointName||'—')+(f.customer?' · '+f.customer:'')+(f.area?' · Khu vực: '+f.area:''))
    )),
    h('div',{className:'order-form-main-grid',style:{display:'grid',gridTemplateColumns:'140px 100px 100px 90px 90px 1fr',gap:'0 8px'}},
      h(F,{label:'Ngày giao'},h('input',{type:'date',value:toIsoDate(f.deliveryDate),onChange:e=>s('deliveryDate',e.target.value?vnDateFromISO(e.target.value):''),title:'Chọn ngày giao'})),
      h(F,{label:'Giờ giao'},h('input',{value:f.deliveryTime,onChange:e=>s('deliveryTime',e.target.value),placeholder:'08:00'})),
      h(F,{label:'Trạng thái'},h('select',{value:f.status,onChange:e=>s('status',e.target.value),style:{fontSize:12}},
        [['pending','Chờ xếp'],['assigned','Đã xếp'],['delivering','Đang giao'],['done','Đã giao'],['failed','Giao lỗi'],['cancelled','Hủy']].map(([v,l])=>h('option',{key:v,value:v},l))
      )),
      h(F,{label:'Công đi'},h('input',{type:'number',min:0,step:.5,value:f.workOut,onChange:e=>s('workOut',e.target.value),placeholder:'0'})),
      h(F,{label:'Công về'},h('input',{type:'number',min:0,step:.5,value:f.workReturn,onChange:e=>s('workReturn',e.target.value),placeholder:'0'})),
      h(F,{label:'Ghi chú chung'},h('input',{value:f.note,onChange:e=>s('note',e.target.value),placeholder:'Ghi chú cho toàn đơn...'})),
    ),
    !hasLineOverrides?h('div',{style:{padding:'9px 10px',background:prodShiftMode==='manual'?'#FFF8E1':'#E6F1FB',borderRadius:'var(--r)',marginBottom:8}},
      h('div',{className:'order-form-shift-grid',style:{display:'grid',gridTemplateColumns:'150px minmax(180px,260px) 1fr',gap:8,alignItems:'end'}},
        h(F,{label:'Cách chọn Ca SX'},h('select',{value:prodShiftMode,onChange:e=>{
          const mode=e.target.value;
          sf(prev=>({...prev,prodShiftAssignMode:mode,prodShiftId:mode==='manual'?(prev.prodShiftId||autoShift?.id||''):(autoShift?.id||''),...(mode==='auto'?{prodTime:'',prodDate:'',labelTime:'',labelDate:''}:{})}));
        }},
          h('option',{value:'auto'},'Tự động'),
          h('option',{value:'manual'},'Chọn tay')
        )),
        prodShiftMode==='manual'
          ?h(F,{label:'Ca SX chọn tay *'},h('select',{value:f.prodShiftId||'',onChange:e=>sf(prev=>({...prev,prodShiftId:e.target.value,prodTime:'',prodDate:'',labelTime:'',labelDate:''}))},
            h('option',{value:''},'— Chọn Ca SX —'),
            (prodShifts||[]).map(shift=>h('option',{key:shift.id,value:shift.id},shift.name||shift.id))
          ))
          :h(F,{label:'Ca SX tự động'},h('input',{value:autoShift?.name||'Không tìm thấy ca phù hợp',readOnly:true,style:{background:'#fff'}})),
        effectiveShift?h('div',{style:{alignSelf:'center',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',color:prodShiftMode==='manual'?'#8A5A00':'#185FA5'}},
          h('span',{className:'badge',style:{background:prodShiftMode==='manual'?'#FFF3CD':'#E8F5E9',color:prodShiftMode==='manual'?'#8A5A00':'#1B5E20'}},prodShiftMode==='manual'?'Đ.Tay':'T.Đ'),
          h('span',null,'Ngày SX: '+(effectiveTiming.prodDate||'—')),
          h('span',null,'Giờ SX: '+(effectiveTiming.prodTime||'—')),
          h('span',null,'In tem: '+(effectiveTiming.labelTime||'—')+' · '+(effectiveTiming.labelDate||'—'))
        ):h('div',{style:{alignSelf:'center',color:'#A32D2D'}},
          h('i',{className:'ti ti-alert-triangle',style:{marginRight:5}}),'Chưa tìm thấy Ca SX phù hợp.'
        )
      ),
      prodShiftMode==='manual'&&effectiveShift&&h('div',{className:'order-form-timing-grid',style:{display:'grid',gridTemplateColumns:'repeat(4,minmax(120px,1fr))',gap:8,marginTop:4}},
        h(F,{label:'Ngày SX *'},h('input',{type:'date',value:toIsoDate(effectiveTiming.prodDate),onChange:e=>s('prodDate',e.target.value?vnDateFromISO(e.target.value):'')})),
        h(F,{label:'Giờ SX *'},h('input',{type:'time',value:effectiveTiming.prodTime,onChange:e=>s('prodTime',e.target.value)})),
        h(F,{label:'Ngày in tem *'},h('input',{type:'date',value:toIsoDate(effectiveTiming.labelDate),onChange:e=>s('labelDate',e.target.value?vnDateFromISO(e.target.value):'')})),
        h(F,{label:'Giờ in tem *'},h('input',{type:'time',value:effectiveTiming.labelTime,onChange:e=>s('labelTime',e.target.value)}))
      )
    ):h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'#FFF3CD',color:'#7A4E00',border:'1px solid #F4C95D',borderRadius:'var(--r)',marginBottom:8,fontSize:12}},
      h('i',{className:'ti ti-lock',style:{fontSize:16}}),
      h('span',null,h('b',null,'Ca SX cấp đơn đang khóa. '),'Đơn có sản phẩm chỉnh tay nên kế hoạch SX được tính riêng theo từng dòng. Chuyển tất cả dòng về Tự động để mở lại phần cấp đơn.')
    ),
    h('div',{className:'divider'}),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},
      h('div',{style:{fontWeight:500,fontSize:13,color:'var(--pri3)'}},'Chi tiết hàng hóa'),
      h('div',{style:{fontSize:12,color:(totalWeight>0||totalPurchase>0)?'var(--pri)':'var(--tx2)'}},
        [totalWeight>0?'Tổng KL hóa đơn: '+totalWeight.toFixed(2)+' kg':'',totalPurchase>0?'Giá mua: '+moneyFmt(totalPurchase):''].filter(Boolean).join(' · ')
      )
    ),
      f.lines.map(l=>h(OrderDetailLine,{key:l.id,line:l,products,prodCats:prodCats||[],prodShifts:prodShifts||[],deliveryDate:f.deliveryDate,deliveryTime:f.deliveryTime,pointName:resolvedPointName,area:matchedPointArea,
        inheritedShift:hasLineOverrides?autoShift:effectiveShift,
        inheritedTiming:hasLineOverrides?timingForShift(autoShift):effectiveTiming,
        inheritedMode:hasLineOverrides?'auto':prodShiftMode,
        onChange:data=>updLine(l.id,data),onRemove:()=>delLine(l.id)})),
    h('button',{onClick:addLine,style:{fontSize:12,padding:'5px 12px',marginBottom:8}},h('i',{className:'ti ti-plus',style:{fontSize:13,marginRight:4}}),'Thêm hàng hóa'),
    h('div',{className:'form-actions order-form-actions'},h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu đơn hàng'))
  );
}


function isValidCustomerImportDate(value){
  const m=String(value??'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m)return false;
  const day=Number(m[1]),month=Number(m[2]),year=Number(m[3]);
  const date=new Date(year,month-1,day);
  return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day;
}
function customerImportColumnOffset(rawRows){
  const rows=(rawRows||[]).slice(0,100);
  const maxColumns=Math.min(12,Math.max(0,...rows.map(row=>(row||[]).length)));
  const hasText=value=>value!==null&&value!==undefined&&String(value).trim()!=='';
  const looksDate=value=>{
    if(value instanceof Date)return !Number.isNaN(value.getTime());
    if(typeof value==='number')return value>=20000&&value<=80000;
    const text=String(value??'').trim();
    return isValidCustomerImportDate(text)||/^\d{4}-\d{1,2}-\d{1,2}$/.test(text);
  };
  const looksQty=value=>{
    const text=String(value??'').trim().replace(',','.');
    return text!==''&&Number.isFinite(Number(text));
  };
  const looksTime=value=>/^(?:\d{1,2}\s*[hH](?:\s*\d{1,2})?|\d{1,2}[:.]\d{1,2})$/.test(String(value??'').trim());
  let bestOffset=0,bestScore=-1;
  for(let offset=0;offset<Math.max(1,maxColumns-3);offset++){
    let score=0,matchingRows=0;
    rows.forEach(row=>{
      const cells=(row||[]).slice(offset);
      if(!looksDate(cells[0])||!hasText(cells[1])||!hasText(cells[2])||!looksQty(cells[3]))return;
      matchingRows++;
      score+=8;
      if(looksTime(cells[4])||looksTime(cells[5]))score+=2;
    });
    if(matchingRows>0&&(score>bestScore||(score===bestScore&&offset<bestOffset))){bestOffset=offset;bestScore=score;}
  }
  return bestScore>=0?bestOffset:0;
}
function excelColumnName(index){
  let value=Math.max(0,Number(index)||0)+1,name='';
  while(value>0){value--;name=String.fromCharCode(65+(value%26))+name;value=Math.floor(value/26);}
  return name;
}
function customerImportOrderIssues(order){
  const issues=[];
  if(!isValidCustomerImportDate(order?.deliveryDate))issues.push('Ngày giao');
  const time=String(order?.deliveryTime??'').trim();
  const timeMatch=time.match(/^(\d{1,2}):(\d{2})$/);
  if(!timeMatch||Number(timeMatch[1])>23||Number(timeMatch[2])>59)issues.push('Giờ giao');
  const lines=Array.isArray(order?.lines)?order.lines:[];
  if(!lines.length)issues.push('Sản phẩm');
  lines.forEach((line,index)=>{
    const suffix=lines.length>1?' dòng '+(index+1):'';
    if(!String(line?.productName??'').trim())issues.push('Sản phẩm'+suffix);
    if(!(Number(line?.qtyProd)>0))issues.push('Số lượng đặt'+suffix);
    if(!(Number(line?.qtyInvoice)>0))issues.push('SL HĐ'+suffix);
  });
  return [...new Set(issues)];
}

function ImportProductSearch({products,value,onChange,suggestions=[],prodCats=[],showCategoryFilters=true,compact=false}){
  const normalize=value=>String(value||'').trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ');
  const label=product=>[product?.code||product?.id,product?.name].filter(Boolean).join(' - ');
  const selected=products.find(product=>String(product.id)===String(value));
  const selectedType=selected?(isGoodsProduct(selected,prodCats||[])?'HH':'TP'):'';
  const [productType,setProductType]=useState(selectedType);
  const [goodsGroup,setGoodsGroup]=useState(selected?.goodsGroup||'');
  const[query,setQuery]=useState(selected?label(selected):'');
  const[searchText,setSearchText]=useState(selected?label(selected):'');
  const[open,setOpen]=useState(false);
  useEffect(()=>{
    const text=selected?label(selected):'';
    setQuery(text);
    setSearchText(text);
    if(selected){
      setProductType(isGoodsProduct(selected,prodCats||[])?'HH':'TP');
      setGoodsGroup(selected.goodsGroup||'');
    }
  },[value,selected?.id]);
  useEffect(()=>{
    const timer=setTimeout(()=>setSearchText(query),180);
    return()=>clearTimeout(timer);
  },[query]);
  const score=(product,text)=>{
    const needle=normalize(text);
    if(!needle)return suggestions.findIndex(item=>String(item.product?.id)===String(product.id))>=0?2:1;
    const name=normalize(product.name),code=normalize(product.code||product.id),haystack=(code+' '+name).trim();
    if(code===needle||name===needle)return 100;
    if(name.startsWith(needle)||code.startsWith(needle))return 90;
    if(haystack.includes(needle))return 80;
    const tokens=needle.split(' ').filter(Boolean);
    const matched=tokens.filter(token=>haystack.includes(token)).length;
    if(matched)return 50+(matched/tokens.length)*20;
    let common=0;
    for(let i=0;i<needle.length-1;i++)if(haystack.includes(needle.slice(i,i+2)))common++;
    return needle.length>1?(common/(needle.length-1))*40:0;
  };
  const goodsGroups=React.useMemo(()=>[...new Set(products
    .filter(product=>isGoodsProduct(product,prodCats||[]))
    .map(product=>String(product.goodsGroup||'').trim())
    .filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi',{numeric:true})),[products,prodCats]);
  const filteredProducts=React.useMemo(()=>products.filter(product=>{
    if(productType==='TP'&&isGoodsProduct(product,prodCats||[]))return false;
    if(productType==='HH'&&!isGoodsProduct(product,prodCats||[]))return false;
    if(productType==='HH'&&goodsGroup&&String(product.goodsGroup||'')!==goodsGroup)return false;
    return true;
  }),[products,prodCats,productType,goodsGroup]);
  const options=React.useMemo(()=>{
    if(!open)return [];
    return filteredProducts.map(product=>({product,score:score(product,searchText)}))
      .filter(item=>!searchText.trim()||item.score>10)
      .sort((a,b)=>b.score-a.score||label(a.product).localeCompare(label(b.product),'vi',{numeric:true}))
      .slice(0,30);
  },[open,searchText,filteredProducts]);
  const choose=product=>{
    setQuery(label(product));
    setOpen(false);
    // Đóng danh sách và phản hồi ngay trên màn hình trước khi cập nhật modal lớn.
    requestAnimationFrame(()=>onChange(product.id));
  };
  return h('div',{style:{position:'relative',width:'100%'}},
    showCategoryFilters&&h('div',{style:{display:'grid',gridTemplateColumns:productType==='HH'?'72px minmax(100px,1fr)':'1fr',gap:4,marginBottom:4}},
      h('select',{
        value:productType,
        onChange:e=>{
          setProductType(e.target.value);
          setGoodsGroup('');
          setQuery('');
          setSearchText('');
          if(value)onChange('');
        },
        style:{fontSize:compact?11:12,padding:compact?'3px 5px':'5px 7px'}
      },
        h('option',{value:''},'TP / HH'),
        h('option',{value:'TP'},'TP'),
        h('option',{value:'HH'},'HH')
      ),
      productType==='HH'&&h('select',{
        value:goodsGroup,
        onChange:e=>{setGoodsGroup(e.target.value);setQuery('');setSearchText('');if(value)onChange('');},
        style:{fontSize:compact?11:12,padding:compact?'3px 5px':'5px 7px'}
      },
        h('option',{value:''},'Tất cả nhóm HH'),
        goodsGroups.map(group=>h('option',{key:group,value:group},group))
      )
    ),
    h('input',{
      value:query,
      onFocus:()=>setOpen(true),
      onChange:e=>{setQuery(e.target.value);if(value)onChange('');setOpen(true);},
      onBlur:()=>setTimeout(()=>setOpen(false),150),
      placeholder:productType?'Gõ tên hoặc mã sản phẩm...':'Chọn TP hoặc HH trước...',
      disabled:showCategoryFilters&&!productType,
      autoComplete:'off',
      role:'combobox',
      'aria-expanded':open,
      style:{width:'100%',fontSize:compact?12:13,borderColor:value?'#52b788':'#D9534F'}
    }),
    open&&h('div',{style:{position:'absolute',left:0,right:0,top:'calc(100% + 3px)',zIndex:80,maxHeight:260,overflowY:'auto',background:'#fff',border:'1px solid var(--bd)',borderRadius:'var(--r)',boxShadow:'0 8px 24px rgba(0,0,0,.18)'}},
      options.length
        ?options.map(({product,score},optionIndex)=>h('button',{
          key:String(product.id||product.code||'SP')+'-'+optionIndex,
          type:'button',
          onMouseDown:e=>{e.preventDefault();choose(product);},
          style:{display:'block',width:'100%',padding:'8px 10px',textAlign:'left',background:String(product.id)===String(value)?'#EAF3DE':'#fff',border:'none',borderBottom:'1px solid #eee',cursor:'pointer',fontSize:13}
        },
          h('div',{style:{fontWeight:600}},label(product)),
          searchText.trim()&&h('div',{style:{fontSize:10,color:'var(--tx2)'}},'Độ phù hợp '+Math.round(Math.min(100,score))+'%')
        ))
        :h('div',{style:{padding:'10px',fontSize:12,color:'var(--tx2)'}},'Không tìm thấy sản phẩm gần giống')
    )
  );
}
const MemoImportProductSearch=React.memo(ImportProductSearch,(prev,next)=>
  prev.products===next.products&&
  prev.prodCats===next.prodCats&&
  String(prev.value||'')===String(next.value||'')&&
  prev.suggestions===next.suggestions&&
  prev.showCategoryFilters===next.showCategoryFilters&&
  prev.compact===next.compact
);

/* ─── IMPORT PREVIEW MODAL ─── */
function ImportPreviewModal({data, customers, setCustomers, orders, setOrders, products=[], prodCats=[], prodShifts, onClose}) {
  const {newOrders=[], dupOrders=[], unknownPts=[], incompleteOrders=[], columnOffset=0} = data||{};
  const [skipDups, setSkipDups] = React.useState(true);
  const [includeIncomplete, setIncludeIncomplete] = React.useState(false);
  const [ptAssign, setPtAssign] = React.useState({}); // pointName -> customerId
  const [addToCustomer, setAddToCustomer] = React.useState({}); // pointName -> bool
  const [ptArea, setPtArea] = React.useState({}); // pointName -> area
  const [ptMerge, setPtMerge] = React.useState({}); // pointName -> existingPointId (gộp vào điểm có sẵn)
  const [skipPoint, setSkipPoint] = React.useState({}); // pointName -> bỏ qua toàn bộ đơn thuộc địa điểm
  const [productAssign, setProductAssign] = React.useState({}); // tên SP import -> productId trong danh mục

  // Hàm tính độ tương đồng tên (Levenshtein đơn giản)
  const similarity = (a, b) => {
    const s1 = (a||'').trim().toLowerCase().replace(/\s+/g,' ');
    const s2 = (b||'').trim().toLowerCase().replace(/\s+/g,' ');
    if(s1===s2) return 1;
    if(!s1||!s2) return 0;
    const longer = s1.length>s2.length?s1:s2;
    const shorter = s1.length>s2.length?s2:s1;
    if(longer.includes(shorter)) return shorter.length/longer.length;
    // Levenshtein
    const dp=Array.from({length:shorter.length+1},(_,i)=>i);
    for(let i=1;i<=longer.length;i++){
      let prev=i;
      for(let j=1;j<=shorter.length;j++){
        const val=longer[i-1]===shorter[j-1]?dp[j-1]:1+Math.min(dp[j-1],dp[j],prev);
        dp[j-1]=prev; prev=val;
      }
      dp[shorter.length]=prev;
    }
    return 1-dp[shorter.length]/longer.length;
  };

  // Mọi sản phẩm từ file KH bắt buộc phải khớp với một sản phẩm trong danh mục.
  const normalizeProductKey=value=>String(value||'').trim().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d')
    .replace(/\s+/g,' ').toUpperCase();
  const productById=id=>products.find(p=>String(p.id)===String(id));
  const productGroupKeyForLine=line=>normalizeProductKey(line?.productName)||('__EMPTY__'+String(line?.id||''));
  const unknownProductMap=new Map();
  newOrders.forEach(order=>(order.lines||[]).forEach(line=>{
    if(line.productId&&productById(line.productId))return;
    const rawName=String(line.productName||'').trim();
    const key=productGroupKeyForLine(line);
    const current=unknownProductMap.get(key)||{key,rawName:rawName||'Chưa có tên sản phẩm',count:0,rows:new Set()};
    current.count++;
    current.rows.add(order._importRow||'?');
    unknownProductMap.set(key,current);
  }));
  const unknownProductGroups=[...unknownProductMap.values()];
  const unresolvedProductGroups=unknownProductGroups.filter(group=>!productById(productAssign[group.key]));
  const sortedProducts=React.useMemo(
    ()=>[...products].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi')),
    [products]
  );
  const productSuggestions=React.useMemo(()=>{
    const result={};
    unknownProductGroups.forEach(group=>{
      result[group.key]=sortedProducts.map(product=>({product,score:similarity(group.rawName,product.name)}))
        .sort((a,b)=>b.score-a.score).slice(0,3);
    });
    return result;
  },[newOrders,sortedProducts]);

  // Tìm địa điểm gần giống (>= 75%) trong tất cả khách hàng
  const allExistingPts = customers.flatMap(c=>(c.points||[]).map(p=>({...p, custId:c.id, custName:c.name})));
  const similarMap = {}; // ptName -> [{pt, score}]
  unknownPts.forEach(pt=>{
    const matches = allExistingPts
      .map(ep=>({ep, score:similarity(pt, ep.name)}))
      .filter(x=>x.score>=0.75)
      .sort((a,b)=>b.score-a.score)
      .slice(0,3);
    if(matches.length>0) similarMap[pt]=matches;
  });

  const incompleteIssueMap=new Map(incompleteOrders.map(item=>[item.order.id,item.issues]));
  const candidateOrders=includeIncomplete?newOrders:newOrders.filter(o=>!incompleteIssueMap.has(o.id));
  const toImport = skipDups ? candidateOrders.filter(o=>!dupOrders.includes(o)) : candidateOrders;
  const resolvedProductForLine=line=>productById(line?.productId)||productById(productAssign[productGroupKeyForLine(line)]);
  const importableOrders=toImport.filter(order=>!skipPoint[order.pointName]).map(order=>({
    ...order,
    lines:(order.lines||[]).filter(line=>!!resolvedProductForLine(line))
  })).filter(order=>order.lines.length>0);
  const unresolvedPoints=unknownPts.filter(pt=>!skipPoint[pt]&&(
    !ptAssign[pt]||
    (!ptMerge[pt]&&!addToCustomer[pt])||
    (addToCustomer[pt]&&!ptArea[pt])
  ));

  const doImport = () => {
    if(unresolvedProductGroups.length){
      if(!confirm('Bạn vẫn bỏ qua các dòng thiếu sản phẩm ở trên?'))return;
    }
    if(!importableOrders.length){window.showToast('Không có dòng nào đã chọn được sản phẩm tương ứng để import.','warn');return;}
    if(unresolvedPoints.length){
      window.showToast('Vui lòng chọn khách hàng và địa điểm cho '+unresolvedPoints.length+' địa điểm mới.','warn');
      return;
    }
    const selectedIncomplete=importableOrders.filter(o=>incompleteIssueMap.has(o.id));
    if(selectedIncomplete.length){
      const detail=selectedIncomplete.slice(0,8).map(o=>'• Dòng '+(o._importRow||'?')+' - '+(o.pointName||'Chưa có địa điểm')+': '+incompleteIssueMap.get(o.id).join(', ')).join('\n');
      const more=selectedIncomplete.length>8?'\n... và '+(selectedIncomplete.length-8)+' đơn khác.':'';
      if(!confirm('Có '+selectedIncomplete.length+' đơn đang thiếu dữ liệu bắt buộc:\n'+detail+more+'\n\nBạn có chắc vẫn muốn import các đơn này không?'))return;
    }
    // Xử lý từng địa điểm mới
    Object.entries(ptAssign).forEach(([pt, custId]) => {
      if(!custId) return;
      const mergeIntoId = ptMerge[pt]; // gộp vào điểm đã có
      let resolvedPointId='', resolvedPointName='', resolvedPointArea='', resolvedPointAddress='';
      if(mergeIntoId) {
        // Gộp: dùng điểm đã có, không tạo mới
        const existing = allExistingPts.find(p=>String(p.id)===String(mergeIntoId)&&String(p.custId)===String(custId));
        if(existing){
          resolvedPointId=existing.id;
          resolvedPointName=existing.name;
          resolvedPointArea=existing.area||'';
          resolvedPointAddress=existing.address||'';
        }
      } else if(addToCustomer[pt]) {
        // Tạo mới
        const newId='PT'+uid();
        resolvedPointId=newId; resolvedPointName=pt;
        resolvedPointArea=ptArea[pt]||'';
        setCustomers(prev => prev.map(c => {
          if(String(c.id) !== String(custId)) return c;
          const pts = c.points||[];
          if(pts.find(p=>p.name.trim().toUpperCase()===pt.toUpperCase())) return c;
          return {...c, points:[...pts,{id:newId,name:pt,area:resolvedPointArea,address:''}]};
        }));
      }
      // Cập nhật đơn hàng với thông tin khách hàng & điểm giao
      const cust = customers.find(c=>String(c.id)===String(custId));
      if(cust) importableOrders.forEach(o=>{
        if(o.pointName.trim().toUpperCase()===pt.toUpperCase()){
          o.customerId=cust.id; o.customer=cust.name;
          if(resolvedPointId){
            o.pointId=resolvedPointId;
            o.pointName=resolvedPointName||pt;
            o.area=resolvedPointArea;
            o.address=resolvedPointAddress;
          }
        }
      });
    });
    const cleanOrders=importableOrders.map(o=>{
      const {_importRow,...clean}=o;
      return {...clean,lines:(o.lines||[]).map(line=>{
        const mapped=resolvedProductForLine(line);
        return {...line,productId:mapped.id,productName:mapped.name,unit:mapped.unit||line.unit,weightPerUnit:mapped.weightPerUnit||0};
      })};
    });
    setOrders(p=>[...p,...cleanOrders]);
    window.showToast('Đã import '+cleanOrders.length+' đơn hàng ('+cleanOrders.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng sản phẩm); các dòng không tìm được sản phẩm đã được bỏ qua.','success');
    onClose();
  };

  return h(Modal,{title:'Xem trước import đơn hàng',lg:true,onClose},
    columnOffset>0&&h('div',{style:{background:'#EAF3DE',border:'1px solid #52b788',borderRadius:'var(--r)',padding:'8px 12px',marginBottom:'1rem',fontSize:12,color:'#2D5A0E'}},
      'Đã tự nhận dạng dữ liệu bắt đầu từ cột '+excelColumnName(columnOffset)+'; các cột trống bên trái đã được bỏ qua.'
    ),
    // Summary
    h('div',{style:{display:'flex',gap:10,marginBottom:'1rem',flexWrap:'wrap'}},
      h('div',{style:{background:'#EAF3DE',border:'1px solid #52b788',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#2D5A0E'}},newOrders.length+' đơn mới'),
        h('div',{style:{color:'#555'}},newOrders.reduce((s,o)=>s+(o.lines||[]).length,0)+' sản phẩm')
      ),
      dupOrders.length>0&&h('div',{style:{background:'#FFF3CD',border:'1px solid #FFC107',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#856404'}},dupOrders.length+' đơn trùng'),
        h('div',{style:{color:'#555'}},'Cùng địa điểm + ngày + giờ')
      ),
      unknownPts.length>0&&h('div',{style:{background:'#FEE8E8',border:'1px solid #E06060',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#A32D2D'}},unknownPts.length+' địa điểm mới'),
        h('div',{style:{color:'#555'}},'Chưa có trong danh sách KH')
      ),
      unknownProductGroups.length>0&&h('div',{style:{background:'#FEE8E8',border:'1px solid #E06060',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#A32D2D'}},unknownProductGroups.length+' sản phẩm chưa khớp'),
        h('div',{style:{color:'#555'}},'Dòng không chọn được sản phẩm sẽ được bỏ qua')
      ),
      incompleteOrders.length>0&&h('div',{style:{background:'#FDECEC',border:'1px solid #D9534F',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#A32D2D'}},incompleteOrders.length+' đơn thiếu dữ liệu'),
        h('div',{style:{color:'#555'}},'Cần xác nhận trước khi import')
      )
    ),

    unknownProductGroups.length>0&&h('div',{style:{background:'#FFF5F5',border:'1px solid #D9534F',borderRadius:'var(--r)',padding:'12px',marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:4,fontSize:14,color:'#A32D2D'}},'Đối chiếu sản phẩm chưa có trong danh mục'),
      h('div',{style:{fontSize:12,color:'#6B1F1F',marginBottom:10}},'Dòng chọn được sản phẩm tương ứng sẽ được import và đổi sang đúng tên trong danh mục. Dòng không tìm được sản phẩm sẽ tự động bỏ qua.'),
      unknownProductGroups.map(group=>{
        const suggestions=productSuggestions[group.key]||[];
        return h('div',{key:group.key,style:{display:'grid',gridTemplateColumns:'minmax(180px,1fr) minmax(260px,1.5fr)',gap:10,alignItems:'center',padding:'8px 0',borderTop:'1px solid #f5c6c6'}},
          h('div',null,
            h('div',{style:{fontWeight:600,fontSize:13}},group.rawName),
            h('div',{style:{fontSize:11,color:'var(--tx2)'}},group.count+' dòng · dòng Excel '+[...group.rows].join(', ')),
            suggestions[0]&&suggestions[0].score>=0.45&&h('div',{style:{fontSize:11,color:'#856404',marginTop:2}},'Gợi ý gần nhất: '+suggestions[0].product.name+' ('+Math.round(suggestions[0].score*100)+'%)')
          ),
          h(MemoImportProductSearch,{
            products:sortedProducts,
            prodCats,
            value:productAssign[group.key]||'',
            suggestions,
            onChange:productId=>setProductAssign(prev=>({...prev,[group.key]:productId}))
          })
        );
      })
    ),

    incompleteOrders.length>0&&h('div',{style:{background:'#FFF5F5',border:'1px solid #D9534F',borderRadius:'var(--r)',padding:'12px',marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:8,fontSize:14,color:'#A32D2D'}},'⚠ Đơn chưa đủ thông tin bắt buộc:'),
      incompleteOrders.map(({order,issues})=>h('div',{key:order.id,style:{fontSize:12,padding:'3px 0',color:'#6B1F1F'}},
        '• Dòng '+(order._importRow||'?')+' — '+(order.pointName||'Chưa có địa điểm')+': thiếu '+issues.join(', ')
      )),
      h('div',{style:{marginTop:10,display:'flex',gap:16,flexWrap:'wrap'}},
        h('label',{style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}},
          h('input',{type:'radio',checked:!includeIncomplete,onChange:()=>setIncludeIncomplete(false)}),
          'Không import các đơn thiếu'
        ),
        h('label',{style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}},
          h('input',{type:'radio',checked:includeIncomplete,onChange:()=>setIncludeIncomplete(true)}),
          'Vẫn import — hỏi xác nhận lần cuối'
        )
      )
    ),

    // Duplicate handling
    dupOrders.length>0&&h('div',{style:{background:'#FFFBF0',border:'1px solid #FFC107',borderRadius:'var(--r)',padding:'12px',marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:8,fontSize:14}},'⚠️ Các đơn trùng:'),
      dupOrders.map(o=>h('div',{key:o.id,style:{fontSize:12,padding:'3px 0',color:'#666'}},
        '• '+o.deliveryDate+' '+o.deliveryTime+' — '+o.pointName
      )),
      h('div',{style:{marginTop:10,display:'flex',gap:16}},
        h('label',{style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}},
          h('input',{type:'radio',checked:skipDups,onChange:()=>setSkipDups(true)}),
          'Bỏ qua đơn trùng'
        ),
        h('label',{style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}},
          h('input',{type:'radio',checked:!skipDups,onChange:()=>setSkipDups(false)}),
          'Import thêm cả đơn trùng'
        )
      )
    ),

    // Unknown points handling
    unknownPts.length>0&&h('div',{style:{background:'#FEF6F6',border:'1px solid #E06060',borderRadius:'var(--r)',padding:'12px',marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:8,fontSize:14}},'🆕 Địa điểm giao mới — chưa có trong danh mục:'),
      unknownPts.map(pt=>{
        const similar = similarMap[pt]||[];
        const isMerging = !!ptMerge[pt];
        const isSkipped=!!skipPoint[pt];
        const selectedCustomer=customers.find(c=>String(c.id)===String(ptAssign[pt]||''));
        const customerPoints=selectedCustomer?.points||[];
        return h('div',{key:pt,style:{padding:'8px 0',borderBottom:'1px solid #f5c6c6',opacity:isSkipped?0.7:1}},
          // Tên địa điểm + badge gần giống
          h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:6}},
            h('span',{style:{fontWeight:600,fontSize:13}},pt),
            similar.length>0&&h('span',{style:{fontSize:11,background:'#FFF3CD',color:'#856404',
              border:'1px solid #FFC107',borderRadius:10,padding:'1px 8px'}},
              '⚠ có '+similar.length+' địa điểm gần giống'
            ),
            h('button',{
              type:'button',
              onClick:()=>setSkipPoint(prev=>({...prev,[pt]:!prev[pt]})),
              style:{marginLeft:'auto',padding:'4px 9px',fontSize:11,borderRadius:'var(--r)',border:'1px solid '+(isSkipped?'#52b788':'#D9534F'),background:isSkipped?'#EAF3DE':'#fff',color:isSkipped?'#216E4E':'#A32D2D',fontWeight:600}
            },isSkipped?'↩ Chọn lại':'⊘ Bỏ qua địa điểm này')
          ),
          isSkipped&&h('div',{style:{padding:'8px 10px',background:'#F2F4F3',borderRadius:'var(--r)',fontSize:12,color:'var(--tx2)'}},
            'Các đơn thuộc địa điểm này sẽ không được import.'
          ),
          // Gợi ý gần giống chỉ để tham khảo, không tự chọn/gộp.
          !isSkipped&&similar.length>0&&h('div',{style:{background:'#FFFBF0',border:'1px solid #FFC107',
            borderRadius:'var(--r)',padding:'8px 10px',marginBottom:6}},
            h('div',{style:{fontSize:12,fontWeight:600,color:'#856404',marginBottom:6}},
              '🔍 Địa điểm gần giống để tham khảo:'
            ),
            similar.map(({ep,score})=>h('div',{key:ep.id,
              style:{display:'flex',alignItems:'center',gap:8,padding:'4px 6px',borderRadius:4,marginBottom:2}
            },
              h('div',{style:{flex:1}},
                h('span',{style:{fontWeight:500,fontSize:12}},ep.name),
                h('span',{style:{fontSize:11,color:'var(--tx2)',marginLeft:6}},'('+ep.custName+')'),
                ep.area&&h('span',{style:{fontSize:11,background:'var(--bg2)',
                  padding:'0 5px',borderRadius:8,marginLeft:4}},ep.area)
              ),
              h('span',{style:{fontSize:11,color:'#856404',fontWeight:600}},
                Math.round(score*100)+'% giống'
              )
            ))
          ),
          // Bước 1: chọn khách hàng. Bước 2: chọn địa điểm của khách hàng hoặc tạo mới.
          !isSkipped&&h('div',{style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}},
            h('select',{
              value:ptAssign[pt]||'',
              onChange:e=>{
                setPtAssign(p=>({...p,[pt]:e.target.value}));
                setPtMerge(p=>{const n={...p};delete n[pt];return n;});
                setAddToCustomer(p=>({...p,[pt]:false}));
              },
              style:{padding:'4px 8px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',minWidth:160}
            },
              h('option',{value:''},'1. Chọn khách hàng...'),
              customers.map(c=>h('option',{key:c.id,value:c.id},c.name))
            ),
            h('select',{
              value:isMerging?ptMerge[pt]:(addToCustomer[pt]?'__new__':''),
              disabled:!selectedCustomer,
              onChange:e=>{
                const value=e.target.value;
                if(value==='__new__'){
                  setPtMerge(p=>{const n={...p};delete n[pt];return n;});
                  setAddToCustomer(p=>({...p,[pt]:true}));
                  return;
                }
                setPtMerge(p=>{
                  const n={...p};
                  if(value)n[pt]=value;
                  else delete n[pt];
                  return n;
                });
                setAddToCustomer(p=>({...p,[pt]:false}));
              },
              style:{padding:'4px 8px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',minWidth:210}
            },
              h('option',{value:''},selectedCustomer?'2. Chọn địa điểm...':'2. Chọn khách hàng trước'),
              customerPoints.map(point=>h('option',{key:point.id,value:point.id},point.name+(point.area?' · '+point.area:''))),
              h('option',{value:'__new__'},'+ Tạo địa điểm mới "'+pt+'"')
            ),
            !isMerging&&h('select',{
              value:ptArea[pt]||'',
              onChange:e=>setPtArea(p=>({...p,[pt]:e.target.value})),
              disabled:!addToCustomer[pt],
              style:{padding:'4px 8px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',minWidth:110}
            },
              h('option',{value:''},'— Khu vực —'),
              [...new Set(customers.flatMap(c=>(c.points||[]).map(p=>p.area)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi')).map(a=>h('option',{key:a,value:a},a))
            ),
            isMerging&&h('span',{style:{fontSize:12,color:'#856404',fontWeight:500}},
              '↪ Dùng địa điểm: "'+(customerPoints.find(p=>String(p.id)===String(ptMerge[pt]))?.name||'')+'"'
            ),
            addToCustomer[pt]&&h('span',{style:{fontSize:12,color:'var(--pri)',fontWeight:500}},
              '＋ Sẽ tạo địa điểm mới trong khách hàng '+(selectedCustomer?.name||'')
            )
          )
        );
      })
    ),

    // Orders preview table
    h('div',{style:{maxHeight:200,overflowY:'auto',marginBottom:'1rem'}},
      h('table',{style:{width:'100%',fontSize:12,borderCollapse:'collapse'}},
        h('thead',null,h('tr',{style:{background:'var(--bg2)'}},
          ['Ngày','Địa điểm','Giờ','Khách hàng','Sản phẩm','SL đặt','SL HĐ','Trạng thái'].map(c=>
            h('th',{key:c,style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)',fontWeight:600}},c)
          )
        )),
        h('tbody',null,importableOrders.map(o=>h('tr',{key:o.id},
          h('td',{style:{padding:'4px 8px'}},o.deliveryDate),
          h('td',{style:{padding:'4px 8px',fontWeight:500}},o.pointName),
          h('td',{style:{padding:'4px 8px'}},o.deliveryTime),
          h('td',{style:{padding:'4px 8px',color:'var(--tx2)'}},o.customer||h('span',{style:{color:'#E06060'}},'Chưa gán')),
          h('td',{style:{padding:'4px 8px',minWidth:150}},(o.lines||[]).map((line,index)=>
            h('div',{key:line.id||index,style:{whiteSpace:'nowrap',lineHeight:1.5}},(index+1)+'. '+(line.productName||'—'))
          )),
          h('td',{style:{padding:'4px 8px'}},(o.lines||[]).reduce((sum,line)=>sum+(Number(line.qtyProd)||0),0)),
          h('td',{style:{padding:'4px 8px'}},(o.lines||[]).reduce((sum,line)=>sum+(Number(line.qtyInvoice)||0),0)),
          h('td',{style:{padding:'4px 8px'}},
            incompleteIssueMap.has(o.id)?h('span',{style:{color:'#A32D2D',fontSize:11}},'⚠ thiếu: '+incompleteIssueMap.get(o.id).join(', ')):
            dupOrders.includes(o)?h('span',{style:{color:'#856404',fontSize:11}},'⚠️ trùng'):
            h('span',{style:{color:'#2D5A0E',fontSize:11}},'✓ mới')
          )
        )))
      )
    ),

    h(Row,null,
      h('button',{onClick:onClose},'Hủy'),
      h('button',{className:'bp',onClick:doImport,disabled:!toImport.length,style:{padding:'8px 20px'}},
        h('i',{className:'ti ti-file-import',style:{fontSize:14}}),
        ' Import '+importableOrders.length+' đơn'
      )
    )
  );
}

function ImageOrderImportModal({customers,products,orders,setOrders,prodShifts,onClose}) {
  const[file,setFile]=useState(null);
  const[img,setImg]=useState('');
  const[text,setText]=useState('');
  const[rows,setRows]=useState([]);
  const[busy,setBusy]=useState(false);
  const[progress,setProgress]=useState('');
  const inputRef=useRef(null);
  const norm=s=>String(s||'').trim().replace(/\s+/g,' ');
  const shiftTimes={'SANG':'03:00','SÁNG':'03:00','TRUA':'08:00','TRƯA':'08:00','CHIEU':'14:00','CHIỀU':'14:00','DEM':'20:00','ĐÊM':'20:00'};
  const noAccent=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').toUpperCase();
  const findPoint=line=>{
    const src=norm(line).toUpperCase();
    const plain=noAccent(src);
    let best=null;
    customers.forEach(c=>(c.points||[]).forEach(pt=>{
      const pn=norm(pt.name).toUpperCase();
      const pp=noAccent(pn);
      if(!pn)return;
      if(src.includes(pn)||pn.includes(src)||plain.includes(pp)||pp.includes(plain)||((plain.includes('DBG')||plain.includes('TANG 1'))&&pp.includes('DBG'))||(plain.includes('TRINA')&&pp.includes('TRINA'))){
        const score=Math.min(src.length,pn.length)/Math.max(src.length,pn.length);
        if(!best||score>best.score)best={cust:c,pt,score};
      }
    }));
    return best;
  };
  const findProduct=line=>{
    const src=norm(line).toUpperCase();
    let best=null;
    products.forEach(p=>{
      const pn=norm(p.name).toUpperCase();
      if(!pn)return;
      if(src.includes(pn)||pn.includes(src)){
        const score=Math.min(src.length,pn.length)/Math.max(src.length,pn.length);
        if(!best||score>best.score)best={prod:p,score};
      }
    });
    return best;
  };
  const readDate=line=>{
    const src=String(line||'');
    const hasDateContext=/\b(NGAY|NGÀY|DATE)\b/i.test(noAccent(src));
    const m=src.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?|\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/);
    if(!m)return '';
    const a=Number(m[1]||m[4]),b=Number(m[2]||m[5]);
    const yy=m[3]||m[6]||'';
    if(!yy&&!hasDateContext&&src.trim().length>12)return '';
    const y=yy?String(yy).padStart(4,'20'):String(new Date().getFullYear());
    if(a<=12&&b>12)return pad2(b)+'/'+pad2(a)+'/'+y;
    return pad2(a)+'/'+pad2(b)+'/'+y;
  };
  const readTime=line=>{
    const m=String(line||'').match(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/);
    return m?pad2(m[1])+':'+pad2(m[2]):'';
  };
  const findYoungsunCustomer=()=>customers.find(c=>noAccent(c.name).includes('YOUNG')||noAccent(c.name).includes('YOUNGSUN'))||{};
  const excelOrderId=(date,index)=>{
    const p=String(date||fmtDate()).split('/');
    const dd=pad2(p[0]),mm=pad2(p[1]),yy=String(p[2]||new Date().getFullYear()).slice(-2);
    return 'D'+yy+dd+mm+String(index).padStart(3,'0');
  };
  const dateFromShort=(s,baseDate)=>{
    const src=noAccent(s);
    const shift='SANG|TRUA|CHIEU|DEM';
    const m=src.match(new RegExp('(?:'+shift+')\\s*(\\d{1,2})[\\/\\-.](\\d{1,2})\\b|\\b(\\d{1,2})[\\/\\-.](\\d{1,2})\\s*(?:'+shift+')'));
    if(!m)return '';
    const y=(baseDate&&baseDate.split('/')[2])||String(new Date().getFullYear());
    return pad2(m[1]||m[3])+'/'+pad2(m[2]||m[4])+'/'+y;
  };
  const guessShiftItems=(note,totalQty,baseDate)=>{
    const src=noAccent(note);
    const parts=src.split(/[\/;,]+/).map(x=>x.trim()).filter(Boolean);
    const detailed=[];
    parts.forEach(part=>{
      const k=Object.keys(shiftTimes).find(x=>part.includes(x));
      if(!k)return;
      const dt=dateFromShort(part,baseDate);
      const noDate=part.replace(/\b\d{1,2}[\/\-.]\d{1,2}\b/g,' ');
      const nums=[...noDate.matchAll(/(\d+(?:[,.]\d+)?)(?=\s*(KG|K|$))/g)].map(m=>numFmt(m[1])).filter(Boolean);
      detailed.push({key:k,time:shiftTimes[k],date:dt||baseDate,qty:nums.length?nums[nums.length-1]:totalQty});
    });
    if(detailed.length)return detailed;
    const found=Object.keys(shiftTimes).filter(k=>src.includes(k)).map(k=>({key:k,time:shiftTimes[k],date:dateFromShort(src,baseDate)||baseDate}));
    const uniq=[];found.forEach(x=>{if(!uniq.some(u=>u.time===x.time))uniq.push(x);});
    const hourOnly=src.match(/\b([01]?\d|2[0-3])\s*H\b/);
    if(!uniq.length)return [{time:hourOnly?pad2(hourOnly[1])+':00':'08:00',date:dateFromShort(src,baseDate)||baseDate,qty:totalQty,shift:''}];
    if(uniq.length===1)return [{time:uniq[0].time,date:uniq[0].date,qty:totalQty,shift:uniq[0].key}];
    return uniq.map((x,i)=>{
      const tail=src.slice(src.indexOf(x.key)+x.key.length);
      const m=tail.match(/(\d+(?:[,.]\d+)?)/);
      return {time:x.time,date:x.date,qty:m?numFmt(m[1]):(i===0?totalQty:0),shift:x.key};
    }).filter(x=>x.qty>0);
  };
  const parseYoungsunText=raw=>{
    const lines=String(raw||'').replace(/\r/g,'\n').split('\n').map(norm).filter(Boolean);
    const joined=lines.join(' ');
    if(!/(?:[BTK8]\d{3,})/i.test(joined)||!/SC/i.test(joined))return [];
    let curDate=readDate(joined)||'';let curPoint='';
    lines.forEach(line=>{
      const d=readDate(line);if(d)curDate=d;
      const plain=noAccent(line);
      if(plain.includes('TRINA'))curPoint='TRINA';
      if(plain.includes('DBG'))curPoint=plain.includes('TANG')?'DBG tầng 1':'DBG';
    });
    const cust=findYoungsunCustomer();
    const resultMap={};
    const ensureOrder=(point,time,date)=>{
      const ptMatch=findPoint(point);
      const pt=ptMatch?.pt||{};
      const c=ptMatch?.cust||cust;
      const d=date||curDate||fmtDate();
      const key=(point||'')+'|'+d+'|'+time;
      if(!resultMap[key])resultMap[key]={id:excelOrderId(d,Object.keys(resultMap).length+1),deliveryDate:d,deliveryTime:time,pointId:pt.id||'',pointName:pt.name||point,customerId:c.id||'',customer:c.name||'YOUNGSUN',address:pt.address||'',area:pt.area||'',status:'pending',note:'Nhập từ ảnh Youngsun OCR',workOut:0,workReturn:0,prodShiftId:(getProdShiftForOrder({deliveryDate:d,deliveryTime:time,pointId:pt.id||'',pointName:pt.name||point,customerId:c.id||'',customer:c.name||'YOUNGSUN',address:pt.address||'',area:pt.area||''},prodShifts||[],customers||[])||{}).id||'',lines:[],createdAt:fmtDate(),updatedAt:fmtDT()};
      return resultMap[key];
    };
    lines.forEach(line=>{
      const plain=noAccent(line);
      if(/^(BEP|NGAY|MA\b|TEN\b|NCC\b|DVT\b|GHI CHU\b|SL\b)/.test(plain))return;
      if(!/\bSC\b/i.test(line))return;
      let m=line.match(/\b([BTK8]\d{3,})\b[\s.,;:-]+(.+?)\s+SC\s+([A-ZÀ-Ỹa-zà-ỹ]+)\s+(\d+(?:[,.]\d+)?)(?:\s+(.+))?$/i);
      if(!m){
        const loose=line.match(/\b([BTK8]\d{3,})\b[\s.,;:-]+(.+?)\s+SC\s+([A-ZÀ-Ỹa-zà-ỹ]{1,5})\s+(\d+(?:[,.]\d+)?)(.*)$/i);
        if(loose)m=loose;
      }
      if(!m){
        const simple=line.match(/\b([BTK8]\d{3,})\b[\s.,;:-]+(.+?)\s+(\d+(?:[,.]\d+)?)(?:\s+(.+))?$/i);
        if(simple){
          const rawTail=norm(simple[2]).replace(/\bSC\b/ig,'').trim();
          const unitMatch=rawTail.match(/\b(KG|K|G|CAI|CÁI|GOI|GÓI|THUNG|THÙNG|HOP|HỘP|BAO|BO|BỘ|LIT|LÍT)\b$/i);
          const rawUnit=unitMatch?unitMatch[1]:'KG';
          m=[null,simple[1],unitMatch?rawTail.replace(unitMatch[0],'').trim():rawTail,rawUnit,simple[3],simple[4]||''];
        }
      }
      if(!m)return;
      let code=m[1].toUpperCase();
      if(/^8\d{4}$/.test(code))code='B'+code.slice(1);
      let rawName=norm(m[2])
        .replace(/~?SL\s*D[ẠA]T|DAT\s*HA|ĐẠT\s*HÀ|DAT|H[Il]GHICHU|GHI\s*CHU/ig,'')
        .replace(/\bNCC\b|\bDVT\b/ig,'')
        .trim();
      if(!rawName||/^(TEN|TÊN)$/i.test(rawName))return;
      const unit=(m[3]||'KG').toUpperCase(), total=numFmt(m[4]), note=m[5]||'';
      const prodMatch=findProduct(rawName);
      const prod=prodMatch?.prod||products.find(p=>noAccent(p.name)===noAccent(rawName))||{};
      const lineDate=dateFromShort(note,curDate)||curDate;
      const items=guessShiftItems(note,total,lineDate);
      items.forEach(it=>{
        const o=ensureOrder(curPoint||'YOUNGSUN',it.time,it.date||lineDate);
        o.lines.push({id:uid(),productId:prod.id||'',productName:prod.name||rawName,customerCode:code,unit,weightPerUnit:prod.weightPerUnit||0,qtyProd:it.qty,qtyInvoice:it.qty,shift:it.time==='20:00'?'night':'day',note:note});
      });
    });
    return Object.values(resultMap).filter(o=>o.lines.length);
  };
  const parseText=raw=>{
    const youngsun=parseYoungsunText(raw);
    if(youngsun.length)return youngsun;
    const clean=String(raw||'').replace(/\r/g,'\n').replace(/[|]/g,' ').split('\n').map(norm).filter(Boolean);
    const result=[];let cur=null;let curDate='';
    const flush=()=>{if(cur&&cur.lines.length)result.push(cur);cur=null;};
    clean.forEach(line=>{
      const d=readDate(line);if(d)curDate=d;
      const t=readTime(line);
      const ptMatch=findPoint(line);
      if(ptMatch||t){
        if(ptMatch||(!cur&&t)){
          if(cur&&cur.lines.length)flush();
          const pt=ptMatch?.pt||{};
          const cust=ptMatch?.cust||{};
          const od=d||curDate||fmtDate();
          cur={id:excelOrderId(od,result.length+1),deliveryDate:od,deliveryTime:t||'08:00',pointId:pt.id||'',pointName:pt.name||line.replace(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/g,'').trim(),customerId:cust.id||'',customer:cust.name||'',address:pt.address||'',area:pt.area||'',status:'pending',note:'Nhập từ ảnh OCR',workOut:0,workReturn:0,prodShiftId:(getProdShiftForOrder({deliveryDate:od,deliveryTime:t||'08:00',pointId:pt.id||'',pointName:pt.name||line.replace(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/g,'').trim(),customerId:cust.id||'',customer:cust.name||'',address:pt.address||'',area:pt.area||''},prodShifts||[],customers||[])||{}).id||'',lines:[],createdAt:fmtDate(),updatedAt:fmtDT()};
        } else if(cur&&t) cur.deliveryTime=t;
      }
      if(!cur)return;
      const qtyMatch=line.match(/(\d+(?:[,.]\d+)?)\s*(kg|kgs|gói|goi|cái|cai|thùng|thung|túi|tui|hộp|hop|bao|bộ|bo|lít|lit)?\s*$/i);
      const prodMatch=findProduct(line);
      if(qtyMatch&&(prodMatch||!ptMatch)){
        const qty=numFmt(qtyMatch[1]);
        let name=line.replace(qtyMatch[0],'').replace(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/g,'').trim();
        if(prodMatch)name=prodMatch.prod.name;
        if(name&&name.length>1){
          const prod=prodMatch?.prod||products.find(p=>norm(p.name).toUpperCase()===name.toUpperCase())||{};
          const unit=qtyMatch[2]||prod.unit||'Kg';
          cur.lines.push({id:uid(),productId:prod.id||'',productName:name,unit,weightPerUnit:prod.weightPerUnit||0,qtyProd:qty,qtyInvoice:qty,shift:'day',note:''});
        }
      }
    });
    flush();
    return result.filter(o=>o.lines.length);
  };
  const setImageFile=f=>{
    if(!f)return;
    setFile(f);setRows([]);setText('');
    const r=new FileReader();
    r.onload=e=>setImg(e.target.result);
    r.readAsDataURL(f);
  };
  const runOcr=async()=>{
    if(!file){window.showToast('Hãy chọn hoặc kéo ảnh vào trước.','warn');return;}
    setBusy(true);setProgress('Đang đọc ảnh...');
    try{
      if(!window.Tesseract)await window.scfLoadExternalScript('tesseract');
      const res=await Tesseract.recognize(file,'vie+eng',{logger:m=>{if(m.status)setProgress(m.status+(m.progress?(' '+Math.round(m.progress*100)+'%'):''));}});
      const txt=res?.data?.text||'';
      setText(txt);
      setRows(parseText(txt));
      setProgress('Đã đọc xong');
    }catch(e){window.showToast('Không đọc được ảnh: '+(e.message||e),'error');}
    finally{setBusy(false);}
  };
  const reparse=()=>setRows(parseText(text));
  const updateOrder=(id,data)=>setRows(p=>p.map(o=>o.id===id?{...o,...data}:o));
  const updateLine=(oid,lid,data)=>setRows(p=>p.map(o=>o.id===oid?{...o,lines:o.lines.map(l=>l.id===lid?{...l,...data}:l)}:o));
  const allPoints=(customers||[]).flatMap(c=>(c.points||[]).map(pt=>({...pt,customerId:c.id,customerName:c.name})));
  const updatePointName=(id,value)=>{
    const m=findPoint(value);
    updateOrder(id,{pointName:value,pointId:m?.pt?.id||'',address:m?.pt?.address||'',area:m?.pt?.area||'',customerId:m?.cust?.id||'',customer:m?.cust?.name||''});
  };
  const setPointById=(id,pointId)=>{
    if(!pointId){updateOrder(id,{pointId:'',pointName:'',address:'',area:'',customerId:'',customer:''});return;}
    const pt=allPoints.find(x=>x.id===pointId)||{};
    updateOrder(id,{pointId:pt.id||'',pointName:pt.name||'',address:pt.address||'',area:pt.area||'',customerId:pt.customerId||'',customer:pt.customerName||''});
  };
  const setProductById=(oid,lid,productId)=>{
    if(!productId){updateLine(oid,lid,{productId:'',productName:'',unit:'',weightPerUnit:0});return;}
    const p=(products||[]).find(x=>x.id===productId)||{};
    updateLine(oid,lid,{productId:p.id||'',productName:p.name||'',unit:p.unit||'',weightPerUnit:p.weightPerUnit||0});
  };
  const importRows=()=>{
    if(!rows.length){window.showToast('Chưa có đơn hàng nào để nhập.','warn');return;}
    const unmatchedLines=rows.flatMap(order=>(order.lines||[]).filter(line=>!line.productId||!(products||[]).some(product=>String(product.id)===String(line.productId))));
    if(unmatchedLines.length){
      window.showToast('Còn '+unmatchedLines.length+' dòng sản phẩm chưa khớp danh mục. Hãy chọn sản phẩm tương ứng trước khi nhập.','warn');
      return;
    }
    const dup=rows.filter(o=>orders.some(ex=>ex.deliveryDate===o.deliveryDate&&ex.pointName===o.pointName&&ex.deliveryTime===o.deliveryTime));
    const finalRows=dup.length&&confirm('Có '+dup.length+' đơn có thể bị trùng. Bỏ qua đơn trùng?')?rows.filter(o=>!dup.includes(o)):rows;
    if(!finalRows.length){window.showToast('Không còn đơn hàng mới để nhập.','info');return;}
    setOrders(p=>[...p,...finalRows]);
    window.showToast('Đã nhập '+finalRows.length+' đơn hàng từ ảnh.','success');
    onClose();
  };
  return h(Modal,{title:'Tự động lấy đơn từ ảnh',lg:true,onClose},
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,alignItems:'start'}},
      h('div',null,
        h('div',{
          onDragOver:e=>{e.preventDefault();},
          onDrop:e=>{e.preventDefault();setImageFile(e.dataTransfer.files&&e.dataTransfer.files[0]);},
          onClick:()=>inputRef.current&&inputRef.current.click(),
          style:{border:'1.5px dashed var(--pri)',borderRadius:'var(--rl)',padding:'1.25rem',minHeight:220,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',cursor:'pointer',background:'#f7fbf8',overflow:'hidden'}
        },
          img?h('img',{src:img,style:{maxWidth:'100%',maxHeight:260,objectFit:'contain'}})
          :h('div',null,h('i',{className:'ti ti-photo-scan',style:{fontSize:44,color:'var(--pri)',display:'block',marginBottom:8}}),'Kéo ảnh vào đây hoặc bấm để chọn ảnh')
        ),
        h('input',{ref:inputRef,type:'file',accept:'image/*',style:{display:'none'},onChange:e=>setImageFile(e.target.files&&e.target.files[0])}),
        h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}},
          h('button',{className:'bp',onClick:runOcr,disabled:busy},h('i',{className:'ti ti-scan-text',style:{fontSize:14}}),busy?'Đang đọc...':'AI/OCR đọc ảnh'),
          h('button',{onClick:reparse,disabled:busy||!text},h('i',{className:'ti ti-table-import',style:{fontSize:14}}),'Vào bảng xem trước')
        ),
        progress&&h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:8}},progress)
      ),
      h('div',null,
        h(F,{label:'Nội dung OCR'},h('textarea',{value:text,onChange:e=>setText(e.target.value),rows:12,placeholder:'Sau khi OCR, chữ đọc được sẽ hiện ở đây. Có thể sửa rồi bấm Tách lại dữ liệu.'})),
        h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Mẹo: ảnh rõ, thẳng, đủ sáng và mỗi dòng có tên hàng + số lượng sẽ đọc tốt hơn.')
      )
    ),
    h('div',{style:{marginTop:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:8,color:'var(--pri3)'}},'Bảng xem trước ('+rows.length+' đơn, '+rows.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng hàng)'),
      h('div',{className:'tw',style:{maxHeight:260}},
        h('table',null,
          h('thead',null,h('tr',null,...['Thông tin đơn','Dòng hàng trong đơn'].map(c=>h('th',{key:c},c)))),
          h('tbody',null,rows.length?rows.map(o=>h('tr',{key:o.id},
            h('td',null,
              h('div',{style:{display:'grid',gridTemplateColumns:'92px 70px',gap:5,marginBottom:5}},
                h('input',{value:o.deliveryDate,onChange:e=>updateOrder(o.id,{deliveryDate:e.target.value}),style:{fontSize:12,padding:'5px 6px'}}),
                h('input',{value:o.deliveryTime,onChange:e=>updateOrder(o.id,{deliveryTime:e.target.value,prodShiftId:(getProdShiftForOrder({...o,deliveryTime:e.target.value},prodShifts||[],customers||[])||{}).id||''}),style:{fontSize:12,padding:'5px 6px'}})
              ),
              h('select',{value:o.pointId||'__current__',onChange:e=>e.target.value==='__current__'?null:setPointById(o.id,e.target.value),style:{width:'100%',fontSize:12,padding:'5px 6px',fontWeight:600,marginBottom:4}},
                !o.pointId&&h('option',{value:'__current__'},(o.pointName||'— Chọn địa điểm —')+' (chưa khớp)'),
                h('option',{value:''},'— Chọn địa điểm —'),
                allPoints.map(pt=>h('option',{key:pt.id,value:pt.id},pt.customerName+' - '+pt.name))
              ),
              h('input',{value:o.customer||'',readOnly:true,style:{width:'100%',fontSize:12,padding:'5px 6px',background:'#f7faf8'}}),
              !o.pointId&&h('div',{style:{fontSize:11,color:'#A32D2D',marginTop:2}},'Chưa khớp danh mục')
            ),
            h('td',null,
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:5}},(o.lines||[]).length+' dòng hàng'),
              (o.lines||[]).map(l=>h('div',{key:l.id,style:{display:'grid',gridTemplateColumns:'70px minmax(180px,1fr) 64px 58px',gap:5,marginBottom:5,alignItems:'center'}},
                h('input',{value:l.customerCode||'',onChange:e=>updateLine(o.id,l.id,{customerCode:e.target.value}),placeholder:'Mã',style:{fontSize:12,padding:'4px 5px'}}),
                h('select',{value:l.productId||'__current__',onChange:e=>e.target.value==='__current__'?null:setProductById(o.id,l.id,e.target.value),style:{fontSize:12,padding:'4px 5px'}},
                  !l.productId&&h('option',{value:'__current__'},(l.productName||'— Chọn sản phẩm —')+' (chưa khớp)'),
                  h('option',{value:''},'— Chọn sản phẩm —'),
                  (products||[]).map(p=>h('option',{key:p.id,value:p.id},(p.code?p.code+' - ':'')+p.name))
                ),
                h('input',{value:l.qtyInvoice,onChange:e=>updateLine(o.id,l.id,{qtyInvoice:numFmt(e.target.value),qtyProd:numFmt(e.target.value)}),placeholder:'SL',style:{fontSize:12,padding:'4px 5px'}}),
                h('input',{value:l.unit||'',onChange:e=>updateLine(o.id,l.id,{unit:e.target.value}),placeholder:'ĐVT',style:{fontSize:12,padding:'4px 5px'}})
              ))
            )
          )):h('tr',null,h('td',{colSpan:2,className:'empty-st'},'Chưa có dữ liệu xem trước.')))
        )
      )
    ),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:importRows,disabled:busy||!rows.length},h('i',{className:'ti ti-file-import',style:{fontSize:14}}),'Nhập đơn hàng'))
  );
}

function PrintByCustomerModal({orders,customers,products,company,initialDate,onClose}) {
  const [custId,sCust]=useState('');
  const [df,sdf]=useState(initialDate||'');
  const [dt,sdt]=useState(initialDate||'');
  const [tpl,setTpl]=useState('welstory');
  const [selected,setSelected]=useState({});
  const parseD=s=>{
    if(!s)return null;
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);}
    const[d,m,y]=String(s).split('/').map(Number);return new Date(y,m-1,d);
  };
  const inRange=d=>{
    const dt2=parseD(d);if(!dt2)return false;
    const f=df?parseD(df):null;const t=dt?parseD(dt):null;
    if(f&&dt2<f)return false;if(t&&dt2>t)return false;return true;
  };
  const selectedCustomer=customers.find(c=>c.id===custId);
  const orderDate=o=>o.deliveryDate||o.date||o.ngayGiao||'';
  const filtered=orders.filter(o=>
    o.status!=='cancelled'&&
    (!custId||o.customerId===custId||o.custId===custId||selectedCustomer?.name===o.customer)&&
    inRange(orderDate(o))
  ).sort((a,b)=>{
    const da=parseD(orderDate(a));const db=parseD(orderDate(b));
    const dateDiff=(da&&db)?da-db:String(orderDate(a)).localeCompare(String(orderDate(b)));
    return dateDiff||((a.deliveryTime||'').localeCompare(b.deliveryTime||''));
  });
  const selectedOrders=filtered.filter(o=>selected[o.id]!==false);
  const allChecked=filtered.length>0&&selectedOrders.length===filtered.length;
  const toggleAll=checked=>setSelected(p=>{const n={...p};filtered.forEach(o=>{n[o.id]=checked;});return n;});
  const toggleOne=(id,checked)=>setSelected(p=>({...p,[id]:checked}));

  const doPrint=()=>{
    if(!selectedOrders.length){window.showToast('Chọn ít nhất 1 đơn để in!','warn');return;}
    const extractPart=(html,tag)=>{
      const m=String(html||'').match(new RegExp('<'+tag+'[^>]*>([\\s\\S]*?)<\\/'+tag+'>','i'));
      return m?m[1]:'';
    };
    const docs=selectedOrders.map(o=>buildPrintHTML(tpl,o,company));
    const style=extractPart(docs[0],'style');
    const bodyParts=docs.map((html,idx)=>{
      const body=extractPart(html,'body')||html;
      return idx<docs.length-1?body+'<div style="page-break-after:always"></div>':body;
    }).join('');
    const printHtml='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Phieu giao hang</title><style>'+style+'<\/style><\/head><body>'+bodyParts+'<\/body><\/html>';
    if(window.scfShouldUsePrintAgent?.()){
      window.scfQueueA4Print(printHtml,{title:'Phiếu giao hàng · '+selectedOrders.length+' đơn'})
        .then(()=>window.showToast('Đã gửi '+selectedOrders.length+' đơn tới Canon 2900.','success'))
        .catch(error=>window.showToast(error?.message||'Chưa gửi được lệnh in tới Canon 2900.','error'));
      return;
    }
    const win=window.open('','_blank');
    win.document.write(printHtml);
    win.document.close();
    setTimeout(function(){win.print();},500);
  };

  return h(Modal,{title:'In phiếu giao hàng theo khách hàng',lg:true,onClose},
    h('div',{className:'g4'},
      h(F,{label:'Khách hàng'},h('select',{value:custId,onChange:e=>sCust(e.target.value)},
        h('option',{value:''},'— Tất cả —'),
        customers.map(c=>h('option',{key:c.id,value:c.id},c.name))
      )),
      h(F,{label:'Mẫu in'},h('select',{value:tpl,onChange:e=>setTpl(e.target.value)},
        PRINT_TEMPLATES.map(t=>h('option',{key:t.id,value:t.id},t.name))
      )),
      h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})),
      h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)}))
    ),
    filtered.length>0?h('div',null,
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:'1rem',fontSize:13}},
        h('i',{className:'ti ti-file-invoice',style:{color:'var(--pri)',marginRight:6}}),
        h('strong',null,selectedOrders.length+'/'+filtered.length+' phiếu đã chọn'),
        ' — '+selectedOrders.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng sản phẩm'
      ),
      h('div',{style:{maxHeight:200,overflowY:'auto',marginBottom:'1rem'}},
        h('table',{style:{width:'100%',fontSize:12,borderCollapse:'collapse'}},
          h('thead',null,h('tr',{style:{background:'var(--bg2)'}},
            h('th',{style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)',width:34}},
              h('input',{type:'checkbox',checked:allChecked,onChange:e=>toggleAll(e.target.checked),style:{width:'auto'}})
            ),
            ['Ngày','Địa điểm','Giờ','SP'].map(c=>h('th',{key:c,style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)'}},c))
          )),
          h('tbody',null,filtered.map(o=>h('tr',{key:o.id},
            h('td',{style:{padding:'4px 8px'}},h('input',{type:'checkbox',checked:selected[o.id]!==false,onChange:e=>toggleOne(o.id,e.target.checked),style:{width:'auto'}})),
            h('td',{style:{padding:'4px 8px'}},orderDate(o)),
            h('td',{style:{padding:'4px 8px',fontWeight:500}},o.pointName||'—'),
            h('td',{style:{padding:'4px 8px'}},o.deliveryTime||'—'),
            h('td',{style:{padding:'4px 8px'}},(o.lines||[]).length)
          )))
        )
      ),
      h(Row,null,
        h('button',{onClick:onClose},'Hủy'),
        h('button',{className:'bp',onClick:doPrint,disabled:!selectedOrders.length,style:{padding:'8px 20px'}},h('i',{className:'ti ti-printer',style:{fontSize:15}}),' In '+selectedOrders.length+' phiếu')
      )
    ):h('div',null,
      h('div',{style:{textAlign:'center',padding:'2rem',color:'var(--tx2)',fontSize:13}},'Không có đơn hàng. Chọn khách hàng hoặc điều chỉnh khoảng ngày.'),
      h(Row,null,h('button',{onClick:onClose},'Đóng'))
    )
  );
}

function PrintLabelsMultiModal({orders,customers,initialDate,onClose,onPrint}) {
  const [custId,sCust]=useState('');
  const [df,sdf]=useState(initialDate||'');
  const [dt,sdt]=useState(initialDate||'');
  const [selected,setSelected]=useState({});
  const parseD=s=>{
    if(!s)return null;
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);}
    const[d,m,y]=String(s).split('/').map(Number);return new Date(y,m-1,d);
  };
  const inRange=d=>{
    const dt2=parseD(d);if(!dt2)return false;
    const f=df?parseD(df):null;const t=dt?parseD(dt):null;
    if(f&&dt2<f)return false;if(t&&dt2>t)return false;return true;
  };
  const selectedCustomer=customers.find(c=>c.id===custId);
  const orderDate=o=>o.deliveryDate||o.date||o.ngayGiao||'';
  const filtered=orders.filter(o=>
    o.status!=='cancelled'&&
    (!custId||o.customerId===custId||o.custId===custId||selectedCustomer?.name===o.customer)&&
    inRange(orderDate(o))
  ).sort((a,b)=>{
    const da=parseD(orderDate(a));const db=parseD(orderDate(b));
    const dateDiff=(da&&db)?da-db:String(orderDate(a)).localeCompare(String(orderDate(b)));
    return dateDiff||((a.deliveryTime||'').localeCompare(b.deliveryTime||''));
  });
  const selectedOrders=filtered.filter(o=>selected[o.id]!==false);
  const allChecked=filtered.length>0&&selectedOrders.length===filtered.length;
  const toggleAll=checked=>setSelected(p=>{const n={...p};filtered.forEach(o=>{n[o.id]=checked;});return n;});
  const toggleOne=(id,checked)=>setSelected(p=>({...p,[id]:checked}));
  const doPrint=()=>{
    if(!selectedOrders.length){window.showToast('Chọn ít nhất 1 đơn để in tem!','warn');return;}
    onPrint(selectedOrders);
  };
  return h(Modal,{title:'In tem cho nhiều đơn hàng',lg:true,onClose},
    h('div',{className:'g3'},
      h(F,{label:'Khách hàng'},h('select',{value:custId,onChange:e=>sCust(e.target.value)},
        h('option',{value:''},'— Tất cả —'),
        customers.map(c=>h('option',{key:c.id,value:c.id},c.name))
      )),
      h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})),
      h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)}))
    ),
    filtered.length>0?h('div',null,
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:'1rem',fontSize:13}},
        h('i',{className:'ti ti-tag',style:{color:'var(--pri)',marginRight:6}}),
        h('strong',null,selectedOrders.length+'/'+filtered.length+' đơn đã chọn'),
        ' — '+selectedOrders.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng sản phẩm'
      ),
      h('div',{style:{maxHeight:200,overflowY:'auto',marginBottom:'1rem'}},
        h('table',{style:{width:'100%',fontSize:12,borderCollapse:'collapse'}},
          h('thead',null,h('tr',{style:{background:'var(--bg2)'}},
            h('th',{style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)',width:34}},
              h('input',{type:'checkbox',checked:allChecked,onChange:e=>toggleAll(e.target.checked),style:{width:'auto'}})
            ),
            ['Ngày','Địa điểm','Giờ','SP'].map(c=>h('th',{key:c,style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)'}},c))
          )),
          h('tbody',null,filtered.map(o=>h('tr',{key:o.id},
            h('td',{style:{padding:'4px 8px'}},h('input',{type:'checkbox',checked:selected[o.id]!==false,onChange:e=>toggleOne(o.id,e.target.checked),style:{width:'auto'}})),
            h('td',{style:{padding:'4px 8px'}},orderDate(o)),
            h('td',{style:{padding:'4px 8px',fontWeight:500}},o.pointName||'—'),
            h('td',{style:{padding:'4px 8px'}},o.deliveryTime||'—'),
            h('td',{style:{padding:'4px 8px'}},(o.lines||[]).length)
          )))
        )
      ),
      h(Row,null,
        h('button',{onClick:onClose},'Hủy'),
        h('button',{className:'bp',onClick:doPrint,disabled:!selectedOrders.length,style:{padding:'8px 20px'}},h('i',{className:'ti ti-printer',style:{fontSize:15}}),' In tem '+selectedOrders.length+' đơn')
      )
    ):h('div',null,
      h('div',{style:{textAlign:'center',padding:'2rem',color:'var(--tx2)',fontSize:13}},'Không có đơn hàng. Chọn khách hàng hoặc điều chỉnh khoảng ngày.'),
      h(Row,null,h('button',{onClick:onClose},'Đóng'))
    )
  );
}

function IntemTab({products,company}){
  const printableProducts=(products||[]).filter(Boolean).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));
  const [productId,setProductId]=useState(printableProducts[0]?.id||'');
  const [templateType,setTemplateType]=useState('58x40');
  const [prodDate,setProdDate]=useState(isoDate());
  const [prodTime,setProdTime]=useState(shortTime(timeNow()));
  const [totalKg,setTotalKg]=useState('');
  const [packQty,setPackQty]=useState(1);
  const [packWeight,setPackWeight]=useState('');
  const [printAgentId,setPrintAgentId]=useState(()=>window.scfPrintAgentSettings?.().agentId||'SCF-PC-01');
  const [printAgentPrinter,setPrintAgentPrinter]=useState(()=>window.scfPrintAgentSettings?.().printerRole||'x350');
  const [sendingToAgent,setSendingToAgent]=useState(false);
  useEffect(()=>{if(!productId&&printableProducts[0]?.id)setProductId(printableProducts[0].id);},[productId,printableProducts]);
  const selectedProduct=printableProducts.find(p=>String(p.id||'')===String(productId||''))||null;
  const selectedProductText=[selectedProduct?.name,selectedProduct?.custName,selectedProduct?.unit].filter(Boolean).join(' ').toUpperCase();
  const isPacProduct=selectedProductText.includes('/PAC')||selectedProductText.includes('KG/PAC')||(/\bPAC\b/i.test(selectedProductText)&&/GÓI|GOI/i.test(selectedProductText));
  const labelRule=resolveProductLabelPackRule(selectedProduct,selectedProduct?.name||'');
  // Thành phẩm TP dùng tem theo quy tắc đóng gói, kể cả dữ liệu cũ còn lưu nhầm cờ "không in tem".
  const productNeedsLabel=labelRule.enabled||/^TP\d+/i.test(String(selectedProduct?.code||''));
  const defaultPackWeight=numFmt(selectedProduct?.weightPerUnit)||0;
  useEffect(()=>{
    if(templateType==='100x100'&&defaultPackWeight>0&&!numFmt(packWeight))setPackWeight(String(defaultPackWeight));
  },[templateType,defaultPackWeight]);
  useEffect(()=>{
    if(!selectedProduct)return;
    setTemplateType(isPacProduct?'100x100':'58x40');
  },[productId,isPacProduct]);
  useEffect(()=>{
    if(templateType==='100x100')setPrintAgentPrinter('x420');
  },[templateType]);
  const toVnDate=value=>vnDateFromISO(value)||fmtAnyDate(value)||value||'';
  // In qua hộp in hệ điều hành; trình duyệt không thể chọn máy in trực tiếp.
  const printerIp='';
  const splitClassicWeights=kg=>{
    if(!productNeedsLabel)return [];
    const total=Number(numFmt(kg)||0);
    if(!(total>0))return [];
    const pack=Number(labelRule.pack||10);
    const full=Math.floor(total/pack);
    const remain=Number((total-full*pack).toFixed(2));
    const parts=Array.from({length:full},()=>pack);
    if(remain>0){
      if(labelRule.mergeSmallRemainder&&remain<2&&parts.length)parts[parts.length-1]=Number((parts[parts.length-1]+remain).toFixed(2));
      else parts.push(remain);
    }
    return parts;
  };
  const buildPackWeights=()=>{
    if(!productNeedsLabel)return [];
    const count=Math.max(0,Math.round(numFmt(packQty)||0));
    const each=Number(numFmt(packWeight)||defaultPackWeight||0);
    if(!(count>0) || !(each>0))return [];
    return Array.from({length:count},()=>each);
  };
  const labelWeights=templateType==='58x40'?splitClassicWeights(totalKg):buildPackWeights();
  const formatKg=kg=>Number(numFmt(kg)||0).toLocaleString('vi-VN',{maximumFractionDigits:2});
  const summaryLine=labelWeights.length
    ?labelWeights.map((kg,idx)=>formatKg(kg)+'kg').join(' | ')
    :'Chưa có tem để in';
  const classicSvg=kg=>{
    const product=String(selectedProduct?.name||'').trim()||'SẢN PHẨM';
    const nsx=toVnDate(prodDate);
    const gioSx=String(prodTime||'').trim().replace(':','H').replace(/H00$/,'H');
    const directUse=product.toUpperCase().includes('BÚN LÁ')||product.toUpperCase().includes('BUN LA')||product.toUpperCase().includes('BÁNH CUỐN')||product.toUpperCase().includes('BANH CUON')||product.toUpperCase().includes('BÁNH PHỞ CUỐN')||product.toUpperCase().includes('BANH PHO CUON');
    const hdsd=directUse?'Ăn trực tiếp':'Trần qua nước sôi trước khi ăn.';
    return '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"580\" height=\"400\" viewBox=\"0 0 580 400\">'
      +'<rect width=\"580\" height=\"400\" fill=\"white\"/>'
      +'<rect x=\"10\" y=\"10\" width=\"560\" height=\"380\" fill=\"white\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<text x=\"160\" y=\"68\" font-family=\"Arial,sans-serif\" font-size=\"54\" font-weight=\"700\" text-anchor=\"middle\" lengthAdjust=\"spacingAndGlyphs\" textLength=\"270\">'+String(product).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"425\" y=\"68\" font-family=\"Arial,sans-serif\" font-size=\"52\" font-weight=\"700\" text-anchor=\"middle\">'+formatKg(kg)+'</text>'
      +'<text x=\"520\" y=\"68\" font-family=\"Arial,sans-serif\" font-size=\"38\" font-weight=\"700\" text-anchor=\"middle\">KG</text>'
      +'<text x=\"22\" y=\"112\" font-family=\"Arial,sans-serif\"><tspan font-size=\"22\">SP CỦA: C.TY TNHH </tspan><tspan font-size=\"23\" font-weight=\"700\">THỰC PHẨM SÔNG CÔNG</tspan></text>'
      +'<text x=\"22\" y=\"154\" font-family=\"Arial,sans-serif\" font-size=\"23\">ĐC: Tổ 1. P.Mỏ Chè, Sông Công, T.Thái Nguyên</text>'
      +'<text x=\"22\" y=\"196\" font-family=\"Arial,sans-serif\" font-size=\"23\" font-weight=\"700\">SĐT : 0969709878</text>'
      +'<text x=\"258\" y=\"196\" font-family=\"Arial,sans-serif\" font-size=\"23\">THÀNH PHẦN: Bột gạo, nước</text>'
      +'<text x=\"22\" y=\"238\" font-family=\"Arial,sans-serif\" font-size=\"23\">HDSD: '+hdsd.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"512\" y=\"238\" font-family=\"Arial,sans-serif\" font-size=\"25\" text-anchor=\"end\"><tspan font-weight=\"700\">PH</tspan> 5-8</text>'
      +'<text x=\"22\" y=\"280\" font-family=\"Arial,sans-serif\" font-size=\"23\">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'
      +'<text x=\"22\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\">NSX:</text>'
      +'<text x=\"132\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\">'+nsx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"342\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\">GIỜ SX</text>'
      +'<text x=\"512\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\" text-anchor=\"end\">'+gioSx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"28\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\">HSD: 24H</text>'
      +'<text x=\"170\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\">FORMOL: 0</text>'
      +'<text x=\"302\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\">HÀN THE: 0</text>'
      +'<text x=\"552\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\" text-anchor=\"end\">BQ: 0-10°C</text>'
      +'</svg>';
  };
  const legacyPacSvg=kg=>{
    const product=String(selectedProduct?.name||'').trim().toUpperCase()||'SẢN PHẨM';
    const nsx=toVnDate(prodDate);
    const gioSx=String(prodTime||'').trim().replace(':','H').replace(/H00$/,'H');
    return '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1000\" height=\"1000\" viewBox=\"0 0 1000 1000\">'
      +'<rect width=\"1000\" height=\"1000\" fill=\"white\"/>'
      +'<rect x=\"56\" y=\"56\" width=\"888\" height=\"888\" fill=\"white\" stroke=\"#111\" stroke-width=\"5\"/>'
      +'<line x1=\"86\" y1=\"152\" x2=\"914\" y2=\"152\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<line x1=\"760\" y1=\"56\" x2=\"760\" y2=\"152\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<line x1=\"844\" y1=\"56\" x2=\"844\" y2=\"152\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<text x=\"414\" y=\"118\" font-family=\"Times New Roman,serif\" font-size=\"62\" font-weight=\"700\" text-anchor=\"middle\">'+product.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"802\" y=\"118\" font-family=\"Times New Roman,serif\" font-size=\"58\" font-weight=\"700\" text-anchor=\"middle\">'+formatKg(kg)+'</text>'
      +'<text x=\"886\" y=\"118\" font-family=\"Times New Roman,serif\" font-size=\"46\" text-anchor=\"middle\">KG</text>'
      +'<text x=\"88\" y=\"214\" font-family=\"Times New Roman,serif\" font-size=\"28\" font-weight=\"700\">SP CỦA: CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG</text>'
      +'<text x=\"88\" y=\"294\" font-family=\"Times New Roman,serif\" font-size=\"28\" font-weight=\"700\">ĐC: Tổ 1. P.Mỏ Chè, Sông Công, T.Thái Nguyên</text>'
      +'<line x1=\"86\" y1=\"332\" x2=\"914\" y2=\"332\" stroke=\"#bbb\" stroke-width=\"1\"/>'
      +'<line x1=\"352\" y1=\"332\" x2=\"352\" y2=\"408\" stroke=\"#bbb\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"386\" font-family=\"Times New Roman,serif\" font-size=\"32\" font-weight=\"700\">SĐT : 0969709878</text>'
      +'<text x=\"372\" y=\"386\" font-family=\"Times New Roman,serif\" font-size=\"32\" font-weight=\"700\">TP: Bột gạo, nước</text>'
      +'<line x1=\"86\" y1=\"412\" x2=\"914\" y2=\"412\" stroke=\"#bbb\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"500\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 15°C-20°C. Đóng gói hở. HSD 12h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"526\" x2=\"914\" y2=\"526\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"610\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 10°C-15°C. Đóng gói hở. HSD 24h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"636\" x2=\"914\" y2=\"636\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"720\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 5°C-10°C. Đóng gói hở. HSD 36h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"746\" x2=\"914\" y2=\"746\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"830\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 0°C-5°C. Đóng gói kín. HSD 72h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"856\" x2=\"914\" y2=\"856\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"904\" font-family=\"Times New Roman,serif\" font-size=\"28\" font-weight=\"700\">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'
      +'<line x1=\"86\" y1=\"936\" x2=\"914\" y2=\"936\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<line x1=\"260\" y1=\"936\" x2=\"260\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"442\" y1=\"936\" x2=\"442\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"608\" y1=\"936\" x2=\"608\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"732\" y1=\"936\" x2=\"732\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"816\" y1=\"936\" x2=\"816\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<text x=\"110\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\">FORMOL</text>'
      +'<text x=\"352\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">0</text>'
      +'<text x=\"525\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">PH:5-8</text>'
      +'<text x=\"670\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">HÀN THE</text>'
      +'<text x=\"774\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">0</text>'
      +'<text x=\"864\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">BQ</text>'
      +'<text x=\"928\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">0-10°C</text>'
      +'<text x=\"120\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\">NSX:</text>'
      +'<text x=\"360\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">'+nsx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"650\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\">GIỜ SX:</text>'
      +'<text x=\"866\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">'+gioSx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'</svg>';
  };
  const warehousePacSvg=kg=>{
    const escapeSvg=value=>String(value||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const product=String(selectedProduct?.name||'')
      .replace(/\s+/g,' ')
      .replace(/\s*,\s*\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'')
      .replace(/\s+\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'')
      .replace(/\s*,\s*PAC\b/ig,'')
      .trim().toUpperCase()||'SẢN PHẨM';
    const kgNum=formatKg(kg);
    const nsx=toVnDate(prodDate);
    const gioSx=String(prodTime||'').trim().replace(':','H').replace(/H00$/,'H');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">'
      +'<rect width="1000" height="1000" fill="white"/>'
      +'<g transform="translate(28 41) scale(0.95)">'
      +'<rect x="0" y="0" width="1000" height="1006" fill="white" stroke="#111" stroke-width="6"/>'
      +'<text x="430" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+escapeSvg(product)+'</text>'
      +'<text x="804" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+escapeSvg(kgNum)+'</text>'
      +'<text x="922" y="143" font-family="Times New Roman,serif" font-size="52" font-weight="700" text-anchor="middle">KG</text>'
      +'<text x="72" y="245" font-family="Times New Roman,serif" font-size="32" font-weight="700">SP CỦA: CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG</text>'
      +'<text x="72" y="329" font-family="Times New Roman,serif" font-size="32" font-weight="700">ĐC: Tổ 1. P.Mỏ Chè, Sông Công, T.Thái Nguyên</text>'
      +'<text x="72" y="413" font-family="Times New Roman,serif" font-size="32" font-weight="700">SĐT : 0969709878</text>'
      +'<text x="510" y="413" font-family="Times New Roman,serif" font-size="32" font-weight="700">TP: Bột gạo, nước</text>'
      +'<text x="72" y="497" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 15°C-20°C. Đóng gói hở. HSD 12h trần nước sôi trước khi dùng.</text>'
      +'<text x="72" y="581" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 10°C-15°C. Đóng gói hở. HSD 24h trần nước sôi trước khi dùng.</text>'
      +'<text x="72" y="665" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 5°C-10°C. Đóng gói hở. HSD 36h trần nước sôi trước khi dùng.</text>'
      +'<text x="72" y="749" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 0°C-5°C. Đóng gói kín. HSD 72h trần nước sôi trước khi dùng.</text>'
      +'<text x="72" y="833" font-family="Times New Roman,serif" font-size="31" font-weight="700">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'
      +'<text x="105" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">Formol:</text>'
      +'<text x="292" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">0</text>'
      +'<text x="448" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">PH:</text>'
      +'<text x="560" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">5-8</text>'
      +'<text x="634" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">Hàn the:</text>'
      +'<text x="846" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">0</text>'
      +'<text x="140" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">NSX:</text>'
      +'<text x="335" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">'+escapeSvg(nsx)+'</text>'
      +'<text x="620" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">GIỜ SX:</text>'
      +'<text x="860" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">'+escapeSvg(gioSx)+'</text>'
      +'</g></svg>';
  };
  const sendToPrintAgent=async()=>{
    if(!selectedProduct){window.showToast('Chọn sản phẩm trước khi in tem','warn');return;}
    if(!productNeedsLabel){window.showToast('Sản phẩm này đang để không in tem trong danh mục sản phẩm','warn');return;}
    if(templateType==='100x100'&&!isPacProduct){window.showToast('Mẫu tem 100×100 chỉ áp dụng cho sản phẩm PAC','warn');return;}
    if(!labelWeights.length){
      window.showToast(templateType==='58x40'?'Nhập tổng kg cần in để tách tem':'Nhập số gói/số tem và kg mỗi tem để in','warn');
      return;
    }
    try{
      setSendingToAgent(true);
      const svgs=labelWeights.map(kg=>templateType==='100x100'?warehousePacSvg(kg):classicSvg(kg));
      await window.scfQueueLabelPrint({
        agentId:printAgentId,
        printerRole:printAgentPrinter,
        label:(selectedProduct?.name||'Sản phẩm')+' · '+labelWeights.length+' tem',
        title:'Tem '+(selectedProduct?.name||'SCF'),
        paperWidthMm:templateType==='100x100'?100:58,
        paperHeightMm:templateType==='100x100'?100:40,
        svgs,
        rotate180:templateType==='58x40'
      });
      window.scfSavePrintAgentSettings?.({agentId:printAgentId,printerRole:printAgentPrinter});
      window.showToast('Đã gửi '+labelWeights.length+' tem tới '+String(printAgentPrinter||'x350').toUpperCase()+' trên '+String(printAgentId||'SCF-PC-01').toUpperCase()+'.','success');
    }catch(error){
      console.error('SCF Print Agent:',error);
      window.showToast(error?.message||'Chưa gửi được lệnh in tới máy tính.','error');
    }finally{
      setSendingToAgent(false);
    }
  };
  const openLabelWindow=()=>{
    if(!selectedProduct){window.showToast('Chọn sản phẩm trước khi in tem','warn');return;}
    if(!productNeedsLabel){window.showToast('Sản phẩm này đang để không in tem trong danh mục sản phẩm','warn');return;}
    if(templateType==='100x100'&&!isPacProduct){window.showToast('Mẫu tem 100×100 chỉ áp dụng cho sản phẩm PAC','warn');return;}
    if(!labelWeights.length){
      window.showToast(templateType==='58x40'?'Nhập tổng kg cần in để tách tem':'Nhập số gói/số tem và kg mỗi tem để in','warn');
      return;
    }
    const isClassic58=templateType==='58x40';
    const width=templateType==='100x100'?'100mm':'58mm';
    const height=templateType==='100x100'?'100mm':'40mm';
    const contentWidth=templateType==='100x100'?'100mm':'58mm';
    const contentHeight=templateType==='100x100'?'100mm':'40mm';
    const labels=labelWeights.map((kg,idx)=>{
      const svg=templateType==='100x100'?warehousePacSvg(kg):classicSvg(kg);
      const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
      return '<section class=\"label'+(isClassic58?' classic58':'')+'\"><img class=\"label-img'+(isClassic58?' classic58-img':'')+'\" alt=\"Tem '+(idx+1)+'\" src=\"'+src+'\"></section>';
    }).join('');
    const popup=window.open('','_blank','width=1200,height=850');
    if(!popup){window.showToast('Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup.','warn');return;}
    popup.document.write('<html><head><title>In tem '+String(selectedProduct.name||'')+'</title><style>'
      +'@page{size:'+width+' '+height+';margin:0}'
      +'html,body{margin:0;padding:0;font-family:Arial,sans-serif;background:#eef3f0}'
      +'body{display:flex;min-height:100vh}'
      +'.summary{width:320px;box-sizing:border-box;padding:18px;background:#f6fbf8;border-right:1px solid #d8e4dc}'
      +'.summary h2{margin:0 0 10px;font-size:24px;color:#1f5134}'
      +'.summary .meta{font-size:13px;line-height:1.6;color:#23402f}'
      +'.summary .chips{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px}'
      +'.summary .chip{display:inline-flex;padding:4px 10px;border-radius:999px;background:#fff;border:1px solid #c9dbcf;font-size:12px;font-weight:600;color:#23402f}'
      +'.summary .note{margin-top:10px;font-size:12px;color:#56705f}'
      +'.labels{flex:1;display:flex;flex-direction:column;gap:0;padding:0}'
      +'.label{position:relative;display:block;width:'+width+';height:'+height+';overflow:hidden;break-after:page;page-break-after:always}'
      +'.label:last-child{break-after:auto;page-break-after:auto}'
      +'.label-img{display:block;width:'+width+';height:'+height+'}'
      +'.label.classic58{width:58mm;height:40mm}'
      +'.label-img.classic58-img{position:static;width:58mm;height:40mm;transform:none}'
      +'@media print{body{display:block;background:#fff}.summary{display:none}.labels{display:block}.label.classic58{width:58mm;height:40mm}.label-img.classic58-img{position:static;width:'+contentWidth+';height:'+contentHeight+';transform:rotate(180deg);transform-origin:center center}}'
      +'</style></head><body>'
      +'<aside class=\"summary\"><h2>Intem 420B</h2>'
      +'<div class=\"meta\"><b>Sản phẩm:</b> '+String(selectedProduct.name||'')+'<br><b>Mẫu tem:</b> '+templateType+'<br><b>Ngày SX:</b> '+toVnDate(prodDate)+'<br><b>Giờ SX:</b> '+String(prodTime||'—')+'<br><b>Tổng số tem:</b> '+labelWeights.length+'<br><b>IP máy in:</b> '+String(printerIp||'Chưa lưu')+'</div>'
      +'<div class=\"chips\">'+labelWeights.map((kg,idx)=>'<span class=\"chip\">Tem '+(idx+1)+': '+formatKg(kg)+'kg</span>').join('')+'</div>'
      +'<div class=\"note\">Trình duyệt sẽ mở hộp in. Nếu máy 420B đã cài trên Windows, chọn đúng máy in trong hộp in để in ra tem.</div>'
      +'</aside><main class=\"labels\">'+labels+'</main></body></html>');
    popup.document.close();
    setTimeout(()=>popup.print(),350);
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-printer',style:{fontSize:20}}),'Intem'),
    false&&h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:14,flexWrap:'wrap',marginBottom:14}},
        h('div',null,
          h('div',{style:{fontSize:16,fontWeight:700,color:'var(--pri3)',marginBottom:4}},'Kết nối máy in nhiệt 420B qua Wi‑Fi'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',maxWidth:760}},'App sẽ quét nhanh các IP nội bộ thường dùng để tìm máy in có phản hồi. Nếu máy in không mở web nội bộ thì có thể không quét thấy, khi đó mình nhập IP tay rồi lưu lại.')
        ),
        h('div',{style:{background:'var(--bg2)',padding:'10px 12px',borderRadius:'var(--r)',minWidth:220}},
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:4}},'Máy in đang chọn'),
          h('div',{style:{fontWeight:700,color:'var(--pri3)'}},printerIp||'Chưa có IP'),
          printerState?.lastScanAt&&h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:4}},'Lần quét: '+printerState.lastScanAt)
        )
      ),
      h('div',{className:'g3'},
        h(F,{label:'IP máy in 420B'},
          h('input',{value:printerIp,onChange:e=>setPrinterIp(e.target.value),placeholder:'Ví dụ: 192.168.1.120'})
        ),
        h(F,{label:'IP tìm thấy'},
          h('select',{value:printerIp,onChange:e=>setPrinterIp(e.target.value)},
            h('option',{value:''},foundIps.length?'— Chọn IP đã quét —':'— Chưa có IP quét thấy —'),
            foundIps.map(ip=>h('option',{key:ip,value:ip},ip))
          )
        ),
        h(F,{label:'Trạng thái quét'},
          h('div',{style:{minHeight:40,padding:'8px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'#fff',fontSize:12,color:'var(--tx2)',lineHeight:1.45}},scanMsg)
        )
      ),
      h(Row,null,
        h('button',{onClick:scanPrinterIps,disabled:scanLoading,style:{padding:'8px 14px'}},h('i',{className:'ti ti-wifi',style:{fontSize:14}}),scanLoading?'Đang quét...':'Quét IP máy in'),
        h('button',{onClick:savePrinterIp,style:{padding:'8px 14px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu IP'),
        h('button',{onClick:openPrinterPage,disabled:!printerIp,style:{padding:'8px 14px'}},h('i',{className:'ti ti-world-www',style:{fontSize:14}}),'Mở trang máy in')
      )
    ),
    h('div',{className:'card'},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:14,flexWrap:'wrap',marginBottom:14}},
        h('div',null,
          h('div',{style:{fontSize:16,fontWeight:700,color:'var(--pri3)',marginBottom:4}},'Tạo tem thủ công'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',maxWidth:760}},'Chọn sản phẩm, nhập ngày SX, giờ SX và mẫu tem. Với tem 58x40, app sẽ tự tách số tem theo quy tắc của sản phẩm. Với tem 100x100, mình nhập số gói/số tem và kg mỗi tem.')
        ),
        h('div',{style:{background:'var(--bg2)',padding:'10px 12px',borderRadius:'var(--r)',minWidth:250}},
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:4}},'Tóm tắt nhanh'),
          h('div',{style:{fontWeight:700,color:'var(--pri3)'}},selectedProduct?.name||'Chưa chọn sản phẩm'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:4}},'Mẫu '+templateType+' · '+labelWeights.length+' tem')
        )
      ),
      h('div',{className:'g2'},
        h(F,{label:'Sản phẩm'},
          h('select',{value:productId,onChange:e=>setProductId(e.target.value)},
            h('option',{value:''},'— Chọn sản phẩm —'),
            printableProducts.map(p=>h('option',{key:p.id,value:p.id},p.code?(p.code+' - '+p.name):p.name))
          )
        ),
        h(F,{label:'Mẫu tem'},
          h('select',{value:templateType,onChange:e=>setTemplateType(e.target.value)},
            h('option',{value:'58x40'},'58 x 40 mm'),
            h('option',{value:'100x100',disabled:!isPacProduct},'100 x 100 mm · PAC kho vận')
          )
        )
      ),
      h('div',{className:'g2'},
        h(F,{label:'Ngày sản xuất'},h('input',{type:'date',value:prodDate,onChange:e=>setProdDate(e.target.value)})),
        h(F,{label:'Giờ sản xuất'},h('input',{type:'time',value:prodTime,onChange:e=>setProdTime(e.target.value)}))
      ),
      !productNeedsLabel&&selectedProduct&&h('div',{style:{background:'#fff7ed',padding:'10px 12px',borderRadius:'var(--r)',fontSize:12,color:'#9A3412',marginBottom:'1rem'}},'Sản phẩm này đang để trạng thái Không in tem trong danh mục sản phẩm. Nếu muốn in, cần bật lại cờ in tem ở danh mục sản phẩm.'),
      templateType==='58x40'
        ?h('div',{className:'g2'},
          h(F,{label:'Tổng kg cần in'},h('input',{type:'number',min:0,step:'0.01',value:totalKg,onChange:e=>setTotalKg(e.target.value),disabled:!productNeedsLabel,placeholder:labelRule.pack?('Ví dụ: '+labelRule.pack*5+7):'Ví dụ: 57'})),
          h(F,{label:'Quy tắc tem đang áp dụng'},
            h('div',{style:{minHeight:40,padding:'8px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'#fff',fontSize:12,color:'var(--tx2)',lineHeight:1.45}},
              productNeedsLabel?(labelRule.pack+'kg/tem'+(labelRule.mergeSmallRemainder?' · gộp phần lẻ nhỏ':' · tách riêng phần lẻ')):'Sản phẩm không in tem'
            )
          )
        )
        :h('div',{className:'g2'},
          h(F,{label:'Số gói / số tem'},h('input',{type:'number',min:1,step:1,value:packQty,onChange:e=>setPackQty(e.target.value),disabled:!productNeedsLabel,placeholder:'Ví dụ: 14'})),
          h(F,{label:'Kg mỗi gói / tem'},h('input',{type:'number',min:0,step:'0.01',value:packWeight,onChange:e=>setPackWeight(e.target.value),disabled:!productNeedsLabel,placeholder:defaultPackWeight?String(defaultPackWeight):'Ví dụ: 5'}))
        ),
      h('div',{style:{background:'var(--bg2)',padding:'10px 12px',borderRadius:'var(--r)',fontSize:12,color:'var(--tx2)',marginBottom:'1rem'}},
        h('div',{style:{fontWeight:600,color:'var(--pri3)',marginBottom:6}},'Kết quả tách tem'),
        h('div',null,summaryLine),
        templateType==='100x100'&&defaultPackWeight>0&&h('div',{style:{marginTop:6}},'Khối lượng mặc định của sản phẩm: ',h('b',null,formatKg(defaultPackWeight)),'kg / ',selectedProduct?.unit||'gói')
      ),
      h('div',{className:'g2',style:{alignItems:'end'}},
        h(F,{label:'Mã SCF Print Agent trên máy tính'},
          h('input',{
            value:printAgentId,
            onChange:e=>setPrintAgentId(String(e.target.value||'').toUpperCase()),
            onBlur:()=>window.scfSavePrintAgentSettings?.({agentId:printAgentId}),
            placeholder:'SCF-PC-01'
          })
        ),
        h(F,{label:'Máy in nhận lệnh'},
          h('select',{
            value:printAgentPrinter,
            onChange:e=>{
              const value=e.target.value;
              setPrintAgentPrinter(value);
              window.scfSavePrintAgentSettings?.({agentId:printAgentId,printerRole:value});
            }
          },
            h('option',{value:'x350',disabled:templateType==='100x100'},'X350B · tem 58×40'),
            h('option',{value:'x420'},templateType==='100x100'?'X420B · tem 100×100':'X420B · tem 58×40'),
            h('option',{value:'canon',disabled:true},'Canon 2900 · giấy A4')
          )
        )
      ),
      h(Row,null,
        h('button',{className:'bp',onClick:sendToPrintAgent,disabled:sendingToAgent,style:{padding:'8px 20px'}},
          h('i',{className:'ti ti-device-desktop-up',style:{fontSize:15}}),
          sendingToAgent?'Đang gửi tem...':'Gửi in qua máy tính'
        ),
        h('button',{onClick:openLabelWindow,disabled:sendingToAgent,style:{padding:'8px 20px'}},
          h('i',{className:'ti ti-printer',style:{fontSize:15}}),'In trên thiết bị này'
        )
      )
    )
  );
}

function deliveryOrderDateKey(value){
  const raw=String(value??'').trim();
  let year,month,day;
  let m=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m){day=Number(m[1]);month=Number(m[2]);year=Number(m[3]);}
  else{
    m=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(!m)return null;
    year=Number(m[1]);month=Number(m[2]);day=Number(m[3]);
  }
  const date=new Date(year,month-1,day);
  if(date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day)return null;
  return year*10000+month*100+day;
}
function deliveryOrderRecordKeys(items){
  const seen=new Map();
  return (items||[]).map(order=>{
    const identity=[
      order?.id,
      order?.deliveryDate,
      order?.deliveryTime,
      order?.pointId||order?.pointName||order?.address,
      order?.customerId||order?.customer,
      order?.createdAt
    ].map(value=>String(value??'').trim()).join('\u001f');
    const occurrence=(seen.get(identity)||0)+1;
    seen.set(identity,occurrence);
    return 'delivery-order\u001f'+identity+'\u001f'+occurrence;
  });
}
function deliveryProductTextWidth(text){
  const value=String(text||'');
  const fallback=Array.from(value).reduce((width,char)=>width+(/[MWĐƯƠÔ]/i.test(char)?10:/[il1.,' ]/i.test(char)?4.5:7.5),0);
  try{
    if(typeof document==='undefined'||typeof getComputedStyle!=='function')return fallback;
    const canvas=deliveryProductTextWidth._canvas||(deliveryProductTextWidth._canvas=document.createElement('canvas'));
    const context=canvas.getContext('2d');
    if(!context)return fallback;
    const rootStyle=getComputedStyle(document.documentElement);
    const fontStyle=rootStyle.getPropertyValue('--ui-table-style').trim()||'normal';
    const fontWeight=rootStyle.getPropertyValue('--ui-table-weight').trim()||'400';
    const fontSize=rootStyle.getPropertyValue('--ui-table-size').trim()||'13px';
    const fontFamily=rootStyle.getPropertyValue('--ui-font-family').trim()||'sans-serif';
    context.font=[fontStyle,fontWeight,fontSize,fontFamily].join(' ');
    return context.measureText(value).width;
  }catch(_err){return fallback;}
}
function currentISOWeekInput(date=new Date()){
  const target=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const day=target.getDay()||7;
  target.setDate(target.getDate()+4-day);
  const weekYear=target.getFullYear();
  const yearStart=new Date(weekYear,0,1);
  const week=Math.ceil((((target-yearStart)/86400000)+1)/7);
  return weekYear+'-W'+String(week).padStart(2,'0');
}
function isoWeekDateKeyRange(value){
  const m=String(value??'').match(/^(\d{4})-W(\d{2})$/);
  if(!m)return null;
  const year=Number(m[1]),week=Number(m[2]);
  if(week<1||week>53)return null;
  const jan4=new Date(year,0,4);
  const jan4Day=jan4.getDay()||7;
  const monday=new Date(year,0,4-(jan4Day-1)+(week-1)*7);
  const sunday=new Date(monday);sunday.setDate(monday.getDate()+6);
  const key=d=>d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
  return [key(monday),key(sunday)];
}

function DeliveryOrdersTab({orders,setOrders,customers,setCustomers,products,prodCats,quotes,employees,currentUser,trips,setTrips,company,prodShifts,prodShiftRules,shifts,menuHidden,setMenuHidden,printTemplateSettings}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[copyDraft,setCopyDraft]=useState(null);const[print,spr]=useState(null);const[invoiceView,setInvoiceView]=useState(null);const[q,sq]=useState('');const[filter,sf]=useState('all');const[sortMode,setSortMode]=useState('area');const _td0=fmtDate();const _ti0=_td0.split('/').reverse().join('-');
  const[dateFilterMode,setDateFilterMode]=useState('day');
  const[fDate,sfDate]=useState(_ti0);const[fDateTo,sfDateTo]=useState(_ti0);
  const[fWeek,sfWeek]=useState(currentISOWeekInput());const[fMonth,sfMonth]=useState(_ti0.slice(0,7));
  const[fPoint,sfPoint]=useState('');const[fProduct,sfProduct]=useState('');const[fTime,sfTime]=useState('');const[fArea,sfArea]=useState('');
  const[pageSize,setPageSize]=useState(()=>typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(max-width: 768px)').matches?20:100);const[currentPage,setCurrentPage]=useState(1);let oSeq=orders.length+1;
  const[mobileActionsOpen,setMobileActionsOpen]=useState(false);const[mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
  const[bulkSelected,setBulkSelected]=useState({});
  const isAdmin=String(currentUser?.role||'').trim().toLowerCase()==='admin';
  const deliveryTableScroll=useRef(null);
  const normArea=v=>String(v||'').trim().replace(/\s+/g,' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').toUpperCase();
  const areaKey=v=>normArea(v).replace(/[^A-Z0-9]/g,'');
  const sameArea=(a,b)=>{
    const ak=areaKey(a), bk=areaKey(b);
    if(!ak||!bk)return false;
    if(ak==='CHUAPHANKHUVUC'||bk==='CHUAPHANKHUVUC')return false;
    return ak===bk||ak.includes(bk)||bk.includes(ak);
  };
  const pointMatchById=new Map();
  const pointMatchByName=new Map();
  (customers||[]).forEach(customer=>(customer.points||[]).forEach(point=>{
    const match={customer,point};
    if(point.id)pointMatchById.set(String(point.id),match);
    const nameKey=normalizeLookupText(point.name||'');
    if(nameKey){
      if(!pointMatchByName.has(nameKey))pointMatchByName.set(nameKey,match);
      else pointMatchByName.set(nameKey,null);
    }
  }));
  const tripById=new Map((trips||[]).map(trip=>[String(trip.id||''),trip]));
  const orderContext=o=>{
    const resolved=pointMatchById.get(String(o?.pointId||o?.ptId||''))||pointMatchByName.get(normalizeLookupText(o?.pointName||''))||findOrderPointMatch(o,customers||[]);
    const pt=resolved?.point||{};
    const cust=resolved?.customer||{};
    return {
      ...o,
      deliveryTime:normalizeTimeInput(o?.deliveryTime||''),
      pointId:pt.id||o?.pointId||'',
      pointName:pt.name||o?.pointName||o?.address||'',
      address:pt.address||o?.address||'',
      area:pt.area||o?.area||'',
      customerId:cust.id||o?.customerId||'',
      customer:cust.name||o?.customer||''
    };
  };
  useEffect(()=>{
    const onKey=e=>{
      if((e.ctrlKey||e.metaKey)&&!e.altKey&&String(e.key||'').toLowerCase()==='d'){
        e.preventDefault();
        if(!modal&&!print&&!invoiceView){se(null);setCopyDraft(null);sm('f');}
      }
    };
    document.addEventListener('keydown',onKey,true);
    return()=>document.removeEventListener('keydown',onKey,true);
  },[modal,print,invoiceView]);
  useEffect(()=>{setCurrentPage(1);setBulkSelected({});},[q,filter,dateFilterMode,fDate,fDateTo,fWeek,fMonth,fPoint,fProduct,fTime,fArea,sortMode,pageSize]);
  const save=d=>{if(edit)applyOrdersAndTripSync(p=>p.map(x=>x.id===edit.id?d:x));else{const datePart=(d.deliveryDate||fmtDate()).split('/').slice(0,2).join('');const id='DGH'+datePart+String(oSeq++).toString().padStart(3,'0');const clean={...d};delete clean.copySourceId;applyOrdersAndTripSync(p=>[...p,{...clean,id,createdAt:fmtDate()}]);if(copyDraft)window.showToast('Đã tạo đơn mới từ bản sao '+copyDraft.copySourceId+'.','success');}sm(null);se(null);setCopyDraft(null);};
  const copyOrder=order=>{
    const source=orderContext(order);
    const draft={...source,id:'',copySourceId:order.id||'',status:'pending',tripId:'',tripAssignMode:'auto',invoiceImage:'',invoiceImageName:'',invoiceUploadedAt:'',invoiceUploadedBy:'',createdAt:'',updatedAt:'',lines:(source.lines||[]).map(line=>({...line,id:uid(),qtyDelivered:''}))};
    se(null);setCopyDraft(draft);sm('f');
  };
  const saveInvoiceImage=async(order,file)=>{
    if(!file)return;
    try{
      const url=await uploadPhoto(file,'order-invoices/'+(order.id||'order'));
      const imageData={invoiceImage:url,invoiceImageName:file.name||'hoa-don.jpg',invoiceUploadedAt:fmtDT(),invoiceUploadedBy:currentUser?.name||''};
      setOrders(prev=>prev.map(x=>x.id===order.id?{...x,...imageData}:x));
      setInvoiceView(prev=>prev?.id===order.id?{...prev,...imageData}:prev);
    }catch(e){window.showToast('Không đọc được ảnh hóa đơn: '+(e.message||e),'error');}
  };
  const pickInvoiceImage=order=>{
    const inp=document.createElement('input');
    inp.type='file';inp.accept='image/*';inp.capture='environment';
    inp.onchange=e=>saveInvoiceImage(order,e.target.files&&e.target.files[0]);
    inp.click();
  };
  const removeInvoiceImage=async order=>{
    if(!order?.invoiceImage)return;
    if(!await window.scfConfirm('Xóa ảnh hóa đơn của đơn '+(order.id||'')+'?\nĐơn hàng và các thông tin khác vẫn được giữ nguyên.','Xóa ảnh hóa đơn',true))return;
    setOrders(prev=>prev.map(x=>x.id===order.id?{
      ...x,
      invoiceImage:'',
      invoiceImageName:'',
      invoiceUploadedAt:'',
      invoiceUploadedBy:'',
      invoiceImageRemovedAt:fmtDT(),
      invoiceImageRemovedBy:currentUser?.name||''
    }:x));
    setInvoiceView(prev=>prev?.id===order.id?null:prev);
    window.showToast('Đã xóa ảnh hóa đơn của đơn '+(order.id||'')+'.','success');
  };
  const del=async id=>{
    if(await window.scfConfirm('Bạn có chắc muốn xóa đơn hàng này?','Xóa đơn hàng',true))applyOrdersAndTripSync(p=>p.filter(x=>x.id!==id));
  };
  const sts=[['all','Tất cả'],['pending','Chờ xếp'],['assigned','Đã xếp'],['delivering','Đang giao'],['done','Đã giao'],['failed','Giao lỗi'],['cancelled','Hủy']];
  const getArea=o=>{
    const direct=String(o?.area||'').trim();
    if(direct&&areaKey(direct)!=='CHUAPHANKHUVUC')return direct;
    const resolved=findOrderPointMatch(o,customers||[]);
    const areaFromPoint=String(resolved?.point?.area||'').trim();
    if(areaFromPoint&&areaKey(areaFromPoint)!=='CHUAPHANKHUVUC')return areaFromPoint;
    return '';
  };
  const tripDateOptionsForOrder=o=>[o?.deliveryDate,addDaysVN(o?.deliveryDate,-1),getOrderTripDate(o,prodShifts||[])].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);
  const tripOptionsForOrder=o=>{
    const dateSet=new Set(tripDateOptionsForOrder(o));
    return (trips||[]).filter(t=>!t.deliveryDate||dateSet.has(t.deliveryDate)||t.id===o.tripId);
  };
  const tripMatchesArea=(trip,area)=>!!area&&(sameArea(trip?.area,area)||sameArea(trip?.shiftName,area));
  const tripMatchesShift=(trip,shiftId,shiftName)=>{
    const desiredId=String(shiftId||'').trim();
    const desiredName=normalizeLookupText(shiftName||'');
    const tripId=String(trip?.shiftId||'').trim();
    const tripName=normalizeLookupText(trip?.shiftName||'');
    return (!!desiredId&&tripId===desiredId)|| (!!desiredName&&tripName===desiredName);
  };
  const autoTripForOrder=o=>{
    const ctx=orderContext(o);
    const preferredDate=getOrderTripDate(ctx,prodShifts||[])||'';
    const preferredShiftId=getOrderTripShiftId(ctx,prodShifts||[]);
    const preferredShiftName=getOrderTripShiftName(ctx,prodShifts||[]);
    const area=getArea(ctx);
    const options=tripOptionsForOrder(ctx);
    if(!options.length||!preferredDate)return null;
    // Ca SX đã cấu hình một ca giao hàng cụ thể thì phải ưu tiên tuyệt đối ca đó.
    // Khu vực của điểm giao chỉ dùng làm phương án ghép khi ca SX không chỉ định ca giao.
    if(preferredShiftId||preferredShiftName){
      const shiftOptions=options.filter(t=>tripMatchesShift(t,preferredShiftId,preferredShiftName));
      const byDate=shiftOptions.filter(t=>t.deliveryDate===preferredDate);
      if(!byDate.length)return null;
      return [...byDate].sort((a,b)=>{
        const currentScore=t=>String(t.id||'')===String(o.tripId||'')?20:0;
        return currentScore(b)-currentScore(a)||(String(a.id||'').localeCompare(String(b.id||''),'vi'));
      })[0]||null;
    }
    const sameAreaOptions=area?options.filter(t=>tripMatchesArea(t,area)):[];
    if(sameAreaOptions.length){
      const byDate=preferredDate?sameAreaOptions.filter(t=>t.deliveryDate===preferredDate):sameAreaOptions;
      if(preferredDate&&!byDate.length)return null;
      return [...byDate].sort((a,b)=>{
        const ad=parseAnyDate(a.deliveryDate||''),bd=parseAnyDate(b.deliveryDate||'');
        const byDate=(bd?.getTime?.()||0)-(ad?.getTime?.()||0);
        if(byDate)return byDate;
        const score=t=>(tripMatchesShift(t,preferredShiftId,preferredShiftName)?60:0)+(t.id===o.tripId?20:0);
        return score(b)-score(a)||(String(a.id||'').localeCompare(String(b.id||''),'vi'));
      })[0]||null;
    }
    // Đơn đã có khu vực thì chỉ được ghép vào chuyến đúng khu vực.
    // Không lấy một chuyến khác cùng ngày làm phương án dự phòng.
    if(area)return null;
    const candidates=preferredDate?options.filter(t=>t.deliveryDate===preferredDate):options;
    if(!candidates.length)return null;
    return [...candidates].sort((a,b)=>{
      const score=t=>(t.deliveryDate===preferredDate?100:0)+(t.id===o.tripId?20:0)+(tripMatchesArea(t,area)?10:0);
      const diff=score(b)-score(a);
      if(diff)return diff;
      const ad=parseAnyDate(a.deliveryDate||''),bd=parseAnyDate(b.deliveryDate||'');
      const byDate=(bd?.getTime?.()||0)-(ad?.getTime?.()||0);
      if(byDate)return byDate;
      return String(a.id||'').localeCompare(String(b.id||''),'vi');
    })[0]||null;
  };
  const syncTripOrderIds=nextOrders=>{
    let changed=false;
    const nextTrips=(trips||[]).map(t=>{
      const desired=nextOrders.filter(o=>o.tripId===t.id).map(o=>o.id);
      const current=t.orderIds||[];
      if(desired.length!==current.length||desired.some((id,idx)=>id!==current[idx])){
        changed=true;
        return {...t,orderIds:desired};
      }
      return t;
    });
    if(changed)setTrips(nextTrips);
  };
  // Chỉ ghi dữ liệu tự động khi người dùng thao tác hoặc bấm cập nhật,
  // tránh vừa mở tab đã quét + lưu lại toàn bộ đơn hàng.
  const applyOrdersAndTripSync=updater=>{
    setOrders(prev=>{
      const nextOrders=typeof updater==='function'?updater(prev):updater;
      syncTripOrderIds(nextOrders);
      return nextOrders;
    });
  };
  const setOrderTripMode=(order,mode)=>{
    if(mode==='manual'){
      const currentTripId=order.tripId||autoTripForOrder(order)?.id||null;
      applyOrdersAndTripSync(prev=>prev.map(x=>x.id===order.id?{...x,tripAssignMode:'manual',tripId:currentTripId,status:currentTripId?'assigned':'pending'}:x));
      return;
    }
    applyOrdersAndTripSync(prev=>prev.map(x=>x.id===order.id?{...x,tripAssignMode:'auto'}:x));
  };
  const assignTripManually=(order,newTripId)=>{
    applyOrdersAndTripSync(prev=>prev.map(x=>x.id===order.id?{...x,tripAssignMode:'manual',tripId:newTripId||null,status:newTripId?'assigned':'pending'}:x));
  };
  const changeDateFilterMode=mode=>{
    setDateFilterMode(mode);
    if(mode==='day'&&!fDate)sfDate(_ti0);
    if(mode==='range'){
      if(!fDate)sfDate(_ti0);
      if(!fDateTo)sfDateTo(_ti0);
    }
    if(mode==='week'&&!fWeek)sfWeek(currentISOWeekInput());
    if(mode==='month'&&!fMonth)sfMonth(_ti0.slice(0,7));
  };
  const hasDateFilter=(dateFilterMode==='day'&&!!fDate)||(dateFilterMode==='range'&&!!(fDate||fDateTo))||(dateFilterMode==='week'&&!!fWeek)||(dateFilterMode==='month'&&!!fMonth);
  const resetDeliveryFilters=()=>{sfDate('');sfDateTo('');sfWeek('');sfMonth('');sfPoint('');sfProduct('');sfTime('');sfArea('');};
  const matchesDateFilter=value=>{
    if(!hasDateFilter)return true;
    const key=deliveryOrderDateKey(value);
    if(key===null)return false;
    if(dateFilterMode==='day')return key===deliveryOrderDateKey(fDate);
    if(dateFilterMode==='range'){
      const from=deliveryOrderDateKey(fDate),to=deliveryOrderDateKey(fDateTo);
      if(from!==null&&to!==null)return key>=Math.min(from,to)&&key<=Math.max(from,to);
      if(from!==null)return key>=from;
      if(to!==null)return key<=to;
      return true;
    }
    if(dateFilterMode==='week'){
      const range=isoWeekDateKeyRange(fWeek);
      return !!range&&key>=range[0]&&key<=range[1];
    }
    if(dateFilterMode==='month'){
      const m=String(fMonth||'').match(/^(\d{4})-(\d{2})$/);
      return !!m&&Math.floor(key/100)===Number(m[1])*100+Number(m[2]);
    }
    return true;
  };
  const allOrderRowKeys=deliveryOrderRecordKeys(orders);
  const orderRowKeyByObject=new Map((orders||[]).map((order,index)=>[order,allOrderRowKeys[index]]));
  const orderRowKey=order=>order?._rowKey||orderRowKeyByObject.get(order)||('delivery-order-fallback\u001f'+String(order?.id||''));
  const listWithoutPoint=orders.filter(x=>{
    if(filter!=='all'&&x.status!==filter) return false;
    if(q&&!String(x.customer||'').toLowerCase().includes(q.toLowerCase())&&!String(x.id||'').toLowerCase().includes(q.toLowerCase())&&!String(x.pointName||'').toLowerCase().includes(q.toLowerCase())&&!(x.lines||[]).some(line=>String(line.productName||'').toLowerCase().includes(q.toLowerCase()))) return false;
    if(!matchesDateFilter(x.deliveryDate))return false;
    if(fProduct){
      const selectedName=normalizeLookupText(fProduct);
      if(!(x.lines||[]).some(line=>normalizeLookupText(line.productName||'')===selectedName))return false;
    }
    if(fTime&&normalizeTimeInput(x.deliveryTime||'')!==fTime) return false;
    if(fArea&&getArea(x)!==fArea) return false;
    return true;
  });
  const pointOptions=[...new Set(listWithoutPoint.map(x=>String(x.pointName||x.address||'').trim()).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'vi',{sensitivity:'base',numeric:true}));
  useEffect(()=>{if(fPoint&&!pointOptions.includes(fPoint))sfPoint('');},[fPoint,pointOptions.join('\u0001')]);
  const list=listWithoutPoint.filter(x=>!fPoint||String(x.pointName||x.address||'').trim()===fPoint);
  const statusScope=orders.filter(x=>{
    if(q&&!String(x.customer||'').toLowerCase().includes(q.toLowerCase())&&!String(x.id||'').toLowerCase().includes(q.toLowerCase())&&!String(x.pointName||'').toLowerCase().includes(q.toLowerCase())&&!(x.lines||[]).some(line=>String(line.productName||'').toLowerCase().includes(q.toLowerCase())))return false;
    if(!matchesDateFilter(x.deliveryDate))return false;
    if(fProduct&&!(x.lines||[]).some(line=>normalizeLookupText(line.productName||'')===normalizeLookupText(fProduct)))return false;
    if(fTime&&normalizeTimeInput(x.deliveryTime||'')!==fTime)return false;
    if(fArea&&getArea(x)!==fArea)return false;
    if(fPoint&&String(x.pointName||x.address||'').trim()!==fPoint)return false;
    return true;
  });
  const statusCount=value=>value==='all'?statusScope.length:statusScope.filter(order=>order.status===value).length;
  const updateAutoProductionTimes=()=>{
    const targetRowKeys=new Set(list.filter(o=>o.status!=='cancelled'&&o.tripAssignMode!=='manual'&&o.prodShiftAssignMode!=='manual').map(orderRowKey));
    let changed=0,lineChanged=0,miss=0,timeChanged=0;
    const nextOrders=orders.map((o,index)=>{
      if(!targetRowKeys.has(allOrderRowKeys[index]))return o;
      const rawDeliveryTime=String(o.deliveryTime??'').trim();
      const normalizedDeliveryTime=/h/i.test(rawDeliveryTime)?normalizeCustomerImportTime(rawDeliveryTime):rawDeliveryTime;
      const deliveryTimeChanged=normalizedDeliveryTime!==rawDeliveryTime;
      if(deliveryTimeChanged)timeChanged++;
      const ctx=orderContext({...o,deliveryTime:normalizedDeliveryTime});
      const autoShift=getProdShiftForOrder(ctx,prodShifts||[],customers||[]);
      if(!autoShift){
        miss++;
        if(!deliveryTimeChanged)return o;
        changed++;
        return {...o,deliveryTime:normalizedDeliveryTime,updatedAt:fmtDT(),updatedBy:currentUser?.name||''};
      }
      const autoProdTime=autoShift.actualProdTime||autoShift.endTime||'';
      const autoProdDate=addDaysVN(o.deliveryDate,autoShift.prodDateOffset||0);
      const autoLabelTime=autoShift.labelPrintTime||'';
      const autoLabelDate=addDaysVN(o.deliveryDate,autoShift.labelPrintDateOffset||0);
      const nextCtx={...ctx,area:ctx.area||'',prodShiftAssignMode:'auto',prodShiftId:autoShift.id};
      const autoTrip=autoTripForOrder(nextCtx);
      const nextTripId=autoTrip?.id||null;
      const nextStatus=nextTripId?'assigned':'pending';
      let touched=deliveryTimeChanged||o.prodShiftAssignMode!=='auto'||o.prodShiftId!==autoShift.id||o.tripId!==nextTripId||o.status!==nextStatus||o.tripAssignMode!=='auto';
      const lines=(o.lines||[]).map(l=>{
        if(l.shiftOverride)return l;
        const next={...l,prodTime:autoProdTime,prodDate:autoProdDate,labelTime:autoLabelTime,labelDate:autoLabelDate};
        if(l.prodTime!==next.prodTime||l.prodDate!==next.prodDate||l.labelTime!==next.labelTime||l.labelDate!==next.labelDate){lineChanged++;touched=true;}
        return next;
      });
      if(touched)changed++;
      return touched?{...o,deliveryTime:normalizedDeliveryTime,prodShiftAssignMode:'auto',prodShiftId:autoShift.id,tripId:nextTripId,tripAssignMode:'auto',status:nextStatus,lines,updatedAt:fmtDT(),updatedBy:currentUser?.name||''}:o;
    });
    applyOrdersAndTripSync(nextOrders);
    window.showToast((timeChanged?'Đã chuẩn hóa giờ cho '+timeChanged+' đơn. ':'')+'Đã cập nhật tự động ca SX, ngày SX, giờ SX, ngày in tem, giờ in tem và chuyến xe cho '+changed+' đơn, '+lineChanged+' dòng'+(miss?'. '+miss+' đơn chưa tìm thấy ca SX.':''),'success',7000);
  };
  const orderLineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const orderLineWeight=l=>{
    const p=products?.find(x=>x.id===l.productId);
    const unit=String(l.unit||p?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');
    const qty=orderLineQty(l);
    if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;
    const wpu=p?.weightPerUnit||numFmt(l.weightPerUnit)||0;
    return wpu*qty;
  };
  const calcOrderWeight=o=>(o.lines||[]).reduce((s,l)=>s+orderLineWeight(l),0);
  const shiftScheduleMeta=(shifts||[]).map((sh,idx)=>({
    ...sh,
    _order:idx,
    _start:String(sh.timeStart||sh.startTime||'').trim(),
    _startMin:String(sh.timeStart||sh.startTime||'').trim()?timeToMin(sh.timeStart||sh.startTime):Number.MAX_SAFE_INTEGER
  }));
  const matchShiftSchedule=({shiftId,shiftName,area,deliveryTime}={})=>{
    const desiredId=String(shiftId||'').trim();
    const desiredName=normalizeLookupText(shiftName||'');
    const desiredArea=String(area||'').trim();
    const desiredTime=String(deliveryTime||'').trim();
    const scoreShift=sh=>{
      let score=0;
      if(desiredId&&String(sh.id||'').trim()===desiredId)score+=5000;
      const shName=normalizeLookupText(sh.name||'');
      if(desiredName&&shName===desiredName)score+=1600;
      else if(desiredName&&shName&&(shName.includes(desiredName)||desiredName.includes(shName)))score+=900;
      if(desiredArea&&sameArea(sh.area,desiredArea))score+=700;
      const shTime=String(sh.timeStart||sh.startTime||'').trim();
      if(desiredTime&&shTime===desiredTime)score+=1200;
      return score;
    };
    const ranked=shiftScheduleMeta
      .map(sh=>({sh,score:scoreShift(sh)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score||a.sh._order-b.sh._order||a.sh._startMin-b.sh._startMin||(String(a.sh.id||'').localeCompare(String(b.sh.id||''),'vi')));
    return ranked[0]?.sh||null;
  };
  const tripGroupLabel=t=>{
    if(!t)return 'Chưa có chuyến';
    const parts=[t.deliveryDate,t.shiftName,t.area].filter(Boolean);
    return parts.join(' · ')||t.id||'Chưa có chuyến';
  };
  const orderMeta=list.map(o=>{
    const ctx=orderContext(o);
    const area=getArea(ctx)||'';
    return {...o,_ctx:ctx,_area:area,_rowKey:orderRowKey(o)};
  });
  const enrichOrderTripMeta=o=>{
    const ctx=o._ctx||orderContext(o);
    const tripMode=o.tripAssignMode==='manual'?'manual':'auto';
    const storedTrip=ctx.tripId?tripById.get(String(ctx.tripId)):null;
    const autoTrip=storedTrip||autoTripForOrder(ctx);
    const manualTrip=storedTrip||null;
    const effectiveTrip=tripMode==='manual'?(manualTrip||autoTrip||null):autoTrip;
    const preferredTripDate=getOrderTripDate(ctx,prodShifts||[])||'';
    const preferredTripShiftName=getOrderTripShiftName(ctx,prodShifts||[])||'';
    return {...o,_ctx:ctx,_autoTrip:autoTrip,_effectiveTrip:effectiveTrip,_preferredTripDate:preferredTripDate,_preferredTripShiftName:preferredTripShiftName,_area:o._area||getArea(ctx)||''};
  };
  const sortableOrderMeta=sortMode==='trip'?orderMeta.map(enrichOrderTripMeta):orderMeta;
  const groupInfoForOrder=o=>{
    if(sortMode==='trip'){
      if(o._effectiveTrip){
        const label=tripGroupLabel(o._effectiveTrip);
        const tripDateObj=parseAnyDate(o._effectiveTrip.deliveryDate||'');
        const shiftMeta=matchShiftSchedule({shiftId:o._effectiveTrip.shiftId,shiftName:o._effectiveTrip.shiftName,area:o._effectiveTrip.area,deliveryTime:o._effectiveTrip.deliveryTime});
        return {
          key:'trip:'+(o._effectiveTrip.id||tripGroupLabel(o._effectiveTrip)),
          label,
          summaryLabel:label,
          mode:'trip',
          sortDate:tripDateObj?tripDateObj.getTime():Number.MAX_SAFE_INTEGER,
          sortShiftOrder:shiftMeta?shiftMeta._order:Number.MAX_SAFE_INTEGER,
          sortShiftTime:shiftMeta?shiftMeta._startMin:(String(o._effectiveTrip.deliveryTime||'').trim()?timeToMin(o._effectiveTrip.deliveryTime):Number.MAX_SAFE_INTEGER),
          sortText:label
        };
      }
      const pendingKey=[o._preferredTripDate,o._preferredTripShiftName||o._area||''].join('|');
      const pendingLabel=[o._preferredTripDate,o._preferredTripShiftName||o._area].filter(Boolean).join(' · ');
      const label=(pendingLabel?pendingLabel+' · ':'')+'Chưa tạo chuyến';
      const pendingDateObj=parseAnyDate(o._preferredTripDate||'');
      const shiftMeta=matchShiftSchedule({shiftName:o._preferredTripShiftName,area:o._area,deliveryTime:o._ctx?.deliveryTime});
      return {
        key:'trip:pending:'+pendingKey,
        label,
        summaryLabel:label,
        mode:'trip',
        sortDate:pendingDateObj?pendingDateObj.getTime():Number.MAX_SAFE_INTEGER,
        sortShiftOrder:shiftMeta?shiftMeta._order:Number.MAX_SAFE_INTEGER,
        sortShiftTime:shiftMeta?shiftMeta._startMin:(String(o._ctx?.deliveryTime||'').trim()?timeToMin(o._ctx.deliveryTime):Number.MAX_SAFE_INTEGER),
        sortText:pendingLabel||'Chưa tạo chuyến'
      };
    }
    return {
      key:'area:'+areaKey(o._area||''),
      label:o._area||'Chưa phân khu vực',
      summaryLabel:o._area||'Chưa phân khu vực',
      mode:'area',
      sortDate:0,
      sortText:o._area||'Chưa phân khu vực'
    };
  };
  const sortedList=[...sortableOrderMeta].sort((a,b)=>{
    const ga=groupInfoForOrder(a),gb=groupInfoForOrder(b);
    if(sortMode==='trip'){
      const dateCmp=(ga.sortDate||0)-(gb.sortDate||0);
      if(dateCmp!==0)return dateCmp;
      const shiftOrderCmp=(ga.sortShiftOrder??Number.MAX_SAFE_INTEGER)-(gb.sortShiftOrder??Number.MAX_SAFE_INTEGER);
      if(shiftOrderCmp!==0)return shiftOrderCmp;
      const shiftTimeCmp=(ga.sortShiftTime??Number.MAX_SAFE_INTEGER)-(gb.sortShiftTime??Number.MAX_SAFE_INTEGER);
      if(shiftTimeCmp!==0)return shiftTimeCmp;
      const groupCmp=(ga.sortText||'').localeCompare(gb.sortText||'','vi');
      if(groupCmp!==0)return groupCmp;
    }else{
      const areaCmp=(ga.sortText||'zzz').localeCompare(gb.sortText||'zzz','vi');
      if(areaCmp!==0)return areaCmp;
    }
    // Giữ cách gom nhóm theo khu vực/chuyến, nhưng trong từng nhóm luôn xếp ngày giao tăng dần.
    const aDeliveryDate=deliveryOrderDateKey(a._ctx.deliveryDate);
    const bDeliveryDate=deliveryOrderDateKey(b._ctx.deliveryDate);
    const deliveryDateCmp=(aDeliveryDate??Number.MAX_SAFE_INTEGER)-(bDeliveryDate??Number.MAX_SAFE_INTEGER);
    if(deliveryDateCmp!==0)return deliveryDateCmp;
    if(sortMode==='trip'){
      const timeCmp=(a._ctx.deliveryTime||'').localeCompare(b._ctx.deliveryTime||'');
      if(timeCmp!==0)return timeCmp;
    }
    const pointCmp=(a._ctx.pointName||'').localeCompare(b._ctx.pointName||'','vi');
    if(pointCmp!==0)return pointCmp;
    return sortMode==='trip'?String(a.id||'').localeCompare(String(b.id||''),'vi'):(a._ctx.deliveryTime||'').localeCompare(b._ctx.deliveryTime||'');
  });
  const totalPages=Math.max(1,Math.ceil(sortedList.length/pageSize));
  const visiblePage=Math.min(Math.max(1,currentPage),totalPages);
  const pageStart=(visiblePage-1)*pageSize;
  const pageEnd=Math.min(pageStart+pageSize,sortedList.length);
  const pagedList=sortedList.slice(pageStart,pageEnd).map(o=>{
    const enriched=Object.prototype.hasOwnProperty.call(o,'_autoTrip')?o:enrichOrderTripMeta(o);
    return {...enriched,_totalW:calcOrderWeight(enriched._ctx)};
  });
  const visibleProductLabels=pagedList.flatMap(order=>{
    const lines=(order._ctx||orderContext(order)).lines||[];
    return lines.map((line,index)=>({
      label:(index+1)+'. '+String(line?.productName||'Sản phẩm').trim(),
      name:String(line?.productName||'Sản phẩm').trim()
    }));
  });
  const longestVisibleProduct=visibleProductLabels.reduce((longest,item)=>deliveryProductTextWidth(item.label)>deliveryProductTextWidth(longest.label)?item:longest,{label:'',name:''});
  const productColumnWidth=Math.max(145,Math.min(420,Math.ceil(deliveryProductTextWidth(longestVisibleProduct.label)+28)));
  const productColumnTitle=longestVisibleProduct.name
    ?'Tên dài nhất đang hiển thị: '+longestVisibleProduct.name+' ('+Array.from(longestVisibleProduct.name).length+' ký tự)'
    :'Chưa có tên sản phẩm';
  const existingOrderKeys=new Set(allOrderRowKeys);
  const selectedOrderKeys=isAdmin
    ?Object.keys(bulkSelected).filter(key=>bulkSelected[key]&&existingOrderKeys.has(key))
    :[];
  const pageOrderKeys=pagedList.map(orderRowKey);
  const filteredOrderKeys=list.map(orderRowKey);
  const allPageSelected=pageOrderKeys.length>0&&pageOrderKeys.every(key=>!!bulkSelected[key]);
  const allFilteredSelected=filteredOrderKeys.length>0&&filteredOrderKeys.every(key=>!!bulkSelected[key]);
  const toggleBulkOrder=order=>{
    if(!isAdmin)return;
    const key=orderRowKey(order);
    if(!key)return;
    setBulkSelected(prev=>{
      const next={...prev};
      if(next[key])delete next[key];else next[key]=true;
      return next;
    });
  };
  const setPageSelection=checked=>{
    if(!isAdmin)return;
    setBulkSelected(prev=>{
      const next={...prev};
      pageOrderKeys.forEach(key=>{if(checked)next[key]=true;else delete next[key];});
      return next;
    });
  };
  const toggleFilteredSelection=()=>{
    if(!isAdmin||!filteredOrderKeys.length)return;
    setBulkSelected(prev=>{
      const next={...prev};
      filteredOrderKeys.forEach(key=>{if(allFilteredSelected)delete next[key];else next[key]=true;});
      return next;
    });
  };
  const deleteSelectedOrders=()=>{
    if(!isAdmin)return;
    const keys=selectedOrderKeys;
    if(!keys.length){window.showToast('Chưa chọn đơn hàng cần xóa.','warning');return;}
    const message='Bạn sắp xóa vĩnh viễn '+keys.length+' đơn hàng đã chọn.\nCác đơn này cũng sẽ được gỡ khỏi chuyến liên quan.\n\nThao tác không thể hoàn tác. Tiếp tục xóa?';
    if(!window.confirm(message))return;
    const keySet=new Set(keys);
    applyOrdersAndTripSync(prev=>{
      const prevKeys=deliveryOrderRecordKeys(prev);
      return prev.filter((_order,index)=>!keySet.has(prevKeys[index]));
    });
    setBulkSelected({});
    window.showToast('Đã xóa '+keys.length+' đơn hàng.','success');
  };
  const updateOrderProductNames=async()=>{
    if(!isAdmin)return;
    const targetKeys=new Set(selectedOrderKeys.length?selectedOrderKeys:list.map(orderRowKey));
    const productById=new Map((products||[]).filter(p=>p?.id).map(p=>[String(p.id),p]));
    const eligibleStatuses=new Set(['pending','assigned']);
    let orderCount=0,lineCount=0;
    (orders||[]).forEach((order,index)=>{
      if(!targetKeys.has(allOrderRowKeys[index])||!eligibleStatuses.has(order.status||'pending'))return;
      let changed=false;
      (order.lines||[]).forEach(line=>{
        const product=productById.get(String(line.productId||''));
        if(product&&String(product.name||'').trim()&&String(line.productName||'').trim()!==String(product.name||'').trim()){
          lineCount++;changed=true;
        }
      });
      if(changed)orderCount++;
    });
    if(!lineCount){window.showToast('Không có tên sản phẩm nào cần cập nhật trong phạm vi đã chọn.','info');return;}
    const scopeText=selectedOrderKeys.length?(selectedOrderKeys.length+' đơn đã chọn'):'danh sách đang lọc';
    const ok=await window.scfConfirm('Cập nhật '+lineCount+' dòng sản phẩm trong '+orderCount+' đơn thuộc '+scopeText+'?\n\nChỉ đơn Chờ xếp và Đã xếp được cập nhật. Đơn đã giao hoặc đã hủy sẽ được giữ nguyên.','Cập nhật tên sản phẩm');
    if(!ok)return;
    applyOrdersAndTripSync(prev=>{
      const prevKeys=deliveryOrderRecordKeys(prev);
      return prev.map((order,index)=>{
        if(!targetKeys.has(prevKeys[index])||!eligibleStatuses.has(order.status||'pending'))return order;
        let changed=false;
        const lines=(order.lines||[]).map(line=>{
          const product=productById.get(String(line.productId||''));
          const nextName=String(product?.name||'').trim();
          if(!nextName||String(line.productName||'').trim()===nextName)return line;
          changed=true;
          return {...line,productName:nextName};
        });
        return changed?{...order,lines,updatedAt:fmtDT(),updatedBy:currentUser?.name||''}:order;
      });
    });
    window.showToast('Đã cập nhật tên cho '+lineCount+' dòng sản phẩm trong '+orderCount+' đơn.','success');
  };
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const labelPackRule=line=>{
    const product=(products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||null;
    return resolveProductLabelPackRule(product,line?.productName||product?.name||'');
  };
  const pacPackWeight=line=>{
    const product=(products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||null;
    const explicit=numFmt(product?.weightPerUnit)||numFmt(line?.weightPerUnit)||0;
    if(explicit>0)return explicit;
    const text=[line?.productName,product?.name,line?.customerProductName,product?.custName].filter(Boolean).join(' ').toUpperCase();
    const m=text.match(/(\d+(?:[.,]\d+)?)\s*KG\s*\/\s*PAC\b/);
    return m?numFmt(String(m[1]).replace(',','.')):0;
  };
  const isPacPackageLine=line=>{
    const product=(products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||null;
    const text=[line?.productName,product?.name,line?.customerProductName,product?.custName].filter(Boolean).join(' ').toUpperCase();
    const unit=String(line?.unit||product?.unit||'').trim().toLowerCase();
    return text.includes('/PAC')||text.includes('KG/PAC')||(/\bpac\b/i.test(text)&&/gói|goi/i.test(unit));
  };
  const splitLabelWeights=(totalKg,line)=>{
    const rule=labelPackRule(line);
    if(!rule.enabled)return [];
    if(isPacPackageLine(line)){
      const packCount=Math.max(0,Math.round(orderLineQty(line)));
      const perPackWeight=Number(pacPackWeight(line)||0);
      if(!(packCount>0) || !(perPackWeight>0))return [];
      return Array.from({length:packCount},()=>perPackWeight);
    }
    const kg=Number(numFmt(totalKg)||0);
    if(!(kg>0))return [];
    const pack=Number(rule.pack||10);
    const full=Math.floor(kg/pack);
    const rem=Number((kg-full*pack).toFixed(2));
    const parts=Array.from({length:full},()=>pack);
    if(rem>0){
      if(rule.mergeSmallRemainder&&rem<2&&parts.length)parts[parts.length-1]=Number((parts[parts.length-1]+rem).toFixed(2));
      else parts.push(rem);
    }
    return parts;
  };
  const labelLinesForOrder=o=>{
    const plan=prodShiftPlan(o,prodShifts||[],prodShiftRules);
    const labels=[];
    (o.lines||[]).forEach(l=>{
      const kg=orderLineWeight(l);
      if(!kg)return;
      splitLabelWeights(kg,l).forEach(partKg=>labels.push({line:l,kg:partKg,plan,order:o}));
    });
    return labels;
  };
  const cleanPacProductName=name=>String(name||'')
    .replace(/\s+/g,' ')
    .replace(/\s*,\s*\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'')
    .replace(/\s+\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'')
    .replace(/\s*,\s*PAC\b/ig,'')
    .trim()
    .toUpperCase();
  const buildLabelSummaryHtml=labels=>{
    const summaryMap=new Map();
    labels.forEach(it=>{
      const product=String(it.line?.productName||'Sản phẩm').trim()||'Sản phẩm';
      const kgKey=String(numFmt(it.kg));
      const productMap=summaryMap.get(product)||new Map();
      const current=productMap.get(kgKey)||{kg:numFmt(it.kg),count:0};
      current.count+=1;
      productMap.set(kgKey,current);
      summaryMap.set(product,productMap);
    });
    return [...summaryMap.entries()].map(([product,weightMap])=>{
      const parts=[...weightMap.values()]
        .sort((a,b)=>b.kg-a.kg)
        .map(item=>'<span class="summary-chip">'+esc(Number(item.kg||0).toLocaleString('vi-VN',{maximumFractionDigits:2}))+'kg × '+item.count+'</span>')
        .join('');
      return '<div class="summary-row"><div class="summary-product">'+esc(product)+'</div><div class="summary-parts">'+parts+'</div></div>';
    }).join('');
  };
  const buildPrintOrderSummaryHtml=ordersForPrint=>{
    const list=(Array.isArray(ordersForPrint)?ordersForPrint:[ordersForPrint]).filter(Boolean);
    const points=[...new Set(list.map(o=>String(o?.pointName||'').trim()).filter(Boolean))];
    const pointLabel=points.length<=1?(points[0]||'Chưa có địa điểm'):(points.length+' địa điểm');
    const grouped=new Map();
    list.forEach(o=>{
      (o?.lines||[]).filter(Boolean).forEach(line=>{
        const product=String(line?.productName||'Sản phẩm').trim()||'Sản phẩm';
        const unit=String(line?.unit||((products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||{}).unit||'').trim();
        const key=product+'__'+unit;
        const current=grouped.get(key)||{product,unit,qty:0};
        current.qty+=orderLineQty(line);
        grouped.set(key,current);
      });
    });
    const rows=[...grouped.values()]
      .map(item=>'<div class="summary-row"><div class="summary-product">'+esc(item.product)+'</div><div class="summary-parts"><span class="summary-chip">'+esc(Number(item.qty||0).toLocaleString('vi-VN',{maximumFractionDigits:2})+(item.unit?' '+item.unit:''))+'</span></div></div>')
      .join('');
    return {
      pointLabel,
      rows: rows||'<div class="summary-row"><div class="summary-product">Chưa có sản phẩm</div></div>'
    };
  };
  const buildClassicLabelSvg=(it,o)=>{
    const l=it.line;
    const product=l.productName||'';
    const nsx=it.plan?.prodDate||o.deliveryDate||'';
    const gioSx=(it.plan?.prodTime||'').replace(':','H').replace(/H00$/,'H');
    const kgNum=Number(it.kg).toLocaleString('vi-VN',{maximumFractionDigits:2});
    const pName=product.toUpperCase();
    const directUse=pName.includes('BÚN LÁ')||pName.includes('BUN LA')||pName.includes('BÁNH CUỐN')||pName.includes('BANH CUON')||pName.includes('BÁNH PHỞ CUỐN')||pName.includes('BANH PHO CUON');
    const hdsd=directUse?'Ăn trực tiếp':'Trần qua nước sôi trước khi ăn.';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="580" height="400" viewBox="0 0 580 400">'+
        '<rect width="580" height="400" fill="white"/>'+
        '<rect x="10" y="10" width="560" height="380" fill="white" stroke="#111" stroke-width="2"/>'+
        '<text x="160" y="68" font-family="Arial,sans-serif" font-size="54" font-weight="700" text-anchor="middle" lengthAdjust="spacingAndGlyphs" textLength="270">'+esc(product)+'</text>'+
        '<text x="425" y="68" font-family="Arial,sans-serif" font-size="52" font-weight="700" text-anchor="middle">'+kgNum+'</text>'+
        '<text x="520" y="68" font-family="Arial,sans-serif" font-size="38" font-weight="700" text-anchor="middle">KG</text>'+
        '<text x="22" y="112" font-family="Arial,sans-serif"><tspan font-size="22">SP CỦA: C.TY TNHH </tspan><tspan font-size="23" font-weight="700">THỰC PHẨM SÔNG CÔNG</tspan></text>'+
        '<text x="22" y="154" font-family="Arial,sans-serif" font-size="23">ĐC: Tổ 1. P.Mỏ Chè, Sông Công, T.Thái Nguyên</text>'+
        '<text x="22" y="196" font-family="Arial,sans-serif" font-size="23" font-weight="700">SĐT : 0969709878</text>'+
        '<text x="258" y="196" font-family="Arial,sans-serif" font-size="23">THÀNH PHẦN: Bột gạo, nước</text>'+
        '<text x="22" y="238" font-family="Arial,sans-serif" font-size="23">HDSD: '+esc(hdsd)+'</text>'+
        '<text x="512" y="238" font-family="Arial,sans-serif" font-size="25" text-anchor="end"><tspan font-weight="700">PH</tspan> 5-8</text>'+
        '<text x="22" y="280" font-family="Arial,sans-serif" font-size="23">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'+
        '<text x="22" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">NSX:</text>'+
        '<text x="132" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">'+esc(nsx)+'</text>'+
        '<text x="342" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">GIỜ SX</text>'+
        '<text x="512" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700" text-anchor="end">'+esc(gioSx)+'</text>'+
        '<text x="28" y="364" font-family="Arial,sans-serif" font-size="23">HSD: 24H</text>'+
        '<text x="170" y="364" font-family="Arial,sans-serif" font-size="23">FORMOL: 0</text>'+
        '<text x="302" y="364" font-family="Arial,sans-serif" font-size="23">HÀN THE: 0</text>'+
        '<text x="552" y="364" font-family="Arial,sans-serif" font-size="23" text-anchor="end">BQ: 0-10°C</text>'+
      '</svg>'
    );
  };
  const buildPacLabelSvg=(it,o)=>{
    const l=it.line;
    const matchedPoint=(customers||[])
      .flatMap(c=>(c.points||[]))
      .find(p=>p.id===o.pointId||p.id===o.ptId||p.name===o.pointName);
    const pointName=String(matchedPoint?.name||o.pointName||'KHO VẬN').toUpperCase();
    const product=cleanPacProductName(l.productName||'');
    const kgNum=Number(it.kg||0).toLocaleString('vi-VN',{maximumFractionDigits:2});
    const nsx=it.plan?.prodDate||o.deliveryDate||'';
    const gioSx=String(it.plan?.prodTime||'').replace(':','H').replace(/H00$/,'H')||'';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">'+
        '<rect width="1000" height="1000" fill="white"/>'+
        '<g transform="translate(28 41) scale(0.95)">'+
        '<rect x="0" y="0" width="1000" height="1006" fill="white" stroke="#111" stroke-width="6"/>'+
        '<text x="430" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+esc(product)+'</text>'+
        '<text x="804" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+esc(kgNum)+'</text>'+
        '<text x="922" y="143" font-family="Times New Roman,serif" font-size="52" font-weight="700" text-anchor="middle">KG</text>'+
        '<text x="72" y="245" font-family="Times New Roman,serif" font-size="32" font-weight="700">SP CỦA: CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG</text>'+
        '<text x="72" y="329" font-family="Times New Roman,serif" font-size="32" font-weight="700">ĐC: Tổ 1. P.Mỏ Chè, Sông Công, T.Thái Nguyên</text>'+
        '<text x="72" y="413" font-family="Times New Roman,serif" font-size="32" font-weight="700">SĐT : 0969709878</text>'+
        '<text x="510" y="413" font-family="Times New Roman,serif" font-size="32" font-weight="700">TP: Bột gạo, nước</text>'+
        '<text x="72" y="497" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 15°C-20°C. Đóng gói hở. HSD 12h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="581" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 10°C-15°C. Đóng gói hở. HSD 24h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="665" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 5°C-10°C. Đóng gói hở. HSD 36h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="749" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 0°C-5°C. Đóng gói kín. HSD 72h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="833" font-family="Times New Roman,serif" font-size="31" font-weight="700">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'+
        '<text x="105" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">Formol:</text>'+
        '<text x="292" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">0</text>'+
        '<text x="448" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">PH:</text>'+
        '<text x="560" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">5-8</text>'+
        '<text x="634" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">Hàn the:</text>'+
        '<text x="846" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">0</text>'+
        '<text x="140" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">NSX:</text>'+
        '<text x="335" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">'+esc(nsx)+'</text>'+
        '<text x="620" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">GIỜ SX:</text>'+
        '<text x="860" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">'+esc(gioSx)+'</text>'+
        '</g>'+
      '</svg>'
    );
  };
  const openLabelPrintWindow=(labels,ordersForPrint,mode)=>{
    if(!labels.length)return;
    const isPacMode=mode==='pac';
    const isClassic58=!isPacMode;
    const pageSize=isPacMode?'100mm 100mm':'58mm 40mm';
    const labelWidth=isPacMode?'100mm':'58mm';
    const labelHeight=isPacMode?'100mm':'40mm';
    const contentWidth=isPacMode?'100mm':'58mm';
    const contentHeight=isPacMode?'100mm':'40mm';
    const title=isPacMode?'In tem kho vận ':'In tem ';
    const printOrders=(Array.isArray(ordersForPrint)?ordersForPrint:[ordersForPrint]).filter(Boolean);
    const orderSummary=buildPrintOrderSummaryHtml(printOrders);
    const cards=labels.map(it=>{
      const product=it.line?.productName||'';
      const orderForLabel=it.order||printOrders[0]||{};
      const svg=isPacMode?buildPacLabelSvg(it,orderForLabel):buildClassicLabelSvg(it,orderForLabel);
      const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
      return '<section class="label'+(isClassic58?' classic58':'')+'"><img class="label-img'+(isClassic58?' classic58-img':'')+'" alt="Tem '+esc(product)+'" src="'+src+'"></section>';
    }).join('');
    const w=window.open('','_blank');
    if(!w){window.showToast('Trình duyệt đang chặn cửa sổ in tem. Hãy cho phép popup rồi thử lại.','warn');return;}
    const titleSuffix=printOrders.length===1?String(printOrders[0]?.id||''):String(printOrders.length)+' đơn';
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+title+esc(titleSuffix)+'</title><style>'+
      '@page{size:'+pageSize+';margin:0}'+
      '*{box-sizing:border-box}'+
      'html,body{margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
      'body{font-family:Arial,"Times New Roman",serif;color:#111;padding:10px}'+
      '.summary{margin-bottom:10px;padding:10px 12px;border:1px solid #cfe0d7;border-radius:10px;background:#f4faf7}'+
      '.summary-title{font-size:14px;font-weight:700;margin-bottom:8px}'+
      '.summary-sub{font-size:12px;color:#355447;margin-bottom:8px}'+
      '.summary-row{display:flex;align-items:flex-start;gap:8px;justify-content:space-between;margin-bottom:6px}'+
      '.summary-row:last-child{margin-bottom:0}'+
      '.summary-product{font-size:13px;font-weight:700;min-width:170px}'+
      '.summary-parts{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}'+
      '.summary-chip{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:#fff;border:1px solid #b9d1c3;font-size:12px;font-weight:700;color:#234234}'+
      '.labels{display:flex;flex-direction:column;gap:0}'+
      '.label{position:relative;display:block;width:'+labelWidth+';height:'+labelHeight+';overflow:hidden;break-after:page;page-break-after:always}'+
      '.label:last-child{break-after:auto;page-break-after:auto}'+
      '.label-img{display:block;width:'+labelWidth+';height:'+labelHeight+';image-rendering:high-quality;-webkit-user-select:none;user-select:none}'+
      '.label.classic58{width:58mm;height:40mm}'+
      '.label-img.classic58-img{position:static;width:58mm;height:40mm;transform:none}'+
      '@media print{body{padding:0}.summary{display:none}.labels{display:block}.label.classic58{width:58mm;height:40mm}.label-img.classic58-img{position:static;width:'+contentWidth+';height:'+contentHeight+';transform:rotate(180deg);transform-origin:center center}}'+
      '<\/style><\/head><body><div class="summary"><div class="summary-title">Tóm tắt tem trước khi in</div><div class="summary-sub">Địa điểm: '+esc(orderSummary.pointLabel)+' · Tổng số tem: '+labels.length+' · Số đơn: '+printOrders.length+'</div>'+orderSummary.rows+'</div><div class="labels">'+cards+'<\/div><\/body><\/html>');
    w.document.close();
    setTimeout(()=>w.print(),400);
  };
  const printLabels=o=>{
    const labels=labelLinesForOrder(o);
    if(!labels.length){window.showToast('Đơn này chưa có số kg để in tem!','warn');return;}
    const pacLabels=labels.filter(it=>isPacPackageLine(it?.line));
    const classicLabels=labels.filter(it=>!isPacPackageLine(it?.line));
    if(pacLabels.length&&classicLabels.length)window.showToast('Đơn này có cả tem PAC kho vận và tem thường. Hệ thống sẽ mở 2 cửa sổ in riêng.','ok');
    if(pacLabels.length)openLabelPrintWindow(pacLabels,[o],'pac');
    if(classicLabels.length)openLabelPrintWindow(classicLabels,[o],'classic');
  };
  const printLabelsForOrders=ordersToPrint=>{
    const printOrders=(ordersToPrint||[]).filter(Boolean);
    if(!printOrders.length){window.showToast('Chọn ít nhất 1 đơn để in tem!','warn');return;}
    const labels=printOrders.flatMap(o=>labelLinesForOrder(o));
    if(!labels.length){window.showToast('Các đơn đã chọn chưa có dữ liệu để in tem!','warn');return;}
    const pacLabels=labels.filter(it=>isPacPackageLine(it?.line));
    const classicLabels=labels.filter(it=>!isPacPackageLine(it?.line));
    if(pacLabels.length&&classicLabels.length)window.showToast('Danh sách đang có cả tem PAC kho vận và tem thường. Hệ thống sẽ mở 2 cửa sổ in riêng.','ok');
    if(pacLabels.length)openLabelPrintWindow(pacLabels,printOrders,'pac');
    if(classicLabels.length)openLabelPrintWindow(classicLabels,printOrders,'classic');
  };
  const orderTableRows=[];
  let currentGroup=null,groupKL=0,groupCount=0;
  pagedList.forEach((o,i)=>{
    const group=groupInfoForOrder(o);
    if(!currentGroup||group.key!==currentGroup.key){
      if(currentGroup)orderTableRows.push({_sub:true,group:currentGroup,kl:groupKL,cnt:groupCount});
      currentGroup=group;groupKL=0;groupCount=0;
      orderTableRows.push({_hdr:true,group});
    }
    groupKL+=o._totalW;groupCount++;
    orderTableRows.push(o);
    if(i===pagedList.length-1&&currentGroup)orderTableRows.push({_sub:true,group:currentGroup,kl:groupKL,cnt:groupCount});
  });
  const renderPagination=position=>h('div',{key:'pagination_'+position,className:'delivery-pagination'},
    h('span',{className:'delivery-pagination-label'},'Mỗi trang'),
    h('select',{value:pageSize,onChange:e=>setPageSize(Number(e.target.value)||100),title:'Số đơn hiển thị mỗi trang'},
      [20,50,100,200].map(size=>h('option',{key:size,value:size},size+' đơn'))
    ),
    h('button',{type:'button',disabled:visiblePage<=1,onClick:()=>setCurrentPage(1),title:'Trang đầu'},'«'),
    h('button',{type:'button',disabled:visiblePage<=1,onClick:()=>setCurrentPage(p=>Math.max(1,p-1)),title:'Trang trước'},'‹'),
    h('span',{className:'delivery-pagination-info'},(sortedList.length?pageStart+1:0)+'–'+pageEnd+' / '+sortedList.length+' · Trang '+visiblePage+'/'+totalPages),
    h('button',{type:'button',disabled:visiblePage>=totalPages,onClick:()=>setCurrentPage(p=>Math.min(totalPages,p+1)),title:'Trang sau'},'›'),
    h('button',{type:'button',disabled:visiblePage>=totalPages,onClick:()=>setCurrentPage(totalPages),title:'Trang cuối'},'»')
  );
  return h('div',{className:'delivery-page'+(menuHidden?' compact-menu':'')},
    h('div',{className:'delivery-sticky-head'},
      h('div',{className:'delivery-title-row',style:{marginBottom:10}},
        h('div',{className:'delivery-status-row'},sts.map(([v,l])=>h('button',{key:v,className:'pill'+(filter===v?' on':''),onClick:()=>sf(v)},l+' ('+statusCount(v)+')'))),
        h('div',{className:'delivery-title-actions'},
          h('button',{type:'button',className:'mobile-only delivery-mobile-actions-toggle',onClick:()=>setMobileActionsOpen(v=>!v),'aria-expanded':mobileActionsOpen},
            h('i',{className:'ti ti-dots'}),mobileActionsOpen?'Thu gọn':'Tiện ích'
          ),
          h('div',{className:'delivery-secondary-actions'+(mobileActionsOpen?' mobile-open':'')},
          h('button',{
            onClick:()=>sm('imageImport'),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#6D28D9',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-photo-scan',style:{fontSize:14}}),'Lấy đơn từ ảnh'),
          h('button',{
            onClick:()=>sm('print'),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#185FA5',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-printer',style:{fontSize:14}}),'In phiếu KH'),
          h('button',{
            onClick:()=>sm('printlabels'),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#8B5E00',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-tags',style:{fontSize:14}}),'In tem nhiều đơn'),
          h('button',{
            onClick:updateAutoProductionTimes,
            title:'Cập nhật lại ca SX, ngày SX, giờ SX, chuyến xe, ngày in tem và giờ in tem cho các đơn đang dùng tự động trong danh sách đang lọc',
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#2d6a4f',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-refresh',style:{fontSize:14}}),'Cập nhật SX + chuyến'),
          isAdmin&&h('button',{
            onClick:updateOrderProductNames,
            title:selectedOrderKeys.length?'Cập nhật tên sản phẩm cho các đơn đã chọn':'Cập nhật tên sản phẩm cho đơn Chờ xếp/Đã xếp trong danh sách đang lọc',
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#0f766e',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-package-import',style:{fontSize:14}}),'Cập nhật tên SP'+(selectedOrderKeys.length?' ('+selectedOrderKeys.length+')':'')),
          h('button',{
            title:'Import đơn hàng từ file Excel của khách hàng',
            onClick:()=>document.getElementById('import-from-customer-hidden')?.click(),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'var(--pri3)',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-file-import',style:{fontSize:14}}),'Import từ KH')
          ),
          h('div',{className:'delivery-create-action'},h(AddBtn,{onClick:()=>{se(null);setCopyDraft(null);sm('f')},label:'Tạo đơn giao'}))
        )
      ),
    h('div',{className:'mobile-only delivery-mobile-filter-head'},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm đơn hàng...'}),
      h('button',{type:'button',onClick:()=>setMobileFiltersOpen(v=>!v),'aria-expanded':mobileFiltersOpen},
        h('i',{className:'ti ti-adjustments-horizontal'}),' Bộ lọc',([hasDateFilter,fPoint,fProduct,fTime,fArea].filter(Boolean).length?' ('+[hasDateFilter,fPoint,fProduct,fTime,fArea].filter(Boolean).length+')':'')
      )
    ),
    h('div',{className:'delivery-filter-panel'+(mobileFiltersOpen?' mobile-open':''),style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{className:'delivery-filter-controls',style:{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',flex:'1 1 760px'}},
        h('div',{className:'delivery-filter-search-inline'},h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm đơn hàng...',style:{flex:'1 1 160px',minWidth:130}})),
        h('select',{value:dateFilterMode,onChange:e=>changeDateFilterMode(e.target.value),title:'Kiểu lọc ngày giao',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:112}},
          h('option',{value:'day'},'Một ngày'),
          h('option',{value:'range'},'Khoảng ngày'),
          h('option',{value:'week'},'Theo tuần'),
          h('option',{value:'month'},'Theo tháng')
        ),
        dateFilterMode==='day'&&h('input',{type:'date',value:fDate,onChange:e=>sfDate(e.target.value),title:'Ngày giao',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:130}}),
        dateFilterMode==='range'&&h('div',{className:'delivery-date-range',style:{display:'inline-flex',alignItems:'center',gap:4}},
          h('span',{style:{fontSize:11,color:'var(--tx2)'}},'Từ'),
          h('input',{type:'date',value:fDate,onChange:e=>sfDate(e.target.value),title:'Từ ngày',style:{padding:'5px 6px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:128}}),
          h('span',{style:{fontSize:11,color:'var(--tx2)'}},'Đến'),
          h('input',{type:'date',value:fDateTo,onChange:e=>sfDateTo(e.target.value),title:'Đến ngày',style:{padding:'5px 6px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:128}})
        ),
        dateFilterMode==='week'&&h('input',{type:'week',value:fWeek,onChange:e=>sfWeek(e.target.value),title:'Tuần giao hàng',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:145}}),
        dateFilterMode==='month'&&h('input',{type:'month',value:fMonth,onChange:e=>sfMonth(e.target.value),title:'Tháng giao hàng',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:140}}),
        h('select',{value:fPoint,onChange:e=>sfPoint(e.target.value),title:'Lọc theo địa điểm có trong các đơn đang hiển thị',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:160}},
          h('option',{value:''},'Tất cả địa điểm ('+pointOptions.length+')'),
          pointOptions.map(point=>h('option',{key:point,value:point},point))
        ),
        h('select',{value:fProduct,onChange:e=>sfProduct(e.target.value),title:'Lọc theo tên sản phẩm đang có trong đơn hàng',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:160}},
          h('option',{value:''},'Tất cả sản phẩm'),
          [...new Set((orders||[]).flatMap(order=>(order.lines||[]).map(line=>String(line.productName||'').trim())).filter(Boolean))]
            .sort((a,b)=>a.localeCompare(b,'vi',{sensitivity:'base',numeric:true})).map(productName=>
            h('option',{key:productName,value:productName},productName)
          )
        ),
        h('select',{value:fTime,onChange:e=>sfTime(e.target.value),
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:100}},
          h('option',{value:''},'Tất cả giờ'),
          [...new Set(orders.map(o=>normalizeTimeInput(o.deliveryTime||'')).filter(Boolean))].sort((a,b)=>timeToMin(a)-timeToMin(b)||a.localeCompare(b,'vi')).map(t=>h('option',{key:t,value:t},t))
        ),
        h('select',{value:fArea,onChange:e=>sfArea(e.target.value),
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:120}},
          h('option',{value:''},'Tất cả KV'),
          [...new Set(customers.flatMap(c=>(c.points||[]).map(p=>p.area)).filter(Boolean))].sort().map(a=>h('option',{key:a,value:a},a))
        ),
        (hasDateFilter||fPoint||fProduct||fTime||fArea)&&h('button',{
          onClick:resetDeliveryFilters,
          style:{padding:'5px 8px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',cursor:'pointer',color:'var(--tx2)',whiteSpace:'nowrap'}
        },'✕'),
        (hasDateFilter||fPoint||fProduct||fTime||fArea)&&h('span',{style:{fontSize:12,color:'var(--pri)',fontWeight:500,whiteSpace:'nowrap'}},
          list.length+' kết quả'
        ),
        list.length>0&&renderPagination('top'),
        isAdmin&&h('button',{
          type:'button',
          disabled:!filteredOrderKeys.length,
          onClick:toggleFilteredSelection,
          title:allFilteredSelected?'Bỏ chọn toàn bộ kết quả đang lọc':'Chọn toàn bộ kết quả đang lọc',
          style:{padding:'5px 9px',fontSize:12,borderRadius:'var(--r)',border:'1px solid #2d6a4f',background:allFilteredSelected?'#e8f5e9':'#fff',color:'#1f5c45',cursor:filteredOrderKeys.length?'pointer':'not-allowed',fontWeight:600,whiteSpace:'nowrap'}
        },h('i',{className:allFilteredSelected?'ti ti-checkbox':'ti ti-square',style:{fontSize:14}}),' ',allFilteredSelected?'Bỏ chọn tất cả':'Chọn tất cả ('+filteredOrderKeys.length+')'),
        isAdmin&&h('button',{
          type:'button',
          disabled:!selectedOrderKeys.length,
          onClick:deleteSelectedOrders,
          title:'Xóa vĩnh viễn các đơn hàng đã chọn',
          style:{padding:'5px 9px',fontSize:12,borderRadius:'var(--r)',border:'1px solid #A32D2D',background:selectedOrderKeys.length?'#A32D2D':'#f4e6e6',color:selectedOrderKeys.length?'#fff':'#9f7777',cursor:selectedOrderKeys.length?'pointer':'not-allowed',fontWeight:700,whiteSpace:'nowrap'}
        },h('i',{className:'ti ti-trash',style:{fontSize:14}}),' Xóa đã chọn ('+selectedOrderKeys.length+')'),
        h('div',{style:{display:'flex',alignItems:'center',gap:4,padding:3,border:'1px solid var(--bd)',borderRadius:999,background:'var(--bg2)'}},
          h('span',{style:{fontSize:11,color:'var(--tx2)',padding:'0 6px',whiteSpace:'nowrap'}},'Sắp xếp'),
          h('button',{
            type:'button',
            onClick:()=>setSortMode('area'),
            style:{padding:'5px 10px',fontSize:12,border:'none',borderRadius:999,cursor:'pointer',background:sortMode==='area'?'var(--pri)':'transparent',color:sortMode==='area'?'#fff':'var(--tx2)',fontWeight:600,whiteSpace:'nowrap'}
          },'Theo khu vực'),
          h('button',{
            type:'button',
            onClick:()=>setSortMode('trip'),
            style:{padding:'5px 10px',fontSize:12,border:'none',borderRadius:999,cursor:'pointer',background:sortMode==='trip'?'var(--pri)':'transparent',color:sortMode==='trip'?'#fff':'var(--tx2)',fontWeight:600,whiteSpace:'nowrap'}
          },'Theo chuyến')
        ),
        h(ExportBtn,{onClick:()=>{
          // Flatten orders + lines for Excel export
          const rows=[];
          list.forEach(o=>{
            if(!o.lines||o.lines.length===0){
              const plan=prodShiftPlan(o,prodShifts||[],prodShiftRules);
              rows.push({'Mã đơn':o.id,'Khách hàng':o.customer,'Ngày giao':o.deliveryDate,'Giờ giao':normalizeTimeInput(o.deliveryTime||''),'Điểm giao':o.pointName||'','Công đi':o.workOut||0,'Công về':o.workReturn||0,'Trạng thái':o.status,'Ghi chú đơn':o.note||'','Sản phẩm':'','ĐVT':'','SL Đặt':0,'SL hóa đơn':0,'Giá mua':0,'Thành tiền mua':0,'Ca SX':plan?.shift?.name||'','Giờ SX thực tế':plan?.prodTime||'','Ngày SX':plan?.prodDate||'','Giờ in tem':plan?.labelTime||'','Ngày in tem':plan?.labelDate||'','Ghi chú dòng':''});
            } else {
              o.lines.forEach((l,i)=>{
                const plan=i===0?prodShiftPlan(o,prodShifts||[],prodShiftRules):null;
                const buy=numFmt(l.purchasePrice||l.price);
                const qty=numFmt(l.qtyInvoice)||numFmt(l.qtyProd);
                rows.push({'Mã đơn':i===0?o.id:'','Khách hàng':i===0?o.customer:'','Ngày giao':i===0?o.deliveryDate:'','Giờ giao':i===0?normalizeTimeInput(o.deliveryTime||''):'','Điểm giao':i===0?(o.pointName||''):'','Công đi':i===0?(o.workOut||0):0,'Công về':i===0?(o.workReturn||0):0,'Trạng thái':i===0?o.status:'','Ghi chú đơn':i===0?(o.note||''):'',' Sản phẩm':l.productName||'','ĐVT':l.unit||'','SL Đặt':l.qtyProd||0,'SL hóa đơn':l.qtyInvoice||0,'Giá mua':buy,'Thành tiền mua':buy*qty,'Ca SX':i===0?(plan?.shift?.name||''):'','Giờ SX thực tế':i===0?(plan?.prodTime||''):'','Ngày SX':i===0?(plan?.prodDate||''):'','Giờ in tem':i===0?(plan?.labelTime||''):'','Ngày in tem':i===0?(plan?.labelDate||''):'','Ghi chú dòng':l.note||''});
              });
            }
          });
          const ws=XLSX.utils.json_to_sheet(rows);
          const wb=XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb,ws,'Don giao hang');
          XLSX.writeFile(wb,'Don_giao_hang_'+fmtDate().split('/').join('-')+'.xlsx');
        }}),
        h(ImportBtn,{onFile:rows=>{
          // Group rows by Mã đơn to reconstruct orders
          const orderMap={};
          rows.forEach(r=>{
            const id=(r['Mã đơn']||'').toString().trim();
            if(id){
              // New order header
              const seq=Object.keys(orderMap).length+1;
              orderMap[id]={
                id:id||('D'+new Date().getFullYear().toString().slice(-2)+String(seq).padStart(6,'0')),
                customer:r['Khách hàng']||'',custId:'',
                deliveryDate:r['Ngày giao']||fmtDate(),
                deliveryTime:normalizeTimeInput(r['Giờ giao']||''),
                prodShiftAssignMode:String(r['Ca SX']||'').trim()?'manual':'auto',
                prodShiftId:((prodShifts||[]).find(s=>(s.name||'')===(r['Ca SX']||''))||getProdShiftForOrder({deliveryTime:normalizeTimeInput(r['Giờ giao']||''),pointName:r['Điểm giao']||r['Địa điểm']||'',area:r['Khu vực']||'',address:r['Địa điểm']||'',customer:r['Khách hàng']||''},prodShifts||[],customers||[]))?.id||'',
                address:r['Địa chỉ']||'',
                pointName:r['Điểm giao']||'',ptId:'',
                workOut:r['Công đi']||0,workReturn:r['Công về']||0,
                status:r['Trạng thái']||'pending',
                note:r['Ghi chú đơn']||'',
                lines:[],createdAt:fmtDate(),updatedAt:fmtDT()
              };
              // Find custId
              const cust=customers.find(c=>c.name===r['Khách hàng']);
              if(cust){orderMap[id].custId=cust.id;}
            }
            // Add line to latest order
            const latestId=id||Object.keys(orderMap)[Object.keys(orderMap).length-1];
            const sp=r[' Sản phẩm']||r['Sản phẩm']||'';
            if(latestId&&orderMap[latestId]&&sp){
              const prod=products.find(p=>p.name===sp);
              orderMap[latestId].lines.push({
                id:uid(),
                productId:prod?prod.id:'',productName:sp,
                unit:r['ĐVT']||'',
                weightPerUnit:prod?prod.weightPerUnit||0:0,
                qtyProd:Number(r['SL Đặt']||r['SL đặt']||r['SL sản xuất'])||0,
                qtyInvoice:Number(r['SL hóa đơn'])||0,
                purchasePrice:numFmt(r['Giá mua']),
                price:numFmt(r['Giá mua']),
                shift:(r['Ca SX']||'').includes('đêm')?'night':'day',
                note:r['Ghi chú dòng']||''
              });
            }
          });
          const imported=Object.values(orderMap).filter(o=>o.customer);
          setOrders(p=>{
            const map={};p.forEach(x=>{map[x.id]=x;});
            imported.forEach(x=>{map[x.id]=map[x.id]?{...map[x.id],...x,lines:x.lines.length?x.lines:map[x.id].lines}:x;});
            return Object.values(map);
          });
          window.showToast('Đã nhập/cập nhật '+imported.length+' đơn hàng','success');
        }}),
        h('button',{
          type:'button',
          onClick:()=>setMenuHidden(v=>!v),
          title:(menuHidden?'Hiện lại header + menu web':'Ẩn header + menu web')+' (Ctrl + Shift + A)',
          style:{padding:'6px 12px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'#fff',color:'var(--tx2)',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',gap:5}
        },
          h('i',{className:'ti '+(menuHidden?'ti-layout-navbar-expand':'ti-layout-navbar-collapse'),style:{fontSize:14}}),
          menuHidden?'Hiện menu':'Ẩn menu'
        ),
        modal==='print'&&h(PrintByCustomerModal,{orders,customers,products,company,initialDate:dateFilterMode==='day'?fDate:'',onClose:()=>sm(null)}),
        modal==='printlabels'&&h(PrintLabelsMultiModal,{orders,customers,initialDate:dateFilterMode==='day'?fDate:'',onClose:()=>sm(null),onPrint:printLabelsForOrders}),
        modal==='importPreview'&&window._importData&&h(ImportPreviewModal,{data:window._importData,customers,setCustomers,orders,setOrders,products,prodCats,prodShifts,onClose:()=>{sm(null);delete window._importData;}}),
        modal==='imageImport'&&h(ImageOrderImportModal,{customers,products,orders,setOrders,prodShifts,onClose:()=>sm(null)}),
        h('button',{
          onClick:()=>sm('imageImport'),
          style:{display:'none'}
        },h('i',{className:'ti ti-photo-scan',style:{fontSize:14}}),'Lấy đơn từ ảnh'),
        h('button',{
          id:'import-from-customer-hidden',
          title:'Import đơn hàng từ file Excel của khách hàng',
          style:{display:'none'},
          onClick:()=>{
            const inp=document.createElement('input');
            inp.type='file';inp.accept='.xlsx,.xls';
            inp.onchange=e=>{
              const file=e.target.files[0];if(!file)return;
              const reader=new FileReader();
              reader.onload=ev=>{
                const wb=XLSX.read(ev.target.result,{type:'binary'});
                const ws=wb.Sheets[wb.SheetNames[0]];
                const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:null});
                // Tự nhận dạng cột đầu tiên rồi đọc: [date, point, productStr, qtyHD, _, time].
                const columnOffset=customerImportColumnOffset(raw);
                const orderMap={};
                const invalidDateRows=[];
                raw.forEach((r,idx)=>{
                  const cells=(r||[]).slice(columnOffset);
                  const sourceCells=cells.slice(0,9);
                  if(!sourceCells.some(v=>v!==null&&v!==undefined&&String(v).trim()!==''))return;
                  const headerText=normalizeLookupText(sourceCells.join(' '));
                  if(headerText.includes('ngay')&&(headerText.includes('san pham')||headerText.includes('ten hang'))&&(headerText.includes('so luong')||headerText.includes('sl')))return;
                  // Format date
                  let dStr='';
                  if(cells[0] instanceof Date||typeof cells[0]==='number'){
                    const d=typeof cells[0]==='number'?new Date(Math.round((cells[0]-25569)*86400*1000)):cells[0];
                    const excelDate=XLSX.SSF.parse_date_code(cells[0]);
                    if(excelDate){dStr=String(excelDate.d).padStart(2,'0')+'/'+String(excelDate.m).padStart(2,'0')+'/'+excelDate.y;}
                    else{dStr=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();}
                  } else if(typeof cells[0]==='string') dStr=cells[0];
                  const point=(cells[1]||'').toString().trim();
                  const col4=String(cells[4]??'').trim();
                  const normalizedCol4Time=normalizeCustomerImportTime(col4);
                  const col4LooksTime=/^\d{1,2}:\d{2}$/.test(normalizedCol4Time)&&timeToMin(normalizedCol4Time)>=0;
                  const trailingTimeCells=cells.slice(4,10);
                  const explicitTimeCell=trailingTimeCells.find(value=>/(?:\d\s*[hH]|\d\s*(?:giờ|gio)|\d{1,2}\s*[:.]\s*\d{1,2})/i.test(String(value??'').trim()));
                  const excelTimeCell=trailingTimeCells.find((value,tailIndex)=>tailIndex>0&&typeof value==='number'&&value>=0&&value<1);
                  const time=normalizeCustomerImportTime(explicitTimeCell??excelTimeCell??(col4LooksTime?col4:''));
                  const dParts=(dStr||'').split('/');
                  const dd=(dParts[0]||'').toString().padStart(2,'0');
                  const mm=(dParts[1]||'').toString().padStart(2,'0');
                  const yyyy=(dParts[2]||'').toString();
                  const validDate=isValidCustomerImportDate(dStr);
                  if(!validDate){
                    invalidDateRows.push(idx+1);
                  }
                  const yy=validDate?yyyy.slice(-2):'00';
                  const dateCode=validDate?yy+dd+mm:'000000';
                  const key=validDate&&point&&time?dStr+'|'+point+'|'+time:'__incomplete_row_'+idx;
      if(!orderMap[key]){
                    const autoProdShift=getProdShiftForOrder({deliveryTime:time,pointName:point,area:'',address:'',customer:''},prodShifts||[],customers||[]);
                    orderMap[key]={
                      id:'D'+dateCode+String(Object.keys(orderMap).length+1).padStart(3,'0'),
                      deliveryDate:dStr,pointName:point,pointId:'',
                      customer:'',customerId:'',address:'',
                      productionShift:autoProdShift,
                      prodShiftId:autoProdShift?.id||'',
                      deliveryTime:time,status:'pending',
                      note:'',workOut:0,workReturn:0,
                      lines:[],createdAt:fmtDate(),updatedAt:fmtDT(),_importRow:idx+1
                    };
                    // Find matching point in customers
                    customers.forEach(c=>(c.points||[]).forEach(pt=>{
                      if(pt.name.trim().toUpperCase()===point.toUpperCase()){
                        orderMap[key].pointId=pt.id;
                        orderMap[key].pointName=pt.name;
                        orderMap[key].customer=c.name;
                        orderMap[key].customerId=c.id;
                        orderMap[key].address=pt.address||'';
                      }
                    }));
                  }
                  // Parse product
                  const rawProduct=String(cells[2]??'').trim();
                  const safeProduct=/^#(?:N\/A|VALUE!|REF!|NAME\?|DIV\/0!|NULL!|NUM!)$/i.test(rawProduct)?'':rawProduct;
                  const {name,unit}=parseProductStr(safeProduct);
                  const qtyOrdered=parseFloat(String(cells[3]??'').replace(',','.'))||0;
                  const separateInvoiceQty=col4&&!col4LooksTime&&Number.isFinite(Number(col4.replace(',','.')));
                  const qtyInvoice=separateInvoiceQty?(parseFloat(col4.replace(',','.'))||0):qtyOrdered;
                  // Find product in catalog
                  const prod=products.find(p=>p.name.toUpperCase()===name.toUpperCase())||{};
                  orderMap[key].lines.push({
                    id:uid(),productId:prod.id||'',productName:name,
                    unit:prod.unit||unit,weightPerUnit:prod.weightPerUnit||0,
                    qtyProd:qtyOrdered,qtyInvoice:qtyInvoice,shift:'day',note:''
                  });
                });
                const newOrders=Object.values(orderMap).filter(o=>o.lines.length>0);
                if(newOrders.length===0){
                  window.showToast(invalidDateRows.length?'Có '+invalidDateRows.length+' dòng thiếu hoặc sai ngày/năm.':'Không đọc được đơn hàng nào!',invalidDateRows.length?'warn':'error');
                  return;
                }
                const incompleteOrders=newOrders.map(order=>({order,issues:customerImportOrderIssues(order)})).filter(item=>item.issues.length);
                const incompleteIds=new Set(incompleteOrders.map(item=>item.order.id));
                // Check duplicates & unknown points
                const dupOrders=newOrders.filter(o=>!incompleteIds.has(o.id)&&orders.some(ex=>
                  ex.deliveryDate===o.deliveryDate&&
                  ex.pointName===o.pointName&&
                  (ex.deliveryTime===o.deliveryTime||timeToMin(ex.deliveryTime)===timeToMin(o.deliveryTime))
                ));
                const unknownPts=[...new Set(newOrders.filter(o=>!o.customerId&&o.pointName).map(o=>o.pointName))];
                // Store parsed data for modal
                if(invalidDateRows.length){
                  window.showToast('Có '+invalidDateRows.length+' dòng thiếu hoặc sai ngày/năm. Vui lòng kiểm tra trước khi import.','warn');
                }
                window._importData={newOrders,dupOrders,unknownPts,incompleteOrders,invalidDateRows,columnOffset};
                sm('importPreview');
              };
              reader.readAsBinaryString(file);
            };
            inp.click();
          }
        },h('i',{className:'ti ti-file-import',style:{fontSize:14}}),'Import từ KH'),
        false&&h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Tạo đơn giao'})
      )),
      null
    ),
    h('div',{className:'delivery-body'},
      h('div',{className:'desktop-only tw delivery-table-wrap',ref:deliveryTableScroll},
        h('table',{className:'delivery-orders-table'},
        h('colgroup',null,
          h('col',{style:{width:95}}),
          h('col',{style:{width:175}}),
          h('col',{style:{width:productColumnWidth}}),
          h('col',{style:{width:85}}),
          h('col',{style:{width:85}}),
          h('col',{style:{width:85}}),
          h('col',{style:{width:75}}),
          h('col',{style:{width:160}}),
          h('col',{style:{width:80}}),
          h('col',{style:{width:110}}),
          h('col',null),
          h('col',{style:{width:126}})
        ),
        h('thead',null,h('tr',null,
          h('th',null,
            isAdmin&&h('input',{
              type:'checkbox',
              checked:allPageSelected,
              onChange:e=>setPageSelection(e.target.checked),
              title:'Chọn hoặc bỏ chọn toàn bộ đơn của trang này',
              style:{width:16,height:16,margin:'0 7px 0 0',verticalAlign:'middle',cursor:'pointer'}
            }),
            'Ngày giao'
          ),
          h('th',null,'Địa điểm giao'),
          h('th',{title:productColumnTitle},'Tên sản phẩm'),
          h('th',{className:'delivery-qty-head'},'SL ĐẶT'),
          h('th',{className:'delivery-qty-head'},'SL HĐ'),
          h('th',{className:'delivery-qty-head'},'SL Giao'),
          h('th',{className:'delivery-center-head'},'Giờ'),
          h('th',{className:'delivery-center-head'},'Ca SX'),
          h('th',{className:'delivery-center-head'},'Hóa đơn'),
          h('th',{className:'delivery-center-head'},'Trạng thái'),
          h('th',null,'Chuyến'),
          h('th',null,'')
        )),
        h('tbody',null,list.length?orderTableRows.map((o,_i)=>{
          if(o._hdr) return h('tr',{key:'oh'+_i},h('td',{colSpan:12,style:{background:'#2d6a4f',color:'#fff',fontWeight:700,fontSize:13,padding:'5px 12px'}},(o.group?.mode==='trip'?'🚚 Chuyến: ':'📍 Khu vực: ')+(o.group?.label||'')));
          if(o._sub) return h('tr',{key:'os'+_i},
            h('td',{colSpan:8,style:{background:'#e8f5e9',fontWeight:600,fontSize:12,padding:'4px 12px',color:'#2d6a4f',textAlign:'right'}},'Tổng trên trang · '+(o.group?.summaryLabel||'')+': '+o.cnt+' đơn — '+o.kl.toFixed(1)+' kg'),
            h('td',{colSpan:4,style:{background:'#e8f5e9'}})
          );
          const ctx=o._ctx||orderContext(o);
          const totalW=o._totalW||calcOrderWeight(ctx);
          const prodShiftMode=o.prodShiftAssignMode==='manual'?'manual':'auto';
          const prodShiftCtx={...ctx,prodShiftAssignMode:prodShiftMode};
          const tripMode=o.tripAssignMode==='manual'?'manual':'auto';
          const tripDateOffset=getOrderTripDateOffset(prodShiftCtx,prodShifts||[]);
          const tripDateOffsetLabel=(tripDateOffset===null||tripDateOffset===undefined||Number.isNaN(tripDateOffset))?'?':tripDateOffset;
          const preferredTripDate=o._preferredTripDate||getOrderTripDate(prodShiftCtx,prodShifts||[])||'';
          const preferredTripShiftName=o._preferredTripShiftName||getOrderTripShiftName(prodShiftCtx,prodShifts||[]);
          const autoTrip=o._autoTrip===undefined?autoTripForOrder(prodShiftCtx):o._autoTrip;
          const tripOptions=tripOptionsForOrder(prodShiftCtx);
          const selectedTripId=tripMode==='manual'?(ctx.tripId||''):(autoTrip?.id||'');
          const tripLabel=autoTrip?.area||autoTrip?.shiftName||preferredTripShiftName;
          const plansForDisplay=prodShiftPlansForOrder(prodShiftCtx,prodShifts||[],prodShiftRules);
          const firstPlanForDisplay=plansForDisplay[0]||prodShiftPlan(prodShiftCtx,prodShifts||[],prodShiftRules);
          const planRows=plansForDisplay.length
            ?plansForDisplay.map((plan,pi)=>({key:plan.line?.id||('plan_'+pi),plan,line:plan.line||ctx.lines?.[pi]||{},productName:plan.productName||plan.line?.productName||'Sản phẩm'}))
            :(ctx.lines||[]).map((line,pi)=>({key:line.id||('line_'+pi),plan:null,line,productName:line.productName||'Sản phẩm'}));
          const tripText=t=>{
            if(!t)return 'Chưa có chuyến phù hợp';
            const parts=[];
            if(t.deliveryDate) parts.push(t.deliveryDate);
            if(t.shiftName) parts.push(t.shiftName);
            if(t.driverName) parts.push(t.driverName); else parts.push('Chưa có lái xe');
            if(t.area) parts.push(t.area);
            return parts.join(' · ');
          };
          const tripSelect=h('div',{className:'delivery-trip-content'},
            h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'nowrap'}},
              h('span',{className:'badge',style:{background:tripMode==='manual'?'#FFF3CD':'#E8F5E9',color:tripMode==='manual'?'#8A5A00':'#1B5E20'}},tripMode==='manual'?'Chọn tay':'T.Đ ('+tripDateOffsetLabel+')'),
              tripLabel&&h('span',{className:'delivery-table-text',style:{color:'var(--tx2)'}},'Ca giao: '+tripLabel),
              h('button',{
                type:'button',
                onClick:()=>setOrderTripMode(o,tripMode==='manual'?'auto':'manual'),
                style:{padding:'3px 8px',fontSize:11,borderRadius:999,border:'1px solid var(--bd)',background:'#fff',cursor:'pointer'}
              },tripMode==='manual'?'Về T.Đ':'Đ.Tay')
            ),
            tripMode==='manual'
              ?h('select',{
                  value:selectedTripId,
                  onChange:e=>assignTripManually(o,e.target.value),
                  style:{fontSize:12,padding:'4px 6px',borderRadius:'var(--r)',border:'1px solid var(--bd)',width:'100%',maxWidth:'100%',color:selectedTripId?'var(--pri)':'var(--tx2)'}
                },
                  h('option',{value:''},'— Chọn chuyến —'),
                  tripOptions.map(t=>h('option',{key:t.id,value:t.id},tripText(t)))
                )
              :h('div',{className:'delivery-table-text',style:{color:selectedTripId?'var(--pri3)':'var(--tx2)',lineHeight:1.4,padding:'2px 0',whiteSpace:'nowrap'}},tripText(autoTrip))
          );
          const productionShiftName=firstPlanForDisplay
            ?h('span',{className:'badge delivery-production-shift-name',title:prodShiftMode==='manual'?'Ca SX chọn tay':'Ca SX tự động',style:{background:firstPlanForDisplay.shift.color,color:firstPlanForDisplay.shift.textColor,border:prodShiftMode==='manual'?'1px solid '+firstPlanForDisplay.shift.textColor:'1px dashed '+firstPlanForDisplay.shift.textColor}},firstPlanForDisplay.shift.name)
            :h('span',{className:'delivery-table-text',style:{color:'var(--tx2)'}},'—');
          const productionShiftDisplay=h('div',{className:'delivery-prod-shift-display'},
            productionShiftName,
            h('div',{className:'delivery-production-shift-date'},'Ngày SX: '+(firstPlanForDisplay?.prodDate||'—'))
          );
          return h('tr',{key:o._rowKey,className:'delivery-order-row'},
            h('td',null,
              h('div',{className:'delivery-order-date'},
                isAdmin&&h('input',{
                  type:'checkbox',
                  checked:!!bulkSelected[o._rowKey],
                  onChange:()=>toggleBulkOrder(o),
                  onClick:e=>e.stopPropagation(),
                  title:'Chọn đơn '+(o.id||''),
                  style:{width:16,height:16,margin:0,flex:'0 0 auto',cursor:'pointer'}
                }),
                h('span',{title:ctx.deliveryDate||''},(()=>{
                  const parts=String(ctx.deliveryDate||'').split('/');
                  return parts.length>=2?parts.slice(0,2).join('/'):ctx.deliveryDate||'—';
                })())
              )
            ),
            h('td',null,h('div',{className:'delivery-point-name',title:ctx.pointName||''},ctx.pointName||'—')),
            // Gộp tên sản phẩm + số lượng để các dòng luôn thẳng hàng.
            h('td',{colSpan:4,className:'delivery-product-qty-cell'},
              h('div',{className:'delivery-product-qty-content',style:{'--delivery-product-column-width':productColumnWidth+'px'}},
                planRows.length
                  ?planRows.map((row,pi)=>h('div',{key:row.key,className:'delivery-product-qty-row'},
                    h('div',{className:'delivery-product-info'},
                      h('div',{className:'delivery-product-name'},(pi+1)+'. '+row.productName)
                    ),
                    h('div',{className:'delivery-order-qty delivery-product-qty-value'},numFmt(row.line?.qtyProd).toLocaleString('vi-VN',{minimumFractionDigits:0,maximumFractionDigits:2})),
                    h('div',{className:'delivery-invoice-qty delivery-product-qty-value'},orderLineQty(row.line).toLocaleString('vi-VN',{minimumFractionDigits:0,maximumFractionDigits:2})),
                    h('div',{className:'delivery-delivered-qty delivery-product-qty-value'},row.line?.qtyDelivered!==undefined&&row.line?.qtyDelivered!==''?numFmt(row.line.qtyDelivered).toLocaleString('vi-VN',{minimumFractionDigits:0,maximumFractionDigits:2}):'—')
                  ))
                  :h('span',{style:{fontSize:11,color:'var(--tx2)'}},'—')
              )
            ),
            h('td',{className:'delivery-center-cell'},ctx.deliveryTime||'—'),
            h('td',{className:'delivery-center-cell'},productionShiftDisplay),
            h('td',{className:'delivery-center-cell'},
              o.invoiceImage
                ?h('div',{style:{display:'flex',gap:4,alignItems:'center',justifyContent:'center'}},
                  h('button',{className:'bi',onClick:()=>setInvoiceView(o),title:'Xem hóa đơn đã upload'},h('i',{className:'ti ti-photo-check',style:{fontSize:15,color:'var(--pri)'}})),
                  h('button',{className:'bi',onClick:()=>pickInvoiceImage(o),title:'Đổi ảnh hóa đơn'},h('i',{className:'ti ti-camera-up',style:{fontSize:15}})),
                  h('button',{className:'bi',onClick:()=>removeInvoiceImage(o),title:'Xóa ảnh hóa đơn',style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
                )
                :h('button',{className:'bi',onClick:()=>pickInvoiceImage(o),title:'Upload/chụp ảnh hóa đơn'},h('i',{className:'ti ti-camera-plus',style:{fontSize:15}}))
            ),
            h('td',{className:'delivery-center-cell'},h(StatusBadge,{s:ctx.status})),
            h('td',{className:'delivery-trip-cell'},tripSelect),
            h('td',null,h('div',{style:{display:'flex',gap:2,justifyContent:'center',alignItems:'center'}},
              h('button',{className:'bi',onClick:()=>spr(o),title:'In hóa đơn'},h('i',{className:'ti ti-printer',style:{fontSize:14}})),
              h('button',{className:'bi',onClick:()=>printLabels(o),title:'In tem'},h('i',{className:'ti ti-tag',style:{fontSize:14}})),
              h('button',{className:'bi',onClick:()=>copyOrder(o),title:'Nhân bản thành đơn mới'},h('i',{className:'ti ti-copy',style:{fontSize:15}})),
              h('button',{className:'bi',onClick:()=>{se(o);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              h('button',{className:'bi',onClick:()=>del(o.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            ))
          );
        }):h('tr',null,h('td',{colSpan:11,className:'empty-st'},'Chưa có đơn giao hàng nào.')))
        )
      )
    ),
    h('div',{className:'mobile-only mobile-card-list'},
      list.length?orderTableRows.map((o,_i)=>{
        if(o._hdr)return h('div',{key:'moh'+_i,style:{background:'#2d6a4f',color:'#fff',fontWeight:700,fontSize:13,padding:'8px 12px',borderRadius:10}},(o.group?.mode==='trip'?'Chuyến: ':'Khu vực: ')+(o.group?.label||''));
        if(o._sub)return h('div',{key:'mos'+_i,style:{background:'#e8f5e9',color:'#2d6a4f',fontWeight:600,fontSize:12,padding:'8px 12px',borderRadius:10}},'Tổng trên trang · '+(o.group?.summaryLabel||'')+': '+o.cnt+' đơn — '+o.kl.toFixed(1)+' kg');
        const ctx=o._ctx||orderContext(o);
        const totalW=o._totalW||calcOrderWeight(ctx);
        const tripMode=o.tripAssignMode==='manual'?'manual':'auto';
        const tripDateOffset=getOrderTripDateOffset(ctx,prodShifts||[]);
        const tripDateOffsetLabel=(tripDateOffset===null||tripDateOffset===undefined||Number.isNaN(tripDateOffset))?'?':tripDateOffset;
        const preferredTripDate=o._preferredTripDate||getOrderTripDate(ctx,prodShifts||[])||'';
        const preferredTripShiftName=o._preferredTripShiftName||getOrderTripShiftName(ctx,prodShifts||[]);
        const autoTrip=o._autoTrip===undefined?autoTripForOrder(ctx):o._autoTrip;
        const tripOptions=tripOptionsForOrder(ctx);
        const selectedTripId=tripMode==='manual'?(ctx.tripId||''):(autoTrip?.id||'');
        const tripLabel=autoTrip?.area||autoTrip?.shiftName||preferredTripShiftName;
        const tripText=t=>{
          if(!t)return 'Chưa có chuyến phù hợp';
          const parts=[];
          if(t.deliveryDate) parts.push(t.deliveryDate);
          if(t.shiftName) parts.push(t.shiftName);
          if(t.driverName) parts.push(t.driverName); else parts.push('Chưa có lái xe');
          if(t.area) parts.push(t.area);
          return parts.join(' · ');
        };
        const plans=prodShiftPlansForOrder(ctx,prodShifts||[],prodShiftRules);
        const firstPlan=plans[0]||prodShiftPlan(ctx,prodShifts||[],prodShiftRules);
        return h('div',{key:'mod_'+o._rowKey,className:'mobile-data-card'},
          h('div',{className:'mobile-data-head'},
            h('div',{style:{display:'flex',alignItems:'flex-start',gap:8,minWidth:0}},
              isAdmin&&h('input',{
                type:'checkbox',
                checked:!!bulkSelected[o._rowKey],
                onChange:()=>toggleBulkOrder(o),
                onClick:e=>e.stopPropagation(),
                title:'Chọn đơn '+(o.id||''),
                style:{width:18,height:18,margin:'1px 0 0',flex:'0 0 auto',cursor:'pointer'}
              }),
              h('div',{style:{minWidth:0}},
                h('div',{className:'mobile-data-order-id'},o.id||'Đơn hàng'),
                h('div',{className:'mobile-data-title'},ctx.pointName||'—'),
                ctx.customer&&normalizeLookupText(ctx.customer)!==normalizeLookupText(ctx.pointName)&&h('div',{className:'mobile-data-customer'},ctx.customer)
              )
            ),
            h('div',{className:'mobile-data-sub'},(ctx.deliveryDate||'—')+(ctx.deliveryTime?' • '+ctx.deliveryTime:''))
          ),
          (ctx.address||ctx.note)&&h('div',{className:'mobile-data-note'},
            ctx.address&&h('div',null,h('i',{className:'ti ti-map-pin'}),' ',ctx.address),
            ctx.note&&h('div',null,h('i',{className:'ti ti-note'}),' ',ctx.note)
          ),
          firstPlan&&h('div',{className:'mobile-data-text'},
            h('span',{style:{display:'inline-block',padding:'3px 9px',borderRadius:12,fontSize:11,fontWeight:700,background:firstPlan.shift.color,color:firstPlan.shift.textColor,marginBottom:6}},firstPlan.shift.name),
            plans.map((plan,pi)=>h('div',{key:(plan.line?.id||pi),style:{fontSize:11,color:'var(--tx2)',lineHeight:1.4,marginTop:pi?6:0}},
              h('div',{style:{fontWeight:600,color:plan.manual?'#8A5A00':'var(--pri3)'}},(pi+1)+'. '+(plan.productName||'Sản phẩm')),
              'SX: '+(plan.prodDate||'—')+' • '+(plan.prodTime||'—')
            ))
          ),
          h('div',{className:'delivery-mobile-products'},
            (ctx.lines||[]).map((line,li)=>h('div',{key:line.id||li,className:'delivery-mobile-product-row'},
              h('span',{title:line.productName||''},(li+1)+'. '+(line.productName||'Sản phẩm')),
              h('b',null,
                (Number(line.qtyProd)||0).toLocaleString('vi-VN',{maximumFractionDigits:2}),
                ' / ',
                orderLineQty(line).toLocaleString('vi-VN',{maximumFractionDigits:2})
              )
            ))
          ),
          h('div',{className:'mobile-data-grid'},
            h('div',{className:'mobile-data-item'},h('b',null,'Khối lượng'),h('span',null,totalW>0?totalW.toFixed(2)+' kg':'—')),
            h('div',{className:'mobile-data-item'},h('b',null,'Trạng thái'),h(StatusBadge,{s:ctx.status})),
            h('div',{className:'mobile-data-item'},h('b',null,'Hóa đơn'),h('span',null,ctx.invoiceImage?'Đã có ảnh':'Chưa có'))
          ),
          h('div',{style:{background:'var(--bg2)',borderRadius:10,padding:'10px'}},
            h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:6}},
              h('span',{className:'badge',style:{background:tripMode==='manual'?'#FFF3CD':'#E8F5E9',color:tripMode==='manual'?'#8A5A00':'#1B5E20'}},tripMode==='manual'?'Chọn tay':'T.Đ ('+tripDateOffsetLabel+')'),
              tripLabel&&h('span',{style:{fontSize:12,color:'var(--tx2)'}},'Ca giao: '+tripLabel),
              h('button',{
                type:'button',
                onClick:()=>setOrderTripMode(o,tripMode==='manual'?'auto':'manual'),
                style:{padding:'3px 8px',fontSize:11,borderRadius:999,border:'1px solid var(--bd)',background:'#fff',cursor:'pointer'}
              },tripMode==='manual'?'Về T.Đ':'Đ.Tay')
            ),
            tripMode==='manual'
              ?h('select',{
                  value:selectedTripId,
                  onChange:e=>assignTripManually(o,e.target.value),
                  style:{fontSize:12,padding:'6px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',width:'100%',color:selectedTripId?'var(--pri)':'var(--tx2)'}
                },
                  h('option',{value:''},'— Chọn chuyến —'),
                  tripOptions.map(t=>h('option',{key:t.id,value:t.id},tripText(t)))
                )
              :h('div',{style:{fontSize:12,color:selectedTripId?'var(--pri3)':'var(--tx2)',lineHeight:1.45}},tripText(autoTrip))
          ),
          h('div',{className:'mobile-data-actions'},
            h('details',{className:'delivery-mobile-more'},
              h('summary',null,h('i',{className:'ti ti-dots'}),' Tiện ích'),
              h('div',{className:'delivery-mobile-more-menu'},
                h('button',{onClick:()=>spr(o)},h('i',{className:'ti ti-printer'}),' In hóa đơn'),
                h('button',{onClick:()=>printLabels(o)},h('i',{className:'ti ti-tag'}),' In tem'),
                h('button',{onClick:()=>copyOrder(o)},h('i',{className:'ti ti-copy'}),' Nhân bản đơn'),
                h('button',{onClick:()=>o.invoiceImage?setInvoiceView(o):pickInvoiceImage(o)},h('i',{className:o.invoiceImage?'ti ti-photo-check':'ti ti-camera-plus'}),o.invoiceImage?' Xem ảnh':' Thêm ảnh'),
                o.invoiceImage&&h('button',{onClick:()=>removeInvoiceImage(o),className:'danger'},h('i',{className:'ti ti-photo-x'}),' Xóa ảnh')
              )
            ),
            h('button',{className:'delivery-mobile-edit',onClick:()=>{se(o);sm('f')}},h('i',{className:'ti ti-edit'}),' Sửa'),
            h('button',{className:'delivery-mobile-delete',onClick:()=>del(o.id)},h('i',{className:'ti ti-trash'}),' Xóa đơn')
          )
        );
      }):h('div',{className:'empty-st delivery-empty-state'},
        (hasDateFilter||fPoint||fProduct||fTime||fArea||q)?'Không có đơn phù hợp với bộ lọc hiện tại.':'Chưa có đơn giao hàng nào.',
        (hasDateFilter||fPoint||fProduct||fTime||fArea)&&h('button',{type:'button',onClick:resetDeliveryFilters},h('i',{className:'ti ti-filter-x'}),' Xóa bộ lọc')
      )
    ),
    totalPages>1&&renderPagination('bottom'),
        modal==='f'&&h(OrderForm,{order:edit||copyDraft,copyMode:!!copyDraft,customers,products,prodCats,quotes,employees,currentUser,prodShifts,onSave:save,onClose:()=>{sm(null);se(null);setCopyDraft(null);}}),
    print&&h(PrintTemplateModal,{order:print,company,onClose:()=>spr(null)}),
    invoiceView&&h(Modal,{title:'Ảnh hóa đơn - '+invoiceView.id,lg:true,onClose:()=>setInvoiceView(null)},
      h('div',{style:{display:'grid',gap:10}},
        h('div',{style:{fontSize:13,color:'var(--tx2)'}},
          h('b',null,invoiceView.pointName||invoiceView.customer||''),' — ',invoiceView.deliveryDate||'',invoiceView.deliveryTime?' · '+invoiceView.deliveryTime:'',
          invoiceView.invoiceUploadedAt?(' · Upload: '+invoiceView.invoiceUploadedAt):''
        ),
        h('div',{style:{border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'#f7faf8',padding:10,textAlign:'center',maxHeight:'70vh',overflow:'auto'}},
          h('img',{src:invoiceView.invoiceImage,style:{maxWidth:'100%',height:'auto',borderRadius:'var(--r)'}})
        ),
        h(Row,null,
          h('button',{onClick:()=>pickInvoiceImage(invoiceView)},h('i',{className:'ti ti-camera-up',style:{fontSize:14}}),' Đổi ảnh'),
          h('button',{onClick:()=>removeInvoiceImage(invoiceView),style:{color:'#A32D2D',borderColor:'#F7C1C1',background:'#FFF5F5'}},h('i',{className:'ti ti-trash',style:{fontSize:14}}),' Xóa ảnh'),
          h('button',{className:'bp',onClick:()=>setInvoiceView(null)},'Đóng')
        )
      )
    )
  );
}
