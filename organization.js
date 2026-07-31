/* ─── AREAS TAB ─── */
function AreasTab({areas,setAreas,customers,orders}){
  const[q,sq]=useState('');
  const[modal,sm]=useState(null);
  const[edit,se]=useState(null);
  const[form,sf]=useState({code:'',name:'',note:''});
  const openNew=()=>{sf({code:'',name:'',note:''});se(null);sm('f');};
  const openEdit=a=>{sf({...a});se(a);sm('f');};
  const save=()=>{
    if(!form.code||!form.name){window.showToast('Nhập mã và tên khu vực!','warn');return;}
    if(edit){
      setAreas(p=>p.map(a=>a.id===edit.id?{...a,...form}:a));
      // Cập nhật area string trong tất cả points của customers
      setCustomers(prev=>prev.map(c=>({...c,points:(c.points||[]).map(pt=>
        pt.areaId===edit.id?{...pt,area:form.code}:pt
      )})));
    } else {
      const id='AREA_'+uid();
      setAreas(p=>[...p,{id,code:form.code,name:form.name,note:form.note}]);
    }
    sm(null);
  };
  const del=a=>{
    // Đếm điểm giao dùng khu vực này
    const ptCount=customers.reduce((s,c)=>s+(c.points||[]).filter(p=>p.areaId===a.id||p.area===a.code).length,0);
    const odCount=(orders||[]).filter(o=>o.area===a.code).length;
    if(ptCount>0||odCount>0){
      if(!confirm('Khu vực "'+a.name+'" đang có '+ptCount+' địa điểm và '+odCount+' đơn hàng.\nXóa sẽ mất thông tin khu vực. Tiếp tục?'))return;
    } else {
      if(!confirm('Xóa khu vực "'+a.name+'"?'))return;
    }
    setAreas(p=>p.filter(x=>x.id!==a.id));
  };
  // Migration: tự đồng bộ area string từ customers vào areas list
  const migrate=()=>{
    const existCodes=new Set(areas.map(a=>a.code));
    const newAreas=[...areas];
    let added=0;
    customers.forEach(c=>(c.points||[]).forEach(pt=>{
      const code=(pt.area||'').trim();
      if(code&&!existCodes.has(code)){
        newAreas.push({id:'AREA_'+uid(),code,name:code,note:'Tự tạo từ dữ liệu cũ'});
        existCodes.add(code);added++;
      }
    }));
    if(added>0){setAreas(newAreas);window.showToast('Đã thêm '+added+' khu vực mới từ dữ liệu hiện có!','success');}
    else window.showToast('Dữ liệu đã đồng bộ, không có khu vực mới.','info');
  };
  const list=areas.filter(a=>!q||(a.code+a.name).toLowerCase().includes(q.toLowerCase()));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-map-2',style:{fontSize:20}}),'Quản lý khu vực'),
    h('div',{style:{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap',alignItems:'center'}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm khu vực...'}),
      h('button',{onClick:migrate,style:{padding:'6px 12px',fontSize:12,border:'1px solid #856404',color:'#856404',background:'transparent',borderRadius:'var(--r)',cursor:'pointer',display:'flex',alignItems:'center',gap:4}},
        h('i',{className:'ti ti-refresh',style:{fontSize:13}}),'Đồng bộ từ dữ liệu cũ'),
      h(AddBtn,{onClick:openNew,label:'Thêm khu vực'})
    ),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,...['Mã','Tên khu vực','Địa điểm','Đơn hàng','Ghi chú',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,list.length?list.map(a=>{
          const ptCount=customers.reduce((s,c)=>s+(c.points||[]).filter(p=>p.areaId===a.id||p.area===a.code).length,0);
          const odCount=(orders||[]).filter(o=>o.area===a.code).length;
          // Lấy danh sách KH có địa điểm trong khu vực này
          const custNames=[...new Set(customers.filter(c=>(c.points||[]).some(p=>p.areaId===a.id||p.area===a.code)).map(c=>c.name))];
          return h('tr',{key:a.id},
            h('td',null,h('span',{style:{background:'var(--pri)',color:'#fff',padding:'2px 10px',borderRadius:10,fontSize:12,fontWeight:700}},a.code)),
            h('td',null,h('span',{style:{fontWeight:600}},a.name)),
            h('td',null,
              h('div',{style:{fontSize:12}},
                h('span',{style:{fontWeight:600,color:'var(--pri)'}},ptCount+' điểm'),
                custNames.length>0&&h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2}},custNames.slice(0,3).join(', ')+(custNames.length>3?'...':''))
              )
            ),
            h('td',null,h('span',{style:{fontSize:12,color:'var(--tx2)'}},odCount>0?odCount+' đơn':'—')),
            h('td',null,h('span',{style:{fontSize:12,color:'var(--tx2)'}},a.note||'—')),
            h('td',null,h('div',{style:{display:'flex',gap:4}},
              h('button',{className:'bi',onClick:()=>openEdit(a)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              h('button',{className:'bi',onClick:()=>del(a),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            ))
          );
        }):h('tr',null,h('td',{colSpan:6,className:'empty-st'},'Chưa có khu vực nào.')))
      )
    ),
    modal==='f'&&h(Modal,{title:edit?'Sửa khu vực':'Thêm khu vực mới',onClose:()=>sm(null)},
      h('div',{className:'g2'},
        h(F,{label:'Mã khu vực *'},h('input',{value:form.code,onChange:e=>sf(p=>({...p,code:e.target.value.toUpperCase()})),placeholder:'KV, VP, ĐT, BN...'})),
        h(F,{label:'Tên khu vực *'},h('input',{value:form.name,onChange:e=>sf(p=>({...p,name:e.target.value})),placeholder:'Khu vực Kỳ Vọng...'})),
      ),
      h(F,{label:'Ghi chú'},h('input',{value:form.note,onChange:e=>sf(p=>({...p,note:e.target.value})),placeholder:'Mô tả thêm...'})),
      h(Row,null,
        h('button',{onClick:()=>sm(null)},'Hủy'),
        h('button',{className:'bp',onClick:save,style:{padding:'8px 20px'}},'Lưu khu vực')
      )
    )
  );
}

