/* --- Phân quyền menu --- */
const PAGE_ACCESS = {
  welcome:      ['admin','manager','staff','driver'],
  company:      ['admin','manager'],
  appearance:   ['admin','manager'],
  printtemplates:['admin','manager'],
  employees:    ['admin','manager'],
  attendance:   ['admin','manager','staff','driver'],
  advances:     ['admin','manager','staff','driver'],
  rewards:      ['admin','manager','staff','driver'],
  leaves:       ['admin','manager','staff','driver'],
  backup:       ['admin'],
  materials:    ['admin','manager','staff'],
  assets:       ['admin','manager','staff'],
  depts:        ['admin','manager'],
  products:     ['admin','manager','staff'],
  customers:    ['admin','manager','staff'],
  workcats:     ['admin','manager'],
  tasks:        ['admin','manager','staff','driver'],
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
  nccs:         ['admin','manager'],
  purchaseorders:['admin','manager'],
  fuelpurchases:['admin','manager','driver'],
  fuelreport:['admin','manager'],
  purchasereport:['admin','manager'],
  maintreport:['admin','manager'],
  materialusage:['admin','manager','staff'],
  powderdebtreport:['admin','manager','staff'],
  dbusage:['admin','manager'],
  maint_vehicle:['admin','manager','staff'],
  maint_machine:['admin','manager','staff'],
  salesreport:  ['admin','manager','staff'],
  marketsales:  ['admin','manager','staff'],
  powdersales:  ['admin','manager','staff'],
};
// Default permissions by role
function roleDefaults(role) {
  return Object.keys(PAGE_ACCESS).filter(p => PAGE_ACCESS[p].includes(role));
}
// canAccess checks employee's custom permissions first, else falls back to role
function canAccess(role, page, perms) {
  if (perms && perms.length > 0) return perms.includes(page);
  const allowed = PAGE_ACCESS[page];
  return !allowed || allowed.includes(role);
}
// Mức quyền: 'r'=chỉ xem, 'rw'=xem+sửa, 'rwd'=xem+sửa+xóa
function getLvl(role, page, lvls) {
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
  window.showToast&&window.showToast(action==='delete'?'Bạn không có quyền xóa dữ liệu ở mục này.':'Bạn đang ở chế độ Chỉ xem, không thể thay đổi dữ liệu.','warn');
}

