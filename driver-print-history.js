/* Server-authorized, paged audit view. No print artwork or signed URLs are exposed. */
function scfPrintHistoryOrderLabel(order){
  const raw=String(order.deliveryDate||'').trim();
  const iso=raw.match(/^\d{4}-(\d{2})-(\d{2})/),vn=raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/\d{4})?$/);
  const day=iso?iso[2]+'/'+iso[1]:vn?vn[1].padStart(2,'0')+'/'+vn[2].padStart(2,'0'):'Chưa có ngày giao';
  return [day,order.pointName||order.customer||'Chưa có địa điểm',order.deliveryTime||'Chưa có giờ giao'].join(' · ');
}
function DriverPrintHistoryTab({currentUser}){
  const [rows,setRows]=useState([]),[offset,setOffset]=useState(0),[hasMore,setHasMore]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
  const allowed=canAccess(currentUser?.role,'driverprintlog',currentUser?.permissions,currentUser?.departments||currentUser?.dept);
  const identity=JSON.stringify([currentUser?.id,currentUser?.role,currentUser?.permissions]);
  useEffect(()=>{setOffset(0);setRows([]);},[identity]);
  useEffect(()=>{
    let active=true;setRows([]);setError('');setHasMore(false);
    if(!allowed)return()=>{active=false;};
    setBusy(true);
    invokeScfAuth({body:{action:'driver_print_history',offset,limit:50}}).then(async({data,error})=>{
      if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Không tải được lịch sử in.'));
      if(active){setRows(data.rows||[]);setHasMore(!!data.hasMore);}
    }).catch(e=>{if(active)setError(e.message||'Không tải được lịch sử in.');}).finally(()=>{if(active)setBusy(false);});
    return()=>{active=false;};
  },[identity,allowed,offset,refresh]);
  if(!allowed)return h('p',{role:'alert'},'Bạn chưa được cấp quyền xem lịch sử in.');
  const kind=mode=>({orders:'Tem giao',manual:'Tem giao · In khác đơn',delivery:'Phiếu giao',summary:'Đơn tổng'}[mode]||mode||'');
  const state=value=>value==='done'?'Đã in':'Chưa in';
  return h('div',{className:'card'},h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}},h('h2',null,'Thông tin lái xe in đơn'),h('button',{type:'button',disabled:busy,'data-scf-action':'view',onClick:()=>setRefresh(n=>n+1)},'Tải lại')),
    busy&&h('p',{role:'status'},'Đang tải lịch sử in…'),error&&h('p',{role:'alert'},error),
    !busy&&!error&&rows.length===0&&h('p',null,'Chưa có lịch sử in.'),
    rows.length>0&&h('div',{style:{overflowX:'auto'}},h('table',null,h('thead',null,h('tr',null,['Người in','In gì','Ngày, giờ','Đơn nào','Chuyến nào','Trạng thái'].map(label=>h('th',{key:label},label)))),h('tbody',null,rows.map(row=>h('tr',{key:row.job_id},
      h('td',null,row.actor_name||row.actor_id),h('td',null,kind(row.print_mode)),h('td',null,new Date(row.created_at).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'})),
      h('td',null,(row.orders||[]).length?(row.orders||[]).map((order,index)=>h('div',{key:order.id||index},scfPrintHistoryOrderLabel(order))):row.print_mode==='manual'?'In khác đơn · Không gắn đơn':'Chưa có thông tin đơn'),
      h('td',null,row.trip_name||'Chưa có tên chuyến',h('br'),row.trip_date||''),h('td',null,state(row.status))
    ))))),
    h('div',{style:{display:'flex',gap:12,alignItems:'center',marginTop:16}},h('button',{type:'button','data-scf-action':'view',disabled:busy||offset===0,onClick:()=>setOffset(n=>Math.max(0,n-50))},'Trang trước'),h('span',null,'Trang '+(offset/50+1)),h('button',{type:'button','data-scf-action':'view',disabled:busy||!hasMore,onClick:()=>setOffset(n=>n+50)},'Trang sau')));
}
