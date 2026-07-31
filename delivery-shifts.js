/* ─── CA GIAO HÀNG ─── */
const D_SHIFTS = [
  {id:'CA01',name:'Ca sáng',area:'Khu vực 1',timeStart:'06:00',timeEnd:'12:00',note:''},
  {id:'CA02',name:'Ca chiều',area:'Khu vực 1',timeStart:'12:00',timeEnd:'18:00',note:''},
  {id:'CA03',name:'Ca tối',area:'Khu vực 2',timeStart:'18:00',timeEnd:'22:00',note:''},
];
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
function ShiftsTab({shifts,setShifts,employees=[],trips=[],setTrips}) {
  const drivers=(employees||[]).filter(e=>e.role==='driver'||e.dept==='Lái xe');
  const [modal,sm]=useState(null); const [edit,se]=useState(null); const [q,sq]=useState(''); const [sortBy,setSortBy]=useState('area');
  const save=d=>{
    if(edit)setShifts(p=>p.map(x=>x.id===edit.id?{...d}:x));else setShifts(p=>[...p,d]);
    if(typeof setTrips==='function')setTrips(previous=>(previous||[]).map(trip=>{
      const matchesShift=String(trip.shiftId||'')===String(d.id||'');
      const canRefreshDriver=['planning','assigned'].includes(trip.status||'planning')&&(!trip.driverId&&!trip.driverName||trip.driverAssignMode==='auto');
      if(!matchesShift||!canRefreshDriver)return trip;
      const hasDefault=!!(d.defaultDriverId||d.defaultDriverName);
      return {...trip,driverId:d.defaultDriverId||'',driverName:d.defaultDriverName||'',driverAssignMode:hasDefault?'auto':'',status:hasDefault?'assigned':'planning',updatedAt:fmtDT()};
    }));
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
                h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
                h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
              ))
            )))
          ))
        );});
      })()
    ),
    modal==='f'&&h(DeliveryShiftForm,{s:edit,allShifts:shifts,drivers,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}