function CustomersTab({customers,setCustomers,shifts,orders,areas,cu}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[open,so]=useState(null);const[q,sq]=useState('');
  const save=(d,close)=>{if(edit)setCustomers(p=>p.map(x=>x.id===edit.id?d:x));else setCustomers(p=>[...p,d]);if(close!==false){sm(null);se(null);}};
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa khách hàng này?','Xóa khách hàng',true).then(ok=>{if(ok){setCustomers(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa khách hàng','success');}});};
  const ECOLS=[['code','Mã KH'],['name','Tên KH'],['group','Nhóm khách hàng'],['taxCode','MST'],['address','Địa chỉ'],['note','Ghi chú']];
  const list=customers.filter(x=>!q||x.name.toLowerCase().includes(q.toLowerCase())||(x.group||'').toLowerCase().includes(q.toLowerCase())||x.taxCode.includes(q)).sort((a,b)=>(a.code||a.id||'').localeCompare(b.code||b.id||''));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-users',style:{fontSize:20}}),'Danh mục khách hàng'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm khách hàng...'}),
      h('div',{style:{display:'flex',gap:6}},
        h(ExportBtn,{onClick:()=>xlsxExport(list,ECOLS,'Khach_hang')}),
        h(ImportBtn,{onFile:rows=>{
          const added=rows.map(r=>({id:'KH'+uid(),name:r['Tên KH']||'',group:r['Nhóm khách hàng']||'',taxCode:r['MST']||'',address:r['Địa chỉ']||'',note:r['Ghi chú']||'',points:[]})).filter(r=>r.name);
          setCustomers(p=>[...p,...added]);window.showToast('Đã nhập '+added.length+' khách hàng','success');
        }}),
        (!cu||canWrite(cu.role,'customers',cu.permLevels))&&h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm khách hàng'})
      )
    ),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,...['Mã KH','Khách hàng','Nhóm khách hàng','Mã số thuế','Địa chỉ','Địa điểm giao',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,list.length?list.map(c=>h(React.Fragment,{key:c.id},
          h('tr',{style:{cursor:'pointer'},onClick:()=>so(open===c.id?null:c.id)},
            h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},c.code||c.id)),
            h('td',null,
              h('div',{style:{display:'flex',alignItems:'center',gap:8}},
                h('div',{style:{width:30,height:30,borderRadius:'50%',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'var(--pri)',flexShrink:0}},initials(c.name)),
                h('div',{style:{fontWeight:500}},c.name)
              )
            ),
            h('td',null,h('span',{style:{color:'var(--tx2)'}},c.group||'—')),
            h('td',null,c.taxCode||'—'),
            h('td',null,h('span',{style:{color:'var(--tx2)',display:'block',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},c.address||'—')),
            h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},c.points.length+' địa điểm')),
            h('td',null,h('div',{style:{display:'flex',gap:2},onClick:e=>e.stopPropagation()},
              h('button',{className:'bi',onClick:()=>{se(c);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              h('button',{className:'bi',onClick:()=>del(c.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            ))
          ),
          open===c.id&&h('tr',null,h('td',{colSpan:7,style:{background:'var(--bg2)',padding:'10px 16px'}},
            h('div',{style:{fontWeight:500,fontSize:12,color:'var(--tx2)',marginBottom:8}},'Danh sách địa điểm giao hàng:'),
            c.points.length?h('div',{style:{display:'flex',flexWrap:'wrap',gap:8}},
              c.points.map(pt=>h('div',{key:pt.id,style:{background:'#fff',border:'.5px solid var(--bd)',borderRadius:6,padding:'8px 12px',fontSize:12,minWidth:180}},
                h('div',{style:{fontWeight:500,display:'flex',alignItems:'center',gap:5}},h('i',{className:'ti ti-map-pin',style:{fontSize:12,color:'var(--pri)'}}),pt.name),
                h('div',{style:{color:'var(--tx2)',marginTop:2}},pt.address),
              pt.area&&h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)',marginTop:3,fontSize:10}},h('i',{className:'ti ti-map-pin',style:{fontSize:10,marginRight:3}}),pt.area),
                pt.contact&&h('div',{style:{color:'var(--tx2)',marginTop:1}},pt.contact+' • '+pt.phone)
              ))
            ):h('span',{style:{fontSize:12,color:'var(--tx2)'}},'Chưa có địa điểm giao hàng.')
          ))
        )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có khách hàng nào.')))
      )
    ),
    modal==='f'&&h(CustomerForm,{cust:edit,shifts,customers,orders,areas,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

/* ─── WORK CATEGORIES ─── */
function DeptForm({dept,depts,onSave,onClose}){
  const nextDeptCode=()=>{
    const nums=(depts||[]).map(d=>String(d.code||d.id||'').match(/^BP0*(\d+)$/i)).filter(Boolean).map(m=>Number(m[1])||0);
    return 'BP'+String((nums.length?Math.max(...nums):0)+1).padStart(2,'0');
  };
  const[f,sf]=useState(dept?{...dept,code:dept.code||dept.id||''}:{code:nextDeptCode(),name:'',note:''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{
    const code=(f.code||'').trim().toUpperCase();
    if(!code){window.showToast('Nhập mã bộ phận!','warn');return;}
    if((depts||[]).some(d=>(d.code||d.id||'').trim().toUpperCase()===code&&d.id!==(dept&&dept.id))){window.showToast('Mã bộ phận này đã tồn tại!','warn');return;}
    if(!f.name||!f.name.trim()){window.showToast('Nhập tên bộ phận!','warn');return;}
    if(!dept&&depts.some(d=>d.name.trim().toLowerCase()===f.name.trim().toLowerCase())){window.showToast('Bộ phận này đã tồn tại!','warn');return;}
    onSave({...f,code,name:f.name.trim(),id:dept?.id||code});
  };
  return h(Modal,{title:dept?'Sửa bộ phận':'Thêm bộ phận',onClose},
    h('div',{className:'g2'},
      h(F,{label:'Mã bộ phận *'},h('input',{value:f.code||'',onChange:e=>s('code',e.target.value.toUpperCase()),placeholder:'BP001',autoFocus:true})),
      h(F,{label:'Tên bộ phận *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value),placeholder:'Ví dụ: Kế toán, Kho vận...'}))
    ),
    h(F,{label:'Ghi chú'},h('input',{value:f.note,onChange:e=>s('note',e.target.value)})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Lưu bộ phận'))
  );
}
function DeptsTab({depts,setDepts,employees,workcats}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');
  const withCodes=(depts||[]).map((d,i)=>({...d,code:d.code||deptCode(i)}));
  const save=d=>{if(edit)setDepts(p=>p.map(x=>x.id===edit.id?d:x));else setDepts(p=>[...p,d]);sm(null);se(null);};
  const del=(id,name)=>{
    const empCount=(employees||[]).filter(e=>e.dept===name).length;
    const wcCount=(workcats||[]).filter(w=>w.dept===name).length;
    if(empCount>0||wcCount>0){window.showToast('Bộ phận này đang được dùng cho '+empCount+' nhân viên và '+wcCount+' công việc, không thể xóa!','error');return;}
    window.scfConfirm('Bạn có chắc muốn xóa bộ phận này?','Xóa bộ phận',true).then(ok=>{if(ok){setDepts(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa bộ phận','success');}});
  };
  const list=withCodes
    .filter(x=>!q||x.name.toLowerCase().includes(q.toLowerCase())||(x.code||'').toLowerCase().includes(q.toLowerCase()))
    .sort((a,b)=>(a.code||'').localeCompare(b.code||'','vi',{numeric:true,sensitivity:'base'}));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-sitemap',style:{fontSize:20}}),'Danh mục bộ phận'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm bộ phận...'}),
      h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm bộ phận'})
    ),
    h(TableWrap,{cols:['Mã BP','Tên bộ phận','Số nhân viên','Số công việc','Ghi chú',''],empty:'Chưa có bộ phận nào.',
      rows:list.map(x=>h('tr',{key:x.id},
        h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--pri3)',fontWeight:700}},x.code||'—')),
        h('td',null,h('div',{style:{fontWeight:500}},x.name)),
        h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},(employees||[]).filter(e=>e.dept===x.name).length)),
        h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},(workcats||[]).filter(w=>w.dept===x.name).length)),
        h('td',null,x.note||'—'),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id,x.name),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      ))
    }),
    modal==='f'&&h(DeptForm,{dept:edit,depts:withCodes,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}
function WorkCatForm({cat,depts,onSave,onClose}){
  const deptNames=(depts&&depts.length?depts.map(d=>d.name):DEPTS);
  const[f,sf]=useState(cat||{code:'',name:'',dept:deptNames[0],unit:'Tấn',rate:'',desc:'',duration:'',qualityReq:'',note:''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{if(!f.name){window.showToast('Nhập tên công việc!','warn');return;}onSave({...f,id:cat?.id||'CV'+uid(),rate:numFmt(f.rate)});};
  return h(Modal,{title:cat?'Sửa công việc':'Thêm danh mục công việc',onClose},
    h('div',{className:'g2'},
      h(F,{label:'Mã công việc'},h('input',{value:f.code,onChange:e=>s('code',e.target.value),placeholder:'CV001'})),
      h(F,{label:'Bộ phận'},h('select',{value:f.dept,onChange:e=>s('dept',e.target.value)},deptNames.map(d=>h('option',{key:d,value:d},d)))),
    ),
    h(F,{label:'Tên công việc *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value),placeholder:'Bốc xếp, Vận chuyển...'})),
    h(F,{label:'Mô tả công việc'},h('textarea',{value:f.desc||'',onChange:e=>s('desc',e.target.value),rows:3,placeholder:'Mô tả chi tiết nội dung cần thực hiện...'})),
    h('div',{className:'g2'},
      h(F,{label:'Thời gian'},h('input',{value:f.duration||'',onChange:e=>s('duration',e.target.value),placeholder:'Ví dụ: 30 phút, 1 ca, trước 17:00...'})),
      h(F,{label:'Yêu cầu chất lượng'},h('input',{value:f.qualityReq||'',onChange:e=>s('qualityReq',e.target.value),placeholder:'Ví dụ: đúng số lượng, sạch, không hư hỏng...'}))
    ),
    h('div',{className:'g2'},
      h(F,{label:'Đơn vị tính khối lượng'},h('select',{value:f.unit,onChange:e=>s('unit',e.target.value)},UNITS.map(u=>h('option',{key:u,value:u},u)))),
      h(F,{label:'Đơn giá công (đ/đv)'},h(NumInput,{value:f.rate,onChange:v=>s('rate',v),placeholder:'0'})),
    ),
    h(F,{label:'Ghi chú'},h('input',{value:f.note,onChange:e=>s('note',e.target.value)})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Lưu công việc'))
  );
}
function WorkCatsTab({workcats,setWorkcats,depts}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');
  const save=d=>{if(edit)setWorkcats(p=>p.map(x=>x.id===edit.id?d:x));else setWorkcats(p=>[...p,d]);sm(null);se(null);};
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa công việc này?','Xóa công việc',true).then(ok=>{if(ok){setWorkcats(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa công việc','success');}});};
  const list=workcats.filter(x=>!q||[x.code,x.name,x.dept,x.desc,x.duration,x.qualityReq,x.note].some(v=>(v||'').toLowerCase().includes(q.toLowerCase())));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-checklist',style:{fontSize:20}}),'Danh mục công việc'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm công việc...'}),
      h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm công việc'})
    ),
    h(TableWrap,{cols:['Mã','Tên công việc','Bộ phận','Mô tả','Thời gian','Yêu cầu chất lượng','ĐV khối lượng','Đơn giá công','Ghi chú',''],empty:'Chưa có danh mục công việc nào.',
      rows:list.map(x=>h('tr',{key:x.id},
        h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.code||x.id)),
        h('td',null,h('div',{style:{fontWeight:500}},x.name)),
        h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},x.dept)),
        h('td',null,h('span',{style:{fontSize:12,color:'var(--tx2)'}},x.desc||'—')),
        h('td',null,h('span',{style:{fontSize:12}},x.duration||'—')),
        h('td',null,h('span',{style:{fontSize:12,color:'var(--tx2)'}},x.qualityReq||'—')),
        h('td',null,x.unit),
        h('td',null,moneyFmt(x.rate)),
        h('td',null,x.note||'—'),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      ))
    }),
    modal==='f'&&h(WorkCatForm,{cat:edit,depts,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

function TaskForm({task,workcats,employees,currentUser,onSave,onClose}){
  const canManage=currentUser.role==='admin'||currentUser.role==='manager';
  const staff=employees.filter(e=>e.role!=='admin'||e.id===currentUser.id);
  const deptOptions=[...new Set([...(workcats||[]).map(w=>w.dept).filter(Boolean),...(staff||[]).map(e=>e.dept).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,'vi'));
  const taskEmp=task?employees.find(e=>e.id===task.empId):null;
  const taskWc=task?workcats.find(w=>w.id===task.workCatId||w.code===task.workCatId):null;
  const initialDept=task?(task.dept||taskEmp?.dept||taskWc?.dept||''):(canManage?'':(currentUser.dept||''));
  const[f,sf]=useState(task?{...task,dept:initialDept}:{date:fmtDate(),dept:initialDept,empId:canManage?'':currentUser.id,workCatId:'',qtyAssign:0,dueDate:fmtDate(),shift:'',location:'',note:'',status:'assigned'});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const groupStaff=staff.filter(e=>!f.dept||e.dept===f.dept);
  const groupWorkcats=workcats.filter(w=>!f.dept||w.dept===f.dept);
  const setDept=v=>sf(p=>({...p,dept:v,empId:canManage?'':p.empId,workCatId:''}));
  const emp=employees.find(e=>e.id===f.empId)||{};
  const wc=workcats.find(w=>w.id===f.workCatId||w.code===f.workCatId)||{};
  const submit=()=>{
    if(!f.dept){window.showToast('Chọn nhóm/bộ phận.','warn');return;}
    if(!f.empId){window.showToast('Chọn nhân viên.','warn');return;}
    if(!f.workCatId){window.showToast('Chọn công việc.','warn');return;}
    const taskDate=parseAnyDate(f.date);
    const dueDate=parseAnyDate(f.dueDate);
    if(taskDate&&dueDate&&dueDate<taskDate){window.showToast('Hạn hoàn thành không được nhỏ hơn ngày giao việc.','warn');return;}
    onSave({...f,empName:emp.name||'',dept:f.dept||emp.dept||wc.dept||'',workCatName:wc.name||'',workCatCode:wc.code||wc.id||'',workDesc:wc.desc||'',workDuration:wc.duration||'',qualityReq:wc.qualityReq||'',unit:wc.unit||'',rate:numFmt(wc.rate),status:f.status||'assigned',updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:task?'Sửa phiếu giao việc':'Giao việc cho nhân viên',onClose,lg:true},
    h('div',{className:'g3'},
      h(F,{label:'Ngày giao'},h('input',{value:f.date,onChange:e=>s('date',e.target.value),placeholder:'DD/MM/YYYY'})),
      h(F,{label:'Nhóm / Bộ phận *'},h('select',{value:f.dept||'',onChange:e=>setDept(e.target.value),disabled:!canManage},
        h('option',{value:''},'— Chọn nhóm —'),deptOptions.map(d=>h('option',{key:d,value:d},d))
      )),
      h(F,{label:'Hạn hoàn thành'},h('input',{value:f.dueDate,onChange:e=>s('dueDate',e.target.value),placeholder:'DD/MM/YYYY'}))
    ),
    h('div',{className:'g3'},
      h(F,{label:'Nhân viên *'},h('select',{value:f.empId,onChange:e=>s('empId',e.target.value),disabled:!f.dept},
        h('option',{value:''},f.dept?'— Chọn nhân viên trong nhóm —':'— Chọn nhóm trước —'),groupStaff.map(e=>h('option',{key:e.id,value:e.id},e.id+' - '+e.name))
      )),
      h(F,{label:'Công việc *'},h('select',{value:f.workCatId,onChange:e=>s('workCatId',e.target.value),disabled:!f.dept},
        h('option',{value:''},f.dept?'— Chọn việc của nhóm —':'— Chọn nhóm trước —'),groupWorkcats.map(w=>h('option',{key:w.id,value:w.id},(w.code||w.id)+' - '+w.name+' ('+(w.unit||'')+')'))
      )),
      h(F,{label:'Khối lượng giao'},h('input',{type:'number',min:0,step:'0.01',value:f.qtyAssign,onChange:e=>s('qtyAssign',numFmt(e.target.value))})),
    ),
    (wc.desc||wc.duration||wc.qualityReq)&&h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 12px',marginBottom:12,fontSize:12,color:'var(--tx2)',lineHeight:1.5}},
      wc.desc&&h('div',null,h('b',{style:{color:'var(--pri3)'}},'Mô tả: '),wc.desc),
      wc.duration&&h('div',null,h('b',{style:{color:'var(--pri3)'}},'Thời gian: '),wc.duration),
      wc.qualityReq&&h('div',null,h('b',{style:{color:'var(--pri3)'}},'Yêu cầu chất lượng: '),wc.qualityReq)
    ),
    h('div',{className:'g3'},
      h(F,{label:'Ca / thời gian'},h('input',{value:f.shift||'',onChange:e=>s('shift',e.target.value),placeholder:'Ca sáng, 08:00-11:00...'})),
      h(F,{label:'Địa điểm / khu vực'},h('input',{value:f.location||'',onChange:e=>s('location',e.target.value),placeholder:'Kho, xưởng, bếp...'})),
      h(F,{label:'Trạng thái'},h('select',{value:f.status,onChange:e=>s('status',e.target.value)},
        [['assigned','Đã giao'],['doing','Đang làm'],['submitted','Chờ duyệt'],['approved','Đã duyệt'],['returned','Trả lại'],['cancelled','Hủy']].map(([v,l])=>h('option',{key:v,value:v},l))
      ))
    ),
    h(F,{label:'Ghi chú giao việc'},h('textarea',{value:f.note||'',onChange:e=>s('note',e.target.value),rows:2})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Lưu phiếu'))
  );
}

function TaskReportModal({task,currentUser,onSave,onClose}){
  const[f,sf]=useState({qtyReport:task.qtyReport||task.qtyAssign||0,reportNote:task.reportNote||'',status:'submitted'});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{
    if(numFmt(f.qtyReport)<=0&&!confirm('Khối lượng báo cáo đang bằng 0. Vẫn gửi báo cáo?'))return;
    if(numFmt(f.qtyReport)>numFmt(task.qtyAssign||0)&&!confirm('Khối lượng báo cáo đang lớn hơn khối lượng giao. Vẫn gửi báo cáo?'))return;
    onSave({...task,qtyReport:numFmt(f.qtyReport),reportNote:f.reportNote||'',status:'submitted',reportedBy:currentUser.name,reportedAt:fmtDT(),updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:'Báo cáo công việc - '+(task.workCatName||''),onClose},
    h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 12px',fontSize:13,marginBottom:10}},
      h('div',null,h('b',null,task.empName),' · ',task.date,' · ',task.location||''),
      h('div',{style:{marginTop:4,color:'var(--tx2)'}},'Giao: '+(task.qtyAssign||0)+' '+(task.unit||''))
    ),
    h(F,{label:'Khối lượng thực tế'},h('input',{type:'number',step:'0.01',min:0,value:f.qtyReport,onChange:e=>s('qtyReport',numFmt(e.target.value))})),
    h(F,{label:'Ghi chú báo cáo'},h('textarea',{value:f.reportNote,onChange:e=>s('reportNote',e.target.value),rows:3,placeholder:'Nội dung đã làm, vấn đề phát sinh...'})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit},'Gửi báo cáo'))
  );
}

function TaskApproveModal({task,currentUser,onSave,onClose}){
  const[f,sf]=useState({qtyApproved:task.qtyApproved??task.qtyReport??task.qtyAssign??0,reviewNote:task.reviewNote||''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{
    if(numFmt(f.qtyApproved)<0){window.showToast('Khối lượng duyệt không hợp lệ.','warn');return;}
    if(numFmt(f.qtyApproved)===0&&!confirm('Khối lượng duyệt đang bằng 0. Vẫn lưu duyệt?'))return;
    if(numFmt(f.qtyApproved)>numFmt(task.qtyReport??task.qtyAssign??0)&&!confirm('Khối lượng duyệt đang lớn hơn khối lượng báo cáo. Vẫn tiếp tục?'))return;
    onSave({...task,qtyApproved:numFmt(f.qtyApproved),reviewNote:f.reviewNote||'',status:'approved',approvedBy:currentUser.name,approvedAt:fmtDT(),updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:'Duyệt khối lượng công - '+(task.workCatName||''),onClose},
    h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 12px',fontSize:13,marginBottom:10,lineHeight:1.6}},
      h('div',null,h('b',null,task.empName||'—'),' · ',task.date||'—',' · ',task.location||''),
      h('div',{style:{marginTop:4,color:'var(--tx2)'}},'Giao: '+numFmt(task.qtyAssign||0)+' '+(task.unit||'')+' · Báo cáo: '+numFmt(task.qtyReport||0)+' '+(task.unit||'')),
      task.reportNote&&h('div',{style:{marginTop:4,color:'var(--tx2)'}},'Ghi chú NV: ',task.reportNote)
    ),
    h(F,{label:'Khối lượng duyệt'},h('input',{type:'number',step:'0.01',min:0,value:f.qtyApproved,onChange:e=>s('qtyApproved',numFmt(e.target.value))})),
    h(F,{label:'Nhận xét quản lý'},h('textarea',{value:f.reviewNote,onChange:e=>s('reviewNote',e.target.value),rows:3,placeholder:'Ghi nhận phần duyệt, phần trừ công, lý do...'})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit},'Xác nhận duyệt'))
  );
}

function TasksTab({tasks,setTasks,workcats,employees,currentUser}){
  const canManage=currentUser.role==='admin'||currentUser.role==='manager';
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[report,sr]=useState(null);const[approveItem,sa]=useState(null);const[q,sq]=useState('');const[status,ss]=useState('all');const[deptFilter,setDeptFilter]=useState('all');const[empFilter,setEmpFilter]=useState('all');
  let seq=tasks.length+1;
  const save=d=>{if(edit)setTasks(p=>p.map(x=>x.id===edit.id?{...x,...d}:x));else{const id='GV'+String(seq++).padStart(4,'0');setTasks(p=>[{...d,id,createdBy:currentUser.name,createdAt:fmtDT()},...p]);}sm(null);se(null);};
  const saveReport=d=>{setTasks(p=>p.map(x=>x.id===d.id?d:x));sr(null);};
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa phiếu giao việc này?','Xóa phiếu giao việc',true).then(ok=>{if(ok){setTasks(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa phiếu giao việc','success');}});};
  const setStatus=(id,data)=>setTasks(p=>p.map(x=>x.id===id?{...x,...data,updatedBy:currentUser.name,updatedAt:fmtDT()}:x));
  const back=t=>{const note=prompt('Lý do trả lại:',t.reviewNote||'');if(note!==null)setStatus(t.id,{status:'returned',reviewNote:note});};
  const baseRows=tasks.filter(t=>canManage||t.empId===currentUser.id);
  const deptOptions=[...new Set(baseRows.map(t=>t.dept).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const empOptions=[...new Map(baseRows.filter(t=>deptFilter==='all'||t.dept===deptFilter).map(t=>[t.empId,{id:t.empId,name:t.empName||t.empId,dept:t.dept||''}])).values()];
  const todayDate=parseAnyDate(isoDate());
  const isOverdue=t=>{
    const due=parseAnyDate(t.dueDate);
    return !!(due&&todayDate&&due<todayDate&&!['approved','cancelled'].includes(t.status));
  };
  const matchesSearch=t=>!q||[t.id,t.empName,t.workCatName,t.workCatCode,t.dept,t.location,t.note,t.reportNote,t.reviewNote].some(x=>String(x||'').toLowerCase().includes(q.toLowerCase()));
  const scopedRows=baseRows.filter(t=>(deptFilter==='all'||t.dept===deptFilter)&&(empFilter==='all'||t.empId===empFilter)&&matchesSearch(t));
  const rows=scopedRows.filter(t=>status==='all'||t.status===status);
  const totalApproved=rows.filter(t=>t.status==='approved').reduce((s,t)=>s+numFmt(t.qtyApproved||t.qtyReport||0)*numFmt(t.rate),0);
  const overdueCount=rows.filter(isOverdue).length;
  const sts=[['all','Tất cả'],['assigned','Đã giao'],['doing','Đang làm'],['submitted','Chờ duyệt'],['approved','Đã duyệt'],['returned','Trả lại'],['cancelled','Hủy']];
  const statusLabel=s=>({assigned:'Đã giao',doing:'Đang làm',submitted:'Chờ duyệt',approved:'Đã duyệt',returned:'Trả lại',cancelled:'Hủy'}[s]||s);
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-clipboard-check',style:{fontSize:20}}),canManage?'Giao việc & báo cáo':'Công việc của tôi'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginBottom:'1rem',flexWrap:'wrap'}},
      h('div',{style:{display:'flex',gap:5,flexWrap:'wrap'}},sts.map(([v,l])=>h('button',{key:v,className:'pill'+(status===v?' on':''),onClick:()=>ss(v)},l+' ('+(v==='all'?scopedRows.length:scopedRows.filter(t=>t.status===v).length)+')'))),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm công việc...'}),
        canManage&&h('select',{value:deptFilter,onChange:e=>{setDeptFilter(e.target.value);setEmpFilter('all');},style:{minWidth:150}},
          h('option',{value:'all'},'Tất cả bộ phận'),
          deptOptions.map(d=>h('option',{key:d,value:d},d))
        ),
        canManage&&h('select',{value:empFilter,onChange:e=>setEmpFilter(e.target.value),style:{minWidth:170}},
          h('option',{value:'all'},deptFilter==='all'?'Tất cả nhân viên':'Nhân viên trong bộ phận'),
          empOptions.map(e=>h('option',{key:e.id,value:e.id},e.name+' ('+e.id+')'))
        ),
        canManage&&h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Giao việc'})
      )
    ),
    h('div',{style:{display:'grid',gridTemplateColumns:'repeat(5,minmax(120px,1fr))',gap:8,marginBottom:'1rem'}},
      h('div',{className:'card',style:{padding:'10px 14px'}},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Phiếu'),h('b',null,rows.length)),
      h('div',{className:'card',style:{padding:'10px 14px'}},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Chờ duyệt'),h('b',null,rows.filter(t=>t.status==='submitted').length)),
      h('div',{className:'card',style:{padding:'10px 14px'}},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Đã duyệt'),h('b',null,rows.filter(t=>t.status==='approved').length)),
      h('div',{className:'card',style:{padding:'10px 14px'}},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Quá hạn'),h('b',{style:{color:overdueCount?'#A32D2D':'var(--pri3)'}},overdueCount)),
      h('div',{className:'card',style:{padding:'10px 14px'}},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Tiền công duyệt'),h('b',null,moneyFmt(totalApproved)))
    ),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,...['Mã','Ngày','Nhân viên','Công việc','Giao','Báo cáo','Tiền công','Trạng thái',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,rows.length?rows.map(t=>{
          const approvedAmount=t.status==='approved'?numFmt(t.qtyApproved||0)*numFmt(t.rate):0;
          const provisionalAmount=t.status!=='approved'&&t.qtyReport!==undefined?numFmt(t.qtyReport||0)*numFmt(t.rate):0;
          return h('tr',{key:t.id},
            h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:600}},t.id)),
            h('td',null,h('div',null,t.date||'—'),t.dueDate&&h('div',{style:{fontSize:11,color:isOverdue(t)?'#A32D2D':'var(--tx2)',fontWeight:isOverdue(t)?600:400}},'Hạn: '+t.dueDate)),
            h('td',null,h('div',{style:{fontWeight:500}},t.empName||'—'),h('div',{style:{fontSize:11,color:'var(--tx2)'}},t.dept||'')),
            h('td',null,h('div',{style:{fontWeight:500}},t.workCatName||'—'),h('div',{style:{fontSize:11,color:'var(--tx2)'}},[t.location,t.shift,t.note].filter(Boolean).join(' · '))),
            h('td',null,(t.qtyAssign||0)+' '+(t.unit||'')),
            h('td',null,
              h('div',{style:{fontWeight:600,color:t.status==='submitted'||t.status==='approved'?'var(--pri)':'var(--tx)'}},(t.qtyReport??'—')+(t.qtyReport!==undefined?' '+(t.unit||''):'')),
              t.reportNote&&h('div',{style:{fontSize:11,color:'var(--tx2)',maxWidth:220}},t.reportNote),
              t.reviewNote&&h('div',{style:{fontSize:11,color:t.status==='returned'?'#A32D2D':'#185FA5',maxWidth:220,marginTop:3}},'QL: '+t.reviewNote)
            ),
            h('td',null,
              approvedAmount?h('div',{style:{fontWeight:650,color:'var(--pri3)'}},moneyFmt(approvedAmount))
              :provisionalAmount?h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Tạm tính '+moneyFmt(provisionalAmount))
              :'—',
              t.status==='approved'&&h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2}},'Duyệt '+numFmt(t.qtyApproved||0)+' '+(t.unit||'')),
              t.status!=='approved'&&t.rate?h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2}},'Đơn giá '+moneyFmt(t.rate)+' / '+(t.unit||'đv')):null
            ),
            h('td',null,h('span',{className:'badge',style:{background:t.status==='approved'?'#E1F5EE':t.status==='submitted'?'#E6F1FB':t.status==='returned'?'#FCEBEB':'var(--bg2)',color:t.status==='approved'?'#0F6E56':t.status==='submitted'?'#185FA5':t.status==='returned'?'#A32D2D':'var(--tx)'}},statusLabel(t.status))),
            h('td',null,h('div',{style:{display:'flex',gap:2}},
              !canManage&&['assigned','returned'].includes(t.status)&&h('button',{className:'bi',title:'Bắt đầu làm',onClick:()=>setStatus(t.id,{status:'doing'})},h('i',{className:'ti ti-player-play',style:{fontSize:15}})),
              !canManage&&['assigned','doing','returned'].includes(t.status)&&h('button',{className:'bi',title:'Báo cáo',onClick:()=>sr(t)},h('i',{className:'ti ti-report',style:{fontSize:15}})),
              canManage&&t.status==='submitted'&&h('button',{className:'bi',title:'Duyệt',onClick:()=>sa(t)},h('i',{className:'ti ti-check',style:{fontSize:15,color:'var(--pri)'}})),
              canManage&&t.status==='submitted'&&h('button',{className:'bi',title:'Trả lại',onClick:()=>back(t)},h('i',{className:'ti ti-arrow-back-up',style:{fontSize:15,color:'#A32D2D'}})),
              canManage&&h('button',{className:'bi',title:'Sửa',onClick:()=>{se(t);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              canManage&&h('button',{className:'bi',title:'Xóa',onClick:()=>del(t.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            ))
          );
        }):h('tr',null,h('td',{colSpan:9,className:'empty-st'},'Chưa có công việc nào.')))
      )
    ),
    modal==='f'&&h(TaskForm,{task:edit,workcats,employees,currentUser,onSave:save,onClose:()=>{sm(null);se(null);}}),
    report&&h(TaskReportModal,{task:report,currentUser,onSave:saveReport,onClose:()=>sr(null)}),
    approveItem&&h(TaskApproveModal,{task:approveItem,currentUser,onSave:d=>{setTasks(p=>p.map(x=>x.id===d.id?d:x));sa(null);},onClose:()=>sa(null)})
  );
}

