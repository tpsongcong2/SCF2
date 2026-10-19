/* Chốt ca luôn xác nhận trực tiếp trên máy chủ; không chốt bằng dữ liệu offline. */
async function scfProductionClosingRequest(operation,data={}){
  if(typeof invokeScfAuth!=='function')throw new Error('Chưa có kết nối xác thực máy chủ.');
  const{data:result,error}=await invokeScfAuth({body:{action:'production_closing',operation,...data}},30000);
  if(error||!result?.ok)throw new Error(result?.error||(await serverFunctionErrorMessage(error,result,'Chưa thực hiện được thao tác sản xuất.')));
  return result;
}
function ProductionClosingDialog({initialScope,currentUser,onClose,onReport}){
  const[scope,setScope]=useState(()=>({...scfClosingAutoScope(),workshop:'bun',...initialScope}));
  const[loaded,setLoaded]=useState(null),[adjustments,setAdjustments]=useState({}),[responsibleId,setResponsibleId]=useState(''),[memberIds,setMemberIds]=useState([]);
  const[busy,setBusy]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[editing,setEditing]=useState(false);
  const[clockTick,setClockTick]=useState(0);
  useEffect(()=>{const id=setInterval(()=>setClockTick(n=>n+1),15000);return()=>clearInterval(id);},[]);
  useEffect(()=>{
    let active=true;setLoaded(null);setBusy(true);setError('');setEditing(false);
    scfProductionClosingRequest('load',{scope}).then(result=>{
      if(!active)return;setLoaded({...result,receivedAt:Date.now()});setAdjustments(result.record?.adjustments||result.defaultAdjustments||{});
      setResponsibleId(result.record?.snapshot?.responsible?.id||String(currentUser?.id||''));
      setMemberIds(result.record?.snapshot?.members?.map(member=>member.id)||[String(currentUser?.id||'')]);
    }).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});
    return()=>{active=false;};
  },[scope.date,scope.shift,scope.workshop,attempt,currentUser?.id]);
  const result=scfClosingCalculate(loaded?.lines||[],adjustments),record=loaded?.record;
  const now=loaded?new Date(Date.parse(loaded.serverTime)+(Date.now()-(loaded.receivedAt||Date.now()))):new Date();
  const open=loaded?.open&&scfClosingScopeOpen(scope,now);
  const editable=!!loaded?.canClose&&open&&(!record||editing)&&!busy;
  const validTeam=loaded?.team?.some(member=>member.id===responsibleId)&&memberIds.length>0&&memberIds.every(id=>loaded.team.some(member=>member.id===id));
  const pending=typeof readSyncQueue==='function'&&Object.keys(readSyncQueue()).some(key=>['scf_prod_actuals','scf_orders','scf_prod_shifts','scf_prod_shift_rules','scf_products','scf_prodcats','scf_customers'].includes(key));
  const fmt=value=>Number(value||0).toLocaleString('vi-VN',{maximumFractionDigits:3});
  const save=async()=>{
    if(!editable)return;
    if(pending){setError('Còn dữ liệu chưa đồng bộ. Đợi đồng bộ xong rồi bấm Tải lại để đối chiếu.');window.scfSyncNow?.();return;}
    setBusy(true);setError('');const actorId=String(currentUser?.id||'');
    try{
      const result=await scfProductionClosingRequest('save',{scope,version:loaded.version,adjustments,responsibleId,memberIds});
      if(window.__SCF_ACCESS_CONTEXT?.employeeId&&String(window.__SCF_ACCESS_CONTEXT.employeeId)!==actorId)return;
      setLoaded(previous=>({...previous,record:result.record,version:result.version}));setEditing(false);window.showToast('Đã chốt ca và lưu báo cáo trên máy chủ.','success');
    }catch(e){setError(e.message+' Nếu có thay đổi đồng thời, bấm Tải lại để kiểm tra.');}finally{setBusy(false);}
  };
  return h(Modal,{title:'Chốt cuối ca',lg:true,className:'production-closing-modal',onClose},
    h('div',{className:'g3'},h(F,{label:'Ngày kết thúc ca'},h('input',{type:'date',value:scope.date,disabled:busy,onChange:e=>setScope(s=>({...s,date:e.target.value}))})),h(F,{label:'Ca sản xuất'},h('select',{value:scope.shift,disabled:busy,onChange:e=>setScope(s=>({...s,shift:e.target.value}))},h('option',{value:'night'},'Ca đêm'),h('option',{value:'afternoon'},'Ca chiều'))),h(F,{label:'Xưởng'},h('select',{value:scope.workshop,disabled:busy,onChange:e=>setScope(s=>({...s,workshop:e.target.value}))},h('option',{value:'bun'},'Xưởng bún'),h('option',{value:'banh'},'Xưởng bánh')))),
    h('p',{className:'production-closing-help'},'Chốt theo ngày – ca – xưởng. Ca đêm: sửa trước 07:00 ngày kết thúc ca; ca chiều: trước 18:00. Lượng lỗi được gợi ý từ sản lượng đã lưu; kiểm tra lại trước khi chốt.'),
    busy&&!loaded&&h('p',{role:'status'},'Đang đối chiếu dữ liệu trên máy chủ…'),
    pending&&h('p',{className:'production-closing-notice'},'Đang có dữ liệu chưa đồng bộ. Bấm Tải lại sau khi trạng thái đồng bộ hoàn tất.'),
    loaded&&h(React.Fragment,null,
      !open&&h('p',{className:'production-closing-notice'},'Ca chưa bắt đầu hoặc đã hết hạn sửa. Dữ liệu chỉ được xem.'),
      record&&h('div',{className:'production-closing-saved'},'✓ Đã chốt lần '+record.revision+' · '+record.snapshot.closedBy.name+' · '+new Date(record.snapshot.closedAt).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'})),
      canViewProductionShiftWeight(currentUser)&&h('div',{className:'production-closing-metrics'},...[['Đơn đã SX',result.totals.confirmed,'good'],['SL đặt còn thiếu',result.totals.missing,'warning'],['SL dư',result.totals.extra,'good'],['SL lỗi',result.totals.loss,'bad']].map(([label,value,kind])=>h('div',{key:label,className:kind},h('small',null,label),h('b',null,fmt(value)+' kg')))),
      result.totals.pending>0&&h('div',{className:'production-closing-notice'},'Còn '+result.totals.pending+' dòng chưa tích hoặc lượng đã thay đổi. Quay lại Xem nguồn đơn để kiểm tra.'),
      result.totals.unknown>0&&h('p',{role:'alert',className:'production-mobile-error'},'Có '+result.totals.unknown+' dòng chưa có kg/đơn vị. Bổ sung quy đổi trước khi chốt.'),
      !result.rows.length&&h('p',null,'Không có đơn sản xuất thuộc ca và xưởng này.'),
      result.rows.map(row=>h('div',{key:row.productId,className:'production-closing-product'},h('b',null,row.productName),h('div',{className:'production-closing-help'},'Đặt '+fmt(row.ordered)+' kg · Đã SX theo đơn '+fmt(row.confirmed)+' kg'),row.pending>0&&h('p',{className:'production-closing-help'},'Còn thiếu '+fmt(row.missing)+' kg · '+row.pending+' dòng'),
        h('div',{className:'g2'},h(F,{label:'SL dư (kg)'},h('input',{inputMode:'decimal',value:adjustments[row.productId]?.extra??'',disabled:!editable||row.pending>0||row.unknown>0,placeholder:'0',onChange:e=>setAdjustments(a=>({...a,[row.productId]:{...a[row.productId],extra:e.target.value}}))})),h(F,{label:'SL SX lỗi (kg)'},h('input',{inputMode:'decimal',value:adjustments[row.productId]?.loss??'',disabled:!editable,placeholder:'0',onChange:e=>setAdjustments(a=>({...a,[row.productId]:{...a[row.productId],loss:e.target.value}}))}))),
        h('div',{className:'production-closing-help'},row.pending?'Tích đủ đơn sản phẩm này để nhập dư.':'SL SX đạt: '+fmt(row.good)+' kg'),
        row.pending>0&&h('details',null,h('summary',null,'Các đơn chưa đủ xác nhận'),row.sources.filter(source=>!source.completed).map(source=>h('p',{key:source.key+'|'+source.orderId,className:'production-closing-help'},source.deliveryDate+' · '+source.pointName+' · '+source.deliveryTime+' — '+source.qty+' '+source.unit)))
      )),
      h('div',{className:'production-closing-product'},h(F,{label:'Trưởng ca phụ trách'},h('select',{value:responsibleId,disabled:!editable,onChange:e=>setResponsibleId(e.target.value)},h('option',{value:''},'— Chọn trưởng ca —'),(loaded.team||[]).map(member=>h('option',{key:member.id,value:member.id},member.name)))),h('b',null,'Nhóm người tham gia xưởng'),h('div',{className:'production-closing-members'},(loaded.team||[]).map(member=>h('label',{key:member.id},h('input',{type:'checkbox',checked:memberIds.includes(member.id),disabled:!editable,onChange:e=>setMemberIds(ids=>e.target.checked?[...new Set([...ids,member.id])]:ids.filter(id=>id!==member.id))}),member.name)))),
      record?.history?.length>0&&h('details',{className:'production-closing-help'},h('summary',null,'Lịch sử chốt ('+record.history.length+' bản trước)'),record.history.slice().reverse().map((entry,index)=>h('p',{key:index},new Date(entry.closedAt).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'})+' · '+entry.closedBy.name+' · Đạt '+fmt(entry.totals.good)+' kg · Lỗi '+fmt(entry.totals.loss)+' kg'))),
      result.invalid&&h('p',{role:'alert',className:'production-mobile-error'},'Lượng dư/lỗi phải là số từ 0 trở lên; chỉ nhập dư khi đủ đơn.'),
      h('p',{className:'production-closing-help'},'SL SX đạt = đơn đã tích + dư. Tổng SX = đạt + lỗi. Mỗi lần chốt được lưu riêng trong lịch sử.')
    ),
    error&&h('p',{role:'alert',className:'production-mobile-error'},error),
    h('div',{className:'form-actions'},h('button',{type:'button',disabled:busy,onClick:()=>setAttempt(n=>n+1)},'Tải lại'),onReport&&h('button',{type:'button',onClick:onReport},'Báo cáo SX'),record&&!editing&&loaded?.canClose&&open&&h('button',{type:'button',onClick:()=>setEditing(true)},'Chỉnh sửa ca'),h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:!editable||pending||result.invalid||!result.rows.length||result.totals.pending>0||result.totals.unknown>0||!validTeam,onClick:save},busy?'Đang lưu…':record?'Lưu & chốt lại ca':'Chốt ca'))
  );
}
function ProductionReportTab({currentUser}){
  const today=scfClosingAutoScope().date;
  const[from,setFrom]=useState(today.slice(0,8)+'01'),[to,setTo]=useState(today),[workshop,setWorkshop]=useState('all'),[shift,setShift]=useState('all');
  const[rows,setRows]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const[attempt,setAttempt]=useState(0);
  useEffect(()=>{let active=true;setRows([]);setBusy(true);setError('');scfProductionClosingRequest('report',{from,to}).then(r=>{if(active)setRows(r.items);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[from,to,currentUser?.id,attempt]);
  const visible=rows.filter(row=>(workshop==='all'||row.workshop===workshop)&&(shift==='all'||row.shift===shift)).sort((a,b)=>b.snapshot.closedAt.localeCompare(a.snapshot.closedAt));
  const fmt=n=>Number(n||0).toLocaleString('vi-VN',{maximumFractionDigits:3});
  return h('div',{className:'production-report'},h('div',{className:'ptitle'},'Báo cáo sản xuất'),h('div',{className:'card'},h('div',{className:'g2'},h(F,{label:'Từ ngày'},h('input',{type:'date',value:from,onChange:e=>setFrom(e.target.value)})),h(F,{label:'Đến ngày'},h('input',{type:'date',value:to,onChange:e=>setTo(e.target.value)})),h(F,{label:'Ca'},h('select',{value:shift,onChange:e=>setShift(e.target.value)},h('option',{value:'all'},'Tất cả ca'),h('option',{value:'night'},'Ca đêm'),h('option',{value:'afternoon'},'Ca chiều'))),h(F,{label:'Xưởng'},h('select',{value:workshop,onChange:e=>setWorkshop(e.target.value)},h('option',{value:'all'},'Tất cả xưởng'),h('option',{value:'bun'},'Xưởng bún'),h('option',{value:'banh'},'Xưởng bánh')))),h('button',{type:'button',disabled:busy,onClick:()=>setAttempt(n=>n+1)},'Tải lại báo cáo')),
    h('p',{className:'production-closing-help'},'Chỉ gồm ca đã chốt trên máy chủ. SL SX = đạt + lỗi; tỉ lệ lỗi = lỗi / tổng SX.'),busy&&h('p',{role:'status'},'Đang tải báo cáo…'),error&&h('p',{role:'alert'},error),!busy&&!error&&!visible.length&&h('p',null,'Chưa có ca đã chốt trong khoảng ngày này.'),
    visible.map(record=>{const s=record.snapshot;return h('div',{key:record.id,className:'card production-report-card'},h('div',{className:'production-report-title'},h('b',null,s.date.split('-').reverse().join('/')+' · '+(s.workshop==='bun'?'Xưởng bún':'Xưởng bánh')),h('span',{className:s.shift==='night'?'night':'afternoon'},s.shift==='night'?'Ca đêm':'Ca chiều')),
      h('div',{className:'production-closing-metrics'},...[['SL SX',s.totals.total,''],['SL SX đạt',s.totals.good,'good'],['SL lỗi',s.totals.loss,'bad']].map(([label,value,kind])=>h('div',{key:label,className:kind},h('small',null,label),h('b',null,fmt(value)+' kg'))),h('div',null,h('small',null,'Tỉ lệ lỗi'),h('b',null,Number(s.errorRate||0).toLocaleString('vi-VN',{maximumFractionDigits:2})+'%'))),
      h('p',null,'Phụ trách: '+s.responsible.name),h('p',{className:'production-closing-help'},'Nhóm xưởng: '+s.members.map(member=>member.name).join(' · ')),h('small',null,'Chốt lần '+record.revision+' · '+s.closedBy.name+' · '+new Date(s.closedAt).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'})),
      h('details',null,h('summary',null,'Chi tiết sản phẩm'),s.rows.map(row=>h('p',{key:row.productId,className:'production-closing-help'},row.productName+' · Đạt '+fmt(row.good)+' kg · Dư '+fmt(row.extra)+' kg · Lỗi '+fmt(row.loss)+' kg'))),record.history?.length>0&&h('details',null,h('summary',null,'Lịch sử chốt ('+record.history.length+')'),record.history.slice().reverse().map((entry,index)=>h('p',{key:index,className:'production-closing-help'},new Date(entry.closedAt).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'})+' · '+entry.closedBy.name+' · Tổng SX '+fmt(entry.totals.total)+' kg')))
    );})
  );
}
