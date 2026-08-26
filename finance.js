/* ─── QUẢN LÝ DÒNG TIỀN & CÔNG NỢ ─── */
const FIN_IN_CATS=['Doanh thu bán hàng','Thu công nợ khách hàng','Vốn góp','Vay nhận về','Thu khác'];
const FIN_OUT_CATS=['Mua nguyên vật liệu','Mua hàng hóa','Chi phí Lương LX','Chi phí Lương SX','Chi phí Lương KT','Chi phí Điện nước','Chi bếp','Chi phí Bảo dưỡng xe','Chi phí Bảo dưỡng máy','Lương và nhân sự','Xăng dầu','Sửa chữa, bảo dưỡng','Thuế và phí','Trả công nợ nhà cung cấp','Trả nợ vay','Chi khác'];
const finMoney=v=>(Number(v)||0).toLocaleString('vi-VN')+'đ';
const finMoneyInput=v=>{
  const digits=String(v??'').replace(/[^\d]/g,'');
  return digits?Number(digits).toLocaleString('en-US'):'';
};
const finStatusLabel=s=>s==='paid'?'Đã thanh toán':s==='partial'?'Thanh toán một phần':'Chưa thanh toán';
const finDefaultPnl=(direction,category)=>direction==='in'?(category==='Doanh thu bán hàng'||category==='Thu khác'?'revenue':'none'):(category==='Trả công nợ nhà cung cấp'||category==='Trả nợ vay'?'none':'expense');

// Tạo dữ liệu công nợ phải thu từ số lượng giao thực tế của một chuyến.
// Hàm dùng chung cho màn Chuyến giao hàng và Đơn hàng chi tiết.
function financeTripReceivableDrafts(trip,orders,products,quotes,customers,currentUser){
  const dateKey=value=>{
    const s=String(value||'').trim();
    const iso=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if(iso)return Number(iso[1]+String(iso[2]).padStart(2,'0')+String(iso[3]).padStart(2,'0'));
    const vn=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    return vn?Number(vn[3]+String(vn[2]).padStart(2,'0')+String(vn[1]).padStart(2,'0')):0;
  };
  const isoDateValue=value=>{
    const s=String(value||'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
    const m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):isoDate();
  };
  const pointFor=order=>{
    const targetName=String(order.pointName||'').trim();
    if(targetName)for(const customer of (customers||[]))for(const point of (customer.points||[])){
      if(String(point.name||'').trim()===targetName)return{...point,customerId:customer.id,customerName:customer.name};
    }
    for(const customer of (customers||[]))for(const point of (customer.points||[])){
      if(point.id===order.pointId||point.id===order.ptId)return{...point,customerId:customer.id,customerName:customer.name};
    }
    return{};
  };
  const quotePrice=(order,line)=>{
    const point=pointFor(order),orderDate=dateKey(order.deliveryDate);
    const candidates=(quotes||[]).filter(quote=>{
      if(['cancelled','expired'].includes(quote.status))return false;
      if(quote.customerId&&quote.customerId!==(order.customerId||order.custId||point.customerId))return false;
      const pointIds=quote.pointIds||(quote.pointId?[quote.pointId]:[]),pointNames=quote.pointNames||[],areas=quote.areaNames||[];
      const orderPointName=String(order.pointName||point.name||'').trim();
      const pointOk=pointNames.length?pointNames.some(name=>String(name||'').trim()===orderPointName):pointIds.includes(order.pointId||order.ptId||point.id),areaOk=areas.includes(order.area||point.area||'');
      if(!pointOk&&!areaOk)return false;
      if(quote.dateFrom&&orderDate<dateKey(quote.dateFrom))return false;
      if(quote.dateTo&&orderDate>dateKey(quote.dateTo))return false;
      return(quote.lines||[]).some(row=>row.productId===line.productId||(row.productName&&row.productName===line.productName));
    }).sort((a,b)=>dateKey(b.dateFrom)-dateKey(a.dateFrom));
    const row=(candidates[0]?.lines||[]).find(item=>item.productId===line.productId||(item.productName&&item.productName===line.productName));
    return numFmt(row?.price);
  };
  const groups=new Map();let missingPrice=0;
  const tripOrders=(orders||[]).filter(order=>(trip?.orderIds||[]).includes(order.id));
  tripOrders.forEach(order=>{
    const point=pointFor(order);
    const customerId=order.customerId||order.custId||point.customerId||'';
    const customerName=order.customer||point.customerName||order.pointName||'Khách hàng chưa xác định';
    const key=String(customerId||customerName);
    if(!groups.has(key))groups.set(key,{customerId,customerName,amount:0,actualRevenue:0,orderIds:[],missingPrice:0});
    const group=groups.get(key);group.orderIds.push(order.id);
    (order.lines||[]).forEach(line=>{
      const product=(products||[]).find(item=>item.id===line.productId)||{};
      // Công nợ khách hàng luôn theo SL HĐ; doanh thu thực tế theo SL đã giao.
      const quantity=numFmt(line.qtyInvoice)||0;
      const deliveredQuantity=line.qtyDelivered!==undefined&&line.qtyDelivered!==''?numFmt(line.qtyDelivered):0;
      const price=numFmt(line.salePrice||line.sellPrice||line.unitPrice)||quotePrice(order,line)||numFmt(product.salePrice||product.sellPrice||product.priceSale||product.price)||(!line.purchasePrice?numFmt(line.price):0);
      if(!price){missingPrice++;group.missingPrice++;}
      group.amount+=quantity*price;
      group.actualRevenue+=deliveredQuantity*price;
    });
  });
  const stamp=fmtDT();
  const rows=[...groups.entries()].map(([key,group])=>({
    id:'CN-'+String(trip?.id||'CHUYEN')+'-'+String(group.customerId||key).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,28),
    kind:'receivable',date:isoDateValue(trip?.deliveryDate),dueDate:'',partnerId:group.customerId,partnerName:group.customerName,
    invoiceNo:trip?.id||'',amount:group.amount,vatPercent:0,vatAmount:0,amountAfterTax:group.amount,paidAmount:0,status:'unpaid',sourceTripId:trip?.id||'',sourceOrderIds:group.orderIds,
    note:'Tự động từ chuyến '+(trip?.id||'')+' · Công nợ theo SL HĐ'+(group.missingPrice?' · Thiếu đơn giá '+group.missingPrice+' dòng':''),
    createdBy:currentUser?.name||'',createdAt:stamp,updatedBy:currentUser?.name||'',updatedAt:stamp
  }));
  return{rows,missingPrice,actualRevenue:[...groups.values()].reduce((sum,group)=>sum+group.actualRevenue,0),invoiceRevenue:[...groups.values()].reduce((sum,group)=>sum+group.amount,0)};
}

