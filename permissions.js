const SCF_ORDER_NOTICE_OPTIONS=[['bun','Đơn xưởng bún'],['banh','Đơn xưởng bánh'],['qtyInvoice','SL HĐ'],['qtyProd','SL đặt'],['qtyDelivered','SL giao']];
function normalizedOrderNoticePermissions(employee){
  const text=String([employee?.role,employee?.dept,...(employee?.departments||[])].join(' ')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const finance=['admin','administrator'].includes(employee?.role)||/ke toan|account/.test(text);
  const defaults={bun:true,banh:true,qtyInvoice:finance,qtyProd:true,qtyDelivered:finance};
  return Object.fromEntries(SCF_ORDER_NOTICE_OPTIONS.map(([key])=>[key,typeof employee?.orderNoticePermissions?.[key]==='boolean'?employee.orderNoticePermissions[key]:defaults[key]]));
}
function OrderNoticePermissionFields({employee,onChange,disabled=false}){
  const value=normalizedOrderNoticePermissions(employee);
  return h('fieldset',{style:{border:'1px solid var(--bd)',borderRadius:8,padding:10,margin:'10px 0'}},
    h('legend',null,'Nhận thông báo thay đổi đơn hàng'),
    h('div',{style:{display:'flex',gap:14,flexWrap:'wrap'}},SCF_ORDER_NOTICE_OPTIONS.map(([key,label])=>h('label',{key,style:{display:'flex',gap:6,alignItems:'center'}},h('input',{type:'checkbox',disabled,checked:value[key],onChange:e=>onChange({...value,[key]:e.target.checked})}),label))),
    h('small',null,'Chọn xưởng được nhận và loại số lượng cần báo. Đổi địa điểm, giờ, chú ý vẫn báo trong xưởng đã chọn. Lái xe chỉ nhận đơn thuộc chuyến của mình.'));
}
/* --- Phân quyền menu --- */
const PAGE_ACCESS = {
  kpi4p:['admin'],
  kpi4p_manage:['admin'],
  kpi4p_approve:['admin'],
  kpi4p_settings:['admin'],
  payroll4p:['admin'],
  payroll4p_approve:['admin'],
  attp_process:['admin','manager','staff'],
  attp_standards:['admin','manager','staff'],
  attp_claims:['admin','manager','staff'],
  attp_daily:['admin','manager','staff'],
  attp_legal:['admin','manager','staff'],
  welcome:      ['admin','manager','staff','driver'],
  company:      ['admin','manager','staff','driver'],
  appearance:   ['admin','manager'],
  printtemplates:['admin','manager'],
  employees:    ['admin','manager'],
  personnel:['admin'],
  permission_settings:['admin'],
  attendance:   ['admin','manager','staff','driver'],
  attendance_settings:['admin'],
  attendance_report:['admin','manager','staff','driver'],
  advances:     ['admin','manager','staff','driver'],
  rewards:      ['admin','manager','staff','driver'],
  employee_errors:['admin','manager'],
  employee_uniforms:['admin','manager'],
  leaves:       ['admin','manager','staff','driver'],
  backup:       ['admin'],
  materials:    ['admin','manager','staff'],
  assets:       ['admin','manager','staff'],
  garages:      ['admin','manager'],
  depts:        ['admin','manager'],
  products:     ['admin','manager','staff'],
  customers:    ['admin','manager','staff'],
  areas:        ['admin','manager','staff'],
  prodshifts:   ['admin','manager','staff'],
  deliveryrules:['admin','manager','staff','driver'],
  workcats:     ['admin','manager'],
  tasks:        ['admin','manager','staff','driver'],
  notifications:['admin','manager','staff','driver'],
  userguide:     ['admin','manager','staff','driver'],
  workreport_vp:['admin','manager','staff'],
  workreport_sx:['admin','manager','staff'],
  workreport_lx:['admin','manager','staff','driver'],
  workreport_total:['admin','manager','staff','driver'],
  process_accounting:['admin','manager','staff'],
  process_bun:['admin','manager','staff'],
  process_pho:['admin','manager','staff'],
  process_banhcuon:['admin','manager','staff'],
  shifts:        ['admin','manager','staff'],
  quotes:       ['admin','manager','staff'],
  delivery:     ['admin','manager','staff'],
  intem:        ['admin','manager','staff'],
  orderdetail:  ['admin','manager','staff','driver'],
  trips:        ['admin','manager','driver'],
  prodsummary:  ['admin','manager','staff'],
  prodbom:      ['admin','manager'],
  prodreport:   ['admin'],
  prodorders:   ['admin','manager','staff'],
  stock:        ['admin','manager','staff'],
  purchase:     ['admin','manager'],
  nccs:         ['admin'],
  nccgoods:     ['admin'],
  purchaseorders:['admin'],
  purchasegoods:['admin','manager'],
  fuelpurchases:['admin','manager','driver'],
  utilityexpenses:['admin'],
  fuelreport:['admin','manager'],
  purchasereport:['admin'],
  maintreport:['admin','manager'],
  materialusage:['admin','manager','staff'],
  powderdebtreport:['admin','manager','staff'],
  syncreport:['admin','manager'],
  dbusage:['admin'],
  maint_vehicle:['admin','manager','staff'],
  maint_machine:['admin','manager','staff'],
  salesreport:  ['admin','manager','staff'],
  cashflowreport:['admin','manager'],
  marketsales:  ['admin','manager','staff'],
  invoicereport:['admin','manager','staff'],
  powdersales:  ['admin','manager','staff'],
  deliverysequence:['admin','manager','staff'],
};
// Default permissions by role
function roleDefaults(role) {
  return Object.keys(PAGE_ACCESS).filter(p => PAGE_ACCESS[p].includes(role));
}
// canAccess checks employee's custom permissions first, else falls back to role
function canAccess(role, page, perms, dept='') {
  if(['kpi4p','kpi4p_manage','kpi4p_approve','kpi4p_settings','payroll4p','payroll4p_approve'].includes(page))return ['admin','administrator'].includes(String(role||'').trim().toLowerCase());
  // Báo cáo sử dụng Supabase chứa thông tin hạ tầng và hạn mức của công ty.
  // Không cho quyền tùy chỉnh của nhân viên/quản lý mở trang này.
  if(page==='dbusage')return role==='admin';
  const faceMaskPages=['permission_settings','materials','workreport_total','nccs','purchaseorders','utilityexpenses','cashflowreport','salesreport','fuelreport','purchasereport','maintreport','materialusage','syncreport','dbusage'];
  const sharedVariantPages=['employees'];
  const isFaceMask=window.SCF_APP_VARIANT==='face-mask';
  if(isFaceMask&&!faceMaskPages.includes(page)&&!sharedVariantPages.includes(page))return false;
  if(!isFaceMask&&faceMaskPages.includes(page))return false;
  // Trang đầu là điểm quay lại chung, kể cả khi nhân viên dùng bộ quyền riêng.
  if(page==='welcome')return ['admin','manager','staff','driver'].includes(role);
  if(page==='personnel'&&role==='admin')return true;
  if(page==='permission_settings')return role==='admin';
  const deptText=(Array.isArray(dept)?dept:[dept]).map(value=>String(value||'')).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const isAccounting=deptText.includes('ke toan');
  const isDriverDepartment=deptText.includes('lai xe');
  if(page==='garages'&&role==='admin') return true;
  if(page==='deliveryrules') return true;
  // Admin luôn được quản trị lỗi nhân viên. Quản lý phải tuân theo quyền
  // được cấu hình riêng; nếu `employee_errors` không có trong `perms` thì
  // menu và trang đều phải bị chặn.
  if(page==='employee_errors'&&role==='admin') return true;
  if(page==='notifications') return ['admin','manager','staff','driver'].includes(role);
  if(page==='userguide') return ['admin','manager','staff','driver'].includes(role);
  if(page==='company') return ['admin','manager','staff','driver'].includes(role);
  if(page==='trips'&&(role==='admin'||isAccounting||isDriverDepartment)) return true;
  if(page==='fuelpurchases'&&isDriverDepartment) return true;
  if(['nccgoods','purchasegoods'].includes(page)&&(role==='admin'||isAccounting)) return true;
  if(['nccs','purchaseorders','utilityexpenses','purchasereport'].includes(page)&&role!=='admin') return false;
  if(page==='utilityexpenses'&&role==='admin') return true;
  const allowed = PAGE_ACCESS[page];
  if (!allowed) return false;
  if (perms && perms.length > 0) {
    // Tài khoản cũ chưa có khóa quyền mới: kế thừa quyền xem Đơn giao hàng.
    if(page==='invoicereport'&&perms.includes('delivery')) return true;
    if(page==='purchasegoods'&&perms.includes('purchaseorders')) return true;
    if(page==='nccgoods'&&perms.includes('nccs')) return true;
    if(page==='attendance_report'&&perms.includes('attendance')) return true;
    if(page==='attendance_settings'&&role==='admin'&&perms.includes('attendance')) return true;
    return perms.includes(page);
  }
  return allowed.includes(role);
}
// Mức quyền: 'r'=chỉ xem, 'rw'=xem+sửa, 'rwd'=xem+sửa+xóa
function getLvl(role, page, lvls) {
  // Giới thiệu công ty là mục chung; nhân viên và lái xe chỉ được xem.
  if (page === 'company' && !['admin','manager'].includes(role)) return 'r';
  // Lái xe được tạo và cập nhật đơn xăng dầu của chính mình, nhưng không được xóa.
  if (role === 'driver' && page === 'fuelpurchases') return 'rw';
  if (role === 'driver' && page === 'trips') return 'rw';
  if (lvls && lvls[page]) return lvls[page];
  // Mặc định theo role
  if (role === 'admin') return 'rwd';
  if (role === 'manager') return 'rwd';
  if (role === 'staff') return 'rw';
  if (role === 'driver') return 'r';
  return 'r';
}
function canWrite(role, page, lvls) { const l=getLvl(role,page,lvls); return l==='rw'||l==='rwd'; }
function canDel(role, page, lvls)   { return getLvl(role,page,lvls)==='rwd'; }
function canViewDeliveryQuantityTotals(user={}){
  return ['admin','administrator'].includes(String(user?.role||'').trim().toLowerCase())||user?.deliveryQuantityTotals===true;
}
function DeliveryQuantityTotalsPermissionField({employee,onChange,disabled=false}){
  const admin=['admin','administrator'].includes(String(employee?.role||'').trim().toLowerCase());
  return h('label',{style:{display:'flex',alignItems:'center',gap:8,fontSize:12,padding:'7px 8px',background:'#fff',border:'1px solid var(--bd)',borderRadius:6}},
    h('input',{type:'checkbox',disabled:disabled||admin,checked:canViewDeliveryQuantityTotals(employee),onChange:event=>onChange(event.target.checked)}),
    'Xem tổng SL HĐ, SL Đặt, SL giao dưới tiêu đề Đơn hàng');
}

// Quyền nút trên điện thoại bổ sung cho quyền trang/nghiệp vụ hiện có.
// Tài khoản cũ chưa cấu hình giữ cách hiển thị hiện tại.
const SCF_MOBILE_PERMISSION_GROUPS=[
  {label:'Truy cập từ thanh dưới điện thoại',options:[['welcome','Thời tiết'],['delivery','Đơn giao hàng'],['trips','Chuyến giao hàng'],['attendance','Chấm công'],['prodsummary','SX · Tổng hợp sản xuất'],['quick-summary','Đơn tổng'],['more','Thêm · Danh sách chức năng']]},
  {label:'Tính năng chuyến giao trên điện thoại',options:[['tripSummary','Xem ảnh đơn tổng'],['tripUpdate','Cập nhật SL giao và HĐ'],['tripPrint','In đơn'],['tripInvoices','Hiện ảnh hóa đơn'],['tripImage','Tạo ảnh chuyến']]}
];
function canMobileFeature(user,key){
  if(['admin','administrator'].includes(String(user?.role||'').toLowerCase()))return true;
  return user?.mobilePermissions?.[key]!==false;
}
function normalizedMobilePermissions(user={}){
  return Object.fromEntries(SCF_MOBILE_PERMISSION_GROUPS.flatMap(group=>group.options.map(([key])=>[key,canMobileFeature(user,key)])));
}
function scfMobileStartOptions(user={}){
  const departments=employeeDepartments(user);
  const pages=[['welcome','Thời tiết'],...SCF_PERMISSION_SECTIONS.flatMap(section=>section.pages)];
  const options=[...new Map(pages.filter(([key])=>canAccess(user.role,key,user.permissions,departments)&&canMobileFeature(user,key)).map(item=>[item[0],item])).values()];
  if(canMobileFeature(user,'quick-summary')&&typeof canViewTripQuickSummary==='function'&&canViewTripQuickSummary(user))options.push(['quick-summary','Đơn tổng · Xem nhanh']);
  return options;
}
function scfMobileStartTarget(user={}){
  const requested=String(user?.mobileStartPage||'').trim();
  if(!requested)return '';
  return scfMobileStartOptions(user).some(([key])=>key===requested)?requested:'welcome';
}
function MobilePermissionFields({employee,onChange,onStartPageChange,disabled=false}){
  return h('div',{className:'mobile-permission-settings',style:{border:'1px solid var(--bd)',borderRadius:'var(--r)',padding:10,margin:'10px 0',background:'var(--bg2)'}},
    h('b',null,'Phân quyền giao diện điện thoại'),
    h('div',{style:{fontSize:12,color:'var(--tx2)',margin:'6px 0'}},'Tích để hiện nút và cho phép mở tính năng. Vẫn cần quyền truy cập trang và quyền nghiệp vụ tương ứng ở phía trên.'),
    onStartPageChange&&h('label',{style:{display:'grid',gap:6,fontSize:12,fontWeight:600,margin:'12px 0'}},'Màn hình đầu tiên khi truy cập trên điện thoại',
      h('select',{'aria-label':'Màn hình đầu tiên trên điện thoại',disabled,value:scfMobileStartTarget(employee),onChange:event=>onStartPageChange(event.target.value)},
        h('option',{value:''},'Theo lần truy cập trước (mặc định)'),scfMobileStartOptions(employee).map(([key,label])=>h('option',{key,value:key},label))
      )
    ),
    SCF_MOBILE_PERMISSION_GROUPS.map(group=>h('div',{key:group.label,style:{marginTop:10}},
      h('div',{style:{fontWeight:600,fontSize:12,marginBottom:6}},group.label),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:6}},group.options.map(([key,label])=>h('label',{key,style:{display:'flex',gap:8,alignItems:'center',padding:'7px 8px',background:'#fff',border:'1px solid var(--bd)',borderRadius:6,fontSize:12}},
        h('input',{type:'checkbox',disabled,checked:canMobileFeature(employee,key),style:{width:18,height:18,minHeight:18,flex:'0 0 18px',padding:0,margin:0,accentColor:'var(--pri)'},onChange:event=>onChange({...normalizedMobilePermissions(employee),[key]:event.target.checked})}),label
      )))
    ))
  );
}

