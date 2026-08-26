/* --- Phân quyền menu --- */
const PAGE_ACCESS = {
  welcome:      ['admin','manager','staff','driver'],
  company:      ['admin','manager','staff','driver'],
  appearance:   ['admin','manager'],
  printtemplates:['admin','manager'],
  employees:    ['admin','manager'],
  permission_settings:['admin'],
  attendance:   ['admin','manager','staff','driver'],
  attendance_settings:['admin'],
  attendance_report:['admin','manager','staff','driver'],
  advances:     ['admin','manager','staff','driver'],
  rewards:      ['admin','manager','staff','driver'],
  employee_errors:['admin','manager'],
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
  prodorders:   ['admin','manager','staff'],
  stock:        ['admin','manager','staff'],
  purchase:     ['admin','manager'],
  nccs:         ['admin'],
  nccgoods:     ['admin'],
  purchaseorders:['admin'],
  purchasegoods:['admin','manager'],
  fuelpurchases:['admin','manager','driver'],
  fuelreport:['admin','manager'],
  purchasereport:['admin'],
  maintreport:['admin','manager'],
  materialusage:['admin','manager','staff'],
  powderdebtreport:['admin','manager','staff'],
  syncreport:['admin','manager'],
  dbusage:['admin','manager'],
  maint_vehicle:['admin','manager','staff'],
  maint_machine:['admin','manager','staff'],
  salesreport:  ['admin','manager','staff'],
  cashflowreport:['admin','manager'],
  marketsales:  ['admin','manager','staff'],
  powdersales:  ['admin','manager','staff'],
};
// Default permissions by role
function roleDefaults(role) {
  return Object.keys(PAGE_ACCESS).filter(p => PAGE_ACCESS[p].includes(role));
}
// canAccess checks employee's custom permissions first, else falls back to role
function canAccess(role, page, perms, dept='') {
  const faceMaskPages=['materials','workreport_total','nccs','purchaseorders','cashflowreport','salesreport','fuelreport','purchasereport','maintreport','materialusage','syncreport','dbusage'];
  const sharedVariantPages=['employees'];
  const isFaceMask=window.SCF_APP_VARIANT==='face-mask';
  if(isFaceMask&&!faceMaskPages.includes(page)&&!sharedVariantPages.includes(page))return false;
  if(!isFaceMask&&faceMaskPages.includes(page))return false;
  if(page==='permission_settings')return role==='admin';
  const isAccounting=String(dept||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes('ke toan');
  if(page==='garages'&&role==='admin') return true;
  if(page==='deliveryrules') return true;
  if(page==='employee_errors'&&(role==='admin'||role==='manager')) return true;
  if(page==='notifications') return ['admin','manager','staff','driver'].includes(role);
  if(page==='userguide') return ['admin','manager','staff','driver'].includes(role);
  if(page==='company') return ['admin','manager','staff','driver'].includes(role);
  if(page==='trips'&&(role==='admin'||isAccounting)) return true;
  if(['nccgoods','purchasegoods'].includes(page)&&(role==='admin'||isAccounting)) return true;
  if(['nccs','purchaseorders','purchasereport'].includes(page)&&role!=='admin') return false;
  const allowed = PAGE_ACCESS[page];
  if (!allowed) return false;
  if (perms && perms.length > 0) {
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