function financeParseTransferOcr(rawText){
  const text=String(rawText||'').replace(/\r/g,'');
  const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);
  const normalized=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
  const normalizedLines=lines.map((value,index)=>({value,index,plain:normalized(value).replace(/\s+/g,' ').trim()}));
  const flat=normalized(text).replace(/\s+/g,' ').trim();
  const cleanFieldText=value=>String(value||'').replace(/^(?:tên\s+người\s+)?thụ\s+hưởng\s*/iu,'').replace(/^(?:ten\s+nguoi\s+)?thu\s+huong\s*/i,'').replace(/^[\s:：\-–]+/,'').replace(/\s+/g,' ').trim();
  const fieldBlock=(starts,stops,maxLines=5)=>{
    const start=normalizedLines.findIndex(row=>starts.some(key=>row.plain.includes(key)));
    if(start<0)return'';
    const values=[];
    for(let i=start;i<normalizedLines.length&&i<=start+maxLines;i++){
      const row=normalizedLines[i];
      if(i>start&&stops.some(key=>row.plain.includes(key)))break;
      let value=row.value;
      starts.forEach(key=>{value=value.replace(new RegExp(key.split(' ').filter(Boolean).join('\\s+'),'iu'),' ');});
      value=value.replace(/\b(?:tên người|ten nguoi|tài khoản|tai khoan|ngân hàng|ngan hang|nội dung|noi dung)\b/giu,' ').replace(/\b(?:thụ hưởng|thu huong|giao dịch|giao dich|chuyển tiền|chuyen tien)\b/giu,' ');
      value=cleanFieldText(value);
      if(value)values.push(value);
    }
    return values.join(' ').replace(/\s+/g,' ').trim();
  };
  const amountCandidates=[];
  lines.forEach((line,index)=>{
    const plain=normalized(line),positive=/so tien|amount|chuyen tien|thanh toan/.test(plain),negative=/so du|tai khoan|account|ma giao dich|mgd|tham chieu|reference|ngay|gio|thoi gian/.test(plain),currency=/vnd|vnđ|₫|\bđ\b/i.test(line);
    (line.match(/\d[\d\s.,]{2,}/g)||[]).forEach(value=>{
      const digits=value.replace(/\D/g,''),amount=Number(digits);
      if(!amount||digits.length<4)return;
      amountCandidates.push({amount,score:(positive?8:0)+(currency?12:0)-(negative?7:0)+Math.min(digits.length,7)/10-index/1000});
    });
  });
  amountCandidates.sort((a,b)=>b.score-a.score||b.amount-a.amount);
  const compact=text.replace(/\s+/g,' ');
  const dateMatch=compact.match(/\b([0-3]?\d)\s*[\/.\-]\s*([01]?\d)[^\d]{0,30}[\/.\-]\s*(20\d{2})\b/);
  const timeMatch=compact.match(/\b([01]?\d|2[0-3])\s*[:h.]\s*([0-5]\d)(?:\s*:\s*([0-5]\d))?\b/i);
  const fieldValue=keys=>{
    const line=lines.find(x=>keys.some(key=>normalized(x).includes(key)));
    if(!line)return'';
    const parts=line.split(/[:：]/);
    return parts.length>1?parts.slice(1).join(':').trim():'';
  };
  const bankNames=[
    ['vietcombank','Vietcombank'],['bidv','BIDV'],['vietinbank','VietinBank'],['agribank','Agribank'],['techcombank','Techcombank'],
    ['ngan hang tmcp quan doi','MB Bank'],['mb - ngan hang','MB Bank'],['mb bank','MB Bank'],['mbbank','MB Bank'],['vpbank','VPBank'],
    ['tpbank','TPBank'],['sacombank','Sacombank'],['acb','ACB'],['vib','VIB'],['shb','SHB'],['ocb','OCB'],['msb','MSB']
  ];
  const recipientRaw=fieldBlock(['ten nguoi thu huong','ten nguoi','thu huong'],['tai khoan','ngan hang','phi giao dich','thoi gian','noi dung'],4);
  const recipientName=recipientRaw.replace(/\b\d{7,20}\b/g,'').replace(/\s+/g,' ').trim();
  const accountSection=fieldBlock(['tai khoan thu huong','tai khoan'],['ngan hang','phi giao dich','thoi gian','noi dung'],3);
  const recipientAccount=(accountSection.match(/\b\d[\d\s.-]{5,22}\d\b/)?.[0]||'').replace(/\D/g,'');
  const bankSection=fieldBlock(['ngan hang thu huong','ngan hang'],['phi giao dich','thoi gian','noi dung'],6);
  const recipientBank=bankNames.find(([key])=>normalized(bankSection).includes(key))?.[1]||(/\bmb\b/i.test(bankSection)?'MB Bank':'');
  const bank=recipientBank||bankNames.find(([key])=>flat.includes(key))?.[1]||'';
  const contentBlock=fieldBlock(['noi dung chuyen tien','noi dung'],['tien gui sinh loi','agribank plus'],6);
  const content=contentBlock||fieldValue(['noi dung chuyen tien','noi dung','description','remark','message']);
  const senderSuggestion=content.replace(/\b(?:chuyển|chuyen)\s*tiền\b.*$/iu,'').replace(/\b(?:ck|transfer|thanh toán|thanh toan)\b.*$/iu,'').replace(/[^\p{L}\s]/gu,' ').replace(/\s+/g,' ').trim();
  const reference=fieldValue(['mgd','ma giao dich','ma tham chieu','transaction id','reference'])||(text.match(/\bMGD\s*[:：\-]?\s*([A-Z0-9.-]{5,})/i)?.[1]||'');
  return{
    amount:amountCandidates[0]?.amount||0,
    date:dateMatch?dateMatch[3]+'-'+dateMatch[2].padStart(2,'0')+'-'+dateMatch[1].padStart(2,'0'):'',
    time:timeMatch?timeMatch[1].padStart(2,'0')+':'+timeMatch[2]+(timeMatch[3]?':'+timeMatch[3]:''):'',
    reference,content,bank,recipientName,recipientAccount,recipientBank,senderSuggestion,senderNeedsConfirmation:Boolean(senderSuggestion)
  };
}

function FinanceEntryForm({entry,direction,customers,nccs,currentUser,onSave,onClose}){
  const initialDirection=entry?.direction||direction||'in';
  const[f,sf]=useState(entry?{...entry}:{date:isoDate(),direction:initialDirection,category:initialDirection==='in'?FIN_IN_CATS[0]:FIN_OUT_CATS[0],partnerType:'other',partnerId:'',partnerName:'',amount:0,method:'bank',pnlType:initialDirection==='in'?'revenue':'expense',reference:'',note:''});
  const[transferFile,setTransferFile]=useState(null);
  const[transferPreview,setTransferPreview]=useState(entry?.transferImage||'');
  const[ocrBusy,setOcrBusy]=useState(false);
  const[ocrProgress,setOcrProgress]=useState('');
  const[saving,setSaving]=useState(false);
  const set=(k,v)=>sf(p=>({...p,[k]:v}));
  const changeDirection=v=>{const category=v==='in'?FIN_IN_CATS[0]:FIN_OUT_CATS[0];sf(p=>({...p,direction:v,category,pnlType:finDefaultPnl(v,category)}));};
  const changeCategory=category=>sf(p=>({...p,category,pnlType:finDefaultPnl(p.direction,category)}));
  const partners=f.partnerType==='customer'?customers:f.partnerType==='supplier'?nccs:[];
  const readTransferImage=async file=>{
    if(!file)return;
    if(!String(file.type||'').startsWith('image/')){window.showToast('Vui lòng chọn file ảnh chuyển khoản.','warn');return;}
    setTransferFile(file);
    const reader=new FileReader();
    reader.onload=()=>setTransferPreview(reader.result);
    reader.readAsDataURL(file);
    setOcrBusy(true);setOcrProgress('Đang chuẩn bị đọc ảnh...');
    try{
      if(!window.Tesseract)await window.scfLoadExternalScript('tesseract');
      const result=await Tesseract.recognize(file,'vie+eng',{logger:m=>{
        if(m.status==='recognizing text')setOcrProgress('Đang đọc ảnh '+Math.round((m.progress||0)*100)+'%');
      }});
      const parsed=financeParseTransferOcr(result?.data?.text||'');
      sf(previous=>({
        ...previous,
        amount:parsed.amount||previous.amount,
        date:parsed.date||previous.date,
        reference:parsed.reference||previous.reference,
        note:parsed.content||previous.note,
        partnerType:previous.partnerType==='other'&&parsed.recipientName?'other':previous.partnerType,
        partnerId:previous.partnerType==='other'&&parsed.recipientName?'':previous.partnerId,
        partnerName:previous.partnerType==='other'&&parsed.recipientName?parsed.recipientName:previous.partnerName,
        transferRecipientName:parsed.recipientName||previous.transferRecipientName||'',
        transferRecipientAccount:parsed.recipientAccount||previous.transferRecipientAccount||'',
        transferBank:parsed.recipientBank||parsed.bank||previous.transferBank||'',
        transferTime:parsed.time||previous.transferTime||'',
        transferSenderSuggestion:parsed.senderSuggestion||previous.transferSenderSuggestion||'',
        transferSenderNeedsConfirmation:parsed.senderNeedsConfirmation||previous.transferSenderNeedsConfirmation||false,
        transferOcrText:result?.data?.text||''
      }));
      window.showToast(parsed.amount?'Đã đọc ảnh. Vui lòng kiểm tra lại thông tin trước khi lưu.':'Đã đọc ảnh nhưng chưa nhận ra số tiền. Bạn hãy nhập lại thủ công.','success');
    }catch(error){
      console.warn('Finance transfer OCR:',error);
      window.showToast('Không đọc được ảnh này. Bạn vẫn có thể giữ ảnh và nhập thông tin thủ công.','error');
    }finally{setOcrBusy(false);setOcrProgress('');}
  };
  const submit=async()=>{
    if(!f.date){window.showToast('Chọn ngày thu/chi.','warn');return;}
    if((Number(f.amount)||0)<=0){window.showToast('Nhập số tiền lớn hơn 0.','warn');return;}
    const partner=partners.find(x=>x.id===f.partnerId);
    setSaving(true);
    try{
      const transferImage=transferFile?await uploadPhoto(transferFile,'finance-transfers',{max:1600,quality:.8}):(transferPreview||'');
      onSave({...f,transferImage,transferImageName:transferFile?.name||f.transferImageName||'',amount:Number(f.amount)||0,partnerName:f.partnerType==='other'?f.partnerName:(partner?.name||f.partnerName||''),updatedBy:currentUser.name,updatedAt:fmtDT(),createdBy:entry?.createdBy||currentUser.name,createdAt:entry?.createdAt||fmtDT()});
    }catch(error){
      console.warn('Save finance transfer image:',error);
      window.showToast('Chưa lưu được ảnh chuyển khoản. Vui lòng thử lại.','error');
      setSaving(false);
    }
  };
  return h(Modal,{title:entry?'Sửa khoản thu/chi':(initialDirection==='in'?'Nhập tiền vào':'Nhập tiền ra'),onClose,lg:true},
    h('div',{className:'g3'},
      h(F,{label:'Ngày *'},h('input',{type:'date',value:f.date,onChange:e=>set('date',e.target.value)})),
      h(F,{label:'Dòng tiền *'},h('select',{value:f.direction,onChange:e=>changeDirection(e.target.value)},h('option',{value:'in'},'Tiền vào'),h('option',{value:'out'},'Tiền ra'))),
      h(F,{label:'Phương thức'},h('select',{value:f.method,onChange:e=>set('method',e.target.value)},h('option',{value:'cash'},'Tiền mặt'),h('option',{value:'bank'},'Ngân hàng')))
    ),
    h('div',{className:'g2'},
      h(F,{label:'Nhóm thu/chi'},h('select',{value:f.category,onChange:e=>changeCategory(e.target.value)},(f.direction==='in'?FIN_IN_CATS:FIN_OUT_CATS).map(x=>h('option',{key:x,value:x},x)))),
      h(F,{label:'Tính kết quả kinh doanh'},h('select',{value:f.pnlType,onChange:e=>set('pnlType',e.target.value)},h('option',{value:'revenue'},'Tính vào doanh thu'),h('option',{value:'expense'},'Tính vào chi phí'),h('option',{value:'none'},'Không tính lợi nhuận')))
    ),
    h('div',{className:'g2'},
      h(F,{label:'Đối tượng'},h('select',{value:f.partnerType,onChange:e=>sf(p=>({...p,partnerType:e.target.value,partnerId:'',partnerName:''}))},h('option',{value:'other'},'Khác'),h('option',{value:'customer'},'Khách hàng'),h('option',{value:'supplier'},'Nhà cung cấp'))),
      f.partnerType==='other'?h(F,{label:'Tên đối tượng'},h('input',{value:f.partnerName,onChange:e=>set('partnerName',e.target.value),placeholder:'Người nộp / người nhận...'})):h(F,{label:f.partnerType==='customer'?'Khách hàng':'Nhà cung cấp'},h('select',{value:f.partnerId,onChange:e=>set('partnerId',e.target.value)},h('option',{value:''},'— Chọn —'),partners.map(x=>h('option',{key:x.id,value:x.id},x.name||x.id))))
    ),
    h('div',{className:'g2'},
      h(F,{label:'Số tiền *'},h('input',{type:'text',inputMode:'numeric',value:finMoneyInput(f.amount),onChange:e=>set('amount',String(e.target.value||'').replace(/[^\d]/g,'')),placeholder:'1,781,000'})),
      h(F,{label:'Số chứng từ'},h('input',{value:f.reference,onChange:e=>set('reference',e.target.value),placeholder:'Phiếu thu, phiếu chi, hóa đơn...'}))
    ),
    f.direction==='out'&&f.method==='bank'&&h('div',{style:{margin:'10px 0',padding:12,border:'1px solid #cde4d3',borderRadius:10,background:'#f3f9f5'}},
      h('div',{style:{fontWeight:700,marginBottom:8}},h('i',{className:'ti ti-photo-scan',style:{marginRight:6}}),'Ảnh chuyển khoản ngân hàng'),
      h('div',{style:{display:'flex',gap:12,alignItems:'flex-start',flexWrap:'wrap'}},
        transferPreview&&h('a',{href:transferPreview,target:'_blank',rel:'noopener',title:'Mở ảnh gốc'},h('img',{src:transferPreview,alt:'Ảnh chuyển khoản',style:{width:120,height:120,objectFit:'cover',borderRadius:8,border:'1px solid var(--bd)'}})),
        h('div',{style:{flex:'1 1 260px'}},
          h('label',{className:'btn',style:{display:'inline-flex',alignItems:'center',gap:6,cursor:ocrBusy?'wait':'pointer'}},
            h('i',{className:'ti ti-camera'}),ocrBusy?' Đang đọc ảnh...':' Chụp / tải ảnh chuyển khoản',
            h('input',{type:'file',accept:'image/*',capture:'environment',disabled:ocrBusy||saving,onChange:e=>readTransferImage(e.target.files?.[0]),style:{display:'none'}})
          ),
          transferPreview&&h('button',{type:'button',className:'bdel',disabled:ocrBusy||saving,onClick:()=>{setTransferFile(null);setTransferPreview('');sf(p=>({...p,transferImage:'',transferImageName:''}));},style:{marginLeft:8}},h('i',{className:'ti ti-trash'}),' Xóa ảnh'),
          ocrProgress&&h('div',{style:{marginTop:8,color:'var(--pri3)',fontSize:13}},ocrProgress),
          (f.transferRecipientName||f.transferRecipientAccount||f.transferBank||f.transferTime||f.transferSenderSuggestion)&&h('div',{style:{marginTop:10,padding:10,border:'1px solid #d9e7de',borderRadius:8,background:'#fff',fontSize:13,display:'grid',gap:5}},
            f.transferRecipientName&&h('div',null,'Người thụ hưởng: ',h('b',null,f.transferRecipientName)),
            f.transferRecipientAccount&&h('div',null,'Tài khoản nhận: ',h('b',null,f.transferRecipientAccount)),
            f.transferBank&&h('div',null,'Ngân hàng nhận: ',h('b',null,f.transferBank)),
            f.transferTime&&h('div',null,'Giờ giao dịch: ',h('b',null,f.transferTime)),
            f.transferSenderSuggestion&&h('div',null,'Gợi ý người gửi: ',h('b',null,f.transferSenderSuggestion),' ',h('span',{className:'badge',style:{background:'#FAEEDA',color:'#854F0B'}},'Cần xác nhận'))
          ),
          h('div',{style:{marginTop:8,fontSize:12,color:'var(--tx2)'}},'App sẽ gợi ý số tiền, ngày, mã giao dịch, người thụ hưởng, tài khoản, ngân hàng và nội dung. Tên người gửi lấy từ nội dung chuyển tiền luôn cần xác nhận trước khi lưu.')
        )
      )
    ),
    h(F,{label:'Ghi chú'},h('textarea',{rows:2,value:f.note,onChange:e=>set('note',e.target.value)})),
    h(Row,null,h('button',{onClick:onClose,disabled:saving||ocrBusy},'Hủy'),h('button',{className:'bp',onClick:submit,disabled:saving||ocrBusy},h('i',{className:'ti ti-device-floppy'}),saving?' Đang lưu...':' Lưu khoản '+(f.direction==='in'?'thu':'chi')))
  );
}