// Quyền nghiệp vụ bên trong trang Chuyến giao hàng. Không dùng chung
// mức rw/rwd của trang vì người lập chuyến, lái xe và kế toán có
// trách nhiệm khác nhau.
const SCF_TRIP_PERMISSION_OPTIONS=[
  ['manage','Tạo và sửa thông tin chuyến'],
  ['editOrders','Sửa đơn hàng trong chuyến'],
  ['delete','Xóa chuyến'],
  ['dispatch','Giao / thu hồi chuyến của lái xe'],
  ['orderActualQty','Nhập / sửa SL thực giao ở Đơn hàng'],
  ['actualQty','Nhập / sửa SL thực giao ở Chuyến giao hàng'],
  ['invoiceQty','Sửa SL hóa đơn trong cập nhật chuyến'],
  ['driverWorkflow','Lái xe nhận chuyến, tải HĐ đơn và báo hoàn thành'],
  ['summaryInvoice','Tải hóa đơn tổng chuyến'],
  ['review','Duyệt hóa đơn và hoàn thành chuyến']
];
function defaultTripPermissions(user={}){
  const role=String(user?.role||'').trim().toLowerCase();
  const isAdmin=['admin','administrator'].includes(role),isDriver=role==='driver'||employeeHasDepartment(user,'Lái xe'),isAccounting=employeeDepartmentIncludes(user,'Kế toán');
  if(isAdmin)return{manage:true,editOrders:true,delete:true,dispatch:true,actualQty:true,orderActualQty:true,invoiceQty:true,driverWorkflow:true,summaryInvoice:true,review:true};
  if(isDriver)return{manage:false,editOrders:false,delete:false,dispatch:false,actualQty:true,orderActualQty:true,invoiceQty:isAccounting,driverWorkflow:true,summaryInvoice:true,review:false};
  const pageWrite=canWrite(role,'trips',user?.permLevels),pageDelete=canDel(role,'trips',user?.permLevels);
  return{
    manage:pageWrite,
    editOrders:pageWrite&&isAccounting,
    delete:pageDelete,
    dispatch:pageWrite&&(isAccounting||role==='manager'),
    actualQty:false,
    orderActualQty:false,
    invoiceQty:isAccounting,
    driverWorkflow:false,
    summaryInvoice:pageWrite&&isAccounting,
    review:pageWrite&&(isAccounting||role==='manager')
  };
}
function normalizedTripPermissions(user={}){
  const defaults=defaultTripPermissions(user),configured=user?.tripPermissions;
  if(!configured||typeof configured!=='object')return defaults;
  return Object.fromEntries(SCF_TRIP_PERMISSION_OPTIONS.map(([key])=>[key,Object.prototype.hasOwnProperty.call(configured,key)?configured[key]===true:(key==='orderActualQty'&&Object.prototype.hasOwnProperty.call(configured,'actualQty')?configured.actualQty===true:defaults[key])]));
}
function canTripAction(user,action){
  if(['admin','administrator'].includes(String(user?.role||'').trim().toLowerCase()))return true;
  if(!canAccess(user?.role,action==='orderActualQty'?'delivery':'trips',user?.permissions,user?.departments?.length?user.departments:user?.dept))return false;
  return normalizedTripPermissions(user)[action]===true;
}
// 0 = không giới hạn; tài khoản cũ chưa cấu hình giữ quy tắc khóa từ ngày thứ 2.
function tripActualQtyLimitDays(user){
  if(['admin','administrator'].includes(String(user?.role||'').trim().toLowerCase()))return 0;
  const raw=user?.tripActualQtyLimitDays;
  if(raw===undefined||raw===null||raw==='')return 2;
  const days=Number(raw);
  return Number.isInteger(days)&&days>=0&&days<=365?days:2;
}
function canViewAllDebtCustomers(user){
  const role=String(user?.role||'').trim().toLowerCase();
  return ['admin','administrator'].includes(role)||user?.salesDebtAllCustomers===true;
}
function canViewDriverReportMonthlyWeight(user){
  const role=String(user?.role||'').trim().toLowerCase();
  return ['admin','administrator'].includes(role)||user?.driverReportMonthlyWeight===true;
}

