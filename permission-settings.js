/* Cấu hình quyền mặc định theo chức vụ. */
const SCF_PERMISSION_SECTIONS=[
  {sec:'Giới thiệu công ty',pages:[['company','Giới thiệu công ty']]},
  {sec:'Cài đặt',pages:[['appearance','Cài đặt giao diện'],['printtemplates','Mẫu in Excel'],['employees','Nhân viên'],['permission_settings','Cài đặt phân quyền'],['backup','Backup dữ liệu']]},
  {sec:'Nhân sự',pages:[['attendance','Chấm công'],['attendance_settings','Cài đặt chấm công'],['attendance_report','Báo cáo chấm công'],['advances','Ứng lương'],['rewards','Thưởng phạt'],['employee_errors','Ghi lỗi nhân viên'],['employee_uniforms','Cấp đồng phục nhân viên'],['leaves','Xin nghỉ'],['tasks','Giao việc']]},
  {sec:'Báo công & quy trình',pages:[['workreport_vp','Công kế toán'],['workreport_sx','Công sản xuất'],['workreport_lx','Công lái xe'],['workreport_total','Tổng công'],['process_accounting','Quy trình kế toán'],['process_bun','Quy trình sản xuất Bún'],['process_pho','Quy trình sản xuất Phở'],['process_banhcuon','Quy trình sản xuất Bánh cuốn']]},
  {sec:'Danh mục',pages:[['materials','Nguyên vật liệu'],['assets','Tài sản'],['garages','Gara ô tô'],['depts','Bộ phận'],['products','Sản phẩm'],['customers','Khách hàng'],['areas','Khu vực'],['prodshifts','Ca sản xuất'],['deliveryrules','Quy định giao hàng'],['workcats','Danh mục công việc'],['shifts','Ca giao hàng']]},
  {sec:'Bán hàng',pages:[['quotes','Báo giá'],['delivery','Đơn giao hàng'],['intem','In tem'],['orderdetail','Chi tiết đơn hàng'],['trips','Chuyến giao hàng'],['marketsales','Bán hàng chợ'],['powdersales','Bán bột bún']]},
  {sec:'Mua hàng & bảo dưỡng',pages:[['nccgoods','Nhà cung cấp hàng hóa'],['purchasegoods','Mua hàng hóa'],['fuelpurchases','Mua xăng dầu'],['utilityexpenses','Chi phí điện nước'],['maint_vehicle','Bảo dưỡng xe'],['maint_machine','Bảo dưỡng máy']]},
  {sec:'Sản xuất',pages:[['prodsummary','Tổng hợp sản xuất'],['prodorders','Đơn sản xuất'],['stock','Tồn kho']]},
  {sec:'Chung',pages:[['notifications','Thông báo'],['userguide','Hướng dẫn sử dụng']]}
];
const SCF_PERMISSION_PAGE_KEYS=[...new Set(SCF_PERMISSION_SECTIONS.flatMap(section=>section.pages.map(page=>page[0])))];
function scfProfile(id,label,role,dept,permissions,readOnly=[]){
  const ro=new Set(readOnly);
  return{id,label,role,dept,permissions:[...permissions],permLevels:Object.fromEntries(permissions.map(page=>[page,ro.has(page)?'r':(['admin','manager'].includes(role)?'rwd':'rw')]))};
}
const SCF_PROFILE_COMMON=['company','attendance','attendance_report','leaves','tasks','notifications','userguide'];
const DEFAULT_PERMISSION_PROFILES={
  admin:scfProfile('admin','Admin','admin','Ban Giám Đốc',SCF_PERMISSION_PAGE_KEYS.filter(page=>page!=='permission_settings')),
  director:scfProfile('director','Ban giám đốc','manager','Ban Giám Đốc',['company','appearance','printtemplates','employees','attendance','attendance_report','advances','rewards','employee_errors','employee_uniforms','leaves','tasks','workreport_vp','workreport_sx','workreport_lx','workreport_total','process_accounting','process_bun','process_pho','process_banhcuon','materials','assets','garages','depts','products','customers','areas','prodshifts','deliveryrules','workcats','shifts','quotes','delivery','intem','orderdetail','trips','marketsales','powdersales','nccgoods','purchasegoods','fuelpurchases','maint_vehicle','maint_machine','prodsummary','prodorders','stock','notifications','userguide'],['company','appearance','printtemplates','attendance_report','workreport_vp','workreport_sx','workreport_lx','workreport_total','materials','products','customers','orderdetail']),
  accounting_manager:scfProfile('accounting_manager','Quản lý kế toán','manager','Kế toán',[...SCF_PROFILE_COMMON,'advances','rewards','employee_errors','employee_uniforms','workreport_vp','workreport_total','process_accounting','materials','assets','products','customers','areas','deliveryrules','quotes','delivery','intem','orderdetail','trips','nccgoods','purchasegoods','fuelpurchases','marketsales','powdersales'],['attendance_report','workreport_total','materials','assets','products','customers','areas','orderdetail']),
  accounting_staff:scfProfile('accounting_staff','Nhân viên kế toán','staff','Kế toán',[...SCF_PROFILE_COMMON,'advances','rewards','workreport_vp','workreport_total','process_accounting','materials','products','customers','areas','deliveryrules','quotes','delivery','intem','orderdetail','trips','nccgoods','purchasegoods'],['attendance_report','workreport_total','materials','products','customers','areas','orderdetail']),
  production_manager:scfProfile('production_manager','Quản lý sản xuất','manager','Sản xuất',[...SCF_PROFILE_COMMON,'advances','rewards','employee_errors','employee_uniforms','workreport_sx','workreport_total','process_bun','process_pho','process_banhcuon','materials','assets','products','prodshifts','deliveryrules','workcats','intem','orderdetail','maint_machine','prodsummary','prodorders','stock'],['attendance_report','workreport_total','materials','assets','products','orderdetail']),
  production_staff:scfProfile('production_staff','Nhân viên sản xuất','staff','Sản xuất',[...SCF_PROFILE_COMMON,'workreport_sx','workreport_total','process_bun','process_pho','process_banhcuon','materials','products','deliveryrules','intem','orderdetail','maint_machine','prodsummary','prodorders','stock'],['attendance_report','workreport_total','materials','products','orderdetail']),
  driver:scfProfile('driver','Lái xe','driver','Lái xe',[...SCF_PROFILE_COMMON,'workreport_lx','workreport_total','deliveryrules','orderdetail','trips','fuelpurchases','maint_vehicle'],['attendance_report','workreport_total','deliveryrules','orderdetail'])
};
const PERMISSION_PROFILE_ORDER=['admin','director','accounting_manager','accounting_staff','production_manager','production_staff','driver'];
function normalizePermissionProfiles(value){
  const source=value&&typeof value==='object'?value:{};
  return Object.fromEntries(PERMISSION_PROFILE_ORDER.map(id=>{
    const base=DEFAULT_PERMISSION_PROFILES[id];const raw=source[id]||{};
    const permissions=(Array.isArray(raw.permissions)?raw.permissions:base.permissions).filter(page=>SCF_PERMISSION_PAGE_KEYS.includes(page)&&page!=='permission_settings');
    const levels={};permissions.forEach(page=>{const level=id==='admin'?'rwd':(raw.permLevels?.[page]||base.permLevels?.[page]||(base.role==='manager'?'rwd':'rw'));levels[page]=['r','rw','rwd'].includes(level)?level:'r';});
    return[id,{...base,permissions:[...new Set(permissions)],permLevels:levels}];
  }));
}
function normalizedPermissionProfileLabel(profiles,profileId){return normalizePermissionProfiles(profiles)[profileId]?.label||'';}
function applyPermissionProfile(employee,profiles,profileId){
  const profile=normalizePermissionProfiles(profiles)[profileId];
  if(!profile)return{...employee,permissionProfileId:''};
  if(profileId==='admin')return{...employee,permissionProfileId:profileId,dept:profile.dept,role:'admin',permissions:[],permLevels:{}};
  return{...employee,permissionProfileId:profileId,dept:profile.dept,role:profile.role,permissions:[...profile.permissions],permLevels:{...profile.permLevels}};
}
function PermissionSettingsTab({profiles,setProfiles,employees,setEmployees,currentUser}){
  const normalized=normalizePermissionProfiles(profiles);
  const[selected,setSelected]=useState(PERMISSION_PROFILE_ORDER[0]);
  const[draft,setDraft]=useState(()=>({...normalized[selected],permissions:[...normalized[selected].permissions],permLevels:{...normalized[selected].permLevels}}));
  useEffect(()=>{const next=normalizePermissionProfiles(profiles)[selected];setDraft({...next,permissions:[...next.permissions],permLevels:{...next.permLevels}});},[profiles,selected]);
  const fixedAdmin=selected==='admin';
  const setLevel=(page,level)=>{if(fixedAdmin)return;setDraft(prev=>{const permissions=level==='none'?prev.permissions.filter(item=>item!==page):[...new Set([...prev.permissions,page])];const permLevels={...prev.permLevels};if(level==='none')delete permLevels[page];else permLevels[page]=level;return{...prev,permissions,permLevels};});};
  const save=()=>{if(fixedAdmin){window.showToast('Admin luôn có toàn quyền và không cần lưu cấu hình.','info');return;}setProfiles(prev=>({...normalizePermissionProfiles(prev),[selected]:{...draft,permissions:[...draft.permissions],permLevels:{...draft.permLevels}}}));window.showToast('Đã lưu quyền mặc định cho '+draft.label+'.','success');};
  const reset=async()=>{const ok=window.scfConfirm?await window.scfConfirm('Khôi phục bộ quyền ban đầu của '+draft.label+'?','Khôi phục quyền'):window.confirm('Khôi phục quyền mặc định?');if(!ok)return;const base=DEFAULT_PERMISSION_PROFILES[selected];setDraft({...base,permissions:[...base.permissions],permLevels:{...base.permLevels}});};
  const assigned=(employees||[]).filter(employee=>employee.permissionProfileId===selected);
  const applyToAssigned=async()=>{if(!assigned.length)return;const ok=window.scfConfirm?await window.scfConfirm('Ghi đè quyền riêng của '+assigned.length+' nhân viên đang thuộc chức vụ này?','Áp dụng quyền'):window.confirm('Áp dụng cho nhân viên?');if(!ok)return;setEmployees(prev=>(prev||[]).map(employee=>employee.permissionProfileId===selected?{...applyPermissionProfile(employee,{...normalized,[selected]:draft},selected),updatedBy:currentUser?.name||'',updatedAt:fmtDT()}:employee));window.showToast('Đã áp dụng cho '+assigned.length+' nhân viên.','success');};
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-shield-lock'}),'Cài đặt phân quyền'),
    h('div',{style:{padding:'10px 12px',background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:'var(--r)',fontSize:13,marginBottom:14}},'Chọn chức vụ để đặt quyền mặc định. Khi chọn chức vụ trong hồ sơ nhân viên, hệ thống tự điền bộ phận, cấp quyền và quyền chi tiết; Admin vẫn có thể chỉnh riêng từng người.'),
    h('div',{style:{display:'grid',gridTemplateColumns:'minmax(220px,280px) minmax(0,1fr)',gap:14,alignItems:'start'}},
      h('div',{className:'card',style:{padding:10}},PERMISSION_PROFILE_ORDER.map(id=>{const profile=normalized[id];return h('button',{key:id,type:'button',onClick:()=>setSelected(id),className:selected===id?'bp':'',style:{width:'100%',justifyContent:'flex-start',marginBottom:6,padding:'10px 12px'}},profile.label);})),
      h('div',{className:'card'},
        h('div',{style:{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:12}},h('div',null,h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri)'}},draft.label),h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:3}},'Bộ phận: '+draft.dept+' · Cấp quyền: '+(ROLES[draft.role]||draft.role)+' · '+draft.permissions.length+' mục được truy cập'),fixedAdmin&&h('div',{style:{fontSize:12,color:'var(--pri)',fontWeight:600,marginTop:5}},'Admin là quyền quản trị cố định và luôn có toàn quyền.')),!fixedAdmin&&h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},h('button',{type:'button',onClick:reset},'Khôi phục mặc định'),h('button',{type:'button',className:'bp',onClick:save},h('i',{className:'ti ti-device-floppy'}),'Lưu cấu hình'))),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',gap:'0 18px'}},SCF_PERMISSION_SECTIONS.map(section=>h('div',{key:section.sec,style:{marginBottom:14}},h('div',{style:{fontSize:12,fontWeight:700,color:'var(--pri3)',textTransform:'uppercase',marginBottom:5}},section.sec),section.pages.filter(([page])=>page!=='permission_settings'&&page!=='backup'&&page!=='attendance_settings').map(([page,label])=>{const active=draft.permissions.includes(page);return h('div',{key:page,style:{display:'grid',gridTemplateColumns:'1fr 132px',alignItems:'center',gap:8,padding:'5px 6px',borderRadius:6,background:active?'var(--bg2)':'transparent'}},h('span',{style:{fontSize:13,color:active?'var(--tx)':'var(--tx2)'}},label),h('select',{disabled:fixedAdmin,value:active?(draft.permLevels[page]||'r'):'none',onChange:event=>setLevel(page,event.target.value),style:{fontSize:12,padding:'4px 6px',opacity:fixedAdmin?0.75:1}},h('option',{value:'none'},'Không truy cập'),h('option',{value:'r'},'Chỉ xem'),h('option',{value:'rw'},'Thêm + Xem + Sửa'),h('option',{value:'rwd'},'Thêm + Xem + Sửa + Xóa')));})))),
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,borderTop:'1px solid var(--bd)',paddingTop:12,marginTop:4,flexWrap:'wrap'}},h('span',{style:{fontSize:12,color:'var(--tx2)'}},assigned.length+' nhân viên đang dùng chức vụ này.'),h('button',{type:'button',disabled:!assigned.length,onClick:applyToAssigned},'Áp dụng lại cho nhân viên thuộc chức vụ này'))
      )
    )
  );
}