function FinanceDebtForm({debt,kind,customers,nccs,currentUser,onSave,onClose}){
  const initialKind=debt?.kind||kind||'receivable';
  const[f,sf]=useState(debt?{vatPercent:0,vatAmount:0,amountAfterTax:Number(debt.amount)||0,...debt}:{kind:initialKind,date:isoDate(),dueDate:'',partnerId:'',partnerName:'',invoiceNo:'',amount:0,vatPercent:0,vatAmount:0,amountAfterTax:0,paidAmount:0,note:''});
  const set=(k,v)=>sf(p=>({...p,[k]:v}));
  const changeKind=value=>sf(p=>({...p,kind:value,partnerId:'',partnerName:'',vatPercent:value==='receivable'?(Number(p.vatPercent)||0):0}));
  const partners=f.kind==='receivable'?customers:nccs;
  const amount=Number(f.amount)||0;
  const vatPercent=f.kind==='receivable'?Math.max(0,Number(f.vatPercent)||0):0;
  const vatAmount=f.kind==='receivable'?Math.round(amount*vatPercent/100):0;
  const amountAfterTax=amount+vatAmount;
  const submit=()=>{
    const partner=partners.find(x=>x.id===f.partnerId);
    if(!partner){window.showToast('Chọn '+(f.kind==='receivable'?'khách hàng.':'nhà cung cấp.'),'warn');return;}
    const paid=Math.min(amountAfterTax,Math.max(0,Number(f.paidAmount)||0));
    if(amount<=0){window.showToast('Nhập giá trị công nợ.','warn');return;}
    onSave({...f,amount,vatPercent,vatAmount,amountAfterTax,paidAmount:paid,partnerName:partner.name||partner.id,status:paid>=amountAfterTax?'paid':paid>0?'partial':'unpaid',updatedBy:currentUser.name,updatedAt:fmtDT(),createdBy:debt?.createdBy||currentUser.name,createdAt:debt?.createdAt||fmtDT()});
  };
  return h(Modal,{title:debt?'Sửa công nợ':(initialKind==='receivable'?'Thêm công nợ khách hàng':'Thêm công nợ nhà cung cấp'),onClose,lg:true},
    h('div',{className:'g3'},
      h(F,{label:'Loại công nợ'},h('select',{value:f.kind,onChange:e=>changeKind(e.target.value)},h('option',{value:'receivable'},'Phải thu khách hàng'),h('option',{value:'payable'},'Phải trả nhà cung cấp'))),
      h(F,{label:'Ngày ghi nhận'},h('input',{type:'date',value:f.date,onChange:e=>set('date',e.target.value)})),
      h(F,{label:'Hạn thanh toán'},h('input',{type:'date',value:f.dueDate,onChange:e=>set('dueDate',e.target.value)}))
    ),
    h('div',{className:'g2'},
      h(F,{label:f.kind==='receivable'?'Khách hàng *':'Nhà cung cấp *'},h('select',{value:f.partnerId,onChange:e=>set('partnerId',e.target.value)},h('option',{value:''},'— Chọn —'),partners.map(x=>h('option',{key:x.id,value:x.id},x.name||x.id)))),
      h(F,{label:'Hóa đơn / chứng từ'},h('input',{value:f.invoiceNo,onChange:e=>set('invoiceNo',e.target.value)}))
    ),
    f.kind==='receivable'
      ?h(React.Fragment,null,
        h('div',{className:'g3'},
          h(F,{label:'Giá trị trước thuế *'},h('input',{type:'text',inputMode:'numeric',value:finMoneyInput(f.amount),onChange:e=>set('amount',String(e.target.value||'').replace(/[^\d]/g,'')),placeholder:'1,000,000'})),
          h(F,{label:'% VAT'},h('input',{type:'number',min:0,max:100,step:'0.1',value:f.vatPercent,onChange:e=>set('vatPercent',e.target.value),placeholder:'0'})),
          h(F,{label:'Tiền VAT'},h('input',{type:'text',value:finMoneyInput(vatAmount),readOnly:true,tabIndex:-1}))
        ),
        h('div',{className:'g2'},
          h(F,{label:'Thành tiền sau thuế'},h('input',{type:'text',value:finMoneyInput(amountAfterTax),readOnly:true,tabIndex:-1,style:{fontWeight:700,color:'var(--pri3)'}})),
          h(F,{label:'Đã thanh toán'},h('input',{type:'text',inputMode:'numeric',value:finMoneyInput(f.paidAmount),onChange:e=>set('paidAmount',String(e.target.value||'').replace(/[^\d]/g,'')),placeholder:'0'}))
        )
      )
      :h('div',{className:'g2'},
        h(F,{label:'Giá trị công nợ *'},h('input',{type:'text',inputMode:'numeric',value:finMoneyInput(f.amount),onChange:e=>set('amount',String(e.target.value||'').replace(/[^\d]/g,'')),placeholder:'1,000,000'})),
        h(F,{label:'Đã thanh toán'},h('input',{type:'text',inputMode:'numeric',value:finMoneyInput(f.paidAmount),onChange:e=>set('paidAmount',String(e.target.value||'').replace(/[^\d]/g,'')),placeholder:'0'}))
      ),
    h(F,{label:'Ghi chú'},h('textarea',{rows:2,value:f.note,onChange:e=>set('note',e.target.value)})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit},h('i',{className:'ti ti-device-floppy'}),' Lưu công nợ'))
  );
}