function scfControlAction(control){
  if(!control)return'';
  const declared=control.dataset?.scfAction;
  if(declared)return declared;
  const cls=String(control.className||'');
  const iconCls=Array.from(control.querySelectorAll?.('i')||[]).map(i=>i.className||'').join(' ');
  const text=normalizePlainText(control.textContent||'');
  if(text==='xoa loc'||text.includes('xoa bo loc')||text==='bo loc')return'view';
  if(cls.includes('bdel')||iconCls.includes('ti-trash')||iconCls.includes('ti-delete')||text.includes('xoa ' )||text==='xoa'||text.includes('huy don'))return'delete';
  if(iconCls.includes('ti-edit')||iconCls.includes('ti-pencil')||iconCls.includes('ti-device-floppy')||iconCls.includes('ti-upload')||iconCls.includes('ti-file-import'))return'write';
  const writeWords=['them ','tao don','tao chuyen','giao viec','luu','sua ','cap nhat','doi mat khau','gui bao cao','gui webhook','xac nhan duyet','nhap excel','nhap don','upload'];
  if(writeWords.some(word=>text===word.trim()||text.includes(word)))return'write';
  return'';
}
function guardPermissionAction(e,role,page,lvls){
  const control=e.target?.closest?.('button,[data-scf-action]');
  if(!control)return;
  const action=scfControlAction(control);
  const blocked=(action==='delete'&&!canDel(role,page,lvls))||(action==='write'&&!canWrite(role,page,lvls));
  if(!blocked)return;
  e.preventDefault();e.stopPropagation();
}

