/* Kho hàng hóa: nguồn và chốt kiểm kê được tính lại trên máy chủ, không ghi offline. */
async function scfGoodsInventoryRequest(operation,data){
 const {data:result,error}=await invokeScfAuth({body:{action:'goods_inventory',operation,...data}},30000);
 if(error||!result?.ok)throw Error(result?.error||await serverFunctionErrorMessage(error,result,'Chưa kết nối được kho hàng hóa. Cần cập nhật scf-auth.'));
 return result;
}
function GoodsInventoryTab({currentUser}){
 const today=()=>new Date(Date.now()+7*3600000).toISOString().slice(0,10);
 const[date,setDate]=useState(today),[loaded,setLoaded]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reload,setReload]=useState(0);
 const[counts,setCounts]=useState({}),[query,setQuery]=useState(''),[onlyDiff,setOnlyDiff]=useState(false),[modal,setModal]=useState(''),[form,setForm]=useState({}),[details,setDetails]=useState(null);
 useEffect(()=>{
  let active=true;setBusy(true);setLoaded(null);setError('');setCounts({});setModal('');setDetails(null);
  scfGoodsInventoryRequest('load',{date}).then(r=>{if(active){setLoaded(r);setCounts(Object.fromEntries(r.report.rows.filter(x=>x.actual!==null).map(x=>[x.productId,{actual:String(x.actual),reason:x.reason,quality:x.quality}])));}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});
  return()=>{active=false;};
 },[date,reload]);
 const report=loaded?.report,editable=loaded?.canWrite&&!busy,closed=!!report?.closed;
 const localNow=()=>new Date(Date.now()+7*3600000).toISOString().slice(0,16);
 const change=(key,value)=>setForm(f=>({...f,[key]:value}));
 const mutate=async(operation,data={})=>{
  if(!editable)return;setBusy(true);setError('');
  try{await scfGoodsInventoryRequest(operation,{date,version:loaded.version,requestId:crypto.randomUUID(),...data});setReload(n=>n+1);}
  catch(e){setError(e.message);setBusy(false);}
 };
 const start=kind=>{setForm({at:date===today()?localNow():date+'T08:00',quantities:{},productIds:[],reason:'',productId:report?.rows[0]?.productId||'',qty:'',purchaseId:''});setModal(kind);};
 const number=n=>Number(n).toLocaleString('vi-VN',{maximumFractionDigits:6});
 const actual=r=>counts[r.productId]?.actual??'';
 const difference=r=>String(actual(r)).trim()===''?null:Number(String(actual(r)).replace(',','.'))-r.expected;
 const rows=(report?.rows||[]).filter(r=>(!query||[r.name,r.code,r.group].join(' ').toLowerCase().includes(query.toLowerCase()))&&(!onlyDiff||(difference(r)!==null&&Math.abs(difference(r))>1e-6)));
 const field=(label,value,onChange,props={})=>h(F,{label},h('input',{'aria-label':label,value,onChange:e=>onChange(e.target.value),...props}));
 const tableDetails=r=>setDetails(r);
 const editCount=(r,key,value)=>setCounts(c=>({...c,[r.productId]:{...c[r.productId],[key]:value}}));
 const countInput=r=>h('input',{'aria-label':'Kiểm kê '+r.name,type:'text',inputMode:'decimal',value:actual(r),disabled:!editable||closed||!report.initialized,onChange:e=>editCount(r,'actual',e.target.value),style:{minWidth:82,width:'100%'}});
 const qualityInput=r=>h('input',{'aria-label':'Chất lượng '+r.name,value:counts[r.productId]?.quality||'',disabled:!editable||closed||!report.initialized,placeholder:'Ghi nhận chất lượng…',maxLength:500,onChange:e=>editCount(r,'quality',e.target.value),style:{minWidth:150}});
 const reasonInput=r=>h('input',{'aria-label':'Lý do lệch '+r.name,value:counts[r.productId]?.reason||'',disabled:!editable||closed||!report.initialized,placeholder:'Lý do thừa / thiếu',onChange:e=>editCount(r,'reason',e.target.value),style:{minWidth:150}});
 const diffLabel=r=>{const n=difference(r);return h('b',{style:{color:n<0?'#b45309':n>0?'#166534':'var(--tx2)'}},n===null?'Chưa kiểm':number(n));};
 const eventRows=(loaded?.events||[]).filter(e=>e.at>report?.start&&(e.at<=report?.end||(date===today()&&e.at<=localNow())));
 const selectedPurchase=loaded?.purchases.find(p=>String(p.id)===form.purchaseId);
 const tabsSummary=h('p',{className:'goods-inventory-help'},'Kỳ kiểm kê: sau 9h hôm trước → hết 9h ngày chọn (giờ Việt Nam). Xuất theo SL đặt; bỏ đơn hủy, giao lỗi. Tồn thực tế sau chốt chuyển sang kỳ sau.');
 return h('div',{className:'goods-inventory'},
  h('div',{className:'ptitle'},'Nhập – xuất – tồn hàng hóa · Kiểm kê 9h'),
  h('div',{className:'goods-inventory-toolbar'},field('Ngày kiểm kê',date,v=>setDate(v),{type:'date',disabled:busy,max:today()}),
   h('button',{disabled:busy,onClick:()=>setReload(n=>n+1)},'Tải lại'),
   h('input',{'aria-label':'Tìm hàng hóa',placeholder:'Tìm mã, tên, nhóm hàng…',value:query,onChange:e=>setQuery(e.target.value)}),
   h('label',null,h('input',{type:'checkbox',checked:onlyDiff,onChange:e=>setOnlyDiff(e.target.checked)}),' Chỉ hiện hàng lệch'),
   loaded&&h(ExportBtn,{onClick:()=>xlsxExport(rows.map(r=>({...r,actual:actual(r),quality:counts[r.productId]?.quality||'',difference:difference(r)})),[['name','Hàng hóa'],['unit','Đơn vị'],['opening','Tồn đầu 9h hôm trước'],['incoming','Nhập'],['ordered','Xuất theo đơn'],['extra','Xuất ngoài'],['expected','Tồn tính toán'],['actual','Kiểm kê 9h'],['quality','Chất lượng'],['difference','Lệch'],['reason','Lý do']],'Nhap_xuat_ton_'+date)})
  ),tabsSummary,
  error&&h('p',{role:'alert',className:'goods-inventory-error'},error),busy&&h('p',{role:'status'},'Đang xác nhận dữ liệu kho…'),
  report&&h(React.Fragment,null,
   !report.initialized&&h('p',{className:'goods-inventory-error'},'Chưa khởi tạo tồn đầu. Chọn ngày kiểm kê đầu tiên, nhập số tồn tại 9h hôm trước. Số tồn hàng hóa cũ chưa tự chuyển sang bảng này.'),
   report.staleDate&&h('p',{role:'alert',className:'goods-inventory-error'},'Nguồn nhập/xuất kỳ '+report.staleDate+' đã thay đổi sau khi chốt. Cần mở lại các kỳ từ gần nhất về kỳ này và chốt lại theo thứ tự.'),
   report.warnings.map((w,i)=>h('p',{key:i,role:'alert',className:'goods-inventory-error'},w)),
   h('div',{className:'goods-inventory-toolbar'},
    h('button',{disabled:!editable||!report.initialized,onClick:()=>start('extra')},'+ Xuất ngoài'),
    h('button',{disabled:!editable||!report.initialized,onClick:()=>start('receive')},'+ Nhận hàng mua'),
    !report.initialized&&h('button',{className:'bp',disabled:!editable,onClick:()=>start('opening')},'Khởi tạo tồn đầu'),
    !closed&&report.initialized&&h('button',{className:'bp',disabled:!editable||!report.canClose||!!report.warnings.length,onClick:()=>{setForm({});setModal('close');}},'Chốt kiểm kê 9h'),
    closed&&h('b',null,'Đã chốt · '+report.closed.actor+' · '+new Date(report.closed.at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})),
    closed&&h('button',{disabled:!editable,onClick:()=>start('reopen')},'Mở lại kiểm kê')
   ),
   h('p',{className:'goods-inventory-help'},'Đang xem '+rows.length+' mặt hàng · Thiếu: '+rows.filter(r=>difference(r)<-1e-6).length+' mặt hàng · Thừa: '+rows.filter(r=>difference(r)>1e-6).length+' mặt hàng. Bấm mặt hàng để đối chiếu chi tiết. Không cộng tổng các đơn vị khác nhau.'),
   h('div',{className:'tw goods-inventory-desktop'},h('table',null,
    h('thead',null,h('tr',null,['Hàng hóa','ĐVT','Tồn đầu','Nhập về','Xuất theo đơn','Xuất ngoài','Tồn tính toán','Kiểm kê 9h','Chất lượng','Lệch','Lý do lệch'].map(t=>h('th',{key:t},t)))),
    h('tbody',null,rows.map(r=>h('tr',{key:r.id},h('td',null,h('button',{className:'goods-inventory-link',onClick:()=>tableDetails(r)},r.name)),h('td',null,r.unit),...['opening','incoming','ordered','extra','expected'].map(key=>h('td',{key},number(r[key]))),h('td',null,countInput(r)),h('td',null,qualityInput(r)),h('td',null,diffLabel(r)),h('td',null,reasonInput(r))))))),
   h('div',{className:'goods-inventory-mobile'},rows.map(r=>h('article',{key:r.id,className:'card'},h('button',{className:'goods-inventory-link',onClick:()=>tableDetails(r)},r.name+' · '+r.unit),h('div',{className:'goods-inventory-metrics'},...['Tồn đầu','Nhập về','Xuất theo đơn','Xuất ngoài','Tồn tính toán'].map((label,i)=>h('div',{key:label},h('small',null,label),h('b',null,number(r[['opening','incoming','ordered','extra','expected'][i]]))))),h(F,{label:'Kiểm kê 9h'},countInput(r)),h(F,{label:'Chất lượng'},qualityInput(r)),h('p',null,'Lệch: ',diffLabel(r)),reasonInput(r)))),
   h('details',null,h('summary',null,'Nhật ký nhận hàng / xuất ngoài (gồm phát sinh sau 9h hôm nay · '+eventRows.length+')'),h('div',{className:'tw'},h('table',null,h('thead',null,h('tr',null,['Thời gian','Loại / Hàng hóa','Số lượng','Lý do / Nội dung xuất','Người ghi',''].map(t=>h('th',{key:t},t)))),h('tbody',null,eventRows.map(e=>h('tr',{key:e.id},h('td',null,e.at.replace('T',' '),e.at>report.end&&h('small',{style:{display:'block',color:'var(--pri)'}},'Tính vào kỳ 9h tiếp theo')),h('td',null,e.kind==='in'?'Nhận '+e.purchaseId:report.rows.find(r=>r.id===e.productId)?.name||e.productId),h('td',null,e.kind==='in'?e.lines.map(l=>l.qty+' '+l.unit).join('; '):e.qty),h('td',null,e.reason||e.note||'—'),h('td',null,e.actor),h('td',null,e.voided?'Đã hủy':h('button',{disabled:!editable,onClick:()=>{setForm({eventId:e.id,reason:''});setModal('void');}},'Hủy phát sinh')))))))),
   h('details',null,h('summary',null,'Lịch sử mở lại kiểm kê'),(loaded.history||[]).map((r,i)=>h('p',{key:i},r.date+' · '+r.actor+' · '+r.reason)))
  ),
  details&&h(Modal,{title:'Đối chiếu '+details.name,onClose:()=>setDetails(null)},h('p',null,report.start+' → '+report.end),h('p',null,'Tồn đầu '+number(details.opening)+' '+details.unit),details.details.map((m,i)=>h('p',{key:i},m.at.replace('T',' ')+' · '+({in:'Nhập',order:'Xuất đơn',extra:'Xuất ngoài'}[m.kind])+' · '+m.ref+' · '+number(m.qty)+' '+details.unit+' · '+m.note)),!details.details.length&&h('p',null,'Không có phát sinh trong kỳ.')),
  modal&&h(Modal,{title:({opening:'Khởi tạo tồn tại 9h hôm trước',extra:'Xuất ngoài',receive:'Nhận hàng mua',reopen:'Mở lại kiểm kê',void:'Hủy phát sinh',close:'Xác nhận chốt kiểm kê 9h'})[modal],lg:modal==='opening',onClose:()=>{if(!busy)setModal('');}},
   error&&h('p',{role:'alert',className:'goods-inventory-error'},error),
   modal==='opening'&&h('div',null,h('p',null,'Mốc bắt đầu: 9h ngày trước '+date+'. Nhập cả số 0. Chỉ tính phát sinh sau mốc này.'),h('p',null,'Chọn những hàng hóa cần quản lý (ví dụ quẩy); chỉ những mặt hàng này cần kiểm kê mỗi ngày.'),field('Tìm hàng hóa khởi tạo',form.search||'',v=>change('search',v)),h('div',{style:{maxHeight:'45vh',overflowY:'auto'}},report.rows.filter(r=>!form.search||r.name.toLowerCase().includes(form.search.toLowerCase())).map(r=>h('div',{key:r.id,style:{display:'flex',alignItems:'center',gap:10,marginBottom:10}},h('input',{type:'checkbox','aria-label':'Theo dõi '+r.name,checked:form.productIds?.includes(r.id)||false,style:{width:'auto'},onChange:e=>change('productIds',e.target.checked?[...(form.productIds||[]),r.id]:(form.productIds||[]).filter(id=>id!==r.id))}),field(r.name+' ('+r.unit+')',form.quantities?.[r.id]??'',v=>change('quantities',{...form.quantities,[r.id]:v}),{inputMode:'decimal',disabled:!form.productIds?.includes(r.id)}))))),
   ['extra','receive'].includes(modal)&&field('Ngày giờ phát sinh',form.at||'',v=>change('at',v),{type:'datetime-local',max:localNow()}),
   modal==='extra'&&h(React.Fragment,null,h(F,{label:'Hàng hóa'},h('select',{'aria-label':'Hàng hóa',value:form.productId,onChange:e=>change('productId',e.target.value)},report.rows.map(r=>h('option',{key:r.id,value:r.id},r.name+' ('+r.unit+')')))),field('Số lượng xuất',form.qty||'',v=>change('qty',v),{inputMode:'decimal'})),
   modal==='receive'&&h(React.Fragment,null,h(F,{label:'Đơn mua'},h('select',{'aria-label':'Đơn mua',value:form.purchaseId,onChange:e=>{change('purchaseId',e.target.value);change('quantities',{});}},h('option',{value:''},'Chọn đơn đã đặt'),loaded.purchases.filter(p=>p.lines.some(l=>l.productId&&!l.legacy&&Number(l.qty)>l.received)).map(p=>h('option',{key:p.id,value:String(p.id)},p.id+' · '+p.nccName)))),selectedPurchase?.lines.filter(l=>l.productId).map(l=>field(l.name+' · Còn nhận '+number(Number(l.qty)-l.received)+' '+l.unit,form.quantities?.[l.index]??'',v=>change('quantities',{...form.quantities,[l.index]:v}),{inputMode:'decimal'})),h('p',{className:'goods-inventory-help'},'Có thể nhận nhiều lần. Phát sinh sau 9h tính vào kỳ kiểm kê tiếp theo. Đơn đã đánh dấu Đã nhận được tự tính một lần theo ngày/giờ nhận trong Đơn mua, không nhận lại ở đây.')),
   ['extra','receive','reopen','void'].includes(modal)&&field(modal==='extra'?'Lý do / Nội dung xuất':'Lý do / Ghi chú',form.reason||'',v=>change('reason',v)),
   modal==='close'&&h('p',null,'Chốt '+report.rows.length+' mặt hàng tại 9h ngày '+date+'. Phải nhập số kiểm kê thực tế cho tất cả mặt hàng và lý do nếu thừa/thiếu. Sau chốt, số thực tế chuyển sang kỳ tiếp theo.'),
   h(Row,null,h('button',{disabled:busy,onClick:()=>setModal('')},'Đóng'),h('button',{className:'bp',disabled:!editable,onClick:()=>mutate(modal,modal==='close'?{counts,basis:report.basis}:form)},modal==='close'?'Xác nhận chốt':'Lưu'))
  )
 );
}