function financeSalesSummary(orders,products,quotes,customers,month){
  const monthOf=value=>{
    const s=String(value||'').trim();
    if(/^\d{4}-\d{1,2}/.test(s))return s.slice(0,7);
    const vn=s.match(/^\d{1,2}[\/-](\d{1,2})[\/-](\d{4})/);
    return vn?vn[2]+'-'+vn[1].padStart(2,'0'):'';
  };
  const dateKey=value=>{
    const s=String(value||'').trim();
    const iso=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if(iso)return Number(iso[1]+String(iso[2]).padStart(2,'0')+String(iso[3]).padStart(2,'0'));
    const vn=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    return vn?Number(vn[3]+String(vn[2]).padStart(2,'0')+String(vn[1]).padStart(2,'0')):0;
  };
  const pointFor=order=>{
    const targetName=String(order.pointName||'').trim();
    if(targetName)for(const customer of (customers||[]))for(const point of (customer.points||[]))if(String(point.name||'').trim()===targetName)return {...point,customerId:customer.id,customerName:customer.name};
    for(const customer of (customers||[]))for(const point of (customer.points||[]))if(point.id===order.pointId||point.id===order.ptId)return {...point,customerId:customer.id,customerName:customer.name};
    return {};
  };
  const quotePrice=(order,line)=>{
    const point=pointFor(order),orderDate=dateKey(order.deliveryDate);
    const candidates=(quotes||[]).filter(quote=>{
      if(['cancelled','expired'].includes(quote.status))return false;
      if(quote.customerId&&quote.customerId!==(order.customerId||order.custId||point.customerId))return false;
      const pointIds=quote.pointIds||(quote.pointId?[quote.pointId]:[]),pointNames=quote.pointNames||[],areas=quote.areaNames||[];
      const orderPointName=String(order.pointName||point.name||'').trim();
      const pointOk=pointNames.length?pointNames.some(name=>String(name||'').trim()===orderPointName):pointIds.includes(order.pointId||order.ptId||point.id),areaOk=areas.includes(order.area||point.area||'');
      if(!pointOk&&!areaOk)return false;
      if(quote.dateFrom&&orderDate<dateKey(quote.dateFrom))return false;
      if(quote.dateTo&&orderDate>dateKey(quote.dateTo))return false;
      return (quote.lines||[]).some(row=>row.productId===line.productId||(row.productName&&row.productName===line.productName));
    }).sort((a,b)=>dateKey(b.dateFrom)-dateKey(a.dateFrom));
    const row=(candidates[0]?.lines||[]).find(item=>item.productId===line.productId||(item.productName&&item.productName===line.productName));
    return numFmt(row?.price);
  };
  let amount=0,invoiceAmount=0,ordersCount=0,confirmedOrdersCount=0,missingPrice=0;
  (orders||[]).filter(order=>monthOf(order.deliveryDate)===month&&order.status!=='cancelled').forEach(order=>{
    ordersCount++;
    // Dữ liệu mới chỉ ghi nhận doanh thu thực tế sau khi lái xe xác nhận hoàn thành.
    // Đơn cũ đã giao trước khi có luồng mới vẫn được giữ doanh thu để không mất báo cáo lịch sử.
    const actualConfirmed=!!(order.driverCompletedAt||order.accountingConfirmedAt)||order.status==='done';
    if(actualConfirmed)confirmedOrdersCount++;
    (order.lines||[]).forEach(line=>{
      const product=(products||[]).find(item=>item.id===line.productId)||{};
      const invoiceQuantity=numFmt(line.qtyInvoice)||0;
      const deliveredQuantity=line.qtyDelivered!==undefined&&line.qtyDelivered!==''?numFmt(line.qtyDelivered):(actualConfirmed?invoiceQuantity:0);
      const price=numFmt(line.salePrice||line.sellPrice||line.unitPrice)||quotePrice(order,line)||numFmt(product.salePrice||product.sellPrice||product.priceSale||product.price)||(!line.purchasePrice?numFmt(line.price):0);
      if(!price)missingPrice++;
      invoiceAmount+=invoiceQuantity*price;
      if(actualConfirmed)amount+=deliveredQuantity*price;
    });
  });
  return {amount,invoiceAmount,ordersCount,confirmedOrdersCount,missingPrice};
}

function financePurchaseExpense(purchases,month){
  const monthOf=value=>{
    const s=String(value||'').trim();
    if(/^\d{4}-\d{1,2}/.test(s))return s.slice(0,7);
    const vn=s.match(/^\d{1,2}[\/-](\d{1,2})[\/-](\d{4})/);
    return vn?vn[2]+'-'+vn[1].padStart(2,'0'):'';
  };
  return (purchases||[]).filter(purchase=>purchase.status!=='cancelled'&&monthOf(purchase.orderDate||purchase.receivedDate||purchase.createdAt)===month).reduce((total,purchase)=>total+(purchase.lines||[]).reduce((lineTotal,line)=>{
    const subtotal=(numFmt(line.qty)||0)*(numFmt(line.price)||0);
    const vatPercent=Math.min(100,Math.max(0,numFmt(line.vatPercent)||0));
    return lineTotal+subtotal+Math.round(subtotal*vatPercent/100);
  },0),0);
}

function financeMaintenanceExpense(records,month){
  const monthOf=value=>{
    const text=String(value||'').trim();
    if(/^\d{4}-\d{1,2}/.test(text))return text.slice(0,7);
    const match=text.match(/^\d{1,2}[\/-](\d{1,2})[\/-](\d{4})/);
    return match?match[2]+'-'+match[1].padStart(2,'0'):'';
  };
  const moneyValue=value=>{
    if(typeof value==='number')return Number.isFinite(value)?value:0;
    const text=String(value||'').trim().replace(/\s|đ/gi,'');
    if(!text)return 0;
    if(/^[-+]?\d{1,3}([.,]\d{3})+$/.test(text))return Number(text.replace(/[.,]/g,''))||0;
    return numFmt(text);
  };
  return(records||[]).filter(record=>monthOf(record.date||record.month)===month).reduce((total,record)=>total+moneyValue(record.amount),0);
}

