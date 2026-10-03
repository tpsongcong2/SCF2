/* ─── CA GIAO HÀNG ─── */
const D_SHIFTS = [
  {id:'CA01',name:'Ca sáng',area:'Khu vực 1',timeStart:'06:00',timeEnd:'12:00',note:''},
  {id:'CA02',name:'Ca chiều',area:'Khu vực 1',timeStart:'12:00',timeEnd:'18:00',note:''},
  {id:'CA03',name:'Ca tối',area:'Khu vực 2',timeStart:'18:00',timeEnd:'22:00',note:''},
];
// Trip start times and effective driver changes use Vietnam time, independent of device timezone.
function scfShiftTripStartAt(trip,shift){
  const date=String(trip?.deliveryDate||'').trim();
  const vn=date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/),iso=date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!vn&&!iso)return NaN;
  const year=Number(vn?vn[3]:iso[1]),month=Number(vn?vn[2]:iso[2]),day=Number(vn?vn[1]:iso[3]);
  const valid=new Date(Date.UTC(year,month-1,day));
  if(valid.getUTCFullYear()!==year||valid.getUTCMonth()!==month-1||valid.getUTCDate()!==day)return NaN;
  const raw=String(trip?.deliveryTime||shift?.timeStart||shift?.startTime||'').trim();
  const time=raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if(raw&&!time)return NaN;
  const hour=time?Number(time[1]):0,minute=time?Number(time[2]):0,second=time?Number(time[3]||0):0;
  if(hour>23||minute>59||second>59)return NaN;
  return Date.UTC(year,month-1,day,hour-7,minute,second);
}
function scfShiftDriverAt(shift,trip){
  const current={driverId:String(shift?.defaultDriverId||''),driverName:String(shift?.defaultDriverName||'')};
  const history=Array.isArray(shift?.defaultDriverHistory)?shift.defaultDriverHistory:[];
  if(!history.length)return current;
  const when=scfShiftTripStartAt(trip,shift);
  const baseline=history.find(entry=>entry?.effectiveAt==='');
  let chosen=baseline||current,last=-Infinity;
  if(!Number.isFinite(when))return{driverId:String(chosen.driverId||''),driverName:String(chosen.driverName||'')};
  history.forEach(entry=>{
    const at=Date.parse(entry?.effectiveAt||'');
    if(Number.isFinite(at)&&at<=when&&at>=last){chosen=entry;last=at;}
  });
  return{driverId:String(chosen.driverId||''),driverName:String(chosen.driverName||'')};
}
function scfRecordShiftDriverChange(previous,draft,actor,atIso=new Date().toISOString()){
  const history=[...(Array.isArray(previous?.defaultDriverHistory)?previous.defaultDriverHistory:[])];
  const before={driverId:String(previous?.defaultDriverId||''),driverName:String(previous?.defaultDriverName||'')};
  const after={driverId:String(draft?.defaultDriverId||''),driverName:String(draft?.defaultDriverName||'')};
  const changed=!previous||before.driverId!==after.driverId||before.driverName!==after.driverName;
  if(changed){
    if(!history.length)history.push({effectiveAt:'',...before,initial:true});
    history.push({effectiveAt:atIso,...after,previousDriverId:before.driverId,previousDriverName:before.driverName,by:actor?.name||'Người dùng',byId:actor?.id||'',atIso,action:previous?'Đổi lái xe tự động':'Tạo ca giao hàng'});
  }
  return{shift:{...draft,defaultDriverHistory:history,updatedAt:atIso,updatedBy:actor?.name||'Người dùng'},changed};
}
function scfRefreshShiftTripDrivers(trips,previous,shift,atIso){
  const cutoff=Date.parse(atIso);
  return(trips||[]).map(trip=>{
    const matches=String(trip.shiftId||'')===String(previous?.id||shift.id||'');
    const automatic=trip.driverAssignMode==='auto'||(!trip.driverAssignMode&&!trip.driverId&&!trip.driverName);
    const when=scfShiftTripStartAt(trip,previous||shift);
    if(!matches||!automatic||trip.driverDispatchedAt||!['planning','assigned'].includes(trip.status||'planning')||!Number.isFinite(when)||when<cutoff)return trip;
    const driver=scfShiftDriverAt(shift,trip),hasDriver=!!(driver.driverId||driver.driverName);
    if(String(trip.driverId||'')===driver.driverId&&String(trip.driverName||'')===driver.driverName)return trip;
    return{...trip,...driver,driverAssignMode:'auto',status:hasDriver?'assigned':'planning',updatedAt:atIso,updatedBy:shift.updatedBy||''};
  });
}
function scfShiftHistoryTime(value){
  if(!value)return 'Trước lần thay đổi đầu tiên';
  const date=new Date(value);
  return Number.isFinite(date.getTime())?date.toLocaleString('vi-VN',{timeZone:'Asia/Bangkok',hour12:false}):'Không rõ thời điểm';
}
function DeliveryShiftForm({s,allShifts,drivers,onSave,onClose}) {
  const [f,sf]=useState(s?{defaultDriverId:'',defaultDriverName:'',...s}:{id:'',name:'',area:'',timeStart:'',timeEnd:'',note:'',defaultDriverId:'',defaultDriverName:''});
  const dupId = f.id && allShifts.some(x=>x.id===f.id && x.id!==(s&&s.id));
  return h(Modal,{title:s?'Sửa ca giao hàng':'Thêm ca giao hàng',onClose},
    h('div',{className:'g2'},
      h(F,{label:'Mã ca'+(s?' (có thể sửa)':' (để trống = tự tạo)')},
        h('div',null,
          h('input',{value:f.id||'',onChange:e=>sf(p=>({...p,id:e.target.value.toUpperCase()})),placeholder:'CA01, SS-T1...',style:{borderColor:dupId?'#A32D2D':''}}),
          dupId&&h('div',{style:{fontSize:11,color:'#A32D2D',marginTop:3}},h('i',{className:'ti ti-alert-triangle',style:{marginRight:4}}),'Mã này đã tồn tại!')
        )
      ),
      h(F,{label:'Tên ca *'},h('input',{value:f.name,onChange:e=>sf(p=>({...p,name:e.target.value})),placeholder:'Ca sáng, Ca chiều...'}))
    ),
    h(F,{label:'Khu vực'},h('input',{value:f.area||'',onChange:e=>sf(p=>({...p,area:e.target.value})),placeholder:'Khu vực 1, Nội thành...'})),
    h('div',{className:'g2'},
      h(F,{label:'Giờ bắt đầu'},h('input',{value:f.timeStart,onChange:e=>sf(p=>({...p,timeStart:e.target.value})),placeholder:'06:00'})),
      h(F,{label:'Giờ kết thúc'},h('input',{value:f.timeEnd,onChange:e=>sf(p=>({...p,timeEnd:e.target.value})),placeholder:'12:00'}))
    ),
    h(F,{label:'Gán lái xe tự động'},h('select',{value:f.defaultDriverId||'',onChange:e=>{const driver=drivers.find(x=>String(x.id)===String(e.target.value));sf(p=>({...p,defaultDriverId:e.target.value,defaultDriverName:driver?.name||''}));}},
      h('option',{value:''},'— Không tự động gán —'),
      drivers.map(driver=>h('option',{key:driver.id,value:driver.id},driver.name))
    )),
    h('p',{className:'shift-driver-effective-note'},'Lái xe mới áp dụng từ thời điểm lưu ca. Giữ nguyên chuyến trước thời điểm đó, chuyến chọn lái bằng tay và chuyến đã giao cho lái xe.'),
    h(F,{label:'Ghi chú'},h('input',{value:f.note,onChange:e=>sf(p=>({...p,note:e.target.value}))})),
    h(Row,null,
      h('button',{onClick:onClose},'Hủy'),
      h('button',{className:'bp',onClick:()=>{
        if(!f.name){window.showToast('Nhập tên ca!','warn');return;}
        if(dupId){window.showToast('Mã ca đã tồn tại! Vui lòng dùng mã khác.','error');return;}
        const id=(f.id||'').trim().toUpperCase()||'CA'+uid();
        onSave({...f,id});
      },style:{padding:'8px 20px'}},
        h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu ca')
    )
  );
}
function ShiftsTab({shifts,setShifts,employees=[],trips=[],setTrips,currentUser}) {
  const drivers=(employees||[]).filter(e=>e.role==='driver'||employeeHasDepartment(e,'Lái xe'));
  const [modal,sm]=useState(null); const [edit,se]=useState(null); const [q,sq]=useState(''); const [sortBy,setSortBy]=useState('area');
  const[historyShiftId,setHistoryShiftId]=useState(null);
  const historyShift=(shifts||[]).find(shift=>shift.id===historyShiftId);
  const save=d=>{
    const old=(shifts||[]).find(shift=>shift.id===edit?.id),stamp=new Date().toISOString();
    const result=scfRecordShiftDriverChange(old,d,currentUser,stamp);
    if(edit)setShifts(p=>p.map(x=>x.id===edit.id?result.shift:x));else setShifts(p=>[...p,result.shift]);
    if(result.changed&&typeof setTrips==='function')setTrips(previous=>scfRefreshShiftTripDrivers(previous,old,result.shift,stamp));
    sm(null);se(null);
  };
  const del=id=>window.scfConfirm('Bạn có chắc muốn xóa ca giao hàng này?','Xóa ca giao hàng',true).then(ok=>ok&&setShifts(p=>p.filter(x=>x.id!==id)));
  const naturalCompare=(a,b)=>String(a||'').localeCompare(String(b||''),'vi',{numeric:true,sensitivity:'base'});
  const timeValue=value=>{
    const match=String(value||'').match(/(\d{1,2})(?::(\d{1,2}))?/);
    return match?Number(match[1])*60+Number(match[2]||0):99999;
  };
  const list=shifts.filter(x=>!q||x.name.toLowerCase().includes(q.toLowerCase())||String(x.area||'').toLowerCase().includes(q.toLowerCase()))
    .sort((a,b)=>{
      if(sortBy==='name')return naturalCompare(a.name,b.name)||timeValue(a.timeStart)-timeValue(b.timeStart);
      if(sortBy==='time')return timeValue(a.timeStart)-timeValue(b.timeStart)||naturalCompare(a.name,b.name);
      return naturalCompare(a.area||'Chưa phân khu vực',b.area||'Chưa phân khu vực')||timeValue(a.timeStart)-timeValue(b.timeStart)||naturalCompare(a.name,b.name);
    });
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-clock',style:{fontSize:20}}),'Ca giao hàng'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}},
        h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm ca giao hàng...'}),
        h('select',{value:sortBy,onChange:e=>setSortBy(e.target.value),style:{width:210}},
          h('option',{value:'area'},'Sắp xếp theo khu vực'),
          h('option',{value:'name'},'Sắp xếp theo tên ca'),
          h('option',{value:'time'},'Sắp xếp theo giờ bắt đầu')
        )
      ),
      h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm ca'})
    ),
    h('div',null,
      (()=>{
        if(!list.length) return h('div',{className:'empty-st'},'Chưa có ca giao hàng nào.');
        const areas=sortBy==='time'?['__ALL__']:[...new Set(list.map(x=>x.area||'Chưa phân khu vực'))];
        if(sortBy==='area')areas.sort((a,b)=>naturalCompare(a,b));
        return areas.map(area=>{
          const mixed=area==='__ALL__';
          const areaRows=mixed?list:list.filter(x=>(x.area||'Chưa phân khu vực')===area);
          const headers=mixed?['Mã ca','Tên ca','Khu vực','Giờ bắt đầu','Giờ kết thúc','Lái xe tự động','Ghi chú','']:['Mã ca','Tên ca','Giờ bắt đầu','Giờ kết thúc','Lái xe tự động','Ghi chú',''];
          return h('div',{key:area,style:{marginBottom:'1.25rem'}},
          h('div',{style:{fontWeight:600,fontSize:13,color:'var(--pri3)',padding:'8px 12px',background:'var(--bg2)',borderRadius:'var(--r) var(--r) 0 0',border:'.5px solid var(--bd)',borderBottom:'none',display:'flex',alignItems:'center',gap:6}},
            h('i',{className:mixed?'ti ti-clock':'ti ti-map-pin',style:{fontSize:14,color:'var(--pri)'}}),
            mixed?'Tất cả khu vực · Theo giờ bắt đầu':area,
            h('span',{className:'badge',style:{background:'var(--pri)',color:'#fff',marginLeft:4}},areaRows.length+' ca')
          ),
          h('div',{className:'tw',style:{borderRadius:'0 0 var(--rl) var(--rl)'}},h('table',null,
            h('thead',null,h('tr',null,...headers.map(c=>h('th',{key:c},c)))),
            h('tbody',null,areaRows.map(x=>h('tr',{key:x.id},
              h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.id)),
              h('td',null,h('div',{style:{fontWeight:500}},x.name)),
              mixed&&h('td',null,x.area||'Chưa phân khu vực'),
              h('td',null,x.timeStart?h('span',{className:'badge',style:{background:'#FFF9C4',color:'#854F0B'}},x.timeStart):'—'),
              h('td',null,x.timeEnd?h('span',{className:'badge',style:{background:'#EDE9FE',color:'#5B21B6'}},x.timeEnd):'—'),
              h('td',null,x.defaultDriverName?h('span',{className:'badge',style:{background:'#E1F5EE',color:'#0F6E56'}},x.defaultDriverName):'—'),
              h('td',null,x.note||'—'),
              h('td',null,h('div',{style:{display:'flex',gap:2}},
                h('button',{type:'button',className:'bi','data-scf-action':'view',title:'Lịch sử lái xe tự động','aria-label':'Lịch sử lái xe tự động '+x.name,onClick:()=>setHistoryShiftId(x.id)},h('i',{className:'ti ti-history',style:{fontSize:15}})),
                h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
                h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
              ))
            )))
          ))
        );});
      })()
    ),
    historyShift&&h(Modal,{title:'Lịch sử lái xe tự động — '+historyShift.name,onClose:()=>setHistoryShiftId(null)},
      h('div',{className:'shift-driver-history'},
        h('p',null,'Lái hiện tại: ',h('b',null,historyShift.defaultDriverName||'Không tự động gán')),
        (historyShift.defaultDriverHistory||[]).length?[...historyShift.defaultDriverHistory].reverse().map((entry,index)=>h('div',{key:index,className:'shift-driver-history-entry'},
          h('b',null,scfShiftHistoryTime(entry.effectiveAt)),
          h('div',null,entry.initial?'Lái xe trước khi ghi lịch sử: ':'Lái xe áp dụng: ',h('b',null,entry.driverName||'Không tự động gán')),
          !entry.initial&&h('div',null,'Lái trước: ',entry.previousDriverName||'Không tự động gán'),
          !entry.initial&&h('small',null,entry.action||'Đổi lái xe tự động',' · Người sửa: ',entry.by||'Chưa ghi nhận')
        )):h('p',null,'Ca này chưa có lịch sử thay đổi lái xe. Lịch sử được ghi từ lần lưu tiếp theo.')
      )
    ),
    modal==='f'&&h(DeliveryShiftForm,{s:edit,allShifts:shifts,drivers,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}
