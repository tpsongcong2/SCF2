// V881: Quy tắc chấm công (chỉ Admin).
// - Công thực tế lái xe: Admin sửa bảng quy tắc, Báo công lái xe áp dụng ngay (không cần sửa code).
// - Tiền công lái xe và chấm công sản xuất: quy tắc đang viết trong code; Admin ghi đề xuất thay đổi,
//   app lưu thành "Yêu cầu sửa code" để gửi người phát triển.
const SCF_WORK_RULE_SHIFT_MODES=[['all','Mọi chuyến'],['vp','Chuyến Vĩnh Phúc (VP…)'],['equals','Đúng tên ca'],['any','Ca có chứa (YP, QV…)'],['shift_points','Đúng tên ca + có đủ địa điểm']];
const SCF_DRIVER_TRIP_PAY_TEXT=[
  'Chuyến 0 kg không tính tiền công.',
  'Chuyến KV / Kho vận: 150.000 đ.',
  'Chuyến VP / Vĩnh Phúc: 150.000 đ.',
  'Chuyến ĐT / Điểm Thụy / Chị Hải: 100.000 đ.',
  'Chuyến YP / QV: chỉ giao một nơi (Yên Phong hoặc Quế Võ) 200.000 đ; ca YP QV giao cả hai nơi (hoặc không xác định được nơi giao) 250.000 đ.',
  'Các chuyến khác tính theo khối lượng giao: dưới 400 kg 100.000 đ; 400–600 kg 150.000 đ; 600–800 kg 200.000 đ; 800–1.000 kg 250.000 đ; 1.000–1.200 kg 300.000 đ; 1.200–1.500 kg 350.000 đ; trên 1.500 kg 400.000 đ.',
  'Khối lượng giao lấy theo SL giao cuối cùng (chưa ai sửa thì = SL đặt).'
];
const SCF_PRODUCTION_WORK_TEXT=[
  'Trang "Công sản xuất" chưa có quy tắc tính công riêng (đang phát triển).',
  'Chấm công khuôn mặt (Báo cáo chấm công) đang dùng các quy tắc:',
  'Ngày công = số ngày có lượt chấm công trong tháng.',
  'Tổng giờ = cộng thời gian từ lượt Vào đến lượt Ra kế tiếp (qua nửa đêm vẫn tính; một lượt quá 24 giờ bị bỏ).',
  'Tăng ca = phần giờ vượt độ dài ca làm việc của lượt Vào đó.',
  'Đi muộn = chấm Vào sau giờ bắt đầu ca; Về sớm = chấm Ra trước giờ kết thúc ca (không có ca thì dùng giờ bắt đầu/kết thúc chung trong Cài đặt chấm công).',
  'Tiền công = Tổng giờ × Lương giờ của nhân viên (nhập trong Cài đặt chấm công).'
];
function scfWorkRuleId(){return 'R'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function scfWorkRuleIssues(rules){
  const issues=[];
  (rules||[]).forEach((rule,index)=>{
    const label='Quy tắc '+(index+1)+': ';
    if(['equals','any','shift_points'].includes(rule.shiftMode)&&!String(rule.shiftText||'').trim())issues.push(label+'nhập tên ca.');
    if(rule.shiftMode==='shift_points'&&!scfDriverActualPayPointTokens(rule.pointsText).length)issues.push(label+'nhập địa điểm (VD: SC2+DBG+HKD Hường).');
    if(rule.kind==='day'){if(!(Number(rule.monthAmount)>0))issues.push(label+'nhập lương tháng.');if(!(Number(rule.days)>0))issues.push(label+'nhập số ngày công chuẩn.');if(!String(rule.driver||'').trim())issues.push(label+'quy tắc theo ngày công cần tên lái xe.');}
    else if(!(Number(rule.amount)>=0)||String(rule.amount??'')==='')issues.push(label+'nhập số tiền mỗi chuyến.');
  });
  return issues;
}
function WorkRulesTab({employees=[],trips=[],currentUser}){
  const isAdmin=['admin','administrator'].includes(String(currentUser?.role||'').toLowerCase());
  const[data,setData]=useState(null);const[draft,setDraft]=useState(null);const[busy,setBusy]=useState(false);
  const[requestText,setRequestText]=useState({});const[serverOk,setServerOk]=useState(true);
  useEffect(()=>{let active=true;scfLoadWorkRules().then(value=>{if(!active)return;setData(value);setServerOk(!!window.__SCF_WORK_RULES_SERVER_OK);});return()=>{active=false;};},[]);
  useEffect(()=>{if(typeof window.addEventListener!=='function')return;const receive=event=>{if(event.detail?.value)setData(event.detail.value);};window.addEventListener('scf-work-rules-reconciled',receive);return()=>window.removeEventListener('scf-work-rules-reconciled',receive);},[]);
  const driverNames=React.useMemo(()=>[...new Set([...(employees||[]).filter(e=>e?.role==='driver'||scfDriverPayNorm(e?.dept).includes('LAI XE')).map(e=>e.name),...(trips||[]).map(t=>t.driverName)].map(name=>String(name||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi')),[employees,trips]);
  if(!isAdmin)return h('div',{className:'card'},'Chỉ Admin được xem Quy tắc chấm công.');
  if(!data)return h('div',{className:'card',role:'status'},'Đang tải quy tắc chấm công…');
  const rules=draft||data.driverActualPay.rules;
  const pending=data.codeRequests.filter(item=>item.status!=='done');
  const save=async(next,message)=>{
    setBusy(true);
    try{const ok=await scfSaveWorkRules(next);setData(scfNormalizeWorkRules(next));window.showToast(ok?message:message+' Máy chủ chưa xác nhận, app sẽ tự đồng bộ lại.',ok?'success':'warn',8000);return true;}
    catch(error){window.showToast(error.message||'Chưa lưu được quy tắc.','error',10000);return false;}
    finally{setBusy(false);}
  };
  const update=(index,patch)=>setDraft(rules.map((rule,i)=>i===index?{...rule,...patch}:rule));
  const move=(index,step)=>{const next=[...rules],target=index+step;if(target<0||target>=next.length)return;[next[index],next[target]]=[next[target],next[index]];setDraft(next);};
  const saveRules=async()=>{
    const issues=scfWorkRuleIssues(rules);if(issues.length){window.showToast(issues.join(' '),'warn',10000);return;}
    const clean=rules.map(rule=>({id:rule.id||scfWorkRuleId(),driver:String(rule.driver||'').trim(),shiftMode:rule.shiftMode||'all',shiftText:String(rule.shiftText||'').trim(),...(rule.shiftMode==='shift_points'?{pointsText:String(rule.pointsText||'').trim()}:{}),kind:rule.kind==='day'?'day':'trip',...(rule.kind==='day'?{monthAmount:Number(rule.monthAmount)||0,days:Number(rule.days)||0}:{amount:Number(rule.amount)||0})}));
    if(await save({...data,driverActualPay:{rules:clean,updatedAt:fmtDT(),updatedBy:currentUser?.name||''}},'Đã lưu quy tắc Công thực tế. Báo công lái xe áp dụng ngay.'))setDraft(null);
  };
  const addRequest=async section=>{
    const text=String(requestText[section]||'').trim();if(!text){window.showToast('Nhập nội dung muốn thay đổi.','warn');return;}
    const entry={id:scfWorkRuleId(),section,text,status:'pending',at:fmtDT(),by:currentUser?.name||''};
    if(await save({...data,codeRequests:[...data.codeRequests,entry]},'Đã ghi yêu cầu.')){
      setRequestText(prev=>({...prev,[section]:''}));
      await window.scfConfirm?.('Thay đổi này cần SỬA CODE, app chưa tự áp dụng được. Hãy bấm "Sao chép" ở mục Yêu cầu sửa code và gửi cho người phát triển. Sau khi cập nhật bản mới, bấm "Đã sửa xong".','Cần sửa code');
    }
  };
  const markDone=item=>save({...data,codeRequests:data.codeRequests.map(row=>row.id===item.id?{...row,status:'done',doneAt:fmtDT(),doneBy:currentUser?.name||''}:row)},'Đã đánh dấu đã sửa xong.');
  const copy=async item=>{const text='Yêu cầu sửa code SCFOOD – '+item.section+' ('+item.at+', '+item.by+'):\n'+item.text;try{await navigator.clipboard.writeText(text);window.showToast('Đã sao chép yêu cầu.','success');}catch{window.prompt('Sao chép nội dung:',text);}};
  const textList=lines=>h('ol',{className:'work-rules-text'},lines.map((line,index)=>h('li',{key:index},line)));
  const requestBox=(section,placeholder)=>h('div',{className:'work-rules-request'},
    h('label',null,h('b',null,'Đề xuất thay đổi (cần sửa code)'),h('textarea',{rows:3,value:requestText[section]||'',placeholder,onChange:e=>setRequestText(prev=>({...prev,[section]:e.target.value})),disabled:busy||!serverOk,style:{width:'100%'}})),
    h('button',{type:'button',className:'bs','data-scf-action':'write',disabled:busy||!serverOk,onClick:()=>addRequest(section)},h('i',{className:'ti ti-code'}),' Gửi yêu cầu sửa code'));
  const money=value=>Number(value||0).toLocaleString('vi-VN');
  return h('div',{className:'work-rules-page'},
    h('div',{className:'ptitle'},h('i',{className:'ti ti-gavel',style:{fontSize:20}}),' Quy tắc chấm công'),
    !serverOk&&h('div',{className:'card',role:'alert',style:{borderColor:'#E0A800',background:'#FFF8E6'}},'Máy chủ chưa có kho Quy tắc chấm công nên đang hiện quy tắc mặc định và CHƯA LƯU được. Cần dán bản scf-auth V881 vào Supabase rồi tải lại trang.'),
    pending.length>0&&h('section',{className:'card',style:{borderColor:'#C0392B',background:'#FDF0EE'}},
      h('h3',null,h('i',{className:'ti ti-alert-triangle'}),' Có '+pending.length+' yêu cầu cần sửa code'),
      h('p',null,'Các thay đổi dưới đây app chưa tự áp dụng. Gửi nội dung cho người phát triển; khi đã cập nhật bản mới thì bấm "Đã sửa xong".'),
      pending.map(item=>h('div',{key:item.id,className:'work-rules-pending',style:{display:'flex',gap:8,alignItems:'flex-start',padding:'6px 0',borderTop:'1px solid var(--bd)'}},
        h('div',{style:{flex:1}},h('b',null,item.section),h('small',{style:{display:'block',color:'var(--tx2)'}},item.at+' · '+item.by),h('div',{style:{whiteSpace:'pre-wrap'}},item.text)),
        h('button',{type:'button',className:'bs',onClick:()=>copy(item)},h('i',{className:'ti ti-copy'}),' Sao chép'),
        h('button',{type:'button',className:'bs','data-scf-action':'write',disabled:busy,onClick:()=>markDone(item)},h('i',{className:'ti ti-check'}),' Đã sửa xong')))),
    h('section',{className:'card'},
      h('h3',null,'1. Quy tắc chấm công lái xe thực tế (cột Công thực tế)'),
      h('p',{className:'driver-report-note'},'Áp dụng quy tắc đầu tiên khớp theo thứ tự. Sửa bảng rồi bấm Lưu: Báo công lái xe áp dụng ngay, không cần sửa code. Số Admin đã nhập tay ở từng chuyến vẫn giữ nguyên.'+(data.driverActualPay.updatedAt?' Cập nhật: '+data.driverActualPay.updatedAt+' · '+data.driverActualPay.updatedBy:'')),
      textList([...scfDriverActualPayRuleList(data.driverActualPay.rules).map(rule=>scfDriverActualPayRuleText(rule)),'Các chuyến còn lại: bằng cột Tiền công.']),
      h('datalist',{id:'work-rules-drivers'},driverNames.map(name=>h('option',{key:name,value:name}))),
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['#','Lái xe (trống = mọi lái xe)','Áp dụng cho','Tên ca','Địa điểm (đủ tất cả)','Cách tính','Số tiền',''].map(label=>h('th',{key:label},label)))),
        h('tbody',null,rules.map((rule,index)=>h('tr',{key:rule.id||index},
          h('td',null,index+1),
          h('td',null,h('input',{list:'work-rules-drivers',value:rule.driver||'','aria-label':'Lái xe quy tắc '+(index+1),onChange:e=>update(index,{driver:e.target.value}),style:{minWidth:170}})),
          h('td',null,h('select',{value:rule.shiftMode||'all','aria-label':'Áp dụng cho quy tắc '+(index+1),onChange:e=>update(index,{shiftMode:e.target.value})},SCF_WORK_RULE_SHIFT_MODES.map(([value,label])=>h('option',{key:value,value},label)))),
          h('td',null,['equals','any','shift_points'].includes(rule.shiftMode)?h('input',{value:rule.shiftText||'','aria-label':'Tên ca quy tắc '+(index+1),placeholder:rule.shiftMode==='any'?'VD: YP QV':rule.shiftMode==='shift_points'?'VD: ĐT-2H01':'VD: SS S1',onChange:e=>update(index,{shiftText:e.target.value}),style:{width:110}}):'—'),
          h('td',null,rule.shiftMode==='shift_points'?h('input',{value:rule.pointsText||'','aria-label':'Địa điểm quy tắc '+(index+1),placeholder:'VD: SC2+DBG+HKD Hường',title:'Chuyến phải giao đủ mọi địa điểm, cách nhau bằng dấu +',onChange:e=>update(index,{pointsText:e.target.value}),style:{width:190}}):'—'),
          h('td',null,h('select',{value:rule.kind==='day'?'day':'trip','aria-label':'Cách tính quy tắc '+(index+1),onChange:e=>update(index,e.target.value==='day'?{kind:'day',monthAmount:rule.monthAmount||0,days:rule.days||26}:{kind:'trip',amount:rule.amount||0})},h('option',{value:'trip'},'Theo chuyến'),h('option',{value:'day'},'Theo ngày công'))),
          h('td',null,rule.kind==='day'
            ?h('span',{style:{display:'inline-flex',gap:4,alignItems:'center',flexWrap:'wrap'}},h('input',{type:'number',min:0,step:100000,value:rule.monthAmount??'','aria-label':'Lương tháng quy tắc '+(index+1),onChange:e=>update(index,{monthAmount:e.target.value}),style:{width:120}}),' / ',h('input',{type:'number',min:1,step:1,value:rule.days??'','aria-label':'Số ngày công quy tắc '+(index+1),onChange:e=>update(index,{days:e.target.value}),style:{width:60}}),h('small',null,'= '+money(scfDriverActualPayRuleDayAmount(rule))+' đ/công'))
            :h('input',{type:'number',min:0,step:10000,value:rule.amount??'','aria-label':'Số tiền quy tắc '+(index+1),onChange:e=>update(index,{amount:e.target.value}),style:{width:120}})),
          h('td',null,h('span',{style:{display:'inline-flex',gap:2}},
            h('button',{type:'button',className:'bi',title:'Lên',disabled:index===0,onClick:()=>move(index,-1)},h('i',{className:'ti ti-arrow-up'})),
            h('button',{type:'button',className:'bi',title:'Xuống',disabled:index===rules.length-1,onClick:()=>move(index,1)},h('i',{className:'ti ti-arrow-down'})),
            h('button',{type:'button',className:'bi',title:'Xóa quy tắc',onClick:()=>setDraft(rules.filter((_,i)=>i!==index))},h('i',{className:'ti ti-trash',style:{color:'#A32D2D'}}))))
        ))))),
      h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}},
        h('button',{type:'button',className:'bs',onClick:()=>setDraft([...rules,{id:scfWorkRuleId(),driver:'',shiftMode:'all',shiftText:'',kind:'trip',amount:0}])},h('i',{className:'ti ti-plus'}),' Thêm quy tắc'),
        h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:busy||!draft||!serverOk,onClick:saveRules},h('i',{className:'ti ti-device-floppy'}),' Lưu quy tắc'),
        draft&&h('button',{type:'button',className:'bs',disabled:busy,onClick:()=>setDraft(null)},'Bỏ thay đổi'),
        h('button',{type:'button',className:'bs',disabled:busy,onClick:()=>setDraft(JSON.parse(JSON.stringify(SCF_DRIVER_ACTUAL_PAY_DEFAULT_RULES)))},'Về quy tắc mặc định')),
      requestBox('Chấm công lái xe thực tế','Chỉ dùng khi bảng trên không diễn tả được, VD: "chuyến KV trên 1.000 kg cộng thêm 50k"')),
    h('section',{className:'card'},
      h('h3',null,'2. Quy tắc Tiền công lái xe (cột Tiền công)'),
      h('p',{className:'driver-report-note'},'Quy tắc này viết trong code. Muốn đổi thì ghi đề xuất bên dưới; app sẽ báo cần sửa code.'),
      textList(SCF_DRIVER_TRIP_PAY_TEXT),
      requestBox('Tiền công lái xe','VD: "Chuyến KV đổi thành 170.000 đ"')),
    h('section',{className:'card'},
      h('h3',null,'3. Quy tắc chấm công sản xuất'),
      h('p',{className:'driver-report-note'},'Quy tắc này viết trong code. Muốn đổi hoặc bổ sung thì ghi đề xuất bên dưới; app sẽ báo cần sửa code.'),
      textList(SCF_PRODUCTION_WORK_TEXT),
      requestBox('Chấm công sản xuất','VD: "Đi muộn quá 15 phút trừ nửa công"')),
    data.codeRequests.some(item=>item.status==='done')&&h('details',{className:'card'},h('summary',null,'Yêu cầu đã sửa xong ('+data.codeRequests.filter(item=>item.status==='done').length+')'),
      data.codeRequests.filter(item=>item.status==='done').map(item=>h('div',{key:item.id,style:{padding:'4px 0',borderTop:'1px solid var(--bd)'}},h('b',null,item.section),' · ',item.text,h('small',{style:{display:'block',color:'var(--tx2)'}},'Gửi '+item.at+' · '+item.by+' — Xong '+(item.doneAt||'')+' · '+(item.doneBy||'')))))
  );
}