function financeDebtOcrText(input){
  if(typeof input==='string')return input;
  const data=input||{},tsv=String(data.tsv||'').trim();
  if(!tsv)return String(data.text||'');
  const lines=tsv.split(/\r?\n/).filter(Boolean);
  if(lines.length<2)return String(data.text||'');
  const header=lines[0].split('\t');
  const at=name=>header.indexOf(name);
  const levelIndex=at('level'),leftIndex=at('left'),topIndex=at('top'),widthIndex=at('width'),heightIndex=at('height'),confidenceIndex=at('conf'),textIndex=at('text');
  if([leftIndex,topIndex,widthIndex,heightIndex,textIndex].some(index=>index<0))return String(data.text||'');
  const words=lines.slice(1).map(line=>{
    const cells=line.split('\t');
    return{level:Number(cells[levelIndex]),left:Number(cells[leftIndex])||0,top:Number(cells[topIndex])||0,width:Number(cells[widthIndex])||0,height:Number(cells[heightIndex])||0,confidence:Number(cells[confidenceIndex]),text:String(cells.slice(textIndex).join('\t')||'').trim()};
  }).filter(word=>word.text&&(levelIndex<0||word.level===5)&&(Number.isNaN(word.confidence)||word.confidence>=15));
  if(!words.length)return String(data.text||'');
  const medianHeight=words.map(word=>word.height).filter(Boolean).sort((a,b)=>a-b)[Math.floor(words.length/2)]||12;
  const tolerance=Math.max(5,medianHeight*.65),rows=[];
  words.sort((a,b)=>(a.top+a.height/2)-(b.top+b.height/2)||a.left-b.left).forEach(word=>{
    const center=word.top+word.height/2;
    let row=rows.find(item=>Math.abs(item.center-center)<=tolerance);
    if(!row){row={center,words:[]};rows.push(row);}
    row.words.push(word);row.center=(row.center*(row.words.length-1)+center)/row.words.length;
  });
  const reconstructed=rows.sort((a,b)=>a.center-b.center).map(row=>row.words.sort((a,b)=>a.left-b.left).map(word=>word.text).join(' ')).join('\n');
  return reconstructed||String(data.text||'');
}
function financeNormalizeCustomerName(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase()
    .replace(/\b(?:cong ty|cty|tnhh|co phan|cp|mot thanh vien|mtv|hkd)\b/g,' ')
    .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function financeNameSimilarity(a,b){
  const left=financeNormalizeCustomerName(a),right=financeNormalizeCustomerName(b);
  if(!left||!right)return 0;
  const compactLeft=left.replace(/\s/g,''),compactRight=right.replace(/\s/g,'');
  if(compactLeft===compactRight)return 1;
  if(compactLeft.includes(compactRight)||compactRight.includes(compactLeft))return .88;
  const distance=(x,y)=>{
    const row=Array.from({length:y.length+1},(_,i)=>i);
    for(let i=1;i<=x.length;i++){
      let previous=row[0];row[0]=i;
      for(let j=1;j<=y.length;j++){
        const old=row[j];
        row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(x[i-1]===y[j-1]?0:1));
        previous=old;
      }
    }
    return row[y.length];
  };
  const edit=1-distance(compactLeft,compactRight)/Math.max(compactLeft.length,compactRight.length);
  const aTokens=new Set(left.split(' ')),bTokens=new Set(right.split(' '));
  const common=[...aTokens].filter(token=>bTokens.has(token)).length;
  const tokenScore=common/Math.max(1,new Set([...aTokens,...bTokens]).size);
  return Math.max(0,edit*.72+tokenScore*.28);
}
function financeRankCustomers(name,customers){
  return (customers||[]).map(customer=>({customer,score:financeNameSimilarity(name,customer.name||customer.id)}))
    .sort((a,b)=>b.score-a.score||String(a.customer.name||'').localeCompare(String(b.customer.name||''),'vi'));
}
function financeParseCustomerDebtImage(rawText,customers,date){
  const text=financeDebtOcrText(rawText).replace(/\r/g,'');
  const vatMatch=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/(?:thue|vat|gtgt)[^\n%]{0,20}(\d+(?:[.,]\d+)?)\s*%/i);
  const defaultVat=vatMatch?Number(vatMatch[1].replace(',','.'))||0:8;
  const moneyPattern=/\d{1,3}(?:[.,]\s?\d{3})+|\d{4,}/g;
  return text.split('\n').map(line=>line.replace(/\s+/g,' ').trim()).filter(Boolean).map((line,index)=>{
    const plain=financeNormalizeCustomerName(line);
    if(/tong cong|doanh thu|ten cty|chua thue|sau thue|xuat khac/.test(plain))return null;
    const matches=[...line.matchAll(moneyPattern)];
    if(matches.length<3)return null;
    const values=matches.slice(-3);
    const amount=Number(values[0][0].replace(/\D/g,''))||0;
    const vatAmountOcr=Number(values[1][0].replace(/\D/g,''))||0;
    const amountAfterTaxOcr=Number(values[2][0].replace(/\D/g,''))||0;
    if(!amount||!amountAfterTaxOcr)return null;
    let ocrName=line.slice(0,values[0].index).replace(/^\s*\d+\s*[.)-]?\s*/,'').replace(/[|:]+$/,'').trim();
    if(!ocrName||/^tong/i.test(financeNormalizeCustomerName(ocrName)))return null;
    const calculatedPercent=amount?vatAmountOcr*100/amount:defaultVat;
    const vatPercent=Math.abs(calculatedPercent-defaultVat)<=.3?defaultVat:Number(calculatedPercent.toFixed(2));
    const ranked=financeRankCustomers(ocrName,customers);
    const best=ranked[0];
    return{id:'ocr-'+index,enabled:true,ocrName,customerId:best&&best.score>=.34?best.customer.id:'',matchScore:best?.score||0,date,amount,vatPercent,vatAmountOcr,amountAfterTaxOcr};
  }).filter(Boolean);
}
function financeMapAiCustomerDebts(aiRows,customers,date){
  return (Array.isArray(aiRows)?aiRows:[]).map((item,index)=>{
    const ocrName=String(item?.customer_name||'').trim();
    const amount=Math.max(0,Math.round(Number(item?.amount_before_tax)||0));
    const vatPercent=Math.max(0,Number(item?.vat_percent)||0);
    const vatAmountOcr=Math.max(0,Math.round(Number(item?.vat_amount)||amount*vatPercent/100));
    const amountAfterTaxOcr=Math.max(0,Math.round(Number(item?.amount_after_tax)||amount+vatAmountOcr));
    if(!ocrName||!amount)return null;
    const ranked=financeRankCustomers(ocrName,customers);
    const best=ranked[0];
    return{id:'ai-'+index,enabled:true,ocrName,customerId:best&&best.score>=.34?best.customer.id:'',matchScore:best?.score||0,date,amount,vatPercent,vatAmountOcr,amountAfterTaxOcr};
  }).filter(Boolean);
}function FinanceDebtImageImport({customers,currentUser,defaultMonth,onImport,onClose}){
  const[date,setDate]=useState((defaultMonth||isoDate().slice(0,7))+'-01');
  const[rows,setRows]=useState([]);
  const[busy,setBusy]=useState(false);
  const[progress,setProgress]=useState('');
  const[fileName,setFileName]=useState('');
  const update=(id,patch)=>setRows(previous=>previous.map(row=>row.id===id?{...row,...patch}:row));
  const readImage=async file=>{
    if(!file)return;
    if(!String(file.type||'').startsWith('image/')){window.showToast('Vui lòng chọn một tệp ảnh.','warn');return;}
    setFileName(file.name||'Ảnh công nợ');setBusy(true);setRows([]);setProgress('Đang gửi ảnh cho AI phân tích...');
    try{
      if(!sb)throw new Error('Chưa kết nối Supabase.');
      const prepared=await resizeImageFile(file,2200,.9);
      const{data,error}=await sb.functions.invoke('scf-finance-vision',{body:{imageDataUrl:prepared.dataUrl}});
      if(error)throw error;
      if(!data?.ok)throw new Error(data?.error||'AI không trả về kết quả hợp lệ.');
      const parsed=financeMapAiCustomerDebts(data.rows,customers,date);
      setRows(parsed);
      window.showToast(parsed.length?'AI đã nhận ra '+parsed.length+' dòng. Hãy kiểm tra khách hàng trước khi nhập.':'AI chưa nhận ra dòng công nợ nào trong ảnh.',''+(parsed.length?'success':'warn'));
    }catch(error){
      console.warn('Customer debt image AI:',error);
      window.showToast(error?.message||'AI không đọc được ảnh. Hãy thử ảnh rõ hơn hoặc ảnh chụp thẳng bảng.','error');
    }finally{setBusy(false);setProgress('');}
  };
  const changeDate=value=>{setDate(value);setRows(previous=>previous.map(row=>({...row,date:value})));};
  const submit=()=>{
    const selected=rows.filter(row=>row.enabled);
    if(!selected.length){window.showToast('Chưa chọn dòng nào để nhập.','warn');return;}
    const unmatched=selected.filter(row=>!row.customerId);
    if(unmatched.length){window.showToast('Còn '+unmatched.length+' dòng chưa chọn khách hàng.','warn');return;}
    const stamp=fmtDT();
    const result=selected.map(row=>{
      const customer=(customers||[]).find(item=>String(item.id)===String(row.customerId))||{};
      const amount=Number(row.amount)||0,vatPercent=Math.max(0,Number(row.vatPercent)||0),vatAmount=Math.round(amount*vatPercent/100),amountAfterTax=amount+vatAmount;
      return{id:'CN'+uid(),kind:'receivable',date:row.date||date,dueDate:'',partnerId:customer.id||row.customerId,partnerName:customer.name||row.ocrName,invoiceNo:'Nhập từ ảnh '+(defaultMonth||''),amount,vatPercent,vatAmount,amountAfterTax,paidAmount:0,status:'unpaid',note:'Tên trên ảnh: '+row.ocrName,source:'customer-debt-image',createdBy:currentUser.name,createdAt:stamp,updatedBy:currentUser.name,updatedAt:stamp};
    });
    onImport(result);
  };
  return h(Modal,{title:'Nhập công nợ khách hàng từ ảnh',onClose,lg:true},
    h('div',{className:'g2'},
      h(F,{label:'Ngày ghi nhận'},h('input',{type:'date',value:date,onChange:e=>changeDate(e.target.value)})),
      h(F,{label:'Ảnh bảng doanh thu / công nợ'},h('label',{className:'btn',style:{display:'flex',alignItems:'center',justifyContent:'center',gap:7,cursor:busy?'wait':'pointer',minHeight:40}},
        h('i',{className:'ti ti-photo-scan'}),busy?'AI đang đọc ảnh...':(fileName||'Chọn ảnh'),
        h('input',{type:'file',accept:'image/*',disabled:busy,onChange:e=>readImage(e.target.files?.[0]),style:{display:'none'}})
      ))
    ),
    progress&&h('div',{style:{margin:'8px 0',color:'var(--pri3)',fontSize:13}},progress),
    rows.length>0&&h('div',{style:{margin:'8px 0',fontSize:12,color:'var(--tx2)'}},'AI đã đọc số liệu; app xếp khách hàng gần giống lên đầu danh sách. Bạn cần kiểm tra lại trước khi nhập.'),
    rows.length>0&&h('div',{className:'tw',style:{maxHeight:'55vh',overflow:'auto'}},
      h('table',null,
        h('thead',null,h('tr',null,...['Nhập','Tên đọc từ ảnh','Khách hàng trong danh mục','Trước thuế','% VAT','Tiền VAT','Sau thuế'].map(label=>h('th',{key:label},label)))),
        h('tbody',null,rows.map(row=>{
          const ranked=financeRankCustomers(row.ocrName,customers);
          const vatAmount=Math.round((Number(row.amount)||0)*(Number(row.vatPercent)||0)/100);
          return h('tr',{key:row.id,style:row.customerId?null:{background:'#FFF8E1'}},
            h('td',null,h('input',{type:'checkbox',checked:row.enabled,onChange:e=>update(row.id,{enabled:e.target.checked})})),
            h('td',null,h('b',null,row.ocrName),row.matchScore>0&&h('div',{style:{fontSize:10,color:'var(--tx2)'}},'Độ gần đúng '+Math.round(row.matchScore*100)+'%')),
            h('td',null,h('select',{value:row.customerId,onChange:e=>update(row.id,{customerId:e.target.value})},
              h('option',{value:''},'— Chọn khách hàng —'),
              ranked.map(item=>h('option',{key:item.customer.id,value:item.customer.id},(item.customer.name||item.customer.id)+' · '+Math.round(item.score*100)+'%'))
            )),
            h('td',null,h('input',{type:'text',inputMode:'numeric',value:finMoneyInput(row.amount),onChange:e=>update(row.id,{amount:String(e.target.value||'').replace(/[^\d]/g,'')})})),
            h('td',null,h('input',{type:'number',min:0,max:100,step:'.1',value:row.vatPercent,onChange:e=>update(row.id,{vatPercent:e.target.value}),style:{minWidth:72}})),
            h('td',null,finMoney(vatAmount)),
            h('td',null,h('b',null,finMoney((Number(row.amount)||0)+vatAmount)))
          );
        }))
      )
    ),
    !busy&&!rows.length&&h('div',{className:'empty-st',style:{padding:'26px 12px'}},'Chọn ảnh bảng doanh thu có các cột khách hàng, trước thuế, VAT và sau thuế. AI sẽ đọc bảng để bạn kiểm tra trước khi nhập.'),
    h(Row,null,h('button',{onClick:onClose,disabled:busy},'Hủy'),h('button',{className:'bp',onClick:submit,disabled:busy||!rows.length},h('i',{className:'ti ti-file-import'}),' Nhập '+rows.filter(row=>row.enabled).length+' dòng'))
  );
}

