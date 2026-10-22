/* Private personnel profiles are loaded only on this page, never into local storage. */
async function scfPersonnelRequest(operation,params={}){
  const {data,error}=await invokeScfAuth({body:{action:'personnel_profiles',operation,...params}},45000);
  if(error||data?.error){
    let message=data?.error||error?.message||'Chưa kết nối được hồ sơ nhân sự.';
    try{const body=await error?.context?.json();if(body?.error)message=body.error;}catch{}
    throw Error(message);
  }
  return data;
}
function scfPersonnelBase(employee,record){
  return {name:employee.name||'',birthday:employee.birthday||'',phone:employee.phone||'',identityNumber:'',address:employee.address||'',startDate:employee.startDate||'',endDate:employee.endDate||'',department:employeeDepartmentLabel(employee),bhxh:employee.bhxh===true,insuranceNumber:'',frontPath:'',backPath:'',...(record?.profile||{})};
}
function scfPersonnelDateKey(value){
  const text=String(value||'').trim(),vn=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const iso=vn?vn[3]+'-'+vn[2].padStart(2,'0')+'-'+vn[1].padStart(2,'0'):text;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
  const d=new Date(iso+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===iso?iso:'';
}
function scfPersonnelRows(employees,records,filters){
  const byId=new Map((records||[]).map(r=>[String(r.employee_id),r]));
  const plain=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
  return (employees||[]).filter(e=>!['admin','administrator'].includes(String(e.role||'').toLowerCase())).map(employee=>({employee,record:byId.get(String(employee.id)),profile:scfPersonnelBase(employee,byId.get(String(employee.id)))})).filter(({employee,profile})=>{
    if(filters.query&&!plain([employee.id,profile.name,profile.phone].join(' ')).includes(plain(filters.query)))return false;
    if(filters.department&&![profile.department,...employeeDepartments(employee)].includes(filters.department))return false;
    const day=scfPersonnelDateKey(profile[filters.dateField]);
    if(filters.mode==='day'&&filters.date&&day!==filters.date)return false;
    if(filters.mode==='month'&&filters.month&&day.slice(0,7)!==filters.month)return false;
    if(filters.mode==='range'&&((filters.from&&(!day||day<filters.from))||(filters.to&&(!day||day>filters.to))))return false;
    return true;
  }).sort((a,b)=>String(a.profile.name).localeCompare(String(b.profile.name),'vi'));
}
function PersonnelProfileForm({employee,record,currentUser,depts,onSave,onClose}){
  const [draft,setDraft]=useState(()=>scfPersonnelBase(employee,record)),[version,setVersion]=useState(record?.version||0);
  const [photos,setPhotos]=useState({}),[status,setStatus]=useState('loading'),[error,setError]=useState('');
  const active=React.useRef(true),busy=React.useRef(false);
  const canEdit=canWrite(currentUser.role,'personnel',currentUser.permLevels);
  useEffect(()=>{let alive=true;active.current=true;scfPersonnelRequest('detail',{employeeId:employee.id}).then(data=>{if(alive){setDraft(scfPersonnelBase(employee,data.record));setVersion(data.record?.version||0);setPhotos(data.photos||{});setStatus('ready');}}).catch(e=>{if(alive){setError(e.message);setStatus('failed');}});return()=>{alive=false;active.current=false;};},[employee.id]);
  const set=(field,value)=>setDraft(previous=>({...previous,[field]:value}));
  const close=()=>{if(!busy.current)onClose();};
  const upload=(side,source)=>scfPickPhoto(async file=>{
    if(!file||!canEdit||busy.current||status!=='ready')return;
    busy.current=true;setStatus('uploading');setError('');
    try{
      const prepared=await resizeImageFile(file,1600,.82);
      if(!active.current)return;
      const result=await scfPersonnelRequest('upload',{employeeId:employee.id,side,image:prepared.dataUrl});
      if(active.current){set(side+'Path',result.path);setPhotos(previous=>({...previous,[side]:result.url}));}
    }catch(e){if(active.current)setError(e.message);}finally{busy.current=false;if(active.current)setStatus('ready');}
  },source);
  const save=async()=>{
    if(!canEdit||busy.current||status!=='ready')return;
    busy.current=true;setStatus('saving');setError('');
    try{const result=await scfPersonnelRequest('save',{employeeId:employee.id,profile:draft,version});if(active.current)onSave(result.record);}
    catch(e){if(active.current){setError(e.message);setStatus('ready');}}finally{busy.current=false;}
  };
  const fields=[['name','HỌ VÀ TÊN','text'],['birthday','NGÀY SINH','text'],['phone','SỐ ĐT','tel'],['identityNumber','SỐ CCCD','text'],['address','ĐỊA CHỈ','text'],['startDate','NGÀY VÀO LÀM','date'],['endDate','NGÀY NGHỈ','date']];
  const disabled=!canEdit||status!=='ready';
  const departments=[...new Set([...(depts||[]).map(d=>typeof d==='string'?d:d.name),...employeeDepartments(employee),draft.department].filter(Boolean))];
  return h(Modal,{title:'Thông tin nhân sự · '+employee.id,lg:true,className:'personnel-profile-modal',onClose:close},
    h('p',{className:'personnel-profile-intro'},'Mã nhân sự: '+employee.id),
    status==='loading'&&h('p',{role:'status'},'Đang tải hồ sơ…'),
    error&&h('p',{role:'alert',className:'personnel-error'},error),
    h('div',{className:'personnel-form-grid'},...fields.map(([field,label,type])=>h('label',{key:field},h('span',null,label),h('input',{type,'aria-label':label,autoComplete:'off',value:type==='date'?scfPersonnelDateKey(draft[field]):draft[field]||'',disabled,placeholder:field==='birthday'?'dd/mm/yyyy hoặc yyyy':undefined,inputMode:field==='identityNumber'?'numeric':undefined,onChange:e=>set(field,e.target.value)}))),
      h('label',null,h('span',null,'BỘ PHẬN'),h('select',{'aria-label':'BỘ PHẬN',disabled,value:draft.department,onChange:e=>set('department',e.target.value)},h('option',{value:''},'Chọn bộ phận'),departments.map(name=>h('option',{key:name,value:name},name)))),
      h('label',{className:'personnel-insurance'},h('input',{type:'checkbox','aria-label':'BHXH',checked:draft.bhxh,disabled,onChange:e=>set('bhxh',e.target.checked)}),'Tham gia BHXH'),
      h('label',null,h('span',null,'MÃ SỐ BHXH'),h('input',{'aria-label':'MÃ SỐ BHXH',autoComplete:'off',value:draft.insuranceNumber||'',disabled,onChange:e=>set('insuranceNumber',e.target.value)}))
    ),
    h('div',{className:'personnel-document-grid'},...['front','back'].map(side=>h('section',{key:side},h('b',null,side==='front'?'ẢNH MẶT TRƯỚC':'ẢNH MẶT SAU'),photos[side]?h('a',{href:photos[side],target:'_blank',rel:'noopener noreferrer'},h('img',{src:photos[side],alt:side==='front'?'CCCD mặt trước':'CCCD mặt sau','data-scf-photo-refreshing':'1'})):h('p',null,draft[side+'Path']?'Ảnh chưa tải được. Đóng và mở lại hồ sơ để tải ảnh.':'Chưa có ảnh'),canEdit&&h('div',{className:'personnel-photo-actions'},h('button',{type:'button',disabled,onClick:()=>upload(side,'camera')},'Chụp ảnh'),h('button',{type:'button',disabled,onClick:()=>upload(side,'upload')},'Chọn ảnh'))))),
    (status==='uploading'||status==='saving')&&h('p',{role:'status'},status==='uploading'?'Đang tải ảnh…':'Đang lưu hồ sơ…'),
    h('div',{className:'form-actions'},h('button',{type:'button',disabled:busy.current,onClick:close,'data-scf-action':'view'},'Đóng'),canEdit&&h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:status!=='ready',onClick:save},'Lưu hồ sơ'))
  );
}
function PersonnelInformationTab({employees,currentUser,depts=[]}){
  const [records,setRecords]=useState([]),[status,setStatus]=useState('loading'),[error,setError]=useState(''),[selected,setSelected]=useState(''),[attempt,setAttempt]=useState(0);
  const [filters,setFilters]=useState({query:'',department:'',dateField:'startDate',mode:'all',date:isoDate(),month:isoDate().slice(0,7),from:'',to:''});
  useEffect(()=>{let active=true;setStatus('loading');setError('');scfPersonnelRequest('list').then(data=>{if(active){setRecords(data.records||[]);setStatus('ready');}}).catch(e=>{if(active){setError(e.message);setStatus('failed');}});return()=>{active=false;};},[attempt,currentUser.id]);
  const set=(key,value)=>setFilters(previous=>({...previous,[key]:value}));
  const rows=scfPersonnelRows(employees,records,filters);
  const options=[...new Set((employees||[]).filter(e=>!['admin','administrator'].includes(String(e.role||'').toLowerCase())).flatMap(employeeDepartments).concat(records.map(r=>r.profile?.department)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const chosen=(employees||[]).find(e=>String(e.id)===selected&&!['admin','administrator'].includes(String(e.role||'').toLowerCase()));
  return h('div',{className:'personnel-page'},h('div',{className:'ptitle'},'Thông tin nhân sự'),
    h('div',{className:'card personnel-filters'},
      h('label',null,'Tìm nhân sự',h('input',{'aria-label':'Tìm nhân sự',value:filters.query,placeholder:'Tên, mã nhân sự, số điện thoại…',onChange:e=>set('query',e.target.value)})),
      h('label',null,'Bộ phận',h('select',{'aria-label':'Lọc bộ phận',value:filters.department,onChange:e=>set('department',e.target.value)},h('option',{value:''},'Bộ phận'),options.map(value=>h('option',{key:value,value},value)))),
      h('label',null,'Lọc theo',h('select',{'aria-label':'Loại ngày',value:filters.dateField,onChange:e=>set('dateField',e.target.value)},...[['startDate','Ngày vào làm'],['birthday','Ngày sinh'],['endDate','Ngày nghỉ']].map(([value,label])=>h('option',{key:value,value},label)))),
      h('label',null,'Thời gian',h('select',{'aria-label':'Thời gian',value:filters.mode,onChange:e=>set('mode',e.target.value)},...[['all','Không giới hạn'],['day','Theo ngày'],['month','Theo tháng'],['range','Khoảng ngày']].map(([value,label])=>h('option',{key:value,value},label)))),
      filters.mode==='day'&&h('label',null,'Ngày',h('input',{type:'date','aria-label':'Ngày lọc',value:filters.date,onChange:e=>set('date',e.target.value)})),
      filters.mode==='month'&&h('label',null,'Tháng',h('input',{type:'month','aria-label':'Tháng lọc',value:filters.month,onChange:e=>set('month',e.target.value)})),
      filters.mode==='range'&&h(React.Fragment,null,h('label',null,'Từ ngày',h('input',{type:'date','aria-label':'Từ ngày',value:filters.from,onChange:e=>set('from',e.target.value)})),h('label',null,'Đến ngày',h('input',{type:'date','aria-label':'Đến ngày',value:filters.to,onChange:e=>set('to',e.target.value)})))
    ),
    status==='loading'&&h('p',{role:'status'},'Đang tải thông tin nhân sự…'),
    error&&h('div',{className:'card'},h('p',{role:'alert',className:'personnel-error'},error),h('button',{type:'button',onClick:()=>setAttempt(v=>v+1)},'Thử tải lại')),
    h('p',null,rows.length+' nhân sự · Bấm vào một người để mở hồ sơ'),
    h('div',{className:'personnel-list'},...rows.map(({employee,profile})=>h('button',{key:employee.id,type:'button',className:'personnel-person','data-scf-action':'view',disabled:status!=='ready',onClick:()=>setSelected(String(employee.id))},h('div',null,h('b',null,profile.name),h('small',null,employee.id+' · '+(profile.department||'Chưa có bộ phận'))),h('div',null,h('span',null,profile.phone||'Chưa có SĐT'),h('small',null,'Vào làm: '+(fmtAnyDate(profile.startDate)||'—'))),h('span',{className:'badge'},profile.bhxh?'BHXH: Có':'BHXH: Chưa')))),
    rows.length===0&&h('div',{className:'empty-st'},'Không có nhân sự phù hợp bộ lọc.'),
    chosen&&h(PersonnelProfileForm,{key:chosen.id,employee:chosen,record:records.find(r=>String(r.employee_id)===selected),currentUser,depts,onClose:()=>setSelected(''),onSave:record=>{setRecords(previous=>[...previous.filter(r=>r.employee_id!==record.employee_id),record]);setSelected('');window.showToast('Đã lưu hồ sơ nhân sự trên máy chủ.','success');}})
  );
}