function orderHistoryDays(user={}){
 if(['admin','administrator'].includes(String(user?.role||'').toLowerCase()))return 0;
 const raw=user?.orderHistoryDays;
 if(raw===undefined||raw===null||raw==='')return 60;
 const days=Number(raw);return Number.isInteger(days)&&days>=0&&days<=3650?days:60;
}
function scfOrderInViewPeriod(order,user,now=new Date()){
 const days=orderHistoryDays(user);if(!days)return true;
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=key=>Number(parts.find(p=>p.type===key).value);
 const cutoff=Date.UTC(part('year'),part('month')-1,part('day')-(days-1));
 const raw=String(order?.deliveryDate||order?.date||'');
 const vn=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/),iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if(!vn&&!iso)return false;
 const y=Number(vn?vn[3]:iso[1]),m=Number(vn?vn[2]:iso[2]),d=Number(vn?vn[1]:iso[3]);
 const stamp=Date.UTC(y,m-1,d),date=new Date(stamp);
 return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d&&stamp>=cutoff;
}
function scfMergePeriodView(previous,next,user){
 const hidden=(previous||[]).filter(item=>!scfOrderInViewPeriod(item,user));
 const hiddenIds=new Set(hidden.map(item=>String(item.id)));
 return [...hidden,...(next||[]).filter(item=>!hiddenIds.has(String(item.id))&&scfOrderInViewPeriod(item,user))];
}

function scfOnlyMissingInvoiceChanges(before,after){
  if(!Array.isArray(before)||!Array.isArray(after)||before.length!==after.length)return false;
  const prior=new Map(before.map(item=>[String(item?.id||''),item]));
  if(prior.size!==before.length||prior.has(''))return false;
  const ids=new Set(),allowed=new Set(['invoiceImage','invoiceImageName','invoiceUploadedAt','invoiceUploadedBy']);let changed=false;
  for(const next of after){const id=String(next?.id||''),old=prior.get(id);if(!old||ids.has(id))return false;ids.add(id);
    const keys=new Set([...Object.keys(old),...Object.keys(next)]);const diff=[...keys].filter(key=>JSON.stringify(old[key])!==JSON.stringify(next[key]));if(!diff.length)continue;
    if(String(old.invoiceImage||'').trim()||!/^https:\/\//i.test(String(next.invoiceImage||''))||diff.some(key=>!allowed.has(key)))return false;
    if([...allowed].some(key=>next[key]!==undefined&&typeof next[key]!=='string'))return false;changed=true;
  }return changed;
}