function FinanceReportTab({entries,setEntries,debts,setDebts,openings,setOpenings,customers,nccs,currentUser,orders,products,quotes,purchases,goodsPurchases}){
  const currentMonth=isoDate().slice(0,7);
  const[month,setMonth]=useState(currentMonth);const[tab,setTab]=useState('overview');const[entryModal,setEntryModal]=useState(null);const[debtModal,setDebtModal]=useState(null);const[debtImageModal,setDebtImageModal]=useState(false);
  const[editEntry,setEditEntry]=useState(null);const[editDebt,setEditDebt]=useState(null);
  const[vehicleMaintenance,setVehicleMaintenance]=useState([]);const[machineMaintenance,setMachineMaintenance]=useState([]);
  useEffect(()=>{
    let active=true;
    Promise.all([dbGet('scf_maint_vehicle',[]),dbGet('scf_maint_machine',[])]).then(([vehicles,machines])=>{
      if(!active)return;
      setVehicleMaintenance(Array.isArray(vehicles)?vehicles:[]);
      setMachineMaintenance(Array.isArray(machines)?machines:[]);
    }).catch(()=>{});
    return()=>{active=false;};
  },[]);
  const calcOpening=targetMonth=>{
    const exact=openings.find(x=>x.month===targetMonth);
    if(exact)return{...exact,auto:false};
    const base=[...openings].filter(x=>x.month<targetMonth).sort((a,b)=>String(b.month).localeCompare(String(a.month)))[0]||{month:'0000-00',cash:0,bank:0};
    const prior=entries.filter(x=>{const ym=String(x.date||'').slice(0,7);return ym>=base.month&&ym<targetMonth;});
    const delta=(method,direction)=>prior.reduce((total,x)=>total+(((method==='cash'?x.method==='cash':x.method!=='cash')&&x.direction===direction)?(Number(x.amount)||0):0),0);
    return{month:targetMonth,cash:(Number(base.cash)||0)+delta('cash','in')-delta('cash','out'),bank:(Number(base.bank)||0)+delta('bank','in')-delta('bank','out'),auto:true};
  };
  const opening=calcOpening(month);
  const[openingEdit,setOpeningEdit]=useState(opening);
  useEffect(()=>setOpeningEdit(calcOpening(month)),[month,openings,entries]);
  const monthEntries=entries.filter(x=>String(x.date||'').startsWith(month)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  const sum=(rows,fn)=>rows.reduce((total,row)=>total+(Number(fn(row))||0),0);
  const inflow=sum(monthEntries,x=>x.direction==='in'?x.amount:0),outflow=sum(monthEntries,x=>x.direction==='out'?x.amount:0);
  const cashIn=sum(monthEntries,x=>x.direction==='in'&&x.method==='cash'?x.amount:0),cashOut=sum(monthEntries,x=>x.direction==='out'&&x.method==='cash'?x.amount:0);
  const bankIn=sum(monthEntries,x=>x.direction==='in'&&x.method!=='cash'?x.amount:0),bankOut=sum(monthEntries,x=>x.direction==='out'&&x.method!=='cash'?x.amount:0);
  const openingTotal=(Number(opening.cash)||0)+(Number(opening.bank)||0),endingCash=(Number(opening.cash)||0)+cashIn-cashOut,endingBank=(Number(opening.bank)||0)+bankIn-bankOut,endingTotal=endingCash+endingBank;
  const recordedRevenue=sum(monthEntries,x=>x.pnlType==='revenue'?x.amount:0);
  const automaticExpenseCategories=['Mua nguyên vật liệu','Mua hàng hóa','Chi phí Bảo dưỡng xe','Chi phí Bảo dưỡng máy'];
  const manualExpenseEntries=monthEntries.filter(x=>x.pnlType==='expense'&&!automaticExpenseCategories.includes(x.category));
  const manualExpense=sum(manualExpenseEntries,x=>x.amount);
  const materialExpense=financePurchaseExpense(purchases,month),goodsExpense=financePurchaseExpense(goodsPurchases,month),vehicleMaintenanceExpense=financeMaintenanceExpense(vehicleMaintenance,month),machineMaintenanceExpense=financeMaintenanceExpense(machineMaintenance,month),expense=manualExpense+materialExpense+goodsExpense+vehicleMaintenanceExpense+machineMaintenanceExpense;
  const normalizeExpenseCategory=value=>String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const manualExpenseGroups=manualExpenseEntries.reduce((groups,entry)=>{
    const category=normalizeExpenseCategory(entry.category),amount=Number(entry.amount)||0;
    if(category.includes('luong lx')||category.includes('luong lai xe'))groups.driverSalary+=amount;
    else if(category.includes('luong sx')||category.includes('luong san xuat'))groups.productionSalary+=amount;
    else if(category.includes('luong kt')||category.includes('luong ke toan'))groups.accountingSalary+=amount;
    else if(category.includes('dien nuoc'))groups.utilities+=amount;
    else if(category.includes('chi bep')||category==='bep')groups.kitchen+=amount;
    else groups.other+=amount;
    return groups;
  },{driverSalary:0,productionSalary:0,accountingSalary:0,utilities:0,kitchen:0,other:0});
  const expenseBreakdown=[
    ['Chi phí mua NVL',materialExpense,'ti-package-import'],
    ['Chi phí mua HH',goodsExpense,'ti-box'],
    ['Chi phí Lương LX',manualExpenseGroups.driverSalary,'ti-steering-wheel'],
    ['Chi phí Lương SX',manualExpenseGroups.productionSalary,'ti-building-factory'],
    ['Chi phí Lương KT',manualExpenseGroups.accountingSalary,'ti-calculator'],
    ['Chi phí Điện nước',manualExpenseGroups.utilities,'ti-bulb'],
    ['Chi bếp',manualExpenseGroups.kitchen,'ti-tools-kitchen-2'],
    ['Chi phí Bảo dưỡng xe',vehicleMaintenanceExpense,'ti-car'],
    ['Chi phí Bảo dưỡng máy',machineMaintenanceExpense,'ti-settings'],
    ['Chi phí khác',manualExpenseGroups.other,'ti-receipt'],
    ['Tổng chi phí',expense,'ti-report-money']
  ];
  const salesSummary=financeSalesSummary(orders,products,quotes,customers,month);
  const revenueDelivered=salesSummary.amount,revenueInvoice=salesSummary.invoiceAmount,profitDelivered=revenueDelivered-expense,profitInvoice=revenueInvoice-expense;
  const monthEnd=month+'-31';
  const debtRows=debts.filter(x=>!x.date||x.date<=monthEnd);
  const debtVatPercent=x=>x.kind==='receivable'?Math.max(0,Number(x.vatPercent)||0):0;
  const debtVatAmount=x=>x.kind==='receivable'?Math.round((Number(x.amount)||0)*debtVatPercent(x)/100):0;
  const debtAfterTax=x=>(Number(x.amount)||0)+debtVatAmount(x);
  const outstanding=x=>Math.max(0,debtAfterTax(x)-(Number(x.paidAmount)||0));
  const receivable=sum(debtRows,x=>x.kind==='receivable'?outstanding(x):0),payable=sum(debtRows,x=>x.kind==='payable'?outstanding(x):0);
  const saveEntry=data=>{const item={...data,id:editEntry?.id||'TC'+uid()};setEntries(p=>editEntry?p.map(x=>x.id===editEntry.id?item:x):[item,...p]);setEntryModal(null);setEditEntry(null);};
  const saveDebt=data=>{const item={...data,id:editDebt?.id||'CN'+uid()};setDebts(p=>editDebt?p.map(x=>x.id===editDebt.id?item:x):[item,...p]);setDebtModal(null);setEditDebt(null);};
  const importCustomerDebts=items=>{setDebts(previous=>[...items,...previous]);setDebtImageModal(false);window.showToast('Đã nhập '+items.length+' dòng công nợ khách hàng.','success');};
  const saveOpening=()=>{const item={month,cash:Number(openingEdit.cash)||0,bank:Number(openingEdit.bank)||0,updatedBy:currentUser.name,updatedAt:fmtDT()};setOpenings(p=>{const i=p.findIndex(x=>x.month===month);return i>=0?p.map((x,j)=>j===i?item:x):[...p,item];});window.showToast('Đã lưu tiền đầu tháng.','success');};
  const delEntry=id=>window.scfConfirm('Xóa khoản thu/chi này?','Xóa dữ liệu',true).then(ok=>ok&&setEntries(p=>p.filter(x=>x.id!==id)));
  const delDebt=id=>window.scfConfirm('Xóa khoản công nợ này?','Xóa dữ liệu',true).then(ok=>ok&&setDebts(p=>p.filter(x=>x.id!==id)));
  const exportEntries=monthEntries.map(x=>({date:x.date,direction:x.direction==='in'?'Tiền vào':'Tiền ra',category:x.category,partner:x.partnerName,method:x.method==='cash'?'Tiền mặt':'Ngân hàng',amount:x.amount,pnl:x.pnlType==='revenue'?'Doanh thu':x.pnlType==='expense'?'Chi phí':'Không tính',reference:x.reference,bank:x.transferBank||'',transactionTime:x.transferTime||'',transferImage:x.transferImage||'',note:x.note}));
  const year=month.slice(0,4);
  const yearRows=Array.from({length:12},(_,i)=>{
    const ym=year+'-'+String(i+1).padStart(2,'0'),rows=entries.filter(x=>String(x.date||'').startsWith(ym)),op=calcOpening(ym);
    const inc=sum(rows,x=>x.direction==='in'?x.amount:0),out=sum(rows,x=>x.direction==='out'?x.amount:0),sales=financeSalesSummary(orders,products,quotes,customers,ym),revDelivered=sales.amount,revInvoice=sales.invoiceAmount,exp=sum(rows,x=>x.pnlType==='expense'&&!automaticExpenseCategories.includes(x.category)?x.amount:0)+financePurchaseExpense(purchases,ym)+financePurchaseExpense(goodsPurchases,ym)+financeMaintenanceExpense(vehicleMaintenance,ym)+financeMaintenanceExpense(machineMaintenance,ym);
    return{month:ym,opening:(Number(op.cash)||0)+(Number(op.bank)||0),inflow:inc,outflow:out,ending:(Number(op.cash)||0)+(Number(op.bank)||0)+inc-out,revenueInvoice:revInvoice,revenueDelivered:revDelivered,expense:exp,profitInvoice:revInvoice-exp,profitDelivered:revDelivered-exp};
  });
  const debtStatus=x=>outstanding(x)<=0?'paid':Number(x.paidAmount)>0?'partial':'unpaid';
  const exportDebts=debtRows.map(x=>({kind:x.kind==='receivable'?'Phải thu khách hàng':'Phải trả nhà cung cấp',partner:x.partnerName,date:x.date,dueDate:x.dueDate,invoiceNo:x.invoiceNo,amount:x.amount,vatPercent:x.kind==='receivable'?debtVatPercent(x):'',vatAmount:x.kind==='receivable'?debtVatAmount(x):'',amountAfterTax:debtAfterTax(x),paidAmount:x.paidAmount,remaining:outstanding(x),status:finStatusLabel(debtStatus(x)),note:x.note}));
  const exportCurrent=()=>{
    if(tab==='debt')return xlsxExport(exportDebts,[['kind','Loại công nợ'],['partner','Đối tượng'],['date','Ngày ghi nhận'],['dueDate','Hạn thanh toán'],['invoiceNo','Chứng từ'],['amount','Giá trị trước thuế'],['vatPercent','% VAT'],['vatAmount','Tiền VAT'],['amountAfterTax','Thành tiền sau thuế'],['paidAmount','Đã thanh toán'],['remaining','Còn lại'],['status','Trạng thái'],['note','Ghi chú']],'Cong_no_'+month);
    if(tab==='year')return xlsxExport(yearRows,[['month','Tháng'],['opening','Tiền đầu kỳ'],['inflow','Tiền vào'],['outflow','Tiền ra'],['ending','Tiền cuối kỳ'],['revenueInvoice','Doanh thu theo SL HĐ'],['revenueDelivered','Doanh thu theo SL giao'],['expense','Chi phí'],['profitInvoice','Lợi nhuận theo SL HĐ'],['profitDelivered','Lợi nhuận theo SL giao']],'Tong_hop_tai_chinh_'+year);
    return xlsxExport(exportEntries,[['date','Ngày'],['direction','Dòng tiền'],['category','Nhóm thu/chi'],['partner','Đối tượng'],['method','Phương thức'],['amount','Số tiền'],['pnl','KQ kinh doanh'],['reference','Chứng từ'],['bank','Ngân hàng'],['transactionTime','Giờ giao dịch'],['transferImage','Ảnh chuyển khoản'],['note','Ghi chú']],'So_thu_chi_'+month);
  };
  return h('div',{className:'finance-page'},
    h('div',{className:'ptitle'},h('i',{className:'ti ti-cash-banknote'}),'Báo cáo dòng tiền'),
    h('div',{className:'finance-toolbar'},
      h('div',{className:'finance-tabs'},[['overview','Tổng quan'],['cash','Sổ thu / chi'],['debt','Công nợ'],['year','Tổng hợp năm']].map(([v,l])=>h('button',{key:v,className:tab===v?'on':'',onClick:()=>setTab(v)},l))),
      h('div',{className:'finance-actions'},h('input',{type:'month',value:month,onChange:e=>setMonth(e.target.value||currentMonth)}),h(ExportBtn,{onClick:exportCurrent}),h('button',{className:'bp',onClick:()=>{setEditEntry(null);setEntryModal('in');}},'+ Tiền vào'),h('button',{onClick:()=>{setEditEntry(null);setEntryModal('out');}},'− Tiền ra'))
    ),
    h('div',{className:'finance-kpis'},[
      ['Tiền đầu tháng',openingTotal,'ti-wallet'],['Tiền vào',inflow,'ti-arrow-down-left'],['Tiền ra',outflow,'ti-arrow-up-right'],['Tiền cuối tháng',endingTotal,'ti-cash'],['Doanh thu theo SL HĐ',revenueInvoice,'ti-file-invoice'],['Doanh thu theo SL giao',revenueDelivered,'ti-truck-delivery'],['Chi phí',expense,'ti-receipt'],['Lợi nhuận theo SL HĐ',profitInvoice,'ti-report-money'],['Lợi nhuận theo SL giao',profitDelivered,'ti-report-money'],['Phải thu KH',receivable,'ti-user-dollar'],['Phải trả NCC',payable,'ti-building-bank']
    ].map(([label,value,icon])=>h('div',{className:'finance-kpi',key:label},h('i',{className:'ti '+icon}),h('span',null,label),h('b',{style:value<0?{color:'#A32D2D'}:null},finMoney(value))))),
    h('div',{className:'card',style:{marginBottom:'1rem',padding:'10px 14px',background:'#f3f9f5',border:'1px solid #cde4d3'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}},
        h('div',null,
          h('div',{style:{fontWeight:700,color:'var(--pri3)',fontSize:13}},h('i',{className:'ti ti-link',style:{marginRight:6}}),'Đồng bộ doanh thu thực tế giao'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:3}},'Tháng '+month+': '+salesSummary.confirmedOrdersCount+'/'+salesSummary.ordersCount+' đơn đã được lái xe xác nhận · '+salesSummary.missingPrice+' dòng chưa có giá bán')
        ),
        h('div',{style:{fontSize:12,color:'var(--tx2)',textAlign:'right'}},
          h('div',null,'Doanh thu theo SL HĐ: ',h('b',null,finMoney(revenueInvoice))),
        h('div',{style:{marginTop:2}},'Doanh thu theo SL giao: ',h('b',{style:{color:'var(--pri3)'}},finMoney(revenueDelivered))),
        h('div',{style:{marginTop:2}},'Tiền thực thu đã ghi sổ: ',h('b',null,finMoney(recordedRevenue))),
        h('div',{style:{marginTop:2}},'Chi phí tự động: NVL ',h('b',null,finMoney(materialExpense)),' · Hàng hóa ',h('b',null,finMoney(goodsExpense)),' · Bảo dưỡng xe ',h('b',null,finMoney(vehicleMaintenanceExpense)),' · Bảo dưỡng máy ',h('b',null,finMoney(machineMaintenanceExpense)))
        )
      )
    ),
    tab==='overview'&&h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{className:'finance-card-title'},'Chi tiết chi phí tháng '+month),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}},expenseBreakdown.map(([label,value,icon])=>h('div',{key:label,style:{display:'grid',gridTemplateColumns:'28px 1fr',alignItems:'center',columnGap:8,padding:'10px 12px',border:'1px solid var(--bd)',borderRadius:'var(--r)',background:label==='Tổng chi phí'?'#e7f3eb':'var(--bg)'}},
        h('i',{className:'ti '+icon,style:{gridRow:'1/3',fontSize:20,color:'var(--pri2)'}}),
        h('span',{style:{fontSize:12,color:'var(--tx2)'}},label),
        h('b',{style:{color:'var(--pri3)'}},finMoney(value))
      ))),
      h('div',{style:{marginTop:10,fontSize:12,color:'var(--tx2)'}},'NVL và hàng hóa được lấy tự động từ đơn mua; bảo dưỡng lấy từ dữ liệu Bảo dưỡng xe/máy. Các nhóm lương, điện nước và chi bếp lấy từ Sổ thu/chi theo nhóm tương ứng.')
    ),
    tab==='overview'&&h('div',{className:'finance-overview-grid'},
      h('div',{className:'card'},h('div',{className:'finance-card-title'},'Số dư tiền tháng '+month),opening.auto&&h('div',{className:'finance-auto-opening'},h('i',{className:'ti ti-refresh'}),' Tự chuyển từ số dư cuối tháng trước'),h('div',{className:'g2'},h(F,{label:'Tiền mặt đầu tháng'},h('input',{type:'number',value:openingEdit.cash,onChange:e=>setOpeningEdit(p=>({...p,cash:e.target.value}))})),h(F,{label:'Ngân hàng đầu tháng'},h('input',{type:'number',value:openingEdit.bank,onChange:e=>setOpeningEdit(p=>({...p,bank:e.target.value}))}))),h('button',{className:'bp',onClick:saveOpening},'Lưu tiền đầu tháng'),h('div',{className:'finance-balance-lines'},h('div',null,'Tiền mặt cuối tháng',h('b',null,finMoney(endingCash))),h('div',null,'Ngân hàng cuối tháng',h('b',null,finMoney(endingBank))),h('div',null,'Tổng tiền cuối tháng',h('b',null,finMoney(endingTotal))))),
      h('div',{className:'card'},h('div',{className:'finance-card-title'},'Kết quả kinh doanh'),h('div',{className:'finance-result'},h('div',null,'Doanh thu theo SL HĐ',h('b',null,finMoney(revenueInvoice))),h('div',null,'Doanh thu theo SL giao',h('b',null,finMoney(revenueDelivered))),h('div',null,'Chi phí',h('b',null,finMoney(expense))),h('div',{className:'profit'},'Lợi nhuận theo SL HĐ',h('b',{style:profitInvoice<0?{color:'#A32D2D'}:null},finMoney(profitInvoice))),h('div',{className:'profit'},'Lợi nhuận theo SL giao',h('b',{style:profitDelivered<0?{color:'#A32D2D'}:null},finMoney(profitDelivered)))),h('div',{className:'finance-note'},'Lợi nhuận theo SL HĐ = Doanh thu theo SL HĐ − Chi phí. Lợi nhuận theo SL giao = Doanh thu theo SL giao − Chi phí.'))
    ),
    tab==='cash'&&h('div',{className:'card'},h('div',{className:'finance-card-title'},'Sổ thu / chi tháng '+month),h('div',{className:'tw'},h('table',null,h('thead',null,h('tr',null,...['Ngày','Dòng tiền','Nhóm','Đối tượng','Phương thức','Số tiền','KQKD','Chứng từ','Ảnh CK','Ghi chú',''].map(x=>h('th',{key:x},x)))),h('tbody',null,monthEntries.length?monthEntries.map(x=>h('tr',{key:x.id},h('td',null,vnDateFromISO(x.date)),h('td',null,h('span',{className:'badge',style:{background:x.direction==='in'?'#EAF3DE':'#FCEBEB',color:x.direction==='in'?'#3B6D11':'#A32D2D'}},x.direction==='in'?'Tiền vào':'Tiền ra')),h('td',null,x.category),h('td',null,x.partnerName||'—'),h('td',null,x.method==='cash'?'Tiền mặt':'Ngân hàng'),h('td',null,h('b',null,finMoney(x.amount))),h('td',null,x.pnlType==='revenue'?'Doanh thu':x.pnlType==='expense'?'Chi phí':'Không tính'),h('td',null,x.reference||'—'),h('td',null,x.transferImage?h('a',{href:x.transferImage,target:'_blank',rel:'noopener',className:'btn',style:{whiteSpace:'nowrap'}},h('i',{className:'ti ti-photo'}),' Xem ảnh'):'—'),h('td',null,x.note||'—'),h('td',null,h('button',{className:'bi',onClick:()=>{setEditEntry(x);setEntryModal(x.direction);}},h('i',{className:'ti ti-edit'})),currentUser.role==='admin'&&h('button',{className:'bi bdel',onClick:()=>delEntry(x.id)},h('i',{className:'ti ti-trash'}))))):h('tr',null,h('td',{colSpan:11,className:'empty-st'},'Tháng này chưa có khoản thu/chi')))))),
    tab==='debt'&&h('div',null,
      h('div',{className:'finance-debt-actions'},
        h('button',{className:'bp',onClick:()=>{setEditDebt(null);setDebtModal('receivable');}},'+ Công nợ khách hàng'),
        h('button',{onClick:()=>{setEditDebt(null);setDebtModal('payable');}},'+ Công nợ nhà cung cấp'),
        h('button',{onClick:()=>setDebtImageModal(true)},h('i',{className:'ti ti-photo-scan'}),' Nhập công nợ KH từ ảnh')
      ),
      h('div',{className:'card'},
        h('div',{className:'finance-card-title'},'Theo dõi công nợ'),
        h('div',{className:'tw'},
          h('table',null,
            h('thead',null,h('tr',null,...['Loại','Đối tượng','Ngày','Hạn trả','Chứng từ','Trước thuế','% VAT','Tiền VAT','Sau thuế','Đã trả','Còn lại','Trạng thái',''].map(x=>h('th',{key:x},x)))),
            h('tbody',null,debtRows.length?debtRows.map(x=>{
              const status=debtStatus(x),overdue=status!=='paid'&&x.dueDate&&x.dueDate<isoDate(),isReceivable=x.kind==='receivable';
              return h('tr',{key:x.id,style:overdue?{background:'#FFF5F5'}:null},
                h('td',null,isReceivable?'Phải thu KH':'Phải trả NCC'),
                h('td',null,h('b',null,x.partnerName)),
                h('td',null,vnDateFromISO(x.date)),
                h('td',null,x.dueDate?vnDateFromISO(x.dueDate):'—'),
                h('td',null,x.invoiceNo||'—'),
                h('td',null,finMoney(x.amount)),
                h('td',null,isReceivable?(debtVatPercent(x).toLocaleString('vi-VN')+'%'):'—'),
                h('td',null,isReceivable?finMoney(debtVatAmount(x)):'—'),
                h('td',null,h('b',null,finMoney(debtAfterTax(x)))),
                h('td',null,finMoney(x.paidAmount)),
                h('td',null,h('b',null,finMoney(outstanding(x)))),
                h('td',null,h('span',{className:'badge',style:{background:status==='paid'?'#EAF3DE':overdue?'#FCEBEB':'#FAEEDA',color:status==='paid'?'#3B6D11':overdue?'#A32D2D':'#854F0B'}},overdue?'Quá hạn':finStatusLabel(status))),
                h('td',null,
                  h('button',{className:'bi',onClick:()=>{setEditDebt(x);setDebtModal(x.kind);}},h('i',{className:'ti ti-edit'})),
                  currentUser.role==='admin'&&h('button',{className:'bi bdel',onClick:()=>delDebt(x.id)},h('i',{className:'ti ti-trash'}))
                )
              );
            }):h('tr',null,h('td',{colSpan:13,className:'empty-st'},'Chưa có công nợ')))
          )
        )
      )
    ),
    tab==='year'&&h('div',{className:'card'},h('div',{className:'finance-card-title'},'Tổng hợp doanh thu, chi phí và lợi nhuận năm '+year),h('div',{className:'tw'},h('table',null,h('thead',null,h('tr',null,...['Tháng','Đầu kỳ','Tiền vào','Tiền ra','Cuối kỳ','DT theo SL HĐ','DT theo SL giao','Chi phí','LN theo SL HĐ','LN theo SL giao'].map(x=>h('th',{key:x},x)))),h('tbody',null,yearRows.map(x=>h('tr',{key:x.month},h('td',null,x.month),h('td',null,finMoney(x.opening)),h('td',null,finMoney(x.inflow)),h('td',null,finMoney(x.outflow)),h('td',null,h('b',null,finMoney(x.ending))),h('td',null,finMoney(x.revenueInvoice)),h('td',null,finMoney(x.revenueDelivered)),h('td',null,finMoney(x.expense)),h('td',null,h('b',{style:x.profitInvoice<0?{color:'#A32D2D'}:null},finMoney(x.profitInvoice))),h('td',null,h('b',{style:x.profitDelivered<0?{color:'#A32D2D'}:null},finMoney(x.profitDelivered))))))))),
    entryModal&&h(FinanceEntryForm,{entry:editEntry,direction:entryModal,customers,nccs,currentUser,onSave:saveEntry,onClose:()=>{setEntryModal(null);setEditEntry(null);}}),
    debtModal&&h(FinanceDebtForm,{debt:editDebt,kind:debtModal,customers,nccs,currentUser,onSave:saveDebt,onClose:()=>{setDebtModal(null);setEditDebt(null);}}),
    debtImageModal&&h(FinanceDebtImageImport,{customers,currentUser,defaultMonth:month,onImport:importCustomerDebts,onClose:()=>setDebtImageModal(false)})
  );
}
